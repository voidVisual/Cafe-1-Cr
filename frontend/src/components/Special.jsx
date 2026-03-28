import React, { useState } from 'react';

const specialItems = [
  {
    id: 's1',
    badge: '12 Months Special Offer 🔥',
    title: 'Thick Cold Coffee',
    rating: 4.9,
    reviews: 512,
    desc: "Experience our legendary Thick Cold Coffee. Brewed slowly to extract maximum flavor, this isn't just a drink – it's a rich, creamy indulgence that instantly refreshes and energizes your day.",
    price: 20,
    originalPrice: 45,
    img: '/img/thick-cold-coffee.jpg',
    sizes: ['Regular']
  },
  {
    id: 's2',
    badge: 'Crunchy Delight',
    title: 'Oreo Shake',
    rating: 4.8,
    reviews: 420,
    desc: "A classic favorite reimagined. Our rich and creamy Oreo Shake blends premium vanilla ice cream with generous chunks of real Oreo cookies, topped with a luscious chocolate drizzle.",
    price: 70,
    img: '/img/oreo-shake.jpg',
    sizes: ['Regular', 'Jumbo']
  },
  {
    id: 's3',
    badge: 'House Special',
    title: '1CR Loaded Pizza',
    rating: 4.9,
    reviews: 630,
    desc: "The ultimate cheesy experience. Our signature 1CR Loaded Pizza comes packed to the brim with premium mozzarella, farm-fresh toppings, and an array of secret spices baked perfectly on a hand-tossed crust.",
    price: 210,
    img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    sizes: ['8"', '10"', '12"']
  }
];

export default function Special({ addToCart }) {
  const [selectedSizes, setSelectedSizes] = useState({
    s1: 'Regular',
    s2: 'Regular',
    s3: '10"'
  });

  const handleSizeChange = (id, size) => {
    setSelectedSizes(prev => ({ ...prev, [id]: size }));
  };

  return (
    <section id="special">
      <div style={{ textAlign: 'center', marginBottom: '80px' }}>
        <div className="section-label reveal">Our Specials</div>
        <h2 className="section-title reveal">Handpicked for you</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '100px' }}>
        {specialItems.map((item, index) => (
          <div className="special-wrap" key={item.id}>
            {/* Image Section */}
            <div className="special-img-wrap reveal" style={{ order: index % 2 !== 0 ? 2 : 1 }}>
              <img src={item.img} alt={item.title} />
              <div className="special-badge-card">
                <div className="icon">✨</div>
                <div><strong>Chef's Special</strong><span>{item.badge}</span></div>
              </div>
            </div>
            
            {/* Info Section */}
            <div className="special-info reveal" style={{ order: index % 2 !== 0 ? 1 : 2 }}>
              <div className="section-label">Featured Item</div>
              <h2 className="section-title">{item.title}</h2>
              <div className="special-rating">
                <span className="stars">★★★★★</span>
                <span className="rating-val">{item.rating}</span>
                <span className="rating-count">({item.reviews} reviews)</span>
              </div>
              <p className="special-desc">
                {item.desc}
              </p>
              <div>
                <div className="modal-size-label">Choose Size</div>
                <div className="size-selector">
                  {item.sizes.map(s => (
                    <button 
                      key={s} 
                      className={`size-btn ${selectedSizes[item.id] === s ? 'active' : ''}`}
                      onClick={() => handleSizeChange(item.id, s)}
                      style={{ width: 'auto', padding: '0 16px', borderRadius: '50px' }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="special-price">
                ₹ {item.price} 
                {item.originalPrice && <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '1.2rem', marginLeft: '12px', fontWeight: '500' }}>₹ {item.originalPrice}</span>}
              </div>
              <div style={{ display: 'flex', gap: '14px', marginTop: '24px', flexWrap: 'wrap' }}>
                <button 
                  className="btn-primary" 
                  style={{ padding: '14px 36px', fontSize: '1rem' }}
                  onClick={() => addToCart({
                    id: item.id,
                    name: `${item.title} (${selectedSizes[item.id]})`,
                    price: item.price,
                    img: item.img
                  })}
                >
                  Buy Now
                </button>
                <button className="btn-outline" style={{ padding: '14px 24px' }}>♡ Wishlist</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
