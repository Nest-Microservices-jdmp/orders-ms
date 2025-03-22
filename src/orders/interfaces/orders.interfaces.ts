import { OrderStatus } from '@prisma/client';
import { OrderItemCustomDto } from '../dto';

export interface CreateOrderItem {
  productId: number;
  price: number;
  quantity: number;
}

export interface ValidatedProduct {
  id: number;
  name: string;
  price: number;
  available: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderResponse {
  totalAmount?: number;
}

export interface ExtendedOrderResponse extends OrderResponse {
  totalItems: number;
  OrderItem?: OrderItemCustomDto[];
}

export interface ExtendedOrderProperties extends ExtendedOrderResponse {
  id: string;
  totalAmount: number;
  status: OrderStatus;
  paid: boolean;
  paidAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
