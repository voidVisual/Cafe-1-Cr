import { Controller, Post, Get, Put, Body, Param } from '@nestjs/common';
import { OrderService } from './order.service';

@Controller('api')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}


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

  /** Admin: get all orders */
  @Get('admin/orders')
  getAllOrders() {
    return this.orderService.getAllOrders();
  }

  /** Admin: update order status */
  @Put('admin/orders/:id/status')
  updateOrderStatus(@Param('id') id: string, @Body() body: any) {
    return this.orderService.updateOrderStatus(id, body.status, body.prep_time_minutes);
  }

  /** Admin: dashboard analytics */
  @Get('analytics')
  getAnalytics() {
    return this.orderService.getAnalytics();
  }
}

