import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { OrdersGateway } from './orders.gateway';

@Controller()
export class OrdersController {
  constructor(private readonly ordersGateway: OrdersGateway) {}

  @EventPattern('orders.created')
  handleOrderCreated(@Payload() message: any) {
    console.log('Admin Gateway received orders.created:', message.id);
    this.ordersGateway.broadcastOrderCreated(message);
  }

  @EventPattern('orders.status')
  handleOrderStatus(@Payload() message: any) {
    console.log('Admin Gateway received orders.status:', message.order_id);
    this.ordersGateway.broadcastOrderStatus(message);
  }
}
