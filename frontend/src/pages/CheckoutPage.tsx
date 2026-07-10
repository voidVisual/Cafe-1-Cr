import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';

export default function CheckoutPage() {
  const { items, updateQty, removeItem, clearCart, totalPrice } = useCartStore();
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const navigate = useNavigate();

  const handleCheckout = () => {
    setIsOrdering(true);
    // Simulate API call
    setTimeout(() => {
      setIsOrdering(false);
      setOrderComplete(true);
      clearCart();
    }, 2000);
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-coffee-50 pt-32 pb-20 flex items-center justify-center">
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-coffee-100 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="font-serif text-3xl font-bold text-coffee-900 mb-4">Order Received!</h2>
          <p className="text-coffee-600 mb-8">
            Thank you for your order. We are preparing it fresh and will have it ready for you shortly.
          </p>
          <Button variant="premium" className="w-full" asChild>
            <Link to="/">Return Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-coffee-50 pt-32 pb-20 flex flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="font-serif text-3xl font-bold text-coffee-900 mb-4">Your cart is empty</h2>
          <p className="text-coffee-600 mb-8">Looks like you haven't added anything to your cart yet.</p>
          <Button variant="premium" asChild>
            <Link to="/menu">Explore Menu</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-coffee-50 pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        <div className="mb-8">
          <Button variant="ghost" className="text-coffee-600 hover:text-coffee-900 -ml-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
        </div>

        <h1 className="font-serif text-4xl font-bold text-coffee-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-coffee-100">
              <h2 className="text-xl font-bold text-coffee-900 mb-6 border-b border-coffee-100 pb-4">Order Summary</h2>
              
              <div className="space-y-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-20 h-20 rounded-xl object-cover border border-coffee-100"
                    />
                    <div className="flex-grow">
                      <h3 className="font-bold text-coffee-900">{item.name}</h3>
                      <p className="text-coffee-500 text-sm">{item.category}</p>
                      <div className="text-coffee-900 font-medium mt-1">${item.price.toFixed(2)}</div>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-coffee-50 rounded-full px-2 py-1 border border-coffee-100">
                      <button 
                        className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-coffee-700 hover:bg-coffee-200 shadow-sm"
                        onClick={() => updateQty(item.id, -1)}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-4 text-center font-medium text-sm">{item.qty}</span>
                      <button 
                        className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-coffee-700 hover:bg-coffee-200 shadow-sm"
                        onClick={() => updateQty(item.id, 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    
                    <button 
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors ml-2"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Checkout Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-coffee-100 sticky top-28">
              <h2 className="text-xl font-bold text-coffee-900 mb-6 border-b border-coffee-100 pb-4">Payment</h2>
              
              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between text-coffee-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-coffee-900">${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-coffee-600">
                  <span>Taxes (5%)</span>
                  <span className="font-medium text-coffee-900">${(totalPrice * 0.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-coffee-600">
                  <span>Delivery Fee</span>
                  <span className="font-medium text-coffee-900">$2.99</span>
                </div>
              </div>
              
              <div className="border-t border-coffee-100 pt-4 mb-8">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg text-coffee-900">Total</span>
                  <span className="font-bold text-2xl text-coffee-900">${(totalPrice * 1.05 + 2.99).toFixed(2)}</span>
                </div>
              </div>

              <Button 
                variant="premium" 
                size="lg" 
                className="w-full relative overflow-hidden group"
                onClick={handleCheckout}
                disabled={isOrdering}
              >
                {isOrdering ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </span>
                ) : (
                  <span>Place Order</span>
                )}
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              </Button>
              <p className="text-center text-xs text-coffee-500 mt-4">
                Payments are securely processed. We don't store your credit card information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
