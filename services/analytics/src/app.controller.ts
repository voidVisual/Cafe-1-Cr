import { Controller, Get } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @EventPattern('orders.created')
  handleOrderCreated(@Payload() message: any) {
    this.appService.processOrderEvent(message);
  }

  @EventPattern('orders.status')
  handleOrderStatus(@Payload() message: any) {
    this.appService.processOrderEvent(message);
  }

  @Get('api/admin/analytics')
  getAnalytics() {
    return this.appService.getAnalytics();
  }
}
