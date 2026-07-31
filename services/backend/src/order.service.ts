import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import * as crypto from 'crypto';

import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { OrdersGateway } from './orders.gateway';
import { v4 as uuidv4 } from 'uuid';

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || '';
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || '';
const CASHFREE_ENV = (process.env.CASHFREE_ENV || 'TEST').toUpperCase();
const CASHFREE_BASE_URL = CASHFREE_ENV === 'PROD'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';
const CASHFREE_API_VERSION = '2023-08-01';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private ordersGateway: OrdersGateway,
  ) {}

  normalizePhone(phone: string): string {
    return (phone || '').replace(/\D/g, '');
  }

  async createCashfreeOrder(amount: number, cfOrderId: string, customerName: string) {
    const body = JSON.stringify({
      order_id: cfOrderId,
      order_amount: parseFloat(amount.toFixed(2)),
      order_currency: 'INR',
      customer_details: {
        customer_id: 'cust_' + cfOrderId,
        customer_name: customerName || 'Guest',
        customer_email: 'guest@cafe1cr.in',
        customer_phone: '9999999999',
      },
      order_meta: {
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout?cf_order_id={order_id}`,
      },
    });

    const res = await fetch(`${CASHFREE_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': CASHFREE_API_VERSION,
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
      },
      body,
    });

    const data = await res.json();
    console.log('[Cashfree] Status:', res.status, '| Response:', JSON.stringify(data));
    if (!res.ok) {
      throw new BadRequestException(data.message || 'Failed to create Cashfree order');
    }
    return data; // contains payment_session_id
  }

  async verifyCashfreePayment(cfOrderId: string) {
    const res = await fetch(`${CASHFREE_BASE_URL}/orders/${cfOrderId}`, {
      method: 'GET',
      headers: {
        'x-api-version': CASHFREE_API_VERSION,
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new BadRequestException('Failed to verify payment with Cashfree');
    return data;
  }

  async verifyPayment(data: any) {
    const dbOrderId = data.db_order_id;
    const cfOrderId = data.cf_order_id;

    if (!dbOrderId) throw new BadRequestException('Missing db_order_id');

    // Verify payment status with Cashfree if cf_order_id provided
    if (cfOrderId && CASHFREE_APP_ID) {
      const cfOrder = await this.verifyCashfreePayment(cfOrderId);
      const status = cfOrder.order_status;
      if (status !== 'PAID') {
        throw new BadRequestException(`Payment not completed. Status: ${status}`);
      }
    }

    const order = await this.orderRepository.findOne({ 
      where: { id: dbOrderId }, 
      relations: { items: true } 
    });

    if (!order) throw new NotFoundException('Order not found');

    order.status = 'PAID';
    if (cfOrderId) order.payment_method = 'CASHFREE';
    await this.orderRepository.save(order);

    this.ordersGateway.broadcastOrderCreated({
      id: order.id,
      order_display_id: order.order_display_id,
      status: order.status,
      total_amount: order.total_amount,
      items: order.items,
      customer_phone: order.customer_phone,
      customer_name: order.customer_name,
      table_number: order.table_number,
    });

    return {
      success: true,
      message: 'Payment verified and order confirmed!',
      db_order_id: order.id,
      order_display_id: order.order_display_id,
    };
  }

  async placeOrder(orderDto: any) {
    if (orderDto.table_number) {
      const tableNum = Number(orderDto.table_number);
      if (isNaN(tableNum) || tableNum < 1 || tableNum > 15) {
        throw new BadRequestException('Table number must be between 1 and 15.');
      }
      
      const activeOrder = await this.orderRepository.findOne({
        where: {
          table_number: tableNum,
          status: Not(In(['Completed', 'Declined', 'Cancelled', 'PENDING_PAYMENT']))
        }
      });
      
      if (activeOrder) {
        throw new BadRequestException(`Table ${tableNum} is currently occupied. Please wait until it is free.`);
      }
    }

    // Compute total from items as a safety fallback
    const computedTotal = (orderDto.items || []).reduce(
      (sum: number, item: any) => sum + (Number(item.price) || 0) * (Number(item.qty) || 1),
      0
    );
    const totalAmount = Number(orderDto.total) || computedTotal || 0;

    // Save order as PENDING_PAYMENT first
    const newOrder = this.orderRepository.create({
      payment_method: 'CASHFREE',
      customer_phone: this.normalizePhone(orderDto.phone),
      customer_address: orderDto.address,
      customer_name: orderDto.customer_name || '',
      table_number: orderDto.table_number || null,
      total_amount: totalAmount,
      status: 'PENDING_PAYMENT',
      items: (orderDto.items || []).map((item: any) => ({
        item_id: String(item.id || item.menu_item_id || ''),
        name: item.name || '',
        qty: Number(item.qty) || 1,
        price: Number(item.price) || 0,
      })),
    });

    const savedOrder = await this.orderRepository.save(newOrder);
    savedOrder.order_display_id = 'ORD-' + savedOrder.id.substring(savedOrder.id.length - 6).toUpperCase();
    await this.orderRepository.save(savedOrder);

    // Create Cashfree payment order
    const cfOrderId = 'CF-' + savedOrder.id.substring(0, 12);
    let paymentSessionId = null;

    if (CASHFREE_APP_ID) {
      try {
        const cfOrder = await this.createCashfreeOrder(
          totalAmount,
          cfOrderId,
          orderDto.customer_name || 'Guest'
        );
        paymentSessionId = cfOrder.payment_session_id;
      } catch (e) {
        // Clean up the pending order if Cashfree fails
        await this.orderRepository.delete(savedOrder.id);
        throw new BadRequestException('Payment gateway error. Please try again.');
      }
    }

    return {
      message: 'Order created. Complete payment to confirm.',
      db_order_id: savedOrder.id,
      order_display_id: savedOrder.order_display_id,
      cf_order_id: cfOrderId,
      payment_session_id: paymentSessionId,
      amount: totalAmount,
    };
  }

  async getOrderHistory(phone: string) {
    const normalizedPhone = this.normalizePhone(phone);
    const orders = await this.orderRepository.find({
      where: { customer_phone: normalizedPhone },
      relations: { items: true },
      order: { created_at: 'DESC' }
    });

    return {
      history: orders.map(o => ({
        id: o.id,
        total_amount: o.total_amount,
        status: o.status,
        payment_method: o.payment_method,
        created_at: o.created_at.toISOString(),
        items: o.items.map(i => ({
          name: i.name,
          qty: i.qty,
          price: i.price
        }))
      }))
    };
  }

  async getOrderStatus(id: string) {
    let order: Order | null;
    if (id.toUpperCase().startsWith('ORD-')) {
      order = await this.orderRepository.findOne({ where: { order_display_id: id }, relations: { items: true } });
    } else {
      order = await this.orderRepository.findOne({ where: { id }, relations: { items: true } });
    }

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    let prep_seconds_left = null;
    if (order.approved_at && !['Completed', 'Declined'].includes(order.status)) {
      const elapsed = (new Date().getTime() - order.approved_at.getTime()) / 1000;
      prep_seconds_left = Math.max(0, Math.floor((order.prep_time_minutes || 10) * 60 - elapsed));
    }

    return {
      id: order.id,
      order_id: id,
      order_display_id: order.order_display_id,
      status: order.status,
      approved_at: order.approved_at ? order.approved_at.toISOString() : null,
      prep_time_minutes: order.prep_time_minutes || 10,
      prep_seconds_left,
      items: order.items.map((item: any) => ({
        name: item.name,
        qty: item.qty,
        price: item.price
      }))
    };
  }

  async getAllOrders() {
    const orders = await this.orderRepository.find({
      relations: { items: true },
      order: { created_at: 'DESC' },
      take: 200,
    });
    return {
      orders: orders.map(o => ({
        id: o.id,
        order_display_id: o.order_display_id,
        customer_name: o.customer_name || 'Guest',
        customer_phone: o.customer_phone,
        table_number: o.table_number,
        total_amount: o.total_amount,
        status: o.status,
        payment_method: o.payment_method,
        created_at: o.created_at.toISOString(),
        items: o.items.map(i => ({ name: i.name, qty: i.qty, price: i.price }))
      }))
    };
  }

  async updateOrderStatus(id: string, status: string, prepTimeMinutes?: number) {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) throw new Error('Order not found');
    order.status = status;
    if (status === 'Approved' || status === 'Preparing') {
      order.approved_at = new Date();
      if (prepTimeMinutes) order.prep_time_minutes = prepTimeMinutes;
    }
    await this.orderRepository.save(order);
    this.ordersGateway.broadcastOrderStatus({
      order_id: order.id,
      order_display_id: order.order_display_id,
      status: order.status,
      timestamp: new Date().toISOString(),
      updated_by: 'admin',
    });
    return { success: true, status: order.status };
  }

  async getAnalytics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's orders
    const todaysOrders = await this.orderRepository.find({
      where: {
        // Simple way to filter by today (assuming created_at is a Date column)
        // Wait, TypeORM might need Between or raw SQL for dates.
        // Let's just fetch all recent orders and filter in memory since it's a small app
      },
      relations: { items: true },
      order: { created_at: 'DESC' },
      take: 1000 // reasonable limit
    });

    let revenueToday = 0;
    let ordersToday = 0;
    const itemSales: Record<string, number> = {};

    const last7DaysRevenue: Record<string, number> = {};
    const last7DaysOrders: Record<string, number> = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
      last7DaysRevenue[dayStr] = 0;
      last7DaysOrders[dayStr] = 0;
    }

    for (const order of todaysOrders) {
      // Calculate today's stats
      if (order.created_at >= today) {
        ordersToday++;
        revenueToday += order.total_amount;
      }

      // Calculate chart data (last 7 days)
      const orderDate = new Date(order.created_at);
      const dayStr = orderDate.toLocaleDateString('en-US', { weekday: 'short' });
      if (last7DaysRevenue[dayStr] !== undefined) {
        last7DaysRevenue[dayStr] += order.total_amount;
        last7DaysOrders[dayStr]++;
      }

      // Calculate top items
      for (const item of order.items) {
        if (!itemSales[item.name]) {
          itemSales[item.name] = 0;
        }
        itemSales[item.name] += item.qty;
      }
    }

    const topItems = Object.entries(itemSales)
      .map(([name, sales]) => ({ name, sales }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    const chartData = Object.keys(last7DaysRevenue).map(day => ({
      name: day,
      revenue: last7DaysRevenue[day],
      orders: last7DaysOrders[day]
    }));

    return {
      revenueToday,
      ordersToday,
      topItems,
      chartData
    };
  }
}
