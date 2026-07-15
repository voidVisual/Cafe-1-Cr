import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity({ schema: 'warehouse', name: 'dim_items' })
export class DimItem {
  @PrimaryColumn('int')
  item_id: number;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  category: string;
}
