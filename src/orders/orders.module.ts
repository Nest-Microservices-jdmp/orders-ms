import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrderService } from './order.service';
import { NatsModule } from 'src/transports/nats.module';

@Module({
  controllers: [OrdersController],
  providers: [OrderService],
  imports: [NatsModule],
})
export class OrdersModule {}
