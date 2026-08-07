import React from 'react';

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-32 pb-20 bg-coffee-50">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-coffee-900 mb-8 text-center">About Us</h1>
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-coffee-100">
          <p className="text-lg text-coffee-800 leading-relaxed mb-6">
            Welcome to Cafe1Cr! We are passionate about delivering premium coffee and fresh, artisanal food directly to you.
          </p>
          <p className="text-lg text-coffee-800 leading-relaxed mb-6">
            Experience the modern cafe standard with our carefully curated menu, featuring locally sourced ingredients and expertly crafted beverages.
          </p>
          <p className="text-lg text-coffee-800 leading-relaxed">
            Our mission is to bring the comfort and quality of a top-tier cafe right to your doorstep. Thank you for choosing us!
          </p>
        </div>
      </div>
    </div>
  );
}
