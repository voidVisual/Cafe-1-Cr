import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MenuItemDocument = MenuItem & Document;

@Schema({ timestamps: true })
export class MenuItem {
  @Prop({ required: true })
  name: string;

  @Prop()
  sub: string;

  @Prop()
  desc: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  category: string;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  reviews: number;

  @Prop()
  img: string;

  @Prop()
  description: string;

  @Prop({ default: true })
  is_available: boolean;

  @Prop({ default: 10 })
  prep_time_estimate: number;

  @Prop()
  image_url: string;
}

export const MenuItemSchema = SchemaFactory.createForClass(MenuItem);
