import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ schema: 'warehouse', name: 'fact_orders' })
export class FactOrder {
  @PrimaryColumn()
  order_id: string;

  @Column({ nullable: true })
  time_id: string;

  @Column({ type: 'int', nullable: true })
  table_id: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  total_amount: number;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  payment_status: string;

  @Column({ type: 'int', nullable: true })
  prep_time_actual: number;
}
