import { OrderStatus } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';

export class CreateOrderDto {
  @IsNumber()
  @IsPositive()
  totalAmount: number;

  @IsNumber()
  @IsPositive()
  totalItems: number;

  @IsEnum(OrderStatus, {
    message: `Possible status values are ${Object.values(OrderStatus).join(', ')}`,
  })
  @IsOptional()
  status: OrderStatus = OrderStatus.PENDING;

  @IsOptional()
  @IsBoolean()
  paid: boolean = false;
}
