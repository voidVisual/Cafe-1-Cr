import React from 'react';

export default function OrderSteps() {
  return (
    <div id="order-section">
      <div className="order-inner">
        <div className="section-label reveal">How It Works</div>
        <h2 className="section-title reveal">Order in 4 easy steps</h2>
        <p className="section-sub reveal">From selection to your doorstep, we make it seamless.</p>
        <div className="steps-grid">
          <div className="step-card reveal">
            <div className="step-icon">☕</div>
            <div className="step-num">1</div>
            <h4>Choose Your Coffee</h4>
            <p>Browse our menu and pick your favorite brew, size, and customizations.</p>
          </div>
          <div className="step-card reveal">
            <div className="step-icon">💳</div>
            <div className="step-num">2</div>
            <h4>Pay Securely</h4>
            <p>Pay with Cash, UPI, or Card. Get exclusive discounts on your first order.</p>
          </div>
          <div className="step-card reveal">
            <div className="step-icon">⏱️</div>
            <div className="step-num">3</div>
            <h4>Track Preparation</h4>
            <p>Watch live updates as your coffee is brewed to perfection.</p>
          </div>
          <div className="step-card reveal">
            <div className="step-icon">🛍️</div>
            <div className="step-num">4</div>
            <h4>Pick Up & Enjoy</h4>
            <p>Get notified when it's ready and pick it up at the counter, hot and fresh.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
