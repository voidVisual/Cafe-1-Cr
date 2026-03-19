import React from 'react';

export default function Navbar({ cartCount, openCart }) {
  return (
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
          onClick={() => document.getElementById('menu').scrollIntoView({ behavior: 'smooth' })}
        >
          View Menu
        </button>
        <button className="btn-primary" onClick={openCart}>
          🛒 Cart {cartCount > 0 && `(${cartCount})`}
        </button>
      </div>
    </nav>
  );
}
