import { Injectable, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class AppService {
  constructor(
    @Inject('KAFKA_CLIENT')
    private readonly kafkaClient: ClientKafka,
  ) {}

  handleOrderCreated(data: any) {
    console.log('Kitchen received new order:', data);
    // In a real app, broadcast to connected clients via WebSockets
  }

  handleOrderStatus(data: any) {
    console.log('Kitchen received order status update:', data);
    // In a real app, update UI via WebSockets
  }

  updateOrderStatus(id: string, statusDto: any) {
    console.log(`Kitchen staff updating order ${id} status to ${statusDto.status}`);
    
    // Emit status update to Kafka
    this.kafkaClient.emit('orders.status', {
      order_id: id,
      status: statusDto.status,
      timestamp: new Date().toISOString(),
      updated_by: 'kitchen'
    });

    return { success: true, message: 'Status update emitted' };
  }
}
