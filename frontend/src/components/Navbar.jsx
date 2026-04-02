import React, { useEffect, useState } from 'react';

export default function Navbar({ cartCount, openCart, isAdmin }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('mobile-menu-open', isMobileOpen);
    return () => document.body.classList.remove('mobile-menu-open');
  }, [isMobileOpen]);

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
      <div className="mobile-nav-shell">
        <div className="mobile-nav-header">
          <div className="mobile-nav-kicker">Quick Navigation</div>
          <h3>Explore Cafe 1 Cr</h3>
        </div>

        <ul className="mobile-nav-links">
          <li><a href="#menu" onClick={() => setIsMobileOpen(false)}><span>Signature Menu</span><span className="mobile-nav-arrow">→</span></a></li>
          <li><a href="#special" onClick={() => setIsMobileOpen(false)}><span>Exclusive Specials</span><span className="mobile-nav-arrow">→</span></a></li>
          <li><a href="#order-section" onClick={() => setIsMobileOpen(false)}><span>How to Order</span><span className="mobile-nav-arrow">→</span></a></li>
          <li><a href="#tracking" onClick={() => setIsMobileOpen(false)}><span>Live Tracking</span><span className="mobile-nav-arrow">→</span></a></li>
          <li><a href="#testimonials" onClick={() => setIsMobileOpen(false)}><span>Customer Love</span><span className="mobile-nav-arrow">→</span></a></li>
        </ul>

        <button
          className="btn-primary mobile-nav-cta"
          onClick={() => { setIsMobileOpen(false); document.getElementById('menu').scrollIntoView({ behavior: 'smooth' }); }}
        >
          Start Ordering
        </button>
      </div>
    </div>
    </>
  );
}
