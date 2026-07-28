import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FactOrder } from './fact-order.entity';
import { DimItem } from './dim-item.entity';
import { DimTime } from './dim-time.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(FactOrder)
    private factOrderRepo: Repository<FactOrder>,
    @InjectRepository(DimItem)
    private dimItemRepo: Repository<DimItem>,
    @InjectRepository(DimTime)
    private dimTimeRepo: Repository<DimTime>,
  ) {}

  async processOrderEvent(data: any) {
    const orderId = data.order_id || data.id;
    if (!orderId) {
      console.log('Skipping event, no order_id:', data);
      return;
    }
    console.log('Analytics processing order event:', orderId);
    
    // Save to fact table
    const time_id = new Date().toISOString().substring(0, 13); // yyyy-mm-ddThh
    const updateData: any = { order_id: orderId, time_id };
    if (data.total_amount !== undefined) updateData.total_amount = data.total_amount;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.payment_method !== undefined) updateData.payment_status = data.payment_method;
    
    await this.factOrderRepo.save(updateData);

    // Populate Dim Items if needed
    if (data.items && Array.isArray(data.items)) {
      for (const item of data.items) {
        // Use a deterministic numeric id from item_id string, avoid random fallback
        const numericId = parseInt(item.item_id) || 
          item.name.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
        const qty = parseInt(item.qty) || 1;

        let existingItem = await this.dimItemRepo.findOneBy({ item_id: numericId });
        if (existingItem) {
          existingItem.sales_count = (existingItem.sales_count || 0) + qty;
          await this.dimItemRepo.save(existingItem);
        } else {
          await this.dimItemRepo.save({
            item_id: numericId,
            name: item.name,
            category: item.category || 'Uncategorized',
            sales_count: qty,
          }).catch(() => {
            // ignore duplicate key violations
          });
        }
      }
    }
    
    // Populate Dim Time
    const now = new Date();
    await this.dimTimeRepo.save({
      time_id,
      date: now,
      hour: now.getHours(),
      day_of_week: now.getDay(),
    }).catch(err => {});
  }

  async getAnalytics() {
    const todayStr = new Date().toISOString().substring(0, 10);
    
    // 1. Find today's revenue & orders
    const todayResult = await this.factOrderRepo
      .createQueryBuilder('fact')
      .where('fact.time_id LIKE :today', { today: `${todayStr}%` })
      .select('SUM(fact.total_amount)', 'revenueToday')
      .addSelect('COUNT(fact.order_id)', 'ordersToday')
      .getRawOne();

    // 2. Fetch revenue over the last 7 days for the chart
    // Use LEFT() instead of SUBSTR() — LEFT works on PostgreSQL
    const chartDataResult = await this.factOrderRepo
      .createQueryBuilder('fact')
      .select('LEFT(fact.time_id, 10)', 'date')
      .addSelect('SUM(fact.total_amount)', 'revenue')
      .addSelect('COUNT(fact.order_id)', 'orders')
      .groupBy('LEFT(fact.time_id, 10)')
      .orderBy('date', 'DESC')
      .limit(7)
      .getRawMany();

    // Format chart data for frontend (reverse to chronological order)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const chartData = chartDataResult.reverse().map(row => {
      const d = new Date(row.date);
      return {
        name: days[d.getDay()],
        revenue: parseFloat(row.revenue) || 0,
        orders: parseInt(row.orders) || 0
      };
    });

    // 3. Top Items
    // Read from the newly aggregated sales_count column
    const topItemsResult = await this.dimItemRepo
      .createQueryBuilder('item')
      .select('item.name', 'name')
      .addSelect('item.sales_count', 'sales')
      .orderBy('item.sales_count', 'DESC')
      .limit(5)
      .getRawMany();

    const topItems = topItemsResult.map(row => ({
      name: row.name,
      sales: parseInt(row.sales) || 0
    }));

    return {
      revenueToday: parseFloat(todayResult.revenueToday) || 0,
      ordersToday: parseInt(todayResult.ordersToday) || 0,
      chartData: chartData.length > 0 ? chartData : [
        // Fallback placeholder if no data exists yet
        { name: days[new Date().getDay()], revenue: 0, orders: 0 }
      ],
      topItems: topItems.length > 0 ? topItems : [
        { name: 'No items yet', sales: 0 }
      ]
    };
  }
}
