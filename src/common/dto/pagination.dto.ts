import { OrderStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsPositive } from 'class-validator';

export class PaginationDto {
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}
export class PaginationStatusDto extends PaginationDto {
  @IsEnum(OrderStatus, {
    message: `Possible status values are ${Object.values(OrderStatus).join(', ')}`,
  })
  @IsOptional()
  status?: OrderStatus;
}
