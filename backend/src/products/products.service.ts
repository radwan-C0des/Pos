import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateProductDto) {
        const existing = await this.prisma.product.findUnique({
            where: { sku: dto.sku },
        });

        if (existing) {
            throw new ConflictException('SKU already exists');
        }

        return this.prisma.product.create({
            data: {
                ...dto,
            },
        });
    }

    async findAll(query: {
        page?: string;
        limit?: string;
        search?: string;
        sortBy?: string;
        order?: 'asc' | 'desc';
    }) {
        const page = parseInt(query.page || '1');
        const limit = parseInt(query.limit || '10');
        const skip = (page - 1) * limit;

        const where = query.search
            ? {
                OR: [
                    { name: { contains: query.search, mode: 'insensitive' as const } },
                    { sku: { contains: query.search, mode: 'insensitive' as const } },
                ],
            }
            : {};

        const [products, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    [query.sortBy || 'created_at']: query.order || 'desc',
                },
                select: {
                    id: true,
                    name: true,
                    sku: true,
                    category: true,
                    price: true,
                    stock_quantity: true,
                    image_url: true,
                    created_at: true,
                    updated_at: true,
                },
            }),
            this.prisma.product.count({ where }),
        ]);

        return { products, total, page, limit };
    }

    async findOne(id: string) {
        const product = await this.prisma.product.findUnique({
            where: { id },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        return product;
    }

    async update(id: string, dto: UpdateProductDto) {
        await this.findOne(id);

        if (dto.sku) {
            const existing = await this.prisma.product.findFirst({
                where: { sku: dto.sku, NOT: { id } },
            });

            if (existing) {
                throw new ConflictException('SKU already exists');
            }
        }

        return this.prisma.product.update({
            where: { id },
            data: dto,
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.product.delete({
            where: { id },
        });
    }
}
