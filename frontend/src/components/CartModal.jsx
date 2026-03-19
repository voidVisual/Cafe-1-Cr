import React, { useState } from 'react';

export default function CartModal({ cart, close, remove, updateQty, placeOrder }) {
  const [step, setStep] = useState('cart'); // 'cart' or 'payment'
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isProcessing, setIsProcessing] = useState(false);

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  
  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      close();
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);

    if (paymentMethod === 'cash') {
      setTimeout(() => {
        setIsProcessing(false);
        placeOrder("ORD-CASH-" + Math.floor(Math.random() * 9999)); 
      }, 1000);
      return;
    }

    try {
      // 1. Create Payment Order on Backend
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          total: total,
          address: 'Default Local Address, Pune',
          phone: '+91 9999999999'
        })
      });
      const orderData = await res.json();

      if (!orderData.order_id) throw new Error("Could not initiate payment.");

      // 2. Open Razorpay Checkout Modal
      const options = {
        key: "rzp_test_placeholderKey", 
        amount: orderData.amount,
        currency: "INR",
        name: "Cafe 1 Cr",
        description: "Order Checkout",
        order_id: orderData.order_id,
        handler: async function (response) {
          try {
            // 3. Verify Payment
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id || "mock_payment_id",
                razorpay_order_id: response.razorpay_order_id || orderData.order_id,
                razorpay_signature: response.razorpay_signature || "mock_signature",
                orderData: { items: cart, total: total, address: 'Pune', phone: '9999999999' }
              })
            });
            const verifyData = await verifyRes.json();
            
            if (verifyData.success) {
              setIsProcessing(false);
              placeOrder(verifyData.order_id);
            } else {
              alert("Payment verification failed!");
              setIsProcessing(false);
            }
          } catch (err) {
            console.error(err);
            alert("Payment verification error.");
            setIsProcessing(false);
          }
        },
        prefill: { name: "Customer Name", email: "customer@example.com", contact: "9999999999" },
        theme: { color: "#9A5820" }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        alert("Payment Failed: " + response.error.description);
        setIsProcessing(false);
      });
      rzp.open();

    } catch (err) {
      console.error(err);
      alert("Error initiating Razorpay payment.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-backdrop open" onClick={handleBackdropClick}>
      <div className="modal-wrap" style={{ maxWidth: '500px' }}>
        <button className="modal-close" onClick={close}>✕</button>
        <div className="modal" style={{ padding: '32px' }}>
          
          {step === 'cart' ? (
            <div className="modal-body">
              <div className="modal-name">Your Cart</div>
              <div className="modal-sub">Review your items before ordering</div>
              
              <div style={{ marginTop: '24px', marginBottom: '24px', maxHeight: '50vh', overflowY: 'auto', paddingRight: '8px' }}>
                {cart.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>Your cart is empty.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {cart.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={item.img} alt={item.name} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }} />
                          <div>
                            <strong style={{ display: 'block', color: 'var(--dark)' }}>{item.name}</strong>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                              <button onClick={() => updateQty(item.id, -1)} style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--border)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                              <span style={{ fontSize: '0.95rem', fontWeight: '600' }}>{item.qty}</span>
                              <button onClick={() => updateQty(item.id, 1)} style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--brown)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <strong style={{ display: 'block', color: 'var(--brown)', fontSize: '1.1rem' }}>₹ {item.price * item.qty}</strong>
                          <button 
                            onClick={() => remove(item.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--dark)', fontSize: '0.8rem', cursor: 'pointer', marginTop: '4px', textDecoration: 'underline', fontWeight: '600' }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {cart.length > 0 && (
                <>
                  <div style={{ borderTop: '2px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Total</span>
                    <span style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--brown)' }}>₹ {total}</span>
                  </div>
                  <div className="modal-footer" style={{ borderTop: 'none', paddingTop: '24px', display: 'flex', gap: '16px' }}>
                    <button className="btn-outline" onClick={close} style={{ flex: 1, padding: '14px' }}>Continue Browsing</button>
                    <button className="btn-primary" onClick={handleProceed} style={{ flex: 1.5, padding: '14px' }}>
                      Proceed to Pay
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="modal-body payment-step">
              <div className="modal-name">Payment Options</div>
              <div className="modal-sub">Choose how you'd like to pay ₹{total}</div>
              
              <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ border: `2px solid ${paymentMethod === 'upi' ? 'var(--brown)' : 'var(--border)'}`, borderRadius: '12px', background: paymentMethod === 'upi' ? 'rgba(200, 115, 42, 0.05)' : 'transparent', transition: 'all 0.3s ease', overflow: 'hidden' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', cursor: 'pointer' }}>
                    <input type="radio" name="payment" value="upi" checked={paymentMethod === 'upi'} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: '20px', height: '20px', accentColor: 'var(--brown)' }} />
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: 'block', fontSize: '1.1rem' }}>UPI (GPay, Paytm, PhonePe)</strong>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Scan QR or pay via UPI ID</span>
                    </div>
                  </label>
                  {paymentMethod === 'upi' && (
                    <div style={{ padding: '0 16px 16px 52px', display: 'flex', gap: '16px', alignItems: 'center', animation: 'fadeUp 0.3s ease forwards' }}>
                      <div style={{ background: 'white', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=upi://pay?pa=cafe1cr@ybl&pn=Cafe1Cr&am=${total}&cu=INR`} alt="UPI QR Code" style={{ width: '100px', height: '100px', display: 'block' }} />
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--dark)' }}>
                        <strong>Scan to pay exactly ₹{total}</strong>
                        <p style={{ margin: '4px 0 12px', color: 'var(--text-muted)' }}>Scan with any UPI app on another phone, or pay directly below.</p>
                        <a href={`upi://pay?pa=cafe1cr@ybl&pn=Cafe1Cr&am=${total}&cu=INR`} style={{ display: 'inline-block', background: 'var(--brown)', color: 'white', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.85rem' }}>
                          Open UPI App
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                
                <div style={{ border: `2px solid ${paymentMethod === 'card' ? 'var(--brown)' : 'var(--border)'}`, borderRadius: '12px', background: paymentMethod === 'card' ? 'rgba(200, 115, 42, 0.05)' : 'transparent', transition: 'all 0.3s ease', overflow: 'hidden' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', cursor: 'pointer' }}>
                    <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: '20px', height: '20px', accentColor: 'var(--brown)' }} />
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: 'block', fontSize: '1.1rem' }}>Credit / Debit Card</strong>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Visa, Mastercard, RuPay</span>
                    </div>
                  </label>
                  {paymentMethod === 'card' && (
                    <div style={{ padding: '0 16px 16px 52px', animation: 'fadeUp 0.3s ease forwards' }}>
                      <div style={{ display: 'grid', gap: '12px' }}>
                        <input type="text" placeholder="Card Number" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <input type="text" placeholder="MM/YY" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem' }} />
                          <input type="text" placeholder="CVV" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', border: `2px solid ${paymentMethod === 'cash' ? 'var(--brown)' : 'var(--border)'}`, borderRadius: '12px', cursor: 'pointer', background: paymentMethod === 'cash' ? 'rgba(200, 115, 42, 0.05)' : 'transparent', transition: 'all 0.3s ease' }}>
                  <input type="radio" name="payment" value="cash" checked={paymentMethod === 'cash'} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: '20px', height: '20px', accentColor: 'var(--brown)' }} />
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', fontSize: '1.1rem' }}>Pay at Counter</strong>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pay cash when you pick up your order</span>
                  </div>
                </label>
              </div>
              
              <div className="modal-footer" style={{ borderTop: 'none', paddingTop: '32px', display: 'flex', gap: '16px' }}>
                <button className="btn-outline" onClick={() => setStep('cart')} disabled={isProcessing} style={{ flex: 1, padding: '14px' }}>Back to Cart</button>
                <button className="btn-primary" onClick={handlePayment} disabled={isProcessing} style={{ flex: 1.5, padding: '14px', position: 'relative' }}>
                  {isProcessing ? 'Processing...' : `Pay ₹${total} & Order`}
                </button>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
