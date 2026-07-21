import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, Plus } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const categories = ['All', 'Cappuccino', 'Latte', 'Macchiato', 'Cold Coffee', 'Fries', 'Pizza', 'Sandwich', 'Burger', 'Snacks & Pasta'];

// Display labels for the category buttons (matches what the backend seeds)
const categoryLabels: Record<string, string> = {
  'All': 'All',
  'Cappuccino': 'Cappuccino',
  'Latte': 'Latte',
  'Macchiato': 'Macchiato',
  'Cold Coffee': 'Cold Coffee',
  'Fries': 'Fries',
  'Pizza': 'Pizza',
  'Sandwich': 'Sandwich',
  'Burger': 'Burger',
  'Snacks & Pasta': 'Snacks & Pasta',
};

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const addToCart = useCartStore((state) => state.addItem);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/menu');
        const data = await res.json();
        setMenuItems(data.map((item: any) => ({
          ...item,
          id: item.id.toString(),
          image: item.img || item.image_url || '/images/hero_coffee.png',
          description: item.desc || item.description || 'Delicious cafe item',
          rating: item.rating || 4.5
        })));
      } catch (err) {
        console.error("Failed to fetch menu:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const handleAddToCart = (item: typeof menuItems[0]) => {
    addToCart({ 
      id: item.id, 
      name: item.name, 
      price: item.price, 
      image: item.image,
      category: item.category
    });
    toast.success(`${item.name} has been added to your basket`);
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = activeCategory === 'All' || 
      (item.category || '').toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="pt-24 pb-16 min-h-screen bg-coffee-50">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <h1 className="font-serif text-4xl font-bold text-coffee-900">Our Menu</h1>
          
          <div className="flex w-full md:w-auto gap-4">
            <div className="relative flex-1 md:w-64">
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full border border-coffee-200 focus:outline-none focus:ring-2 focus:ring-coffee-500 bg-white"
              />
              <Search className="absolute left-3 top-2.5 text-coffee-400 w-5 h-5" />
            </div>
            <Button variant="outline" className="rounded-full border-coffee-200 text-coffee-700">
              <Filter className="w-5 h-5 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex overflow-x-auto pb-4 mb-8 gap-3 hide-scrollbar">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2 rounded-full whitespace-nowrap font-medium transition-colors duration-200 ${
                activeCategory === category
                  ? 'bg-gradient-to-r from-coffee-600 to-coffee-700 text-white shadow-md'
                  : 'bg-white text-coffee-600 hover:bg-coffee-100'
              }`}
            >
              {categoryLabels[category] || category}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
             <div className="w-12 h-12 border-4 border-coffee-200 border-t-coffee-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredItems.map((item) => (
              <div key={item.id} className="group rounded-3xl bg-white border border-coffee-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col">
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 bg-gray-100"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-coffee-800">
                    {item.category}
                  </div>
                </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-serif text-xl font-bold text-coffee-900 leading-tight">{item.name}</h3>
                  <div className="flex items-center gap-1 text-sm font-medium bg-coffee-50 px-2 py-1 rounded-md text-coffee-800">
                    <Star className="w-3.5 h-3.5 fill-coffee-500 text-coffee-500" />
                    <span>{item.rating}</span>
                  </div>
                </div>
                <p className="text-coffee-600 text-sm mb-6 line-clamp-2 flex-grow">{item.description}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xl font-bold text-coffee-900">₹{item.price.toFixed(2)}</span>
                  <Button 
                    onClick={() => handleAddToCart(item)}
                    variant="outline"
                    size="sm"
                    className="rounded-full border-coffee-200 text-coffee-700 hover:bg-coffee-900 hover:text-white hover:border-coffee-900 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

        {!loading && filteredItems.length === 0 && (
          <div className="text-center py-20">
            <h3 className="text-2xl font-serif text-coffee-900 mb-2">No items found</h3>
            <p className="text-coffee-600">Try adjusting your search or category filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
