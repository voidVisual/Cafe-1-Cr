import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MenuItem, MenuItemDocument } from './menu-item.schema';

const menu_data = [
  {"name":"Cappuccino","sub":"with Chocolate","category":"cappuccino","price":320,"rating":4.8,"reviews":230,"img":"https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80","desc":"A classic cappuccino made with 25ml of rich espresso and 85ml of perfectly steamed milk, topped with chocolate shavings."},
  {"name":"Café Latte","sub":"with Oat Milk","category":"latte","price":310,"rating":4.9,"reviews":187,"img":"https://images.unsplash.com/photo-1485808191679-5f86510bd9d4?w=600&q=80","desc":"A smooth, creamy latte made with oat milk for a naturally sweet finish. Perfect for your morning."},
  {"name":"Machiato","sub":"Caramel Drizzle","category":"machiato","price":360,"rating":4.7,"reviews":145,"img":"https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80","desc":"Espresso marked with a dollop of foam, drizzled with house-made caramel. Bold yet sweet."},
  {"name":"Cold Brew","sub":"Double Strength","category":"cold","price":400,"rating":4.9,"reviews":312,"img":"https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80","desc":"Steeped for 18 hours in cold water for an incredibly smooth, low-acid coffee. Served over ice."},
  {"name":"Americano","sub":"Classic Black","category":"cappuccino","price":240,"rating":4.6,"reviews":98,"img":"https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=600&q=80","desc":"A long espresso with hot water for a clean, bold black coffee. The purist's choice."},
  {"name":"Mocha Latte","sub":"Dark Chocolate","category":"latte","price":380,"rating":4.8,"reviews":201,"img":"https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=600&q=80","desc":"Espresso blended with rich dark chocolate and steamed milk. A dessert in a cup."},
  {"name":"Cold Latte","sub":"Vanilla Bean","category":"cold","price":360,"rating":4.7,"reviews":156,"img":"https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&q=80","desc":"Chilled espresso over ice with vanilla-infused cold milk. Sweet, simple, and satisfying."},
  {"name":"Almond Croissant","sub":"Fresh Baked","category":"snack","price":200,"rating":4.8,"reviews":88,"img":"https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80","desc":"Flaky, buttery croissant filled with almond cream and topped with toasted flaked almonds. Baked fresh daily."}
];

@Injectable()
export class MenuService implements OnModuleInit {
  constructor(
    @InjectModel(MenuItem.name) private menuModel: Model<MenuItemDocument>,
  ) {}

  async onModuleInit() {
    const count = await this.menuModel.countDocuments();
    if (count === 0) {
      await this.menuModel.insertMany(menu_data);
    }
  }

  async getMenu() {
    const items = await this.menuModel.find().exec();
    return items.map(item => ({
      id: item._id.toString(),
      name: item.name,
      sub: item.sub,
      category: item.category,
      price: item.price,
      rating: item.rating,
      reviews: item.reviews,
      img: item.img,
      desc: item.desc,
      is_available: item.is_available,
      prep_time_estimate: item.prep_time_estimate,
      image_url: item.image_url
    }));
  }

  async createMenu(data: any) {
    const newItem = new this.menuModel(data);
    return await newItem.save();
  }

  async updateMenu(id: string, data: any) {
    return await this.menuModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async deleteMenu(id: string) {
    await this.menuModel.findByIdAndDelete(id).exec();
    return { success: true };
  }
}
