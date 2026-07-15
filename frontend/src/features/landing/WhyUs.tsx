import React from 'react';
import { Leaf, Zap, Award, Heart } from 'lucide-react';

const features = [
  {
    icon: <Leaf className="w-6 h-6" />,
    title: 'Fresh Ingredients',
    description: 'We source only the finest, organic ingredients from local farmers to ensure maximum freshness.'
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Fast Delivery',
    description: 'Our optimized logistics ensure your coffee arrives hot and your pastries fresh within 15 minutes.'
  },
  {
    icon: <Award className="w-6 h-6" />,
    title: 'Expert Baristas',
    description: 'Every cup is crafted by certified baristas who are passionate about the art of coffee making.'
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: 'Eco-Friendly',
    description: 'All our packaging is 100% biodegradable, because we care about the planet as much as our coffee.'
  }
];

export default function WhyUs() {
  return (
    <section className="py-24 bg-coffee-900 text-white relative overflow-hidden">
      {/* Decorative background element removed for solid color look */}

      
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-serif text-4xl font-bold mb-6">Why Choose Us</h2>
          <p className="text-coffee-200 text-lg">
            We don't just serve coffee; we craft an experience. Here is what sets us apart from the rest.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-coffee-800/50 backdrop-blur-md border border-coffee-700/50 p-8 rounded-3xl hover:bg-coffee-800 transition-all duration-300">
              <div className="w-14 h-14 bg-coffee-700 rounded-2xl flex items-center justify-center text-coffee-100 shadow-inner mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-coffee-300 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
