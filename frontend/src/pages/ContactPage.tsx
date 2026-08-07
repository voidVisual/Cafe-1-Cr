import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen pt-32 pb-20 bg-coffee-50">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-coffee-900 mb-8 text-center">Contact Us</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-coffee-100 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-coffee-100 rounded-full flex items-center justify-center text-coffee-700 mb-4">
              <Phone size={32} />
            </div>
            <h3 className="text-xl font-bold text-coffee-900 mb-2">Call Us</h3>
            <p className="text-coffee-600">Available Monday to Friday, 9am - 8pm.</p>
            <a href="tel:+910000000000" className="mt-4 text-coffee-700 font-semibold hover:text-coffee-900 transition-colors">+91 000 000 0000</a>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-coffee-100 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-coffee-100 rounded-full flex items-center justify-center text-coffee-700 mb-4">
              <Mail size={32} />
            </div>
            <h3 className="text-xl font-bold text-coffee-900 mb-2">Email Us</h3>
            <p className="text-coffee-600">We'll get back to you within 24 hours.</p>
            <a href="mailto:contact@cafe1cr.com" className="mt-4 text-coffee-700 font-semibold hover:text-coffee-900 transition-colors">contact@cafe1cr.com</a>
          </div>
        </div>

        <div className="mt-12 bg-white rounded-2xl p-8 shadow-sm border border-coffee-100">
          <div className="flex items-center gap-3 mb-6">
            <MapPin size={24} className="text-coffee-700" />
            <h3 className="text-2xl font-bold text-coffee-900">Visit Us</h3>
          </div>
          <p className="text-coffee-800 text-lg mb-6">
            Vishwashanti Marg, Rambaug Colony,<br />
            Kothrud, Pune, Maharashtra 411038
          </p>
          <div className="rounded-xl overflow-hidden h-[400px]">
            <iframe 
              src="https://maps.google.com/maps?q=Vishwashanti%20Marg,%20Rambaug%20Colony,%20Kothrud,%20Pune,%20Maharashtra%20411038&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}
