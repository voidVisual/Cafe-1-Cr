import React, { useEffect, useMemo, useState } from 'react';

const emptyItem = {
  name: '',
  price: '',
  category: '',
  img: '',
  sub: '',
  rating: '4.6',
  reviews: '0'
};

const ADMIN_PASS_KEY = 'cafe1cr_admin_pass';
const ADMIN_AUTH_KEY = 'cafe1cr_admin_authed';

export default function AdminDashboard({
  orders,
  menuItems,
  onUpdateOrderStatus,
  onAddMenuItem,
  onUpdateMenuItem,
  onRemoveMenuItem,
  onClearOrders,
  onResetMenu,
  onCreateOrder,
  onExit
}) {
  const [isAuthed, setIsAuthed] = useState(() => sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true');
  const [hasPasscode, setHasPasscode] = useState(() => Boolean(localStorage.getItem(ADMIN_PASS_KEY)));
  const [passcode, setPasscode] = useState('');
  const [setupPasscode, setSetupPasscode] = useState('');
  const [setupConfirm, setSetupConfirm] = useState('');
  const [changeCurrent, setChangeCurrent] = useState('');
  const [changeNext, setChangeNext] = useState('');
  const [changeConfirm, setChangeConfirm] = useState('');
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

  const categories = useMemo(() => {
    const set = new Set(menuItems.map(item => item.category).filter(Boolean));
    return Array.from(set).sort();
  }, [menuItems]);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const pending = orders.filter(order => order.status === 'pending').length;
    const approved = orders.filter(order => order.status === 'approved').length;
    const declined = orders.filter(order => order.status === 'declined').length;
    const revenue = orders
      .filter(order => order.status === 'approved')
      .reduce((sum, order) => sum + (order.total || 0), 0);

    return { totalOrders, pending, approved, declined, revenue };
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

      const orderDate = order.createdAt ? new Date(order.createdAt) : null;
      if (startDate && orderDate && orderDate < startDate) {
        return false;
      }
      if (endDate && orderDate && orderDate > endDate) {
        return false;
      }

      if (!search) {
        return true;
      }

      const matchesId = String(order.id || '').toLowerCase().includes(search);
      const matchesItem = order.items?.some(item => String(item.name || '').toLowerCase().includes(search));
      return matchesId || matchesItem;
    });

    const sorted = [...filtered];
    if (sortBy === 'oldest') {
      sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }
    if (sortBy === 'newest') {
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    if (sortBy === 'total-high') {
      sorted.sort((a, b) => (b.total || 0) - (a.total || 0));
    }
    if (sortBy === 'total-low') {
      sorted.sort((a, b) => (a.total || 0) - (b.total || 0));
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

    const headers = ['order_id', 'status', 'total', 'payment', 'created_at', 'items'];
    const rows = list.map(order => {
      const items = (order.items || [])
        .map(item => `${item.name} x${item.qty}`)
        .join(' | ');
      const values = [
        order.id,
        order.status,
        order.total,
        order.payment,
        order.createdAt,
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
    const stored = localStorage.getItem(ADMIN_PASS_KEY);
    if (stored && passcode === stored) {
      setIsAuthed(true);
      setPasscode('');
      return;
    }
    alert('Incorrect passcode.');
  };

  const handleSetup = (e) => {
    e.preventDefault();
    if (setupPasscode.length < 4) {
      alert('Passcode should be at least 4 characters.');
      return;
    }
    if (setupPasscode !== setupConfirm) {
      alert('Passcodes do not match.');
      return;
    }
    localStorage.setItem(ADMIN_PASS_KEY, setupPasscode);
    setHasPasscode(true);
    setIsAuthed(true);
    setSetupPasscode('');
    setSetupConfirm('');
  };

  const handleChangePasscode = (e) => {
    e.preventDefault();
    const stored = localStorage.getItem(ADMIN_PASS_KEY) || '';
    if (changeCurrent !== stored) {
      alert('Current passcode is incorrect.');
      return;
    }
    if (changeNext.length < 4) {
      alert('New passcode should be at least 4 characters.');
      return;
    }
    if (changeNext !== changeConfirm) {
      alert('New passcodes do not match.');
      return;
    }
    localStorage.setItem(ADMIN_PASS_KEY, changeNext);
    setChangeCurrent('');
    setChangeNext('');
    setChangeConfirm('');
    alert('Passcode updated.');
  };

  const handleLogout = () => {
    setIsAuthed(false);
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
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

  const handlePosSubmit = () => {
    if(posCart.length === 0) { alert('Order is empty.'); return; }
    const total = posCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const newOrder = {
      id: `POS-${Date.now()}`,
      status: 'approved',
      items: posCart,
      total,
      payment: 'cash',
      createdAt: new Date().toISOString()
    };
    onCreateOrder?.(newOrder);
    setPosCart([]);
    alert('Counter order placed securely!');
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
            {hasPasscode ? (
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
            ) : (
              <form className="admin-form" onSubmit={handleSetup}>
                <div className="admin-field">
                  <label>Create Passcode</label>
                  <input type="password" value={setupPasscode} onChange={(e) => setSetupPasscode(e.target.value)} placeholder="Create a passcode" />
                </div>
                <div className="admin-field">
                  <label>Confirm Passcode</label>
                  <input type="password" value={setupConfirm} onChange={(e) => setSetupConfirm(e.target.value)} placeholder="Confirm passcode" />
                </div>
                <div className="admin-actions">
                  <button className="btn-hero-primary" type="submit">Set Passcode & Enter</button>
                  <button className="btn-hero-outline" type="button" onClick={onExit}>Back to Site</button>
                </div>
              </form>
            )}
            <p className="admin-muted">Passcodes are stored locally on this device.</p>
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
      img: form.img.trim() || '/img/Thick cold coffee.jpg',
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
                Review Orders
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
              <span>Pending</span>
              <strong>{stats.pending}</strong>
            </div>
            <div className="admin-hero-stat">
              <span>Approved</span>
              <strong>{stats.approved}</strong>
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
          <h3>Orders History</h3>
          <div className="admin-filter-bar">
            <div className="admin-filter-group">
              <input
                className="admin-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search order ID or item name"
              />
              <select className="admin-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="declined">Declined</option>
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
            {orders.length === 0 && (
              <div className="admin-empty">No orders yet.</div>
            )}
            {orders.length > 0 && filteredOrders.length === 0 && (
              <div className="admin-empty">No orders match the filters.</div>
            )}
            {filteredOrders.map(order => (
              <div key={order.id} className="admin-order">
                <div className="admin-order-top">
                  <div>
                    <strong>Order {order.id}</strong>
                    <div className="admin-muted">{new Date(order.createdAt).toLocaleString()}</div>
                  </div>
                  <span className={`admin-status status-${order.status}`}>{order.status}</span>
                </div>
                <div className="admin-muted">Payment: {order.payment || 'unknown'} · Total: ₹ {order.total}</div>
                <ul className="admin-items">
                  {order.items.map(item => (
                    <li key={`${order.id}-${item.id}`}>
                      <span>{item.name}</span>
                      <span>x{item.qty}</span>
                    </li>
                  ))}
                </ul>
                <div className="admin-actions">
                  <button 
                    className={order.status === 'approved' ? 'btn-outline' : 'btn-primary'} 
                    onClick={() => onUpdateOrderStatus(order.id, 'approved')}
                    disabled={order.status === 'completed'}
                    style={order.status === 'completed' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  >
                    Approve
                  </button>
                  <button 
                    className={order.status === 'completed' ? 'btn-outline' : 'btn-primary'} 
                    style={
                      order.status === 'completed' ? { borderColor: '#42A5F5', color: '#42A5F5', opacity: 0.5, cursor: 'not-allowed' } :
                      order.status === 'approved' ? { background: '#1565C0', color: 'white', border: 'none' } :
                      { background: '#1565C0', color: 'white', border: 'none', opacity: 0.4, cursor: 'not-allowed' }
                    }
                    onClick={() => onUpdateOrderStatus(order.id, 'completed')}
                    disabled={order.status !== 'approved'}
                  >
                    Complete
                  </button>
                  <button 
                    className="btn-outline" 
                    onClick={() => onUpdateOrderStatus(order.id, 'declined')}
                    disabled={order.status === 'completed'}
                    style={order.status === 'completed' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  >
                    Decline
                  </button>
                  <button 
                    className="btn-outline" 
                    onClick={() => onUpdateOrderStatus(order.id, 'pending')}
                    disabled={order.status === 'completed'}
                    style={order.status === 'completed' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  >
                    Pending
                  </button>
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
            <form className="admin-form" onSubmit={handleChangePasscode}>
              <div className="admin-field">
                <label>Current Passcode</label>
                <input type="password" value={changeCurrent} onChange={(e) => setChangeCurrent(e.target.value)} placeholder="Current passcode" />
              </div>
              <div className="admin-row">
                <div className="admin-field">
                  <label>New Passcode</label>
                  <input type="password" value={changeNext} onChange={(e) => setChangeNext(e.target.value)} placeholder="New passcode" />
                </div>
                <div className="admin-field">
                  <label>Confirm New</label>
                  <input type="password" value={changeConfirm} onChange={(e) => setChangeConfirm(e.target.value)} placeholder="Confirm passcode" />
                </div>
              </div>
              <div className="admin-actions">
                <button className="btn-primary" type="submit">Update Passcode</button>
                <button className="btn-outline" type="button" onClick={handleLogout}>Sign Out</button>
              </div>
            </form>
            <div className="admin-divider"></div>
            <div className="admin-actions">
              <button
                className="btn-outline"
                type="button"
                onClick={() => {
                  if (window.confirm('Clear all orders? This cannot be undone.')) {
                    onClearOrders?.();
                  }
                }}
              >
                Clear Orders
              </button>
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
            <p className="admin-muted">Data is saved locally on this device only.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
