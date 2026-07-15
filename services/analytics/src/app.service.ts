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
    console.log('Analytics processing order event:', data.id);
    
    // Save to fact table
    const time_id = new Date().toISOString().substring(0, 13); // yyyy-mm-ddThh
    await this.factOrderRepo.save({
      order_id: data.id,
      time_id,
      total_amount: data.total_amount,
      status: data.status,
      payment_status: data.payment_method || 'UNKNOWN',
    });

    // Populate Dim Items if needed
    if (data.items && Array.isArray(data.items)) {
      for (const item of data.items) {
        await this.dimItemRepo.save({
          item_id: parseInt(item.item_id) || Math.floor(Math.random() * 1000), // fallback
          name: item.name,
          category: 'Uncategorized', // Need proper category if provided
        }).catch(err => {
          // ignore duplicate keys
        });
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
    // In SQLite, substr is 1-indexed. We group by substr(time_id, 1, 10).
    const chartDataResult = await this.factOrderRepo
      .createQueryBuilder('fact')
      .select('SUBSTR(fact.time_id, 1, 10)', 'date')
      .addSelect('SUM(fact.total_amount)', 'revenue')
      .addSelect('COUNT(fact.order_id)', 'orders')
      .groupBy('SUBSTR(fact.time_id, 1, 10)')
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
    // Since fact_order_items isn't fully linked in the warehouse, 
    // we use dim_item occurrences to approximate top items recently ordered
    const topItemsResult = await this.dimItemRepo
      .createQueryBuilder('item')
      .select('item.name', 'name')
      .addSelect('COUNT(item.item_id)', 'sales')
      .groupBy('item.name')
      .orderBy('sales', 'DESC')
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
