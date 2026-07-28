import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuItem } from './menu-item.entity';

const menu_data = [
  {
    "id": 1,
    "name": "Thick Cold Coffee (Offer)",
    "desc": "12 Months Special Offer",
    "rating": 4.8,
    "reviews": 124,
    "price": 20,
    "category": "Cold Coffee",
    "img": "/images/thick_cold_coffee_offer_1783664203176.png"
  },
  {
    "id": 2,
    "name": "Thick Coffee with Crush",
    "desc": "Refreshing blend",
    "rating": 4.5,
    "reviews": 85,
    "price": 35,
    "category": "Cold Coffee",
    "img": "/images/thick_coffee_crush_1783664213634.png"
  },
  {
    "id": 3,
    "name": "Plane / Thick Cold Coffee",
    "desc": "Simple and thick",
    "rating": 4.6,
    "reviews": 92,
    "price": 40,
    "category": "Cold Coffee",
    "img": "/images/plane_thick_cold_coffee_1783664240019.png"
  },
  {
    "id": 4,
    "name": "Thick Coffee with Icecream",
    "desc": "Rich icecream topping",
    "rating": 4.9,
    "reviews": 210,
    "price": 50,
    "category": "Cold Coffee",
    "img": "/images/thick_coffee_icecream_1783664253545.png"
  },
  {
    "id": 5,
    "name": "Caramel Thick Coffee / Crush",
    "desc": "Sweet caramel flavor",
    "rating": 4.7,
    "reviews": 150,
    "price": 70,
    "category": "Cold Coffee",
    "img": "/images/caramel_thick_coffee_1783664305887.png"
  },
  {
    "id": 6,
    "name": "French Vanilla Thick Coffee",
    "desc": "Smooth vanilla taste",
    "rating": 4.8,
    "reviews": 132,
    "price": 80,
    "category": "Cold Coffee",
    "img": "/images/french_vanilla_thick_coffee_1783664323471.png"
  },
  {
    "id": 7,
    "name": "Black Coffee",
    "desc": "Strong and bold",
    "rating": 4.5,
    "reviews": 300,
    "price": 20,
    "category": "Hot Coffee",
    "img": "/images/black_coffee_1783664339035.png"
  },
  {
    "id": 8,
    "name": "Hot Coffee",
    "desc": "Classic hot brew",
    "rating": 4.7,
    "reviews": 450,
    "price": 30,
    "category": "Hot Coffee",
    "img": "/images/hot_coffee_1783664353907.png"
  },
  {
    "id": 9,
    "name": "Hot Chocolate",
    "desc": "Rich cocoa goodness",
    "rating": 4.9,
    "reviews": 312,
    "price": 50,
    "category": "Hot Coffee",
    "img": "/images/caramel_macchiato.png"
  },
  {
    "id": 10,
    "name": "Lemone Ice Tea (Jumbo)",
    "desc": "Zesty and cool",
    "rating": 4.6,
    "reviews": 88,
    "price": 60,
    "category": "Ice Tea",
    "img": "/images/iced_cold_brew.png"
  },
  {
    "id": 11,
    "name": "Peach Ice Tea (Jumbo)",
    "desc": "Sweet peach infusion",
    "rating": 4.8,
    "reviews": 105,
    "price": 60,
    "category": "Ice Tea",
    "img": "/images/chai_tea_latte.png"
  },
  {
    "id": 12,
    "name": "Strawberry Shake",
    "desc": "Fruity delight",
    "rating": 4.5,
    "reviews": 90,
    "price": 50,
    "category": "Shakes",
    "img": "/images/matcha_latte.png"
  },
  {
    "id": 13,
    "name": "Chocolate Shake",
    "desc": "Chocolate heaven",
    "rating": 4.8,
    "reviews": 160,
    "price": 50,
    "category": "Shakes",
    "img": "/images/caramel_macchiato.png"
  },
  {
    "id": 14,
    "name": "Vanilla Shake",
    "desc": "Classic vanilla",
    "rating": 4.4,
    "reviews": 75,
    "price": 60,
    "category": "Shakes",
    "img": "/images/chai_tea_latte.png"
  },
  {
    "id": 15,
    "name": "Oreo Shake",
    "desc": "Loaded with oreos",
    "rating": 4.9,
    "reviews": 210,
    "price": 70,
    "category": "Shakes",
    "img": "/images/iced_cold_brew.png"
  },
  {
    "id": 16,
    "name": "Kit-Kat Shake",
    "desc": "Crunchy kit-kat blend",
    "rating": 4.8,
    "reviews": 180,
    "price": 80,
    "category": "Shakes",
    "img": "/images/caramel_macchiato.png"
  },
  {
    "id": 17,
    "name": "Salted Fries",
    "desc": "Crispy and salted",
    "rating": 4.6,
    "reviews": 130,
    "price": 70,
    "category": "Fries",
    "img": "/images/avocado_toast.png"
  },
  {
    "id": 18,
    "name": "Masala Fries",
    "desc": "Spicy Indian twist",
    "rating": 4.7,
    "reviews": 145,
    "price": 90,
    "category": "Fries",
    "img": "/images/almond_croissant.png"
  },
  {
    "id": 19,
    "name": "BBQ Fries",
    "desc": "Smoky BBQ flavor",
    "rating": 4.5,
    "reviews": 95,
    "price": 80,
    "category": "Fries",
    "img": "/images/hero_coffee.png"
  },
  {
    "id": 20,
    "name": "Peri Peri Fries / Cheese",
    "desc": "Spicy peri peri",
    "rating": 4.8,
    "reviews": 220,
    "price": 110,
    "category": "Fries",
    "img": "/images/avocado_toast.png"
  },
  {
    "id": 21,
    "name": "Cheese Fries",
    "desc": "Loaded with cheese",
    "rating": 4.9,
    "reviews": 250,
    "price": 100,
    "category": "Fries",
    "img": "/images/blueberry_muffin.png"
  },
  {
    "id": 22,
    "name": "Melted Cheese Fries",
    "desc": "Extra gooey cheese",
    "rating": 4.8,
    "reviews": 190,
    "price": 140,
    "category": "Fries",
    "img": "/images/avocado_toast.png"
  },
  {
    "id": 23,
    "name": "Tandoori Melted Cheese",
    "desc": "Tandoori spice twist",
    "rating": 4.7,
    "reviews": 160,
    "price": 150,
    "category": "Fries",
    "img": "/images/almond_croissant.png"
  },
  {
    "id": 24,
    "name": "White Sauce Macaroni",
    "desc": "Creamy and cheesy",
    "rating": 4.8,
    "reviews": 210,
    "price": 130,
    "category": "Pasta",
    "img": "/images/hero_coffee.png"
  },
  {
    "id": 25,
    "name": "Masala Pasta",
    "desc": "Indian style pasta",
    "rating": 4.6,
    "reviews": 180,
    "price": 140,
    "category": "Pasta",
    "img": "/images/avocado_toast.png"
  },
  {
    "id": 26,
    "name": "Red Paprika Pasta",
    "desc": "Spicy red sauce",
    "rating": 4.7,
    "reviews": 195,
    "price": 150,
    "category": "Pasta",
    "img": "/images/almond_croissant.png"
  },
  {
    "id": 27,
    "name": "Plane Maggie",
    "desc": "Classic instant noodles",
    "rating": 4.5,
    "reviews": 300,
    "price": 50,
    "category": "Maggie",
    "img": "/images/blueberry_muffin.png"
  },
  {
    "id": 28,
    "name": "Veg Maggie",
    "desc": "With fresh veggies",
    "rating": 4.6,
    "reviews": 250,
    "price": 60,
    "category": "Maggie",
    "img": "/images/avocado_toast.png"
  },
  {
    "id": 29,
    "name": "Masala Maggie",
    "desc": "Extra spicy masala",
    "rating": 4.8,
    "reviews": 320,
    "price": 60,
    "category": "Maggie",
    "img": "/images/hero_coffee.png"
  },
  {
    "id": 30,
    "name": "Veg Masala Maggie",
    "desc": "Veggies and spice",
    "rating": 4.7,
    "reviews": 290,
    "price": 70,
    "category": "Maggie",
    "img": "/images/almond_croissant.png"
  },
  {
    "id": 31,
    "name": "Hara Bhara Kabab",
    "desc": "Healthy green snack",
    "rating": 4.5,
    "reviews": 80,
    "price": 70,
    "category": "Snacks",
    "img": "/images/avocado_toast.png"
  },
  {
    "id": 32,
    "name": "Crispy Onion Rings",
    "desc": "Golden and crunchy",
    "rating": 4.7,
    "reviews": 150,
    "price": 80,
    "category": "Snacks",
    "img": "/images/blueberry_muffin.png"
  },
  {
    "id": 33,
    "name": "Cheese Potato Shots",
    "desc": "Cheesy potato bites",
    "rating": 4.8,
    "reviews": 190,
    "price": 80,
    "category": "Snacks",
    "img": "/images/avocado_toast.png"
  },
  {
    "id": 34,
    "name": "Chilli Garlic Shots",
    "desc": "Spicy garlic twist",
    "rating": 4.6,
    "reviews": 130,
    "price": 99,
    "category": "Snacks",
    "img": "/images/almond_croissant.png"
  },
  {
    "id": 35,
    "name": "Veg Fingers",
    "desc": "Crispy veggie sticks",
    "rating": 4.4,
    "reviews": 75,
    "price": 90,
    "category": "Snacks",
    "img": "/images/hero_coffee.png"
  },
  {
    "id": 36,
    "name": "Chicken Nuggets",
    "desc": "Classic chicken snack",
    "rating": 4.8,
    "reviews": 210,
    "price": 99,
    "category": "Snacks",
    "img": "/images/avocado_toast.png"
  },
  {
    "id": 37,
    "name": "Chicken Cheesy Popcorn",
    "desc": "Cheesy chicken bites",
    "rating": 4.9,
    "reviews": 240,
    "price": 120,
    "category": "Snacks",
    "img": "/images/almond_croissant.png"
  },
  {
    "id": 38,
    "name": "Chocolate - M",
    "desc": "Medium chocolate cream",
    "rating": 4.6,
    "reviews": 110,
    "price": 90,
    "category": "Desserts",
    "img": "/images/blueberry_muffin.png"
  },
  {
    "id": 39,
    "name": "Chocolate - B",
    "desc": "Big chocolate cream",
    "rating": 4.8,
    "reviews": 150,
    "price": 99,
    "category": "Desserts",
    "img": "/images/caramel_macchiato.png"
  },
  {
    "id": 40,
    "name": "Chilli Cheese Tost",
    "desc": "Spicy cheese toast",
    "rating": 4.7,
    "reviews": 120,
    "price": 99,
    "category": "Sandwich",
    "img": "/images/avocado_toast.png"
  },
  {
    "id": 41,
    "name": "Corn Cheese Tost",
    "desc": "Sweet corn and cheese",
    "rating": 4.8,
    "reviews": 145,
    "price": 99,
    "category": "Sandwich",
    "img": "/images/hero_coffee.png"
  },
  {
    "id": 42,
    "name": "Plane Veg Sandwich",
    "desc": "Non-grilled plain veg",
    "rating": 4.4,
    "reviews": 200,
    "price": 50,
    "category": "Sandwich",
    "img": "/images/hero_coffee.png"
  },
  {
    "id": 43,
    "name": "Chocolat Sandwich",
    "desc": "Sweet chocolate spread",
    "rating": 4.5,
    "reviews": 180,
    "price": 50,
    "category": "Sandwich",
    "img": "/images/hero_coffee.png"
  },
  {
    "id": 44,
    "name": "Veg Grilled / Cheese",
    "desc": "Grilled with cheese",
    "rating": 4.8,
    "reviews": 310,
    "price": 70,
    "category": "Sandwich",
    "img": "/images/hero_coffee.png"
  },
  {
    "id": 45,
    "name": "Veg Cheese Corn",
    "desc": "Corn and cheese grilled",
    "rating": 4.7,
    "reviews": 240,
    "price": 80,
    "category": "Snacks",
    "img": "/images/hero_coffee.png"
  },
  {
    "id": 46,
    "name": "Tandoori Sandwich",
    "desc": "Spicy tandoori mix",
    "rating": 4.8,
    "reviews": 280,
    "price": 90,
    "category": "Sandwich",
    "img": "/images/hero_coffee.png"
  },
  {
    "id": 47,
    "name": "Paneer Cheese Sandwich",
    "desc": "Soft paneer and cheese",
    "rating": 4.9,
    "reviews": 350,
    "price": 99,
    "category": "Sandwich",
    "img": "/images/hero_coffee.png"
  },
  {
    "id": 48,
    "name": "BBQ Cheese Sandwich",
    "desc": "Smoky BBQ flavor",
    "rating": 4.6,
    "reviews": 190,
    "price": 99,
    "category": "Sandwich",
    "img": "/images/hero_coffee.png"
  },
  {
    "id": 49,
    "name": "Club Grilled Sandwich",
    "desc": "Triple layer loaded",
    "rating": 4.8,
    "reviews": 220,
    "price": 149,
    "category": "Sandwich",
    "img": "/images/hero_coffee.png"
  },
  {
    "id": 50,
    "name": "1CR Spl. Loded Sandwich",
    "desc": "House special loaded",
    "rating": 4.9,
    "reviews": 410,
    "price": 179,
    "category": "Sandwich",
    "img": "/images/hero_coffee.png"
  },
  {
    "id": 51,
    "name": "Margherita Cheese Pizza",
    "desc": "Classic cheese pizza",
    "rating": 4.7,
    "reviews": 320,
    "price": 99,
    "category": "Pizza",
    "img": "/images/hero_coffee.png"
  },
  {
    "id": 52,
    "name": "Veg's Cheese Pizza",
    "desc": "Fresh veggies and cheese",
    "rating": 4.6,
    "reviews": 280,
    "price": 120,
    "category": "Pizza",
    "img": "/images/hero_coffee.png"
  },
  {
    "id": 53,
    "name": "Chilli Cheese Pizza",
    "desc": "Spicy chili touch",
    "rating": 4.5,
    "reviews": 190,
    "price": 130,
    "category": "Pizza",
    "img": "/images/hero_coffee.png"
  },
  {
    "id": 54,
    "name": "Veg's Corn Cheese Pizza",
    "desc": "Sweet corn and cheese",
    "rating": 4.8,
    "reviews": 350,
    "price": 140,
    "category": "Pizza",
    "img": "/images/hero_coffee.png"
  },
  {
    "id": 55,
    "name": "Tandoori Veg Cheese Pizza",
    "desc": "Tandoori flavored paneer",
    "rating": 4.9,
    "reviews": 410,
    "price": 150,
    "category": "Pizza",
    "img": "/images/hero_coffee.png"
  },
  {
    "id": 56,
    "name": "Veg's Paneer Cheese Pizza",
    "desc": "Loaded with paneer chunks",
    "rating": 4.8,
    "reviews": 380,
    "price": 160,
    "category": "Pizza",
    "img": "/images/hero_coffee.png"
  },
  {
    "id": 57,
    "name": "Chicken Cheese Pizza",
    "desc": "Grilled chicken toppings",
    "rating": 4.9,
    "reviews": 450,
    "price": 170,
    "category": "Pizza",
    "img": "/images/hero_coffee.png"
  },
  {
    "id": 58,
    "name": "Chilli Chicken Cheese Pizza",
    "desc": "Spicy chicken slices",
    "rating": 4.7,
    "reviews": 310,
    "price": 180,
    "category": "Pizza",
    "img": "/images/hero_coffee.png"
  },
  {
    "id": 59,
    "name": "Tandoori Chicken Pizza",
    "desc": "Tandoori marinated chicken",
    "rating": 4.8,
    "reviews": 390,
    "price": 190,
    "category": "Pizza",
    "img": "/images/hero_coffee.png"
  },
  {
    "id": 60,
    "name": "1 CR Loded Pizza",
    "desc": "House special veg/non-veg",
    "rating": 4.9,
    "reviews": 520,
    "price": 210,
    "category": "Pizza",
    "img": "/images/hero_coffee.png"
  },
  {
    "id": 61,
    "name": "Veg Burger / Cheese",
    "desc": "Classic veg cheese burger",
    "rating": 4.6,
    "reviews": 240,
    "price": 70,
    "category": "Burger",
    "img": "/images/hero_coffee.png"
  },
  {
    "id": 62,
    "name": "Crispy Burger / Cheese",
    "desc": "Extra crispy patty",
    "rating": 4.7,
    "reviews": 280,
    "price": 90,
    "category": "Burger",
    "img": "/images/hero_coffee.png"
  },
  {
    "id": 63,
    "name": "Tandoori Veg Burger",
    "desc": "Tandoori sauce spread",
    "rating": 4.8,
    "reviews": 310,
    "price": 99,
    "category": "Burger",
    "img": "/images/hero_coffee.png"
  },
  {
    "id": 64,
    "name": "Paneer Duble Decker",
    "desc": "Double paneer patty",
    "rating": 4.9,
    "reviews": 450,
    "price": 120,
    "category": "Burger",
    "img": "/images/hero_coffee.png"
  },
  {
    "id": 65,
    "name": "Chicken Burger / Cheese",
    "desc": "Crispy chicken patty",
    "rating": 4.8,
    "reviews": 420,
    "price": 130,
    "category": "Burger",
    "img": "/images/hero_coffee.png"
  },
  {
    "id": 66,
    "name": "Tandoori Chicken Burger",
    "desc": "Tandoori chicken chunks",
    "rating": 4.9,
    "reviews": 510,
    "price": 140,
    "category": "Burger",
    "img": "/images/hero_coffee.png"
  }
];

@Injectable()
export class MenuService implements OnModuleInit {
  constructor(
    @InjectRepository(MenuItem)
    private menuRepository: Repository<MenuItem>,
  ) {}

  async onModuleInit() {
    const count = await this.menuRepository.count();
    if (count === 0) {
      const entities = menu_data.map(data => {
        // Exclude the integer id from MongoDB seed data, let Postgres generate a UUID
        const { id, ...rest } = data;
        return this.menuRepository.create({ ...rest, sort_order: id });
      });
      await this.menuRepository.save(entities);
    } else {
      // Sync sort_order and category for existing items just in case
      for (const item of menu_data) {
        await this.menuRepository.update(
          { name: item.name },
          { sort_order: item.id, category: item.category }
        );
      }
    }
  }

  async getMenu() {
    const items = await this.menuRepository.find({
      order: { sort_order: 'ASC' }
    });
    return items.map(item => ({
      id: item.id,
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
    const newItem = this.menuRepository.create(data);
    return await this.menuRepository.save(newItem);
  }

  async updateMenu(id: string, data: any) {
    await this.menuRepository.update(id, data);
    return await this.menuRepository.findOne({ where: { id } });
  }

  async deleteMenu(id: string) {
    await this.menuRepository.delete(id);
    return { success: true };
  }
}
