import React, { useEffect, useMemo, useRef, useState } from 'react';

const emptyItem = {
  name: '',
  price: '',
  category: '',
  img: '',
  sub: '',
  rating: '4.6',
  reviews: '0'
};

const ADMIN_AUTH_KEY = 'cafe1cr_admin_authed';
const ADMIN_API_KEY_STORAGE = 'cafe1cr_admin_api_key';
const POLL_INTERVAL = 1000; // 1 second for near-instant updates

export default function AdminDashboard({
  menuItems,
  onAddMenuItem,
  onUpdateMenuItem,
  onRemoveMenuItem,
  onResetMenu,
  onExit
}) {
  const [isAuthed, setIsAuthed] = useState(() => (
    sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true' &&
    Boolean(sessionStorage.getItem(ADMIN_API_KEY_STORAGE))
  ));
  const [passcode, setPasscode] = useState('');
  const [form, setForm] = useState(emptyItem);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // POS State
  const [posCart, setPosCart] = useState([]);
  const [posSelectedId, setPosSelectedId] = useState('');
  const [posQty, setPosQty] = useState(1);

  // API-driven orders
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const prevPendingCount = useRef(0);
  const audioRef = useRef(null);

  // Local overrides: { orderId: { order, expiresAt } }
  // These take precedence over polled data for 10 seconds after a status change
  const localOverrides = useRef({});

  const getAdminKey = () => sessionStorage.getItem(ADMIN_API_KEY_STORAGE) || '';
  const getAdminHeaders = () => ({ 'X-Admin-Key': getAdminKey() });

  // Merge polled orders with local overrides
  const mergeWithOverrides = (polledOrders) => {
    const now = Date.now();
    // Clean expired overrides
    for (const id of Object.keys(localOverrides.current)) {
      if (localOverrides.current[id].expiresAt < now) {
        delete localOverrides.current[id];
      }
    }
    // Merge: local override wins if it exists and hasn't expired
    return polledOrders.map(order => {
      const override = localOverrides.current[order.id];
      if (override && override.expiresAt > now) {
        return { ...order, ...override.order };
      }
      return order;
    });
  };

  // ── Fetch orders from API with polling ──────────────────────────────
  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders', { headers: getAdminHeaders() });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setIsAuthed(false);
          sessionStorage.removeItem(ADMIN_AUTH_KEY);
          sessionStorage.removeItem(ADMIN_API_KEY_STORAGE);
        }
        throw new Error(`Admin orders failed: ${res.status}`);
      }
      const data = await res.json();
      if (data.orders) {
        // Merge with local overrides so recent status changes aren't reverted
        setOrders(mergeWithOverrides(data.orders));

        // Play sound if new pending orders appeared
        const newPending = data.orders.filter(o => o.status === 'Received').length;
        if (newPending > prevPendingCount.current && prevPendingCount.current !== 0) {
          try { audioRef.current?.play(); } catch (_) { /* ignore */ }
        }
        prevPendingCount.current = newPending;
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (!isAuthed) return;
    fetchOrders();
    const interval = setInterval(fetchOrders, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [isAuthed]);

  // ── Update order status via API ─────────────────────────────────────
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAdminHeaders() },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        throw new Error(`Status update failed: ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        // Store local override so polling can't revert this for 10 seconds
        localOverrides.current[orderId] = {
          order: data.order,
          expiresAt: Date.now() + 10000, // 10 second protection window
        };
        // Immediate local update
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...data.order } : o));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update order status. Please try again.');
    }
  };

  const categories = useMemo(() => {
    const set = new Set(menuItems.map(item => item.category).filter(Boolean));
    return Array.from(set).sort();
  }, [menuItems]);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const received = orders.filter(order => order.status === 'Received').length;
    const approved = orders.filter(order => order.status === 'Approved').length;
    const preparing = orders.filter(order => order.status === 'Preparing').length;
    const completed = orders.filter(order => order.status === 'Completed').length;
    const declined = orders.filter(order => order.status === 'Declined').length;
    const revenue = orders
      .filter(order => order.status === 'Completed')
      .reduce((sum, order) => sum + (order.total_amount || 0), 0);

    return { totalOrders, received, approved, preparing, completed, declined, revenue };
  }, [orders]);

  useEffect(() => {
    sessionStorage.setItem(ADMIN_AUTH_KEY, isAuthed ? 'true' : 'false');
  }, [isAuthed]);

  const filteredOrders = useMemo(() => {
    const search = query.trim().toLowerCase();
    const startDate = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const endDate = toDate ? new Date(`${toDate}T23:59:59`) : null;

    const filtered = orders.filter(order => {
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }

      const orderDate = order.created_at ? new Date(order.created_at) : null;
      if (startDate && orderDate && orderDate < startDate) {
        return false;
      }
      if (endDate && orderDate && orderDate > endDate) {
        return false;
      }

      if (!search) {
        return true;
      }

      const matchesId = String(order.id || '').toLowerCase().includes(search) || String(order.order_display_id || '').toLowerCase().includes(search);
      const matchesItem = order.items?.some(item => String(item.name || '').toLowerCase().includes(search));
      const matchesPhone = String(order.customer_phone || '').includes(search);
      const matchesName = String(order.customer_name || '').toLowerCase().includes(search);
      return matchesId || matchesItem || matchesPhone || matchesName;
    });

    const sorted = [...filtered];
    if (sortBy === 'oldest') {
      sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }
    if (sortBy === 'newest') {
      sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    if (sortBy === 'total-high') {
      sorted.sort((a, b) => (b.total_amount || 0) - (a.total_amount || 0));
    }
    if (sortBy === 'total-low') {
      sorted.sort((a, b) => (a.total_amount || 0) - (b.total_amount || 0));
    }

    return sorted;
  }, [orders, query, statusFilter, fromDate, toDate, sortBy]);

  const resetForm = () => {
    setForm(emptyItem);
    setEditingId(null);
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name || '',
      price: String(item.price ?? ''),
      category: item.category || '',
      img: item.img || '',
      sub: item.sub || '',
      rating: String(item.rating ?? '4.6'),
      reviews: String(item.reviews ?? '0')
    });
  };

  const handleImageUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      handleChange('img', reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleClearFilters = () => {
    setQuery('');
    setStatusFilter('all');
    setFromDate('');
    setToDate('');
    setSortBy('newest');
  };

  const handleExportCsv = (list) => {
    if (!list.length) {
      alert('No orders to export.');
      return;
    }

    const headers = ['order_id', 'status', 'total', 'payment', 'phone', 'created_at', 'items'];
    const rows = list.map(order => {
      const items = (order.items || [])
        .map(item => `${item.name} x${item.qty}`)
        .join(' | ');
      const values = [
        order.id,
        order.status,
        order.total_amount,
        order.payment_method,
        order.customer_phone,
        order.created_at,
        items
      ].map(value => `"${String(value ?? '').replace(/"/g, '""')}"`);
      return values.join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cafe1cr-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const key = passcode.trim();
    if (!key) {
      alert('Enter passcode.');
      return;
    }

    // Store key and verify against backend (so wrong passcodes fail fast)
    sessionStorage.setItem(ADMIN_API_KEY_STORAGE, key);
    fetch('/api/admin/orders', { headers: { 'X-Admin-Key': key } })
      .then((res) => {
        if (!res.ok) {
          sessionStorage.removeItem(ADMIN_API_KEY_STORAGE);
          throw new Error('Unauthorized');
        }
        setIsAuthed(true);
        setPasscode('');
      })
      .catch(() => {
        alert('Incorrect passcode.');
      });
  };

  const handleLogout = () => {
    setIsAuthed(false);
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
    sessionStorage.removeItem(ADMIN_API_KEY_STORAGE);
  };

  const handlePosAddItem = (e) => {
    e.preventDefault();
    if(!posSelectedId) return;
    const item = menuItems.find(m => String(m.id) === posSelectedId);
    if(!item) return;
    setPosCart(prev => {
       const existing = prev.find(p => p.id === item.id);
       if(existing) return prev.map(p => p.id === item.id ? {...p, qty: p.qty + Number(posQty)} : p);
       return [...prev, { ...item, qty: Number(posQty) }];
    });
    setPosQty(1);
    setPosSelectedId('');
  };

  const handlePosSubmit = async () => {
    if(posCart.length === 0) { alert('Order is empty.'); return; }
    const total = posCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: posCart.map(i => ({ id: i.id, qty: i.qty, name: i.name, price: i.price })),
          total,
          address: 'Counter Order',
          phone: 'POS'
        })
      });
      const data = await res.json();
      if (data.db_order_id) {
        // Auto-approve POS orders
        await handleStatusChange(data.db_order_id, 'Approved');
        setPosCart([]);
        alert('Counter order placed and approved!');
        fetchOrders();
      }
    } catch (err) {
      console.error('POS order failed:', err);
      alert('Failed to place counter order.');
    }
  };

  // ── Status badge helper ─────────────────────────────────────────────
  const getStatusStyle = (status) => {
    const styles = {
      Received: { background: '#FFF3E0', color: '#E65100', border: '1px solid #FFB74D' },
      Approved: { background: '#E8F5E9', color: '#2E7D32', border: '1px solid #81C784' },
      Preparing: { background: '#E3F2FD', color: '#1565C0', border: '1px solid #64B5F6' },
      Completed: { background: '#F3E5F5', color: '#6A1B9A', border: '1px solid #BA68C8' },
      Declined: { background: '#FFEBEE', color: '#C62828', border: '1px solid #EF9A9A' },
    };
    return styles[status] || {};
  };

  if (!isAuthed) {
    return (
      <div className="admin-shell">
        <section className="admin-auth">
          <div className="admin-hero-bg"></div>
          <div className="admin-hero-overlay"></div>
          <div className="admin-auth-card">
            <div className="hero-badge">Cafe 1 Cr Admin</div>
            <h1 className="admin-hero-title">Admin Access</h1>
            <p className="admin-hero-sub">Secure this dashboard before managing orders and menu updates.</p>
              <form className="admin-form" onSubmit={handleLogin}>
                <div className="admin-field">
                  <label>Passcode</label>
                  <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="Enter admin passcode" />
                </div>
                <div className="admin-actions">
                  <button className="btn-hero-primary" type="submit">Enter Dashboard</button>
                  <button className="btn-hero-outline" type="button" onClick={onExit}>Back to Site</button>
                </div>
              </form>
          </div>
        </section>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category.trim()) {
      alert('Name and category are required.');
      return;
    }

    const payload = {
      id: editingId || `p${Date.now()}`,
      name: form.name.trim(),
      price: Number(form.price) || 0,
      category: form.category.trim().toLowerCase(),
      img: form.img.trim() || '/img/thick-cold-coffee.jpg',
      sub: form.sub.trim() || 'Chef special',
      rating: Number(form.rating) || 4.6,
      reviews: Number(form.reviews) || 0
    };

    if (editingId) {
      onUpdateMenuItem(payload);
    } else {
      onAddMenuItem(payload);
    }

    resetForm();
  };

  return (
    <div className="admin-shell">
      {/* Hidden audio for new order notification */}
      <audio ref={audioRef} preload="auto" src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1iZGtvcHlzbnJyd3h3cXZ7f4CBf3p7foCBgX9/f4CBgYGBgIB/f3+AgYGBgYGAgH5+fn+AgYGCgoGA" />

      <section className="admin-hero">
        <div className="admin-hero-bg"></div>
        <div className="admin-hero-overlay"></div>
        <div className="admin-hero-content">
          <div>
            <div className="hero-badge">Cafe 1 Cr Admin</div>
            <h1 className="admin-hero-title">Control the cafe flow in real time.</h1>
            <p className="admin-hero-sub">Review orders, approve or decline, and manage menu pricing without leaving the dashboard.</p>
            <div className="admin-hero-actions">
              <button className="btn-hero-primary" onClick={() => document.getElementById('admin-orders')?.scrollIntoView({ behavior: 'smooth' })}>
                Review Orders {stats.received > 0 && <span style={{ background: '#FF5722', color: 'white', borderRadius: '50%', padding: '2px 8px', marginLeft: '8px', fontSize: '0.8rem', animation: 'pulse 1.5s infinite' }}>⚡ {stats.received}</span>}
              </button>
              <button className="btn-hero-outline" onClick={() => document.getElementById('admin-menu')?.scrollIntoView({ behavior: 'smooth' })}>
                Edit Menu
              </button>
            </div>
          </div>
          <div className="admin-hero-card">
            <div className="admin-hero-stat">
              <span>Total Orders</span>
              <strong>{stats.totalOrders}</strong>
            </div>
            <div className="admin-hero-stat">
              <span>New</span>
              <strong style={{ color: stats.received > 0 ? '#FF5722' : undefined }}>{stats.received}</strong>
            </div>
            <div className="admin-hero-stat">
              <span>In Progress</span>
              <strong>{stats.approved + stats.preparing}</strong>
            </div>
            <div className="admin-hero-stat">
              <span>Completed</span>
              <strong>{stats.completed}</strong>
            </div>
            <div className="admin-hero-stat">
              <span>Revenue</span>
              <strong>₹ {stats.revenue}</strong>
            </div>
            <div className="admin-actions">
              <button className="btn-outline" onClick={handleLogout}>Sign Out</button>
              <button className="btn-outline" onClick={onExit}>Exit Admin</button>
            </div>
          </div>
        </div>
      </section>

      <div className="admin-header">
        <div>
          <div className="section-label">Admin</div>
          <h2 className="section-title">Order & Menu Control</h2>
          <p className="section-sub">Approve or decline orders, and keep the menu updated in real time.</p>
        </div>
      </div>

      <div className="admin-grid">
        <div className="admin-column">
          <div className="admin-card" id="admin-create-order">
            <h3>Create POS Order</h3>
            <form className="admin-form" onSubmit={handlePosAddItem}>
              <div className="admin-row">
                <div className="admin-field">
                  <label>Select Item</label>
                  <select className="admin-select" value={posSelectedId} onChange={(e) => setPosSelectedId(e.target.value)}>
                    <option value="">-- Choose Menu Item --</option>
                    {menuItems.map(item => (
                      <option key={item.id} value={item.id}>{item.name} - ₹ {item.price}</option>
                    ))}
                  </select>
                </div>
                <div className="admin-field" style={{ minWidth: '80px', maxWidth: '120px' }}>
                  <label>Quantity</label>
                  <input type="number" min="1" value={posQty} onChange={(e) => setPosQty(e.target.value)} />
                </div>
              </div>
              <div className="admin-actions">
                <button className="btn-outline" type="submit" disabled={!posSelectedId}>Add to Order</button>
              </div>
            </form>
            {posCart.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <ul className="admin-items">
                  {posCart.map(item => (
                    <li key={item.id}>
                      <span>{item.name} x {item.qty}</span>
                      <span>₹ {item.price * item.qty}</span>
                    </li>
                  ))}
                </ul>
                <div className="admin-divider" style={{ margin: '16px 0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <strong style={{ color: 'white' }}>Total Pay (Cash)</strong>
                  <strong style={{ color: 'var(--brown-light)', fontSize: '1.2rem' }}>₹ {posCart.reduce((s, i) => s + (i.price * i.qty), 0)}</strong>
                </div>
                <div className="admin-actions">
                  <button className="btn-primary" onClick={handlePosSubmit}>Complete Paid Order</button>
                  <button className="btn-outline" onClick={() => setPosCart([])}>Clear Cart</button>
                </div>
              </div>
            )}
          </div>

          <div className="admin-card" id="admin-orders">
          <h3>Orders {loadingOrders && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading...</span>}</h3>
          <div className="admin-filter-bar">
            <div className="admin-filter-group">
              <input
                className="admin-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search order ID, item, or phone"
              />
              <select className="admin-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="Received">Received (New)</option>
                <option value="Approved">Approved</option>
                <option value="Preparing">Preparing</option>
                <option value="Completed">Completed</option>
                <option value="Declined">Declined</option>
              </select>
            </div>
            <div className="admin-filter-group">
              <input className="admin-input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <input className="admin-input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              <select className="admin-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="total-high">Total High</option>
                <option value="total-low">Total Low</option>
              </select>
            </div>
            <div className="admin-filter-actions">
              <button className="btn-outline" type="button" onClick={handleClearFilters}>Clear Filters</button>
              <button className="btn-outline" type="button" onClick={() => handleExportCsv(filteredOrders)}>Export CSV</button>
            </div>
          </div>
          <div className="admin-muted admin-count">Showing {filteredOrders.length} of {orders.length} orders</div>
          <div className="admin-list">
            {orders.length === 0 && !loadingOrders && (
              <div className="admin-empty">No orders yet.</div>
            )}
            {orders.length > 0 && filteredOrders.length === 0 && (
              <div className="admin-empty">No orders match the filters.</div>
            )}
            {filteredOrders.map(order => (
              <div key={order.id} className={`admin-order ${order.status === 'Received' ? 'new-order-highlight' : ''}`}>
                <div className="admin-order-top">
                  <div>
                    <strong>{order.order_display_id || `#${order.id.slice(-6)}`}</strong>
                    {order.customer_name && <div style={{ color: 'var(--brown-light)', fontWeight: '600', fontSize: '0.9rem' }}>👤 {order.customer_name}</div>}
                    {order.customer_phone && <div style={{ color: 'var(--brown-light)', fontWeight: '600', fontSize: '0.9rem' }}>📱 {order.customer_phone}</div>}
                    <div className="admin-muted">{new Date(order.created_at).toLocaleString()}</div>
                  </div>
                  <span className="admin-status" style={{ ...getStatusStyle(order.status), padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {order.status}
                  </span>
                </div>
                <div className="admin-muted">Payment: {order.payment_method || 'unknown'} · Total: ₹ {order.total_amount}</div>
                <ul className="admin-items">
                  {order.items.map((item, idx) => (
                    <li key={`${order.id}-${idx}`}>
                      <span>{item.name}</span>
                      <span>x{item.qty}</span>
                    </li>
                  ))}
                </ul>
                <div className="admin-actions" style={{ flexWrap: 'wrap' }}>
                  {/* Linear workflow: Received → Approved → Preparing → Completed */}
                  {order.status === 'Received' && (
                    <>
                      <button
                        className="btn-primary"
                        onClick={() => handleStatusChange(order.id, 'Approved')}
                        style={{ background: '#2E7D32' }}
                      >
                        ✓ Approve
                      </button>
                      <button
                        className="btn-outline"
                        onClick={() => handleStatusChange(order.id, 'Declined')}
                        style={{ borderColor: '#C62828', color: '#C62828' }}
                      >
                        ✕ Decline
                      </button>
                    </>
                  )}
                  {order.status === 'Approved' && (
                    <button
                      className="btn-primary"
                      onClick={() => handleStatusChange(order.id, 'Preparing')}
                      style={{ background: '#1565C0' }}
                    >
                      🍳 Start Preparing
                    </button>
                  )}
                  {order.status === 'Preparing' && (
                    <button
                      className="btn-primary"
                      onClick={() => handleStatusChange(order.id, 'Completed')}
                      style={{ background: '#6A1B9A' }}
                    >
                      ✓ Mark Completed
                    </button>
                  )}
                  {order.status === 'Completed' && (
                    <span style={{ color: '#6A1B9A', fontWeight: '600', fontSize: '0.85rem' }}>✓ Done</span>
                  )}
                  {order.status === 'Declined' && (
                    <span style={{ color: '#C62828', fontWeight: '600', fontSize: '0.85rem' }}>✕ Declined</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>

        <div className="admin-column">
          <div className="admin-card" id="admin-menu">
            <h3>{editingId ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
            <form className="admin-form" onSubmit={handleSubmit}>
              <div className="admin-field">
                <label>Name *</label>
                <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Item name" />
              </div>
              <div className="admin-field">
                <label>Price (INR)</label>
                <input type="number" min="0" value={form.price} onChange={(e) => handleChange('price', e.target.value)} placeholder="50" />
              </div>
              <div className="admin-field">
                <label>Category *</label>
                <input value={form.category} onChange={(e) => handleChange('category', e.target.value)} placeholder="cold coffee" list="admin-categories" />
                <datalist id="admin-categories">
                  {categories.map(cat => (
                    <option value={cat} key={cat} />
                  ))}
                </datalist>
              </div>
              <div className="admin-field">
                <label>Image URL</label>
                <input value={form.img} onChange={(e) => handleChange('img', e.target.value)} placeholder="/img/item.jpg" />
              </div>
              <div className="admin-field">
                <label>Upload Image</label>
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files?.[0])} />
              </div>
              {form.img && (
                <div className="admin-image-preview">
                  <img src={form.img} alt="Menu preview" />
                  <button className="btn-outline" type="button" onClick={() => handleChange('img', '')}>Remove Image</button>
                </div>
              )}
              <div className="admin-field">
                <label>Subtitle</label>
                <input value={form.sub} onChange={(e) => handleChange('sub', e.target.value)} placeholder="Short description" />
              </div>
              <div className="admin-row">
                <div className="admin-field">
                  <label>Rating</label>
                  <input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => handleChange('rating', e.target.value)} />
                </div>
                <div className="admin-field">
                  <label>Reviews</label>
                  <input type="number" min="0" value={form.reviews} onChange={(e) => handleChange('reviews', e.target.value)} />
                </div>
              </div>
              <div className="admin-actions">
                <button className="btn-primary" type="submit">{editingId ? 'Save Changes' : 'Add Item'}</button>
                <button className="btn-outline" type="button" onClick={resetForm}>Clear</button>
              </div>
            </form>

            <div className="admin-menu-list">
              {menuItems.map(item => (
                <div key={item.id} className="admin-menu-item">
                  <div>
                    <strong>{item.name}</strong>
                    <div className="admin-muted">{item.category} · ₹ {item.price}</div>
                  </div>
                  <div className="admin-actions">
                    <button className="btn-outline" onClick={() => handleEdit(item)}>Edit</button>
                    <button className="btn-outline" onClick={() => onRemoveMenuItem(item.id)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card admin-settings">
            <h3>Admin Settings</h3>
            <div className="admin-actions">
              <button className="btn-outline" type="button" onClick={handleLogout}>Sign Out</button>
            </div>
            <div className="admin-divider" style={{ margin: '16px 0' }}></div>
            <div className="admin-actions">
              <button
                className="btn-outline"
                type="button"
                onClick={() => {
                  if (window.confirm('Reset menu to default items?')) {
                    onResetMenu?.();
                  }
                }}
              >
                Reset Menu
              </button>
            </div>
            <p className="admin-muted">Orders are stored in the database. Menu items are saved locally.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
