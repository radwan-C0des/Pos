import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCustomerDto) {
    return await this.prisma.customer.create({
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
          { first_name: { contains: query.search, mode: 'insensitive' as const } },
          { last_name: { contains: query.search, mode: 'insensitive' as const } },
          { email: { contains: query.search, mode: 'insensitive' as const } },
          { phone: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }
      : {};

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [query.sortBy || 'created_at']: query.order || 'desc',
        },
        include: {
          sales: {
            orderBy: {
              created_at: 'desc',
            },
          },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    // Calculate total_orders, total_spent, and last_visit for each customer
    const customersWithStats = customers.map((customer) => {
      const total_orders = customer.sales?.length || 0;
      const total_spent = customer.sales?.reduce(
        (sum, sale) => sum + Number(sale.total_amount),
        0,
      ) || 0;
      const last_visit = customer.sales?.[0]?.created_at || null;

      // Remove sales from response to keep it clean
      const { sales, ...customerData } = customer;

      return {
        ...customerData,
        total_orders,
        total_spent,
        last_visit,
      };
    });

    return { customers: customersWithStats, total, page, limit };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        sales: {
          orderBy: {
            created_at: 'desc',
          },
          include: {
            sale_items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Calculate stats
    const total_orders = customer.sales?.length || 0;
    const total_spent = customer.sales?.reduce(
      (sum, sale) => sum + Number(sale.total_amount),
      0,
    ) || 0;
    const last_visit = customer.sales?.[0]?.created_at || null;

    return {
      ...customer,
      total_orders,
      total_spent,
      last_visit,
    };
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findOne(id);

    return await this.prisma.customer.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return await this.prisma.customer.delete({
      where: { id },
    });
  }
}
