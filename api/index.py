from fastapi import FastAPI, HTTPException, Depends # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore
from pydantic import BaseModel # type: ignore
from typing import List, Optional
import uuid
import os
from datetime import datetime, timezone, timedelta
from pymongo import MongoClient # type: ignore
from bson import ObjectId # type: ignore

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
mongo_client = MongoClient(MONGODB_URI)
mongo_db = mongo_client.get_database("cafe_orders")
orders_collection = mongo_db.get_collection("orders")
orders_collection.create_index("customer_phone")
orders_collection.create_index("created_at")

def get_orders_collection():
    return orders_collection

app = FastAPI(title="Cafe 1 Cr API")

# Setup dummy Cashfree client (Replace with actual setup via cashfree_pg for production)
CASHFREE_APP_ID = "test_placeholderAppId"
CASHFREE_SECRET = "test_placeholderSecret"

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_cache_headers(request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "private, max-age=60, s-maxage=0, must-revalidate"
    return response

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
    order_id: str
    orderData: OrderRequest

@app.get("/api/menu")
def get_menu():
    return menu_data

@app.post("/api/payment/create")
def create_payment(order: OrderRequest):
    # Using Cashfree API
    amount = order.total
    
    try:
        # In production, use cashfree_pg.models.create_order_request to create order
        # For our mock testing with dummy keys:
        dummy_order_id = "order_" + str(uuid.uuid4())[:10] # type: ignore
        dummy_session_id = "session_" + str(uuid.uuid4())
        return {"order_id": dummy_order_id, "payment_session_id": dummy_session_id, "amount": amount}
    except Exception as e:
        print("Cashfree Error:", e)
        return {"order_id": "order_dummy12345", "amount": amount}

@app.post("/api/payment/verify")
def verify_payment(data: PaymentVerifyRequest, orders=Depends(get_orders_collection)):
    try:
        # In production, use Cashfree.PGOrderFetchPayments to verify order status
        # Save order to database
        new_order = {
            "payment_method": "ONLINE",
            "razorpay_order_id": data.order_id,
            "customer_phone": data.orderData.phone,
            "customer_address": data.orderData.address,
            "total_amount": data.orderData.total,
            "status": "Received",
            "created_at": datetime.now(timezone.utc),
            "items": [
                {
                    "item_id": item.id,
                    "name": item.name,
                    "qty": item.qty,
                    "price": item.price,
                }
                for item in data.orderData.items
            ],
        }
        result = orders.insert_one(new_order)
        db_order_id = str(result.inserted_id)

        print(f"Verified payment for {data.orderData.phone}. Saved Order #{db_order_id}")
        return {"success": True, "message": "Payment verified and order placed", "order_id": data.order_id, "db_order_id": db_order_id}
    except Exception as e:
        # For our mock testing with dummy keys
        if data.order_id.startswith("order_"):
            # Mock save
            new_order = {
                "payment_method": "ONLINE_MOCK",
                "razorpay_order_id": data.order_id,
                "customer_phone": data.orderData.phone,
                "customer_address": data.orderData.address,
                "total_amount": data.orderData.total,
                "status": "Received",
                "created_at": datetime.now(timezone.utc),
                "items": [
                    {
                        "item_id": item.id,
                        "name": item.name,
                        "qty": item.qty,
                        "price": item.price,
                    }
                    for item in data.orderData.items
                ],
            }
            result = orders.insert_one(new_order)
            db_order_id = str(result.inserted_id)
            return {"success": True, "message": "[MOCK] Payment verified and order placed", "order_id": data.order_id, "db_order_id": db_order_id}
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/order")
def place_order(order: OrderRequest, orders=Depends(get_orders_collection)):
    # Cash on delivery / Pay at counter
    new_order = {
        "payment_method": "CASH",
        "customer_phone": order.phone,
        "customer_address": order.address,
        "total_amount": order.total,
        "status": "Received",
        "created_at": datetime.now(timezone.utc),
        "items": [
            {
                "item_id": item.id,
                "name": item.name,
                "qty": item.qty,
                "price": item.price,
            }
            for item in order.items
        ],
    }
    result = orders.insert_one(new_order)
    db_order_id = str(result.inserted_id)

    print(f"Received CA$H order: {order.total} from {order.phone} at {order.address}. Saved Order #{db_order_id}")
    return {"message": "Order placed successfully via Pay at Counter!", "order_id": f"ORD-CASH-{db_order_id}", "db_order_id": db_order_id}

@app.get("/api/orders/history/{phone}")
def get_order_history(phone: str, orders=Depends(get_orders_collection)):
    cursor = orders.find({"customer_phone": phone}).sort("created_at", -1)
    result = []
    for o in cursor:
        result.append({
            "id": str(o.get("_id")),
            "total_amount": o.get("total_amount"),
            "status": o.get("status"),
            "payment_method": o.get("payment_method"),
            "created_at": o.get("created_at").isoformat() if o.get("created_at") else None,
            "items": [
                {"name": i.get("name"), "qty": i.get("qty"), "price": i.get("price")}
                for i in o.get("items", [])
            ],
        })
    return {"history": result}

@app.get("/api/admin/revenue/today")
def get_today_revenue(orders=Depends(get_orders_collection)):
    now = datetime.now(timezone.utc)
    start_of_day = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    end_of_day = start_of_day + timedelta(days=1)
    today_orders = list(
        orders.find({"created_at": {"$gte": start_of_day, "$lt": end_of_day}})
    )
    total_rev = sum(o.get("total_amount", 0) for o in today_orders)
    return {
        "date": start_of_day.date().isoformat(),
        "total_revenue": total_rev,
        "order_count": len(today_orders)
    }

# ── Real-time order status (polled by LiveTracking every 500ms) ──────────────
@app.get("/api/orders/status/{order_id}")
def get_order_status(order_id: str, orders=Depends(get_orders_collection)):
    try:
        order = orders.find_one({"_id": ObjectId(order_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid order ID")
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    status = order.get("status", "Received")
    approved_at = order.get("approved_at")
    prep_time_minutes = order.get("prep_time_minutes", 10)

    # Compute remaining prep seconds server-side for initial sync
    prep_seconds_left = None
    if approved_at and status not in ["Completed", "Declined"]:
        elapsed = (datetime.now(timezone.utc) - approved_at).total_seconds()
        prep_seconds_left = max(0, int(prep_time_minutes * 60 - elapsed))

    return {
        "order_id": order_id,
        "status": status,
        "approved_at": approved_at.isoformat() if approved_at else None,
        "prep_time_minutes": prep_time_minutes,
        "prep_seconds_left": prep_seconds_left,
    }


class StatusUpdate(BaseModel):
    status: str
    prep_time_minutes: Optional[int] = 10


# ── Admin: update order status ────────────────────────────────────────────────
@app.patch("/api/orders/{order_id}/status")
def update_order_status(
    order_id: str,
    update: StatusUpdate,
    orders=Depends(get_orders_collection)
):
    try:
        oid = ObjectId(order_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid order ID")

    changes: dict = {"status": update.status}
    if update.status == "Approved":
        changes["approved_at"] = datetime.now(timezone.utc)
        changes["prep_time_minutes"] = update.prep_time_minutes

    result = orders.update_one({"_id": oid}, {"$set": changes})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")

    print(f"[Admin] Order {order_id} → {update.status}")
    return {"success": True, "order_id": order_id, "status": update.status}


# ── Admin: get all orders ─────────────────────────────────────────────────────
@app.get("/api/admin/orders")
def get_all_orders(orders=Depends(get_orders_collection)):
    cursor = orders.find().sort("created_at", -1).limit(200)
    result = []
    for o in cursor:
        result.append({
            "id": str(o.get("_id")),
            "order_display_id": o.get("order_display_id") or ("ORD-" + str(o["_id"])[-6:].upper()),
            "total_amount": o.get("total_amount"),
            "status": o.get("status"),
            "payment_method": o.get("payment_method"),
            "customer_name": o.get("customer_name", ""),
            "customer_phone": o.get("customer_phone", ""),
            "customer_address": o.get("customer_address", ""),
            "created_at": o.get("created_at").isoformat() if o.get("created_at") else None,
            "items": [
                {"name": i.get("name"), "qty": i.get("qty"), "price": i.get("price")}
                for i in o.get("items", [])
            ],
        })
    return {"orders": result}


if __name__ == "__main__":
    import uvicorn # type: ignore
    uvicorn.run(app, host="0.0.0.0", port=8000)
