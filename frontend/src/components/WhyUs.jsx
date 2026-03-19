import React from 'react';

export default function WhyUs() {
  return (
    <div id="why">
      <div className="why-inner">
        <div className="why-grid">
          <div className="why-text">
            <div className="section-label reveal">Why Cafe 1 Cr</div>
            <h2 className="section-title reveal">Every cup crafted<br />with passion</h2>
            <p className="section-sub reveal">
              We source the finest beans from across the globe and roast them in-house to give you an experience unlike any other.
            </p>
            <ul className="feature-list">
              <li className="feature-item reveal">
                <div className="feature-icon">🌍</div>
                <div>
                  <h4>Single Origin Beans</h4>
                  <p>Ethically sourced from farms in Ethiopia, Colombia, and Coorg — each with a distinct character.</p>
                </div>
              </li>
              <li className="feature-item reveal">
                <div className="feature-icon">🔥</div>
                <div>
                  <h4>In-House Roasting</h4>
                  <p>Roasted fresh every morning so your cup captures peak flavor, aroma, and richness.</p>
                </div>
              </li>
              <li className="feature-item reveal">
                <div className="feature-icon">⚡</div>
                <div>
                  <h4>Fast Preparation</h4>
                  <p>Your coffee is ready in minutes. Track the status live and pick it up right when it's hot.</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="why-image reveal">
            <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80" alt="Coffee being made" />
          </div>
        </div>
      </div>
    </div>
  );
}
