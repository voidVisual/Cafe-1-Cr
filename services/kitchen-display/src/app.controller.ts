import { Controller, Put, Param, Body } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller('api/kitchen')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @EventPattern('orders.created')
  handleOrderCreated(@Payload() message: any) {
    this.appService.handleOrderCreated(message);
  }

  @EventPattern('orders.status')
  handleOrderStatus(@Payload() message: any) {
    this.appService.handleOrderStatus(message);
  }

  @Put('orders/:id/status')
  updateOrderStatus(@Param('id') id: string, @Body() statusDto: any) {
    return this.appService.updateOrderStatus(id, statusDto);
  }
}
