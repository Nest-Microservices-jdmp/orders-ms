/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderService } from './order.service';
import { PaginationStatusDto } from 'src/common';
import { OrderStatus } from '@prisma/client';
import { PaidOrderDto } from './dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orderService: OrderService) {}

  @MessagePattern({ cmd: 'create_order' })
  async create(@Payload() createOrderDto: CreateOrderDto) {
    const order = await this.orderService.create(createOrderDto);
    const paymentSession = await this.orderService.createPaymentSession(order);
    return {
      order,
      paymentSession,
    };
  }

  @MessagePattern({ cmd: 'find_orders' })
  findAll(@Payload() paginationDto: PaginationStatusDto) {
    return this.orderService.findAll(paginationDto);
  }

  @MessagePattern({ cmd: 'find_one' })
  findOne(@Payload() id: string) {
    return this.orderService.findOne(id);
  }
  @MessagePattern({ cmd: 'find_status' })
  findStatus(@Payload() data: any) {
    return this.orderService.findStatus(data);
  }

  @MessagePattern({ cmd: 'change_order_status' })
  changeOrderStatus(
    @Payload() { id, status }: { id: string; status: OrderStatus },
  ) {
    return this.orderService.updateStatus(id, status);
  }

  @EventPattern({ cmd: 'payment.succeeded' })
  async paidOrder(@Payload() paidOrderDto: PaidOrderDto) {
    return await this.orderService.paidOrder(paidOrderDto);
  }
}
