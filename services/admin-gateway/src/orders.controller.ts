import { Controller, Get, Put, Post, Param, Body } from '@nestjs/common';
import { OrdersGateway } from './orders.gateway';

@Controller()
export class OrdersController {
  constructor(private readonly ordersGateway: OrdersGateway) {}

  // ── Webhooks from Order Service ─────────────────────────────────────────
  @Post('api/internal/webhook/orders/created')
  handleOrderCreated(@Body() message: any) {
    console.log('Admin Gateway received orders.created webhook:', message.id);
    this.ordersGateway.broadcastOrderCreated(message);
  }

  @Post('api/internal/webhook/orders/status')
  handleOrderStatus(@Body() message: any) {
    console.log('Admin Gateway received orders.status webhook:', message.order_id);
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
        `http://${process.env.ORDER_SERVICE_HOST || 'localhost'}:${process.env.ORDER_SERVICE_PORT || 3001}/api/admin/orders/${id}/status`,
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
