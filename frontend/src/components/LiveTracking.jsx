import React, { useState, useEffect, useRef, useCallback } from 'react';

const STATUS_CONFIG = {
  Received: {
    label: 'Pending Approval',
    emoji: '⏳',
    color: '#E65100',
    bg: '#FFF3E0',
    description: 'Your order has been received. Waiting for the café to approve it.',
    progress: 10,
  },
  Approved: {
    label: 'Approved — Getting Ready',
    emoji: '✅',
    color: '#2E7D32',
    bg: '#E8F5E9',
    description: 'Your order has been approved! Preparation is starting now.',
    progress: 30,
  },
  Preparing: {
    label: 'Being Prepared',
    emoji: '🍳',
    color: '#1565C0',
    bg: '#E3F2FD',
    description: 'Your order is being prepared by our barista.',
    progress: 65,
  },
  Completed: {
    label: 'Ready for Pickup! 🎉',
    emoji: '🎉',
    color: '#6A1B9A',
    bg: '#F3E5F5',
    description: 'Your order is ready! Please pick it up at the counter.',
    progress: 100,
  },
  Declined: {
    label: 'Order Declined',
    emoji: '❌',
    color: '#C62828',
    bg: '#FFEBEE',
    description: 'Unfortunately, your order was declined. Please contact the café.',
    progress: 0,
  },
};

const POLL_INTERVAL = 1000; // 1 second for near-instant updates

export default function LiveTracking({ orderData }) {
  const isOrdered = !!orderData;
  const dbOrderId = orderData?.db_order_id;
  const displayId = orderData?.order_display_id || orderData?.order_id;
  const customerName = orderData?.customerName || '';

  const [orderStatus, setOrderStatus] = useState(null);
  const [prepTimeLeft, setPrepTimeLeft] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const timerRef = useRef(null);
  const notifiedRef = useRef(false);
  const prevStatusRef = useRef(null); // Use ref instead of state to avoid re-render loop

  // ── Show in-page toast notification ─────────────────────────────────
  const showToast = useCallback((emoji, message, color) => {
    setToastMessage({ emoji, message, color });
    // Also try browser notification
    if (window.Notification && Notification.permission === 'granted') {
      new Notification('Cafe 1 Cr', { body: `${emoji} ${message}` });
    }
    // Auto-dismiss after 6 seconds
    setTimeout(() => setToastMessage(null), 6000);
  }, []);

  // ── Poll order status from API ──────────────────────────────────────
  useEffect(() => {
    if (!dbOrderId) {
      setOrderStatus(null);
      setPrepTimeLeft(null);
      prevStatusRef.current = null;
      notifiedRef.current = false;
      return;
    }

    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/status/${dbOrderId}`);
        if (!res.ok) {
          console.warn(`[LiveTracking] Poll failed: ${res.status} ${res.statusText}`);
          return;
        }
        const data = await res.json();
        console.log('[LiveTracking] Status:', data.status, '| Prep left:', data.prep_seconds_left);
        setOrderStatus(data);

        // Update prep time from server
        if (data.prep_seconds_left !== null && data.prep_seconds_left !== undefined) {
          setPrepTimeLeft(data.prep_seconds_left);
        }

        // Fire notification on status change (using ref to avoid stale closures)
        const prev = prevStatusRef.current;
        if (prev && data.status !== prev) {
          const config = STATUS_CONFIG[data.status];
          if (config) {
            showToast(config.emoji, config.label, config.color);
          }
        }

        // Special notification when completed
        if (data.status === 'Completed' && !notifiedRef.current) {
          notifiedRef.current = true;
          showToast('🎉', 'Your order is ready for pickup!', '#6A1B9A');
        }

        prevStatusRef.current = data.status;
      } catch (err) {
        console.error('Failed to poll order status:', err);
      }
    };

    poll(); // Immediate first poll
    const interval = setInterval(poll, POLL_INTERVAL);

    // Request notification permission
    if (window.Notification && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    return () => clearInterval(interval);
  }, [dbOrderId, showToast]); // No prevStatus dependency — uses ref

  // ── Local countdown timer (ticks every second between polls) ────────
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (prepTimeLeft !== null && prepTimeLeft > 0 && orderStatus?.status !== 'Completed' && orderStatus?.status !== 'Declined') {
      timerRef.current = setInterval(() => {
        setPrepTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [prepTimeLeft !== null && orderStatus?.status]);

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentStatus = orderStatus?.status || 'Received';
  const config = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.Received;
  const hasTimer = orderStatus?.approved_at && currentStatus !== 'Completed' && currentStatus !== 'Declined';
  const isCompleted = currentStatus === 'Completed';
  const isDeclined = currentStatus === 'Declined';

  // Progress based on status
  let progress = config.progress;
  if (hasTimer && prepTimeLeft !== null && orderStatus?.prep_time_minutes) {
    const totalSecs = orderStatus.prep_time_minutes * 60;
    const elapsed = totalSecs - prepTimeLeft;
    progress = Math.min(95, 30 + (elapsed / totalSecs) * 65);
  }
  if (isCompleted) progress = 100;

  return (
    <section id="tracking">
      <div className="section-label reveal">{isOrdered ? 'Order Placed!' : 'Live Tracking'}</div>
      <h2 className="section-title reveal">
        {isOrdered ? 'Your coffee is being prepared.' : 'Track your order\nin real-time'}
      </h2>
      <p className="section-sub reveal" style={{ marginBottom: '48px' }}>
        {isOrdered ? `Order ${displayId}${customerName ? ` for ${customerName}` : ''}. Sit tight!` : 'Live updates so your brew is perfectly timed for pickup.'}
      </p>

      {/* ── In-page Toast Notification ──────────────────────────────── */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: toastMessage.color || 'var(--brown)',
          color: 'white',
          padding: '14px 28px',
          borderRadius: '50px',
          fontWeight: '700',
          fontSize: '0.95rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          animation: 'fadeUp 0.4s ease',
          fontFamily: "'DM Sans', sans-serif",
          maxWidth: '90vw',
        }}>
          <span style={{ fontSize: '1.3rem' }}>{toastMessage.emoji}</span>
          {toastMessage.message}
        </div>
      )}
      
      <div className="tracking-grid">
        <div>
          <div className="tracking-card reveal">
            {/* Status Badge */}
            {isOrdered && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 16px',
                borderRadius: '24px',
                background: config.bg,
                color: config.color,
                fontWeight: '700',
                fontSize: '0.85rem',
                marginBottom: '16px',
                border: `1px solid ${config.color}20`,
              }}>
                <span>{config.emoji}</span>
                <span>{config.label}</span>
              </div>
            )}

            <h4>Order Status</h4>
            <p className="status-highlight" style={{ color: isOrdered ? config.color : undefined }}>
              {isOrdered ? config.description : 'Waiting for order...'}
            </p>

            {/* Status Steps */}
            {isOrdered && (
              <div style={{ display: 'flex', gap: '4px', margin: '20px 0', alignItems: 'center' }}>
                {['Received', 'Approved', 'Preparing', 'Completed'].map((step, idx) => {
                  const stepIdx = ['Received', 'Approved', 'Preparing', 'Completed'].indexOf(currentStatus);
                  const thisIdx = idx;
                  const isActive = thisIdx <= stepIdx && !isDeclined;
                  const stepConfig = STATUS_CONFIG[step];
                  return (
                    <React.Fragment key={step}>
                      <div style={{
                        flex: 1,
                        height: '4px',
                        borderRadius: '4px',
                        background: isActive ? stepConfig.color : '#E0E0E0',
                        transition: 'background 0.5s ease',
                      }} />
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            {isOrdered && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                <span>Received</span>
                <span>Approved</span>
                <span>Preparing</span>
                <span>Ready</span>
              </div>
            )}

            <div className="tracking-info-row">
              <span className="t-icon">☕</span>
              <div>
                <div className="t-label">Order</div>
                <div className="t-val">{isOrdered ? (displayId || 'Your Custom Order') : 'Cappuccino with Chocolate'}</div>
              </div>
            </div>
            <div className="tracking-info-row">
              <span className="t-icon">👤</span>
              <div>
                <div className="t-label">Customer</div>
                <div className="t-val">{isOrdered ? (customerName || 'You') : 'Guest'}</div>
              </div>
            </div>
            <div className="tracking-info-row">
              <span className="t-icon">👨‍🍳</span>
              <div>
                <div className="t-label">Status</div>
                <div className="t-val" style={{ color: config.color, fontWeight: 700 }}>
                  {isOrdered ? config.label : 'Waiting for order...'}
                </div>
              </div>
            </div>

            {/* Timer — only shows after approval */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  {isOrdered
                    ? (currentStatus === 'Received'
                        ? 'Timer starts after approval'
                        : isCompleted
                          ? 'Order complete!'
                          : isDeclined
                            ? 'Order declined'
                            : 'Estimated Prep Time')
                    : 'Estimated Prep Time'}
                </span>
                <strong style={{ color: 'var(--brown)', fontVariantNumeric: 'tabular-nums' }}>
                  {isOrdered
                    ? (hasTimer ? `${formatTime(prepTimeLeft)} min` : isCompleted ? '✓ Done' : isDeclined ? '—' : 'Pending...')
                    : '10:00 min'}
                </strong>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{
                  width: isOrdered ? `${progress}%` : '50%',
                  transition: 'width 1s ease-in-out',
                  background: isOrdered ? config.color : undefined,
                }}></div>
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
              <strong style={{ fontVariantNumeric: 'tabular-nums' }}>
                {isOrdered
                  ? (hasTimer ? `${formatTime(prepTimeLeft)} min left` : isCompleted ? 'Ready! 🎉' : config.label)
                  : '10:00 min left'}
              </strong><br />
              <span>{isOrdered ? config.description : 'Waiting for order...'}</span>
            </div>
            <div className="status-badge" style={{ background: isOrdered ? config.bg : undefined, color: isOrdered ? config.color : undefined }}>
              {isOrdered ? config.emoji : 'Live ⏱️'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
