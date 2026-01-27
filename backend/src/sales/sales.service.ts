import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SalesService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, dto: CreateSaleDto) {
        try {
            return await this.prisma.$transaction(async (tx) => {
                let totalAmount = 0;
                const saleItemsData: any[] = [];

                // Validate that items exist
                if (!dto.items || dto.items.length === 0) {
                    throw new BadRequestException('Sale must contain at least one item');
                }

                for (const item of dto.items) {
                    const product = await tx.product.findUnique({
                        where: { id: item.product_id },
                    });

                    if (!product) {
                        throw new NotFoundException(`Product ${item.product_id} not found`);
                    }

                    if (product.stock_quantity < item.quantity) {
                        throw new BadRequestException(
                            `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}, Requested: ${item.quantity}`,
                        );
                    }

                    // Deduct stock
                    await tx.product.update({
                        where: { id: item.product_id },
                        data: {
                            stock_quantity: {
                                decrement: item.quantity,
                            },
                        },
                    });

                    const subtotal = Number(product.price) * item.quantity;
                    totalAmount += subtotal;

                    saleItemsData.push({
                        product_id: item.product_id,
                        quantity: item.quantity,
                        unit_price: product.price,
                        subtotal: new Prisma.Decimal(subtotal),
                    });
                }

                const sale = await tx.sale.create({
                    data: {
                        user_id: userId,
                        customer_id: dto.customer_id || null,
                        total_amount: new Prisma.Decimal(totalAmount),
                        sale_items: {
                            create: saleItemsData,
                        },
                    },
                    include: {
                        sale_items: {
                            include: {
                                product: true,
                            },
                        },
                        customer: true,
                        user: {
                            select: {
                                id: true,
                                email: true,
                            },
                        },
                    },
                });

                return sale;
            }, {
                maxWait: 10000, // Maximum wait time: 10 seconds
                timeout: 10000,  // Transaction timeout: 10 seconds
            });
        } catch (error) {
            // Re-throw known errors
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            // Handle Prisma errors
            throw new BadRequestException('Failed to create sale: ' + error.message);
        }
    }

    async findAll(query: { page?: string; limit?: string; startDate?: string; endDate?: string }) {
        const page = parseInt(query.page || '1');
        const limit = parseInt(query.limit || '10');
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.startDate || query.endDate) {
            where.created_at = {};
            if (query.startDate) where.created_at.gte = new Date(query.startDate);
            if (query.endDate) where.created_at.lte = new Date(query.endDate);
        }

        const [sales, total] = await Promise.all([
            this.prisma.sale.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: {
                    user: { select: { id: true, email: true } },
                    customer: { select: { id: true, first_name: true, last_name: true, email: true } },
                    sale_items: {
                        include: {
                            product: true,
                        },
                    },
                },
            }),
            this.prisma.sale.count({ where }),
        ]);

        return { sales, total, page, limit };
    }

    async findOne(id: string) {
        const sale = await this.prisma.sale.findUnique({
            where: { id },
            include: {
                sale_items: {
                    include: {
                        product: true,
                    },
                },
                user: { select: { id: true, email: true } },
                customer: { select: { id: true, first_name: true, last_name: true, email: true, phone: true } },
            },
        });

        if (!sale) {
            throw new NotFoundException('Sale not found');
        }

        return sale;
    }
}

