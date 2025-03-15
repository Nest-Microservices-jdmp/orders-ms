import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { CreateOrderDto } from './dto/create-order.dto';
import { PaginationStatusDto } from 'src/common';
import { OrderStatus, PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class OrderService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('OrderService');

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database Connected');
  }

  create(createProductDto: CreateOrderDto) {
    return this.order.create({
      data: createProductDto,
    });
  }

  async updateStatus(id: string, status: OrderStatus) {
    // 1. Buscar la orden para validar que existe
    const existingOrder = await this.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      throw new RpcException({
        message: `Order not found with id ${id}`,
        status: HttpStatus.NOT_FOUND,
      });
    }

    const updatedOrder = await this.order.update({
      where: { id },
      data: { status },
    });

    this.logger.log(`Order ${id} status updated to ${status}`);
    return updatedOrder;
  }

  async findAll({ limit, page, status }: PaginationStatusDto) {
    const totalPages = await this.order.count({ where: { status } });
    const lastPage = Math.ceil(totalPages / limit!);

    return {
      data: await this.order.findMany({
        take: limit,
        skip: (page! - 1) * limit!,
        where: { status },
      }),
      meta: {
        page,
        total: totalPages,
        lastPage,
      },
    };
  }

  async findOne(id: string) {
    const order = await this.order.findFirst({
      where: { id },
    });
    if (!order) {
      throw new RpcException({
        message: `Order not found with id ${id}`,
        status: HttpStatus.BAD_REQUEST,
      });
    }
    return order;
  }
  async findStatus({ status }: any) {
    const order = await this.order.findFirst({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where: { status },
    });
    if (!order) {
      throw new RpcException({
        message: `Order not found with status ${status}`,
        status: HttpStatus.BAD_REQUEST,
      });
    }
    return order;
  }
}
