/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';

import { CreateOrderDto } from './dto/create-order.dto';
import { PaginationStatusDto } from 'src/common';
import { OrderStatus, PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { NATS_SERVICE } from 'src/config';
import { firstValueFrom } from 'rxjs';
import {
  CreateOrderItem,
  ExtendedOrderProperties,
  ExtendedOrderResponse,
  ValidatedProduct,
} from './interfaces/orders.interfaces';
import { PaidOrderDto } from './dto';

@Injectable()
export class OrderService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('OrderService');

  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database Connected');
  }

  async create(
    createOrderDto: CreateOrderDto,
  ): Promise<ExtendedOrderProperties> {
    const productIds = createOrderDto.items.map(
      (orderItem: CreateOrderItem) => orderItem.productId,
    );

    try {
      const products: ValidatedProduct[] = await firstValueFrom(
        this.client.send<ValidatedProduct[], number[]>(
          { cmd: 'validate_product' },
          productIds,
        ),
      );

      const totalAmount: number = createOrderDto.items.reduce(
        (acc, orderItem) => {
          const product = products.find(
            (product) => product.id === orderItem.productId,
          );

          if (!product) {
            throw new Error(
              `Product not found for productId: ${orderItem.productId}`,
            );
          }

          return acc + product.price * orderItem.quantity;
        },
        0,
      );

      const totalItems = createOrderDto.items.reduce(
        (acc, item) => acc + item.quantity,
        0,
      );

      const order = await this.order.create({
        data: {
          totalAmount,
          totalItems,
          OrderItem: {
            createMany: {
              data: createOrderDto.items.map((orderItem) => ({
                price:
                  products.find((product) => product.id === orderItem.productId)
                    ?.price ?? 0,
                productId: orderItem.productId,
                quantity: orderItem.quantity,
              })),
            },
          },
        },

        include: {
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true,
            },
          },
        },
      });

      const extendedOrder: ExtendedOrderResponse = {
        ...order,
        totalItems,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        OrderItem: order.OrderItem.map((item) => ({
          ...item,
          name:
            products.find((product) => product.id === item.productId)?.name ??
            'Unknown',
        })),
      };

      return extendedOrder as ExtendedOrderProperties;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new RpcException({
        message: `Check Logs`,
        status: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async updateStatus(id: string, status: OrderStatus) {
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
      include: {
        OrderItem: {
          select: {
            price: true,
            quantity: true,
            productId: true,
          },
        },
      },
    });
    if (!order) {
      throw new RpcException({
        message: `Order not found with id ${id}`,
        status: HttpStatus.BAD_REQUEST,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    const productsIds = order.OrderItem.map((orderItem) => orderItem.productId);

    const products: ValidatedProduct[] = await firstValueFrom(
      this.client.send<ValidatedProduct[], number[]>(
        { cmd: 'validate_product' },
        productsIds,
      ),
    );

    return {
      ...order,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      OrderItem: order.OrderItem.map((item) => ({
        ...item,
        name:
          products.find((product) => product.id === item.productId)?.name ??
          'Unknown',
      })),
    };
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

  async createPaymentSession(order: ExtendedOrderProperties) {
    const paymentSession = await firstValueFrom(
      this.client.send(
        { cmd: 'create.payment.session' },
        {
          orderId: order.id,
          currency: 'usd',
          items: order.OrderItem?.map((item) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      ),
    );

    return paymentSession;
  }

  async paidOrder(paidOrderDto: PaidOrderDto) {
    return await this.order.update({
      where: { id: paidOrderDto.orderId },
      data: {
        status: OrderStatus.PAID,
        paid: true,
        paidAt: new Date(),
        stripeChartId: paidOrderDto.stripePaymentId,
        // relationship
        OrderReceipt: {
          create: {
            receiptUrl: paidOrderDto.receiptUrl,
          },
        },
      },
    });
  }
}
