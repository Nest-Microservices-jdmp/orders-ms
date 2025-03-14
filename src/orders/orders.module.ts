import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrderService } from './order.service';

@Module({
  controllers: [OrdersController],
  providers: [OrderService],
})
export class OrdersModule {}
