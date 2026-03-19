import React, { useState, useEffect } from 'react';

import { menuItems, categories } from '../data/menuData';

export default function Menu({ addToCart }) {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? menuItems : menuItems.filter(i => i.category === filter);

  return (
    <section id="menu">
      <div className="menu-header" style={{ width: '100%', textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ maxWidth: '750px', margin: '0 auto', opacity: 1, transform: 'none' }}>
          <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontStyle: 'italic', color: 'var(--brown)', lineHeight: '1.4', fontWeight: '800' }}>
            "Coffee is a language in itself, speaking directly to the soul to awaken the magic within."
          </h2>
          <div style={{ width: '60px', height: '4px', background: 'var(--brown-light)', margin: '24px auto 0', borderRadius: '4px' }}></div>
        </div>
      </div>
      <div className="category-tabs" style={{ overflowX: 'auto', paddingBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'nowrap', WebkitOverflowScrolling: 'touch' }}>
        {categories.map(cat => (
          <button 
            key={cat} 
            className={`tab ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
            style={{ whiteSpace: 'nowrap' }}
          >
            {cat.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </button>
        ))}
      </div>
      <div className="menu-grid">
        {filtered.map((item, i) => (
          <div key={item.id} className="menu-card" style={{ animationDelay: `${(i % 10) * 0.07}s` }}>
            <img src={item.img} alt={item.name} className="menu-card-img" />
            <div className="menu-card-body">
              <div className="menu-card-name">{item.name}</div>
              <div className="menu-card-desc">{item.sub}</div>
              <div className="menu-card-rating">
                <span style={{ color: 'var(--star)' }}>★</span> {item.rating} ({item.reviews})
              </div>
              <div className="menu-card-footer">
                <span className="menu-card-price">₹ {item.price}</span>
                <button 
                  className="add-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(item);
                  }}
                >+</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
