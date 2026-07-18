import { Controller, Get, Put, Param, Body } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { OrdersGateway } from './orders.gateway';

@Controller()
export class OrdersController {
  constructor(private readonly ordersGateway: OrdersGateway) {}

  // ── Kafka event handlers ────────────────────────────────────────────────
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

  // ── REST endpoints for Admin Dashboard ─────────────────────────────────

  /**
   * GET /api/admin/orders
   * Proxies to order-service to fetch all orders for the admin dashboard.
   */
  @Get('api/admin/orders')
  async getOrders() {
    try {
      const res = await fetch(
        `http://${process.env.ORDER_SERVICE_HOST || 'localhost'}:${process.env.ORDER_SERVICE_PORT || 3001}/api/admin/orders`,
      );
      if (!res.ok) {
        // Order-service may not have this endpoint yet — return empty array gracefully
        return { orders: [] };
      }
      return res.json();
    } catch {
      return { orders: [] };
    }
  }

  /**
   * PUT /api/admin/orders/:id/status
   * Proxies the status update to the kitchen-display service which emits a Kafka event.
   */
  @Put('api/admin/orders/:id/status')
  async updateOrderStatus(@Param('id') id: string, @Body() body: any) {
    try {
      const res = await fetch(
        `http://${process.env.KITCHEN_SERVICE_HOST || 'localhost'}:${process.env.KITCHEN_SERVICE_PORT || 3003}/api/kitchen/orders/${id}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      return res.json();
    } catch {
      return { success: false, message: 'Failed to update order status' };
    }
  }
}
