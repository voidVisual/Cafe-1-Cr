import React, { useState, useEffect } from 'react';

export default function LiveTracking({ orderData }) {
  const isOrdered = !!orderData;
  const statusLabel = isOrdered ? 'Order Placed!' : 'Live Tracking';
  const orderMessage = isOrdered ? orderData.message : 'Know exactly when your coffee is ready';

  // State to simulate order progression
  const [prepProgress, setPrepProgress] = useState(0);
  const [prepTimeLeft, setPrepTimeLeft] = useState(600); // 600 seconds = 10 minutes
  const [orderStatusText, setOrderStatusText] = useState('Waiting for order...');

  useEffect(() => {
    if (isOrdered) {
      setOrderStatusText('Order Received');
      setPrepProgress(10);
      setPrepTimeLeft(600);

      const interval = setInterval(() => {
        setPrepTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setOrderStatusText('Ready for Pickup! 🎉');
            setPrepProgress(100);
            if (window.Notification && Notification.permission === "granted") {
              new Notification("Cafe 1 Cr", { body: "Your order is ready for pickup!" });
            } else {
              alert("Your order is ready for pickup! 🎉");
            }
            return 0;
          }
          
          const elapsed = 600 - prev;
          
          if (elapsed === 60) { setOrderStatusText('Preparing Ingredients...'); setPrepProgress(30); }
          if (elapsed === 300) { setOrderStatusText('Brewing Coffee...'); setPrepProgress(60); }
          if (elapsed === 540) { setOrderStatusText('Packing Order...'); setPrepProgress(90); }

          return prev - 1;
        });
      }, 1000); // 1 second intervals

      if (window.Notification && Notification.permission !== "denied") {
        Notification.requestPermission();
      }

      return () => clearInterval(interval);
    } else {
      setPrepProgress(0);
      setPrepTimeLeft(600);
      setOrderStatusText('Waiting for order...');
    }
  }, [isOrdered]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <section id="tracking">
      <div className="section-label reveal">{statusLabel}</div>
      <h2 className="section-title reveal">
        {isOrdered ? 'Your coffee is being prepared.' : 'Track your order\nin real-time'}
      </h2>
      <p className="section-sub reveal" style={{ marginBottom: '48px' }}>
        {isOrdered ? `Order ID: ${orderData.order_id}. Sit tight!` : 'Live updates so your brew is perfectly timed for pickup.'}
      </p>
      
      <div className="tracking-grid">
        <div>
          <div className="tracking-card reveal">
            <h4>Order Status</h4>
            <p className="status-highlight">{orderStatusText}</p>
            <div className="tracking-info-row">
              <span className="t-icon">☕</span>
              <div>
                <div className="t-label">Order</div>
                <div className="t-val">{isOrdered ? 'Your Custom Order' : 'Cappuccino with Chocolate'}</div>
              </div>
            </div>
            <div className="tracking-info-row">
              <span className="t-icon">💳</span>
              <div>
                <div className="t-label">Payment</div>
                <div className="t-val">{isOrdered ? 'Paid via App' : '₹ 440'}</div>
              </div>
            </div>
            <div className="tracking-info-row">
              <span className="t-icon">👨‍🍳</span>
              <div>
                <div className="t-label">Barista</div>
                <div className="t-val">{isOrdered ? 'Assigned to Barista...' : 'Rahul — Master Brewer'}</div>
              </div>
            </div>
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Estimated Prep Time</span>
                <strong style={{ color: 'var(--brown)', fontVariantNumeric: 'tabular-nums' }}>{isOrdered ? formatTime(prepTimeLeft) : '10:00'} min</strong>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: isOrdered ? `${prepProgress}%` : '50%', transition: 'width 1s ease-in-out' }}></div>
              </div>
            </div>
          </div>
        </div>
        <div className="prep-visual reveal">
          <img 
            src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&q=80" 
            alt="Coffee Preparation" 
            style={{ borderRadius: '24px', width: '100%', height: '340px', objectFit: 'cover', boxShadow: 'var(--shadow-card)' }} 
          />
          <div className="prep-overlay">
            <div>
              <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{isOrdered ? formatTime(prepTimeLeft) : '10:00'} min left</strong><br />
              <span>{orderStatusText}</span>
            </div>
            <div className="status-badge">Live ⏱️</div>
          </div>
        </div>
      </div>
    </section>
  );
}
