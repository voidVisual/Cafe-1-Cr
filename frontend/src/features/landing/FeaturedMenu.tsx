import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cartStore';

export default function FeaturedMenu() {
  const addItem = useCartStore((state) => state.addItem);
  const [featuredItems, setFeaturedItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/menu');
        const data = await res.json();
        // Take up to 3 items
        setFeaturedItems(data.slice(0, 3).map((item: any) => ({
          ...item,
          id: item.id.toString(),
          image: item.img || item.image_url || '/images/hero_coffee.png',
          description: item.desc || item.description || 'Delicious cafe item',
          rating: item.rating || 4.5,
          quantity: 1
        })));
      } catch (err) {
        console.error("Failed to fetch featured menu:", err);
      }
    };
    fetchMenu();
  }, []);

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex justify-between items-end mb-12">
          <div className="max-w-xl">
            <h2 className="font-serif text-4xl font-bold text-coffee-900 mb-4">Featured Menu</h2>
            <p className="text-coffee-600">Discover our most popular items, handpicked by our baristas and loved by our customers.</p>
          </div>
          <Button variant="link" className="hidden md:flex text-coffee-600 hover:text-coffee-800" asChild>
            <Link to="/menu">
              View Full Menu <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredItems.map((item) => (
            <div key={item.id} className="group rounded-3xl bg-white border border-coffee-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-coffee-800">
                  {item.category}
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-serif text-xl font-bold text-coffee-900">{item.name}</h3>
                  <div className="flex items-center gap-1 text-sm font-medium bg-coffee-50 px-2 py-1 rounded-md text-coffee-800">
                    <Star className="w-3.5 h-3.5 fill-coffee-500 text-coffee-500" />
                    <span>{item.rating}</span>
                  </div>
                </div>
                
                <p className="text-coffee-600 text-sm mb-6 line-clamp-2">
                  {item.description}
                </p>
                
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xl font-bold text-coffee-900">₹{item.price.toFixed(2)}</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-full border-coffee-200 text-coffee-700 hover:bg-coffee-900 hover:text-white hover:border-coffee-900 transition-colors"
                    onClick={() => addItem(item)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-10 text-center md:hidden">
          <Button variant="outline" className="border-coffee-200 text-coffee-800 w-full" asChild>
            <Link to="/menu">View Full Menu</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
