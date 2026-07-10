export interface MenuItem {
  id: number;
  name: string;
  description: string;
  rating: number;
  reviews: number;
  price: number;
  category: string;
  image: string;
}

export const menuItems: MenuItem[] = [
  // Screenshot 1
  { id: 1, name: 'Thick Cold Coffee (Offer)', description: '12 Months Special Offer', rating: 4.8, reviews: 124, price: 20, category: 'Cold Coffee', image: '/images/thick_cold_coffee_offer_1783664203176.png' },
  { id: 2, name: 'Thick Coffee with Crush', description: 'Refreshing blend', rating: 4.5, reviews: 85, price: 35, category: 'Cold Coffee', image: '/images/thick_coffee_crush_1783664213634.png' },
  { id: 3, name: 'Plane / Thick Cold Coffee', description: 'Simple and thick', rating: 4.6, reviews: 92, price: 40, category: 'Cold Coffee', image: '/images/plane_thick_cold_coffee_1783664240019.png' },
  { id: 4, name: 'Thick Coffee with Icecream', description: 'Rich icecream topping', rating: 4.9, reviews: 210, price: 50, category: 'Cold Coffee', image: '/images/thick_coffee_icecream_1783664253545.png' },
  { id: 5, name: 'Caramel Thick Coffee / Crush', description: 'Sweet caramel flavor', rating: 4.7, reviews: 150, price: 70, category: 'Cold Coffee', image: '/images/caramel_thick_coffee_1783664305887.png' },
  { id: 6, name: 'French Vanilla Thick Coffee', description: 'Smooth vanilla taste', rating: 4.8, reviews: 132, price: 80, category: 'Cold Coffee', image: '/images/french_vanilla_thick_coffee_1783664323471.png' },
  { id: 7, name: 'Black Coffee', description: 'Strong and bold', rating: 4.5, reviews: 300, price: 20, category: 'Hot Coffee & Tea', image: '/images/black_coffee_1783664339035.png' },
  { id: 8, name: 'Hot Coffee', description: 'Classic hot brew', rating: 4.7, reviews: 450, price: 30, category: 'Hot Coffee & Tea', image: '/images/hot_coffee_1783664353907.png' },

  // Screenshot 2
  { id: 9, name: 'Hot Chocolate', description: 'Rich cocoa goodness', rating: 4.9, reviews: 312, price: 50, category: 'Hot Coffee & Tea', image: '/images/caramel_macchiato.png' },
  { id: 10, name: 'Lemone Ice Tea (Jumbo)', description: 'Zesty and cool', rating: 4.6, reviews: 88, price: 60, category: 'Hot Coffee & Tea', image: '/images/iced_cold_brew.png' },
  { id: 11, name: 'Peach Ice Tea (Jumbo)', description: 'Sweet peach infusion', rating: 4.8, reviews: 105, price: 60, category: 'Hot Coffee & Tea', image: '/images/chai_tea_latte.png' },
  { id: 12, name: 'Strawberry Shake', description: 'Fruity delight', rating: 4.5, reviews: 90, price: 50, category: 'Shakes', image: '/images/matcha_latte.png' },
  { id: 13, name: 'Chocolate Shake', description: 'Chocolate heaven', rating: 4.8, reviews: 160, price: 50, category: 'Shakes', image: '/images/caramel_macchiato.png' },
  { id: 14, name: 'Vanilla Shake', description: 'Classic vanilla', rating: 4.4, reviews: 75, price: 60, category: 'Shakes', image: '/images/chai_tea_latte.png' },
  { id: 15, name: 'Oreo Shake', description: 'Loaded with oreos', rating: 4.9, reviews: 210, price: 70, category: 'Shakes', image: '/images/iced_cold_brew.png' },
  { id: 16, name: 'Kit-Kat Shake', description: 'Crunchy kit-kat blend', rating: 4.8, reviews: 180, price: 80, category: 'Shakes', image: '/images/caramel_macchiato.png' },

  // Screenshot 3
  { id: 17, name: 'Salted Fries', description: 'Crispy and salted', rating: 4.6, reviews: 130, price: 70, category: 'Fries & Cheese', image: '/images/avocado_toast.png' },
  { id: 18, name: 'Masala Fries', description: 'Spicy Indian twist', rating: 4.7, reviews: 145, price: 90, category: 'Fries & Cheese', image: '/images/almond_croissant.png' },
  { id: 19, name: 'BBQ Fries', description: 'Smoky BBQ flavor', rating: 4.5, reviews: 95, price: 80, category: 'Fries & Cheese', image: '/images/hero_coffee.png' },
  { id: 20, name: 'Peri Peri Fries / Cheese', description: 'Spicy peri peri', rating: 4.8, reviews: 220, price: 110, category: 'Fries & Cheese', image: '/images/avocado_toast.png' },
  { id: 21, name: 'Cheese Fries', description: 'Loaded with cheese', rating: 4.9, reviews: 250, price: 100, category: 'Fries & Cheese', image: '/images/blueberry_muffin.png' },
  { id: 22, name: 'Melted Cheese Fries', description: 'Extra gooey cheese', rating: 4.8, reviews: 190, price: 140, category: 'Fries & Cheese', image: '/images/avocado_toast.png' },
  { id: 23, name: 'Tandoori Melted Cheese', description: 'Tandoori spice twist', rating: 4.7, reviews: 160, price: 150, category: 'Fries & Cheese', image: '/images/almond_croissant.png' },
  { id: 24, name: 'White Sauce Macaroni', description: 'Creamy and cheesy', rating: 4.8, reviews: 210, price: 130, category: 'Pasta & Noodles', image: '/images/hero_coffee.png' },

  // Screenshot 4
  { id: 25, name: 'Masala Pasta', description: 'Indian style pasta', rating: 4.6, reviews: 180, price: 140, category: 'Pasta & Noodles', image: '/images/avocado_toast.png' },
  { id: 26, name: 'Red Paprika Pasta', description: 'Spicy red sauce', rating: 4.7, reviews: 195, price: 150, category: 'Pasta & Noodles', image: '/images/almond_croissant.png' },
  { id: 27, name: 'Plane Maggie', description: 'Classic instant noodles', rating: 4.5, reviews: 300, price: 50, category: 'Pasta & Noodles', image: '/images/blueberry_muffin.png' },
  { id: 28, name: "Veg's Maggie", description: 'With fresh veggies', rating: 4.6, reviews: 250, price: 60, category: 'Pasta & Noodles', image: '/images/avocado_toast.png' },
  { id: 29, name: 'Masala Maggie', description: 'Extra spicy masala', rating: 4.8, reviews: 320, price: 60, category: 'Pasta & Noodles', image: '/images/hero_coffee.png' },
  { id: 30, name: "Veg's Masala Maggie", description: 'Veggies and spice', rating: 4.7, reviews: 290, price: 70, category: 'Pasta & Noodles', image: '/images/almond_croissant.png' },
  { id: 31, name: 'Hara Bhara Kabab', description: 'Healthy green snack', rating: 4.5, reviews: 80, price: 70, category: 'Snacks', image: '/images/avocado_toast.png' },
  { id: 32, name: 'Crispy Onion Rings', description: 'Golden and crunchy', rating: 4.7, reviews: 150, price: 80, category: 'Snacks', image: '/images/blueberry_muffin.png' },

  // Screenshot 5
  { id: 33, name: 'Cheese Potato Shots', description: 'Cheesy potato bites', rating: 4.8, reviews: 190, price: 80, category: 'Snacks', image: '/images/avocado_toast.png' },
  { id: 34, name: 'Chilli Garlic Shots', description: 'Spicy garlic twist', rating: 4.6, reviews: 130, price: 99, category: 'Snacks', image: '/images/almond_croissant.png' },
  { id: 35, name: 'Veg Fingers', description: 'Crispy veggie sticks', rating: 4.4, reviews: 75, price: 90, category: 'Snacks', image: '/images/hero_coffee.png' },
  { id: 36, name: 'Chicken Nuggets', description: 'Classic chicken snack', rating: 4.8, reviews: 210, price: 99, category: 'Snacks', image: '/images/avocado_toast.png' },
  { id: 37, name: 'Chicken Cheesy Popcorn', description: 'Cheesy chicken bites', rating: 4.9, reviews: 240, price: 120, category: 'Snacks', image: '/images/almond_croissant.png' },
  { id: 38, name: 'Chocolate - M', description: 'Medium chocolate cream', rating: 4.6, reviews: 110, price: 90, category: 'Desserts', image: '/images/blueberry_muffin.png' },
  { id: 39, name: 'Chocolate - B', description: 'Big chocolate cream', rating: 4.8, reviews: 150, price: 99, category: 'Desserts', image: '/images/caramel_macchiato.png' },
  { id: 40, name: 'Chilli Cheese Tost', description: 'Spicy cheese toast', rating: 4.7, reviews: 120, price: 99, category: 'Snacks', image: '/images/avocado_toast.png' },
];
