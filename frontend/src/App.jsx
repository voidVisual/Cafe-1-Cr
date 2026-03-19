import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Menu from './components/Menu';
import WhyUs from './components/WhyUs';
import Special from './components/Special';
import OrderSteps from './components/OrderSteps';
import LiveTracking from './components/LiveTracking';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import CartModal from './components/CartModal';
import OfferTicker from './components/OfferTicker';

function App() {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(null);

  // Reveal animation logic
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible');
      });
    }, { threshold: 0.1 });

    const elements = document.querySelectorAll('.reveal');
    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const addToCart = (item, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + qty } : c);
      }
      return [...prev, { ...item, qty }];
    });
    alert(`${item.name} added to cart!`);
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(c => c.id !== id));
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(c => 
      c.id === id ? { ...c, qty: c.qty + delta } : c
    ).filter(c => c.qty > 0));
  };

  const handleOrderCompletion = (orderId = "ORD-12345") => {
    setOrderPlaced({ message: "Order placed successfully!", order_id: orderId });
    setCart([]);
    setIsCartOpen(false);
    
    // Automatically redirect/scroll to the Live Tracking section
    setTimeout(() => {
      const trackingEl = document.getElementById('tracking');
      if (trackingEl) trackingEl.scrollIntoView({ behavior: 'smooth' });
    }, 400);
  };

  return (
    <>
      <Navbar cartCount={cart.reduce((s, c) => s + c.qty, 0)} openCart={() => setIsCartOpen(true)} />
      <OfferTicker />
      <Hero />
      <Menu addToCart={addToCart} />
      <WhyUs />
      <Special addToCart={addToCart} />
      <OrderSteps />
      <LiveTracking orderData={orderPlaced} />
      <Testimonials />
      <Footer />
      
      {/* Cart FAB */}
      <button className="cart-fab" onClick={() => setIsCartOpen(true)}>
        🛒<span className="cart-badge">{cart.reduce((s, c) => s + c.qty, 0)}</span>
      </button>

      {/* Basic Cart Dialog */}
      {isCartOpen && (
        <CartModal 
          cart={cart} 
          close={() => setIsCartOpen(false)} 
          remove={removeFromCart}
          updateQty={updateQty}
          placeOrder={handleOrderCompletion}
        />
      )}
    </>
  );
}

export default App;
