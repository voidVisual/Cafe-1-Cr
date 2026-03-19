from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import razorpay
import hmac
import hashlib

app = FastAPI(title="Cafe 1 Cr API")

# Setup dummy Razorpay client (Replace with actual keys for production)
RAZORPAY_KEY_ID = "rzp_test_placeholderKey"
RAZORPAY_KEY_SECRET = "placeholderSecretKeyDoNotUse"
rzp_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Hardcoded menu items initialized for now
menu_data = [
  {"id":1,"name":"Cappuccino","sub":"with Chocolate","category":"cappuccino","price":320,"rating":4.8,"reviews":230,"img":"https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80","desc":"A classic cappuccino made with 25ml of rich espresso and 85ml of perfectly steamed milk, topped with chocolate shavings."},
  {"id":2,"name":"Café Latte","sub":"with Oat Milk","category":"latte","price":310,"rating":4.9,"reviews":187,"img":"https://images.unsplash.com/photo-1485808191679-5f86510bd9d4?w=600&q=80","desc":"A smooth, creamy latte made with oat milk for a naturally sweet finish. Perfect for your morning."},
  {"id":3,"name":"Machiato","sub":"Caramel Drizzle","category":"machiato","price":360,"rating":4.7,"reviews":145,"img":"https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80","desc":"Espresso marked with a dollop of foam, drizzled with house-made caramel. Bold yet sweet."},
  {"id":4,"name":"Cold Brew","sub":"Double Strength","category":"cold","price":400,"rating":4.9,"reviews":312,"img":"https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80","desc":"Steeped for 18 hours in cold water for an incredibly smooth, low-acid coffee. Served over ice."},
  {"id":5,"name":"Americano","sub":"Classic Black","category":"cappuccino","price":240,"rating":4.6,"reviews":98,"img":"https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=600&q=80","desc":"A long espresso with hot water for a clean, bold black coffee. The purist's choice."},
  {"id":6,"name":"Mocha Latte","sub":"Dark Chocolate","category":"latte","price":380,"rating":4.8,"reviews":201,"img":"https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=600&q=80","desc":"Espresso blended with rich dark chocolate and steamed milk. A dessert in a cup."},
  {"id":7,"name":"Cold Latte","sub":"Vanilla Bean","category":"cold","price":360,"rating":4.7,"reviews":156,"img":"https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&q=80","desc":"Chilled espresso over ice with vanilla-infused cold milk. Sweet, simple, and satisfying."},
  {"id":8,"name":"Almond Croissant","sub":"Fresh Baked","category":"snack","price":200,"rating":4.8,"reviews":88,"img":"https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80","desc":"Flaky, buttery croissant filled with almond cream and topped with toasted flaked almonds. Baked fresh daily."}
]

class OrderItem(BaseModel):
    id: int
    qty: int
    name: str
    price: float

class OrderRequest(BaseModel):
    items: List[OrderItem]
    total: float
    address: str
    phone: str

class PaymentVerifyRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str
    orderData: OrderRequest

@app.get("/api/menu")
def get_menu():
    return menu_data

@app.post("/api/payment/create")
def create_payment(order: OrderRequest):
    # Calculate amount in paise (1 INR = 100 paise)
    amount_paise = int(order.total * 100)
    
    try:
        # Create a Razorpay Order
        rzp_order = rzp_client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "receipt": "receipt_1",
            "payment_capture": "1" # Auto capture
        })
        return {"order_id": rzp_order["id"], "amount": amount_paise}
    except Exception as e:
        print("Razorpay Error:", e)
        # Fallback to dummy ID when placeholder keys are rejected by Razorpay API
        return {"order_id": "order_dummy12345", "amount": amount_paise}

@app.post("/api/payment/verify")
def verify_payment(data: PaymentVerifyRequest):
    try:
        # Verify the signature
        rzp_client.utility.verify_payment_signature({
            'razorpay_order_id': data.razorpay_order_id,
            'razorpay_payment_id': data.razorpay_payment_id,
            'razorpay_signature': data.razorpay_signature
        })
        
        # If no exception was raised by verify_payment_signature, payment is authentic
        print(f"Verified payment for {data.orderData.phone}. ID: {data.razorpay_payment_id}")
        return {"success": True, "message": "Payment verified and order placed", "order_id": data.razorpay_order_id}
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid payment signature")
    except Exception as e:
        # For our mock testing with dummy keys
        if data.razorpay_order_id.startswith("order_dummy"):
            return {"success": True, "message": "[MOCK] Payment verified and order placed", "order_id": data.razorpay_order_id}
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/order")
def place_order(order: OrderRequest):
    # Backward compatibility / Pay at Counter route
    print(f"Received CA$H order: {order.total} from {order.phone} at {order.address}")
    return {"message": "Order placed successfully via Pay at Counter!", "order_id": "ORD-CASH-123"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
