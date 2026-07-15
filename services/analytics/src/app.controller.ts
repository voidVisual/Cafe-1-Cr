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

  // Route matches Next.js rewrite: /api/analytics → http://localhost:3004/api/analytics
  @Get('api/analytics')
  getAnalytics() {
    return this.appService.getAnalytics();
  }
}
