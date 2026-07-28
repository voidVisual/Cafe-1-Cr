import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Admin Gateway Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Admin Gateway Client disconnected: ${client.id}`);
  }

  broadcastOrderCreated(orderData: any) {
    this.server.emit('order_created', orderData);
  }

  broadcastOrderStatus(orderData: any) {
    this.server.emit('order_status', orderData);
  }
}
