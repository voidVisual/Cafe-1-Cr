import React, { useRef, useEffect } from 'react';
import { Star } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reviews = [
  {
    id: 1,
    name: "Sarah Jenkins",
    text: "The best coffee in town, hands down. Their caramel macchiato is perfectly balanced, and the avocado toast is always fresh. Fast delivery too!",
    rating: 5,
  },
  {
    id: 2,
    name: "David Chen",
    text: "I order from here almost every morning. The app is super fast, and they always get my custom orders exactly right. Premium experience.",
    rating: 5,
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    text: "Beautiful packaging, eco-friendly approach, and the matcha latte is heavenly. It's become my go-to spot for weekend brunch delivery.",
    rating: 4,
  },
  {
    id: 4,
    name: "Michael Chang",
    text: "Their cold brew is absolute perfection. I love how easy it is to customize my drinks, and the UI of the app is stunning.",
    rating: 5,
  },
  {
    id: 5,
    name: "Jessica Taylor",
    text: "The almond croissants are always flaky and fresh. I've tried other cafes, but I always come back here for the premium quality.",
    rating: 5,
  }
];

// Duplicate reviews to create a seamless infinite loop
const duplicatedReviews = [...reviews, ...reviews];

export default function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(
        headerRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: headerRef.current,
            start: 'top 85%',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-coffee-50 overflow-hidden">
      <div className="container mx-auto px-4 md:px-8 mb-16">
        <div ref={headerRef} className="text-center max-w-2xl mx-auto">
          <h2 className="font-serif text-4xl font-bold text-coffee-900 mb-6">What Our Customers Say</h2>
          <p className="text-coffee-600 text-lg">
            Don't just take our word for it.
          </p>
        </div>
      </div>

      <div className="relative w-full max-w-[100vw] overflow-hidden flex group">
        {/* First marquee group */}
        <div className="flex shrink-0 animate-marquee whitespace-nowrap group-hover:[animation-play-state:paused]">
          {duplicatedReviews.map((review, index) => (
            <div 
              key={`${review.id}-${index}`}
              className="bg-white p-8 rounded-3xl shadow-sm border border-coffee-100 hover:shadow-md transition-shadow duration-300 w-[350px] md:w-[400px] mx-4 shrink-0 flex flex-col whitespace-normal"
            >
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-5 h-5 ${i < review.rating ? 'fill-coffee-500 text-coffee-500' : 'fill-gray-200 text-gray-200'}`} 
                  />
                ))}
              </div>
              <p className="text-coffee-800 text-lg leading-relaxed mb-6 italic flex-grow">
                "{review.text}"
              </p>
              <div className="font-bold text-coffee-900">{review.name}</div>
            </div>
          ))}
        </div>
        
        {/* Second marquee group for seamless looping */}
        <div className="flex shrink-0 animate-marquee whitespace-nowrap group-hover:[animation-play-state:paused]">
          {duplicatedReviews.map((review, index) => (
            <div 
              key={`dup-${review.id}-${index}`}
              className="bg-white p-8 rounded-3xl shadow-sm border border-coffee-100 hover:shadow-md transition-shadow duration-300 w-[350px] md:w-[400px] mx-4 shrink-0 flex flex-col whitespace-normal"
            >
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-5 h-5 ${i < review.rating ? 'fill-coffee-500 text-coffee-500' : 'fill-gray-200 text-gray-200'}`} 
                  />
                ))}
              </div>
              <p className="text-coffee-800 text-lg leading-relaxed mb-6 italic flex-grow">
                "{review.text}"
              </p>
              <div className="font-bold text-coffee-900">{review.name}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
