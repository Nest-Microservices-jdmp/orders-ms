import { Injectable, Logger } from '@nestjs/common';

import { CreateOrderDto } from './dto/create-order.dto';
import { PaginationDto } from 'src/common';

@Injectable()
export class OrderService {
  private readonly logger = new Logger('OrderService');

  create(createProductDto: CreateOrderDto) {
    return 'create order';
  }

  findAll({ limit, page }: PaginationDto) {
    return ' find all order ';
  }

  findOne(id: number) {
    return 'find one';
  }
}
