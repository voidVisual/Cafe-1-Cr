import React from 'react';
import Hero from '@/features/landing/Hero';
import FeaturedMenu from '@/features/landing/FeaturedMenu';
import WhyUs from '@/features/landing/WhyUs';
import BestSellers from '@/features/landing/BestSellers';
import Testimonials from '@/features/landing/Testimonials';

export default function LandingPage() {
  return (
    <div>
      <Hero />
      <FeaturedMenu />
      <WhyUs />
      <BestSellers />
      <Testimonials />
    </div>
  );
}
