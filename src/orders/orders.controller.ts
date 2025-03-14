import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderService } from './order.service';
import { PaginationDto } from 'src/common';

@Controller()
export class OrdersController {
  constructor(private readonly orderService: OrderService) {}

  @MessagePattern({ cmd: 'create_order' })
  create(@Payload() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @MessagePattern({ cmd: 'find_orders' })
  findAll(@Payload() paginationDto: PaginationDto) {
    return this.orderService.findAll(paginationDto);
  }

  @MessagePattern({ cmd: 'find_one' })
  findOne(@Payload() id: number) {
    return this.orderService.findOne(id);
  }

  @MessagePattern({ cmd: 'change_order_status' })
  changeOrderStatus(@Payload() updateOrderDto: UpdateOrderDto) {
    return 'hello';
    // return this.ordersService.changeStatus(updateOrderDto.id, updateOrderDto);
  }
}
