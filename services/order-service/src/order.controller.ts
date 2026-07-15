import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { OrderService } from './order.service';

@Controller('api')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('payment/create')
  createPayment(@Body() orderDto: any) {
    return this.orderService.createPayment(orderDto);
  }

  @Post('payment/verify')
  verifyPayment(@Body() data: any) {
    return this.orderService.verifyPayment(data);
  }

  @Post('order')
  placeOrder(@Body() orderDto: any) {
    return this.orderService.placeOrder(orderDto);
  }

  @Get('orders/history/:phone')
  getOrderHistory(@Param('phone') phone: string) {
    return this.orderService.getOrderHistory(phone);
  }

  @Get('orders/status/:id')
  getOrderStatus(@Param('id') id: string) {
    return this.orderService.getOrderStatus(id);
  }
}
