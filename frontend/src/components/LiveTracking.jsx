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

const POLL_INTERVAL = 500; // 500ms for near-instant status updates

// Compute prep time left from approved_at timestamp locally (no server needed)
function computeSecondsLeft(approvedAt, prepTimeMinutes) {
  if (!approvedAt) return null;
  const elapsed = (Date.now() - new Date(approvedAt).getTime()) / 1000;
  return Math.max(0, Math.round(prepTimeMinutes * 60 - elapsed));
}

export default function LiveTracking({ orderData, onFinalize }) {
  const isOrdered = !!orderData;
  const dbOrderId = orderData?.db_order_id;
  const displayId = orderData?.order_display_id || orderData?.order_id;
  const customerName = orderData?.customerName || '';

  const statusLookupId = dbOrderId || (String(displayId || '').toUpperCase().startsWith('ORD-') ? displayId : null);

  const [orderStatus, setOrderStatus] = useState(null);
  // Local display value for the countdown — updated every second via RAF/interval
  const [displaySecondsLeft, setDisplaySecondsLeft] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const rafRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const notifiedRef = useRef(false);
  const prevStatusRef = useRef(null);
  const finalizedRef = useRef(false);
  // Store approved_at + prepTimeMinutes in a ref so the RAF closure never goes stale
  const timerParamsRef = useRef({ approvedAt: null, prepTimeMinutes: 10 });

  // ── Toast notification ────────────────────────────────────────────────────
  const showToast = useCallback((emoji, message, color) => {
    setToastMessage({ emoji, message, color });
    if (window.Notification && Notification.permission === 'granted') {
      new Notification('Cafe 1 Cr', { body: `${emoji} ${message}` });
    }
    setTimeout(() => setToastMessage(null), 6000);
  }, []);

  // ── Smooth countdown via requestAnimationFrame ────────────────────────────
  // Runs independently of the poll — never freezes, always in sync with wall clock
  const startCountdown = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const tick = () => {
      const { approvedAt, prepTimeMinutes } = timerParamsRef.current;
      if (!approvedAt) return;
      const left = computeSecondsLeft(approvedAt, prepTimeMinutes);
      setDisplaySecondsLeft(left);
      if (left > 0) {
        // Schedule next tick ~1 second from now using setTimeout inside RAF
        // This avoids 60fps rerenders while staying smooth
        setTimeout(() => {
          rafRef.current = requestAnimationFrame(tick);
        }, 250); // update 4× per second for smoother display
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // ── Poll order status from API every 500ms ────────────────────────────────
  useEffect(() => {
    if (!statusLookupId) {
      setOrderStatus(null);
      setDisplaySecondsLeft(null);
      prevStatusRef.current = null;
      notifiedRef.current = false;
      finalizedRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    // New order / new lookup id: reset per-order refs
    notifiedRef.current = false;
    prevStatusRef.current = null;
    finalizedRef.current = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/status/${statusLookupId}`);
        if (!res.ok) return;
        const data = await res.json();

        setOrderStatus(data);

        // Update timer params ref whenever we get a new approved_at
        if (data.approved_at) {
          const changed =
            timerParamsRef.current.approvedAt !== data.approved_at ||
            timerParamsRef.current.prepTimeMinutes !== data.prep_time_minutes;

          timerParamsRef.current = {
            approvedAt: data.approved_at,
            prepTimeMinutes: data.prep_time_minutes ?? 10,
          };

          // Start / restart smooth countdown when approved_at is first received
          if (changed && data.status !== 'Completed' && data.status !== 'Declined') {
            startCountdown();
          }
        }

        // Stop countdown if order completed or declined
        if (data.status === 'Completed' || data.status === 'Declined') {
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          if (data.status === 'Completed') setDisplaySecondsLeft(0);

          // Stop polling once the order is final to avoid hammering the API
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }

          if (!finalizedRef.current) {
            finalizedRef.current = true;
            try { onFinalize?.(data); } catch (_) { /* ignore */ }
          }
        }

        // Fire toast on status change
        const prev = prevStatusRef.current;
        if (prev && data.status !== prev) {
          const config = STATUS_CONFIG[data.status];
          if (config) showToast(config.emoji, config.label, config.color);
        }
        if (data.status === 'Completed' && !notifiedRef.current) {
          notifiedRef.current = true;
          showToast('🎉', 'Your order is ready for pickup!', '#6A1B9A');
        }

        prevStatusRef.current = data.status;
      } catch (err) {
        // Silently ignore network errors during poll
      }
    };

    // Request notification permission
    if (window.Notification && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    poll(); // Immediate first poll
    pollIntervalRef.current = setInterval(poll, POLL_INTERVAL);
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [statusLookupId, showToast, startCountdown]);

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentStatus = orderStatus?.status || 'Received';
  const config = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.Received;
  const hasTimer = !!orderStatus?.approved_at && currentStatus !== 'Completed' && currentStatus !== 'Declined';
  const isCompleted = currentStatus === 'Completed';
  const isDeclined = currentStatus === 'Declined';

  // Progress computed from local countdown (smooth, no jumps)
  let progress = config.progress;
  if (hasTimer && displaySecondsLeft !== null && orderStatus?.prep_time_minutes) {
    const totalSecs = orderStatus.prep_time_minutes * 60;
    const elapsed = totalSecs - displaySecondsLeft;
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

      {/* ── Toast Notification ──────────────────────────────────────────────── */}
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
                  const isActive = idx <= stepIdx && !isDeclined;
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

            {/* Timer */}
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
                    ? (hasTimer ? `${formatTime(displaySecondsLeft)} min` : isCompleted ? '✓ Done' : isDeclined ? '—' : 'Pending...')
                    : '10:00 min'}
                </strong>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{
                  width: isOrdered ? `${progress}%` : '50%',
                  transition: 'width 0.25s ease-in-out',
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
                  ? (hasTimer ? `${formatTime(displaySecondsLeft)} min left` : isCompleted ? 'Ready! 🎉' : config.label)
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
