import React, { useMemo, useState, useEffect } from 'react';
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
import AdminDashboard from './components/AdminDashboard';
import { menuItems as defaultMenuItems } from './data/menuData';

const MENU_STORAGE_KEY = 'cafe1cr_menu';
const ORDERS_STORAGE_KEY = 'cafe1cr_orders';

function App() {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(null);
  const [menuItems, setMenuItems] = useState(() => {
    const stored = localStorage.getItem(MENU_STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultMenuItems;
  });
  const [orders, setOrders] = useState(() => {
    const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  const [isAdmin, setIsAdmin] = useState(window.location.hash === '#admin');
  const [toast, setToast] = useState(null);

  const categories = useMemo(() => {
    const set = new Set(menuItems.map(item => item.category).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [menuItems]);

  useEffect(() => {
    const handleHash = () => setIsAdmin(window.location.hash === '#admin');
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

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
    setToast(`Added ${item.name} to bag`);
    setTimeout(() => setToast(null), 3000);
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(c => c.id !== id));
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(c => 
      c.id === id ? { ...c, qty: c.qty + delta } : c
    ).filter(c => c.qty > 0));
  };

  const handleOrderCompletion = (orderInfo = {}) => {
    const orderId = orderInfo.orderId || "ORD-12345";
    const items = orderInfo.items || cart;
    const total = orderInfo.total || items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const paymentMethod = orderInfo.paymentMethod || 'unknown';

    const order = {
      id: orderId,
      status: 'pending',
      items,
      total,
      payment: paymentMethod,
      createdAt: new Date().toISOString()
    };

    setOrders(prev => [order, ...prev]);
    setOrderPlaced({ message: "Order placed successfully!", order_id: orderId });
    setCart([]);
    setIsCartOpen(false);
    
    // Automatically redirect/scroll to the Live Tracking section
    setTimeout(() => {
      const trackingEl = document.getElementById('tracking');
      if (trackingEl) trackingEl.scrollIntoView({ behavior: 'smooth' });
    }, 400);
  };

  if (isAdmin) {
    return (
      <AdminDashboard
        orders={orders}
        menuItems={menuItems}
        onUpdateOrderStatus={(id, status) => {
          setOrders(prev => prev.map(order => order.id === id ? { ...order, status } : order));
        }}
        onCreateOrder={(order) => {
          setOrders(prev => [order, ...prev]);
        }}
        onAddMenuItem={(item) => setMenuItems(prev => [item, ...prev])}
        onUpdateMenuItem={(item) => setMenuItems(prev => prev.map(m => m.id === item.id ? item : m))}
        onRemoveMenuItem={(id) => setMenuItems(prev => prev.filter(m => m.id !== id))}
        onClearOrders={() => setOrders([])}
        onResetMenu={() => setMenuItems(defaultMenuItems)}
        onExit={() => { window.location.hash = ''; }}
      />
    );
  }

  return (
    <>
      <Navbar cartCount={cart.reduce((s, c) => s + c.qty, 0)} openCart={() => setIsCartOpen(true)} />
      <OfferTicker />
      <Hero />
      <Menu addToCart={addToCart} items={menuItems} categories={categories} />
      <WhyUs />
      <Special addToCart={addToCart} />
      <OrderSteps />
      <LiveTracking orderData={orderPlaced} />
      <Testimonials />
      <Footer />
      
      {/* Toast Notification */}
      <div className={`toast-notification ${toast ? 'show' : ''}`}>
        <span className="toast-icon">✓</span>
        <span className="toast-text">{toast}</span>
      </div>

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
