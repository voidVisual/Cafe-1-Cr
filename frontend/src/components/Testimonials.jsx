import React from 'react';

export default function Testimonials() {
  return (
    <>
      <section id="testimonials">
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div className="section-label reveal" style={{ textAlign: 'center' }}>Customer Love</div>
          <h2 className="section-title reveal" style={{ textAlign: 'center' }}>What our regulars say</h2>
        </div>
        <div className="testimonials-grid">
          <div className="testi-card reveal">
            <div className="testi-stars">★★★★★</div>
            <p className="testi-text">"The cappuccino here is absolutely divine. I order it every morning before work — it has become my daily ritual. Nothing else comes close!"</p>
            <div className="testi-author">
              <img src="https://images.unsplash.com/photo-1583091176016-0155b1115de2?w=150&q=80" className="testi-avatar" alt="Priya Sharma" />
              <div>
                <div className="testi-name">Priya Sharma</div>
                <div className="testi-role">Regular Customer · Pune</div>
              </div>
            </div>
          </div>
          <div className="testi-card reveal">
            <div className="testi-stars">★★★★★</div>
            <p className="testi-text">"Fast preparation, piping hot coffee, and the most generous portions. The cold brew is a game changer on hot Pune afternoons. Highly recommend!"</p>
            <div className="testi-author">
              <img src="https://images.unsplash.com/photo-1615813967515-e1838c1c56dc?w=150&q=80" className="testi-avatar" alt="Arjun Mehta" />
              <div>
                <div className="testi-name">Arjun Mehta</div>
                <div className="testi-role">Coffee Enthusiast · Pune</div>
              </div>
            </div>
          </div>
          <div className="testi-card reveal">
            <div className="testi-stars">★★★★☆</div>
            <p className="testi-text">"The chocolate cappuccino with oat milk is everything. I switched from a big chain after my first sip from Cafe 1 Cr. Never looking back!"</p>
            <div className="testi-author">
              <img src="https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=150&q=80" className="testi-avatar" alt="Sneha Kulkarni" />
              <div>
                <div className="testi-name">Sneha Kulkarni</div>
                <div className="testi-role">Food Blogger · Pune</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section included here for simplicity */}
      <div id="cta-section">
        <div className="cta-inner">
          <h2>Ready for your perfect cup?</h2>
          <p>Order now and get 20% off your first order. Use code CAFE1CR at checkout.</p>
          <button className="btn-cta" onClick={() => document.getElementById('menu').scrollIntoView({ behavior: 'smooth' })}>
            Order Now — Get 20% Off
          </button>
        </div>
      </div>
    </>
  );
}
