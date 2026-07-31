import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Clock, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import gsap from 'gsap';

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const [typedText, setTypedText] = useState('');
  const fullText = "Art of Coffee";

  useEffect(() => {
    // GSAP Animations
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      tl.fromTo(
        textRef.current?.children || [],
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out', delay: 0.2 }
      )
      .fromTo(
        imageRef.current,
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1, ease: 'power3.out' },
        '-=0.6'
      )
      .fromTo(
        statsRef.current?.children || [],
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' },
        '-=0.4'
      );
    }, heroRef);

    // Typing Animation
    let currentText = '';
    let i = 0;
    
    // Start typing after initial GSAP animation
    const startDelay = setTimeout(() => {
      const interval = setInterval(() => {
        if (i < fullText.length) {
          currentText += fullText.charAt(i);
          setTypedText(currentText);
          i++;
        } else {
          clearInterval(interval);
        }
      }, 120); // typing speed
      
      return () => clearInterval(interval);
    }, 1200);

    return () => {
      ctx.revert();
      clearTimeout(startDelay);
    };
  }, []);

  return (
    <section 
      ref={heroRef}
      className="relative min-h-screen pt-32 pb-20 flex items-center bg-coffee-50 overflow-hidden"
    >
      {/* Background blobs for a premium feel */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-coffee-200/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-coffee-200/40 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          <div ref={textRef} className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-coffee-100 text-coffee-800 font-medium text-sm mb-6 border border-coffee-200 shadow-sm">
              <Star className="w-4 h-4 fill-coffee-500 text-coffee-500" />
              <span>Rated 4.9/5 by 2000+ customers</span>
            </div>
            
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-coffee-900 mb-6">
              Experience the <br/>
              <span className="italic text-coffee-600 font-light">
                {typedText}
                <span className="animate-pulse opacity-70">|</span>
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-coffee-800/80 mb-10 leading-relaxed max-w-lg">

              Freshly roasted beans, artisanal pastries, and a warm atmosphere. Order ahead or get it delivered to your door.
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              <Button size="lg" variant="premium" className="group" asChild>
                <Link to="/menu">
                  Order Now
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-coffee-300 text-coffee-800 hover:bg-coffee-100" asChild>
                <Link to="/menu">Explore Menu</Link>
              </Button>
            </div>

            <div ref={statsRef} className="mt-16 pt-8 border-t border-coffee-200">
              <div className="grid grid-cols-3 gap-6 mb-10">
                <div>
                  <div className="flex items-center gap-2 text-coffee-900 font-semibold text-lg mb-1">
                    <Clock className="w-5 h-5 text-coffee-600" />
                    <span>15 min</span>
                  </div>
                  <div className="text-sm text-coffee-700">Avg Delivery</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-coffee-900 font-semibold text-lg mb-1">
                    <Leaf className="w-5 h-5 text-coffee-600" />
                    <span>100%</span>
                  </div>
                  <div className="text-sm text-coffee-700">Organic Beans</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-coffee-900 font-semibold text-lg mb-1">
                    <Star className="w-5 h-5 fill-coffee-600 text-coffee-600" />
                    <span>4.9</span>
                  </div>
                  <div className="text-sm text-coffee-700">Rating</div>
                </div>
              </div>

              {/* Delivery Partners */}
              <div className="flex items-center gap-4 mt-8">
                <div className="text-sm text-coffee-700 whitespace-nowrap">Home delivery available at</div>
                <a
                  href="https://www.swiggy.com/city/pune/cafe-1-cr-kothrud-rest1386519"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:scale-105 transition-all duration-200 hover:opacity-80 flex-shrink-0"
                >
                  <img src="/img/swiggy-logo-transparent.png" alt="Order on Swiggy" className="h-8 w-auto object-contain" />
                </a>
              </div>
            </div>
          </div>

          <div ref={imageRef} className="relative w-full h-[500px] lg:h-[700px] rounded-[2rem] overflow-hidden shadow-2xl">
            <img 
              src="/images/hero_coffee.png" 
              alt="Premium coffee pouring into a cup" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
