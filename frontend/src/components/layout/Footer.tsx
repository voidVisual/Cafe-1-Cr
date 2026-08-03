import React from 'react';
import { Link } from 'react-router-dom';
import { Coffee, Mail, Phone, MapPin, Info } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-coffee-900 to-black text-coffee-50 pt-20 pb-10 border-t border-coffee-800">
      <div className="container mx-auto px-4 md:px-8 relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="bg-coffee-50 text-coffee-900 p-2 rounded-lg">
                <Coffee size={24} />
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-white">
                Cafe<span className="text-coffee-400">1</span>Cr
              </span>
            </Link>
            <p className="text-coffee-200 text-sm leading-relaxed mb-6">
              Premium coffee and fresh, artisanal food delivered directly to you. Experience the modern cafe standard.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-gradient-to-br from-coffee-800 to-coffee-900 flex items-center justify-center hover:from-coffee-700 hover:to-coffee-800 transition-colors shadow-sm">
                <Mail size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gradient-to-br from-coffee-800 to-coffee-900 flex items-center justify-center hover:from-coffee-700 hover:to-coffee-800 transition-colors shadow-sm">
                <Phone size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gradient-to-br from-coffee-800 to-coffee-900 flex items-center justify-center hover:from-coffee-700 hover:to-coffee-800 transition-colors shadow-sm">
                <MapPin size={18} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-6 text-white">Quick Links</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="text-coffee-200 hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/menu" className="text-coffee-200 hover:text-white transition-colors">Menu</Link></li>
              <li><Link to="/about" className="text-coffee-200 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-coffee-200 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-6 text-white">Legal</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-coffee-200 hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-coffee-200 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-coffee-200 hover:text-white transition-colors">Cookie Policy</a></li>
              <li><a href="#" className="text-coffee-200 hover:text-white transition-colors">Refunds</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-6 text-white">Newsletter</h4>
            <p className="text-coffee-200 text-sm mb-4">Subscribe for updates, new menu items, and exclusive offers.</p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Email address"
                className="bg-coffee-800 border border-coffee-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-coffee-500 w-full"
              />
              <button type="submit" className="bg-gradient-to-r from-coffee-500 to-coffee-600 hover:from-coffee-400 hover:to-coffee-500 text-white px-4 py-2 rounded-md transition-colors font-medium shadow-md">
                Subscribe
              </button>
            </form>
          </div>
        </div>
        
        <div className="pt-8 border-t border-coffee-800 text-center text-sm text-coffee-400 flex flex-col items-center gap-2 relative">
          <p>&copy; {new Date().getFullYear()} Cafe1Cr. All rights reserved.</p>
          <p>Developed and managed by the <a href="https://rudranshcortex.live/" target="_blank" rel="noopener noreferrer" className="text-coffee-300 hover:text-white transition-colors">RudranshCortex</a></p>
          <a 
            href={import.meta.env.VITE_ADMIN_URL || "https://admin.cafe1cr.food"} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="absolute right-0 bottom-0 p-2 text-coffee-600 hover:text-coffee-300 transition-colors" 
            title="Admin Login"
          >
            <Info size={16} />
          </a>
        </div>
      </div>
    </footer>
  );
}
