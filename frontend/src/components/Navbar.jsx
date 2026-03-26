import React, { useState } from 'react';

export default function Navbar({ cartCount, openCart, isAdmin }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
    <nav>
      <a href="#" className="nav-logo">Cafe <span>1 Cr</span></a>
      <ul className="nav-links">
        <li><a href="#menu">Menu</a></li>
        <li><a href="#special">Specials</a></li>
        <li><a href="#order-section">Order</a></li>
        <li><a href="#tracking">Live Tracking</a></li>
        <li><a href="#testimonials">Reviews</a></li>
      </ul>
      <div className="nav-right">
        <button 
          className="btn-outline" 
          onClick={() => {
            if (isAdmin) window.location.hash = '#menu';
            else document.getElementById('menu').scrollIntoView({ behavior: 'smooth' });
          }}
        >
          {isAdmin ? 'Back to Site' : 'View Menu'}
        </button>
        {!isAdmin && (
          <button className="btn-primary" onClick={openCart}>
            🛒 Cart {cartCount > 0 && `(${cartCount})`}
          </button>
        )}
        <button className="mobile-toggle" onClick={() => setIsMobileOpen(!isMobileOpen)}>
          {isMobileOpen ? '✕' : '☰'}
        </button>
      </div>
    </nav>

    {/* Mobile Fullscreen Menu */}
    <div className={`mobile-nav ${isMobileOpen ? 'open' : ''}`}>
      <ul className="mobile-nav-links">
        <li><a href="#menu" onClick={() => setIsMobileOpen(false)}>Signature Menu</a></li>
        <li><a href="#special" onClick={() => setIsMobileOpen(false)}>Exclusive Specials</a></li>
        <li><a href="#order-section" onClick={() => setIsMobileOpen(false)}>How to Order</a></li>
        <li><a href="#tracking" onClick={() => setIsMobileOpen(false)}>Live Tracking</a></li>
        <li><a href="#testimonials" onClick={() => setIsMobileOpen(false)}>Customer Love</a></li>
      </ul>
      <button 
        className="btn-primary" 
        onClick={() => { setIsMobileOpen(false); document.getElementById('menu').scrollIntoView({ behavior: 'smooth' }); }}
        style={{ padding: '16px 40px', fontSize: '1.1rem' }}
      >
        Order Now
      </button>
    </div>
    </>
  );
}
