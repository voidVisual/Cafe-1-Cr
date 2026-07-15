import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ schema: 'warehouse', name: 'dim_time' })
export class DimTime {
  @PrimaryColumn()
  time_id: string;

  @Column({ type: 'date', nullable: true })
  date: Date;

  @Column('int', { nullable: true })
  hour: number;

  @Column('int', { nullable: true })
  day_of_week: number;
}
