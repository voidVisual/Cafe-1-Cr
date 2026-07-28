import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('menu_items')
export class MenuItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  sub: string;

  @Column({ nullable: true })
  desc: string;

  @Column('float')
  price: number;

  @Column()
  category: string;

  @Column('float', { default: 0 })
  rating: number;

  @Column('int', { default: 0 })
  reviews: number;

  @Column({ nullable: true })
  img: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  is_available: boolean;

  @Column('int', { default: 10 })
  prep_time_estimate: number;

  @Column({ nullable: true })
  image_url: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
