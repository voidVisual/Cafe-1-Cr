import React, { useEffect, useState } from 'react';

export default function Menu({ addToCart, items, categories }) {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!categories.includes(filter)) {
      setFilter('all');
    }
  }, [categories, filter]);

  const filtered = items.filter(i => {
    const matchesFilter = filter === 'all' || i.category === filter;
    const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (i.sub && i.sub.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

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

      <div style={{ maxWidth: '600px', margin: '0 auto 32px', padding: '0 16px' }}>
        <input 
          type="text" 
          placeholder="Search for a particular coffee or snack..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '16px 24px', 
            borderRadius: '50px', 
            border: '2px solid transparent', 
            fontSize: '1.05rem', 
            fontFamily: '"DM Sans", sans-serif', 
            boxShadow: 'var(--shadow-card)', 
            outline: 'none',
            color: 'var(--dark)',
            transition: 'border-color 0.3s'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--brown)'}
          onBlur={(e) => e.target.style.borderColor = 'transparent'}
        />
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

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--dark)', marginBottom: '12px', fontFamily: '"Playfair Display", serif' }}>No results found for "{searchTerm}"</h3>
          <p>Try searching for something else or browse our categories above!</p>
          <button className="btn-outline" style={{ marginTop: '24px', borderColor: 'var(--border)', color: 'var(--dark)' }} onClick={() => { setSearchTerm(''); setFilter('all'); }}>Clear Search</button>
        </div>
      ) : (
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
      )}
    </section>
  );
}
