from fastapi import FastAPI, HTTPException, Depends, Header # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore
from pydantic import BaseModel, field_validator # type: ignore
from typing import List, Optional, Union
import uuid
import os
import hashlib
import secrets
from datetime import datetime, timezone, timedelta
from pymongo import MongoClient # type: ignore
from bson import ObjectId # type: ignore

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
mongo_client = MongoClient(MONGODB_URI)
mongo_db = mongo_client.get_database("cafe_orders")
orders_collection = mongo_db.get_collection("orders")
orders_collection.create_index("customer_phone")
orders_collection.create_index("created_at")
orders_collection.create_index("order_display_id")

_ADMIN_INDEXES_READY = False


def _normalize_phone(phone: str) -> str:
    return "".join(ch for ch in (phone or "") if ch.isdigit())


def _get_customers_collection(orders):
    # Use the same DB as the injected orders collection (mongomock in tests, MongoDB in prod)
    try:
        return orders.database.get_collection("customers")
    except Exception:
        return mongo_db.get_collection("customers")


def upsert_customer(*, orders, phone: str, name: str = "", address: str = ""):
    customers = _get_customers_collection(orders)
    customers.create_index("phone")
    now = datetime.now(timezone.utc)
    phone_norm = _normalize_phone(phone)

    customers.update_one(
        {"phone": phone_norm},
        {
            "$set": {
                "phone": phone_norm,
                "name": name or "",
                "address": address or "",
                "updated_at": now,
            },
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )
    doc = customers.find_one({"phone": phone_norm}, {"_id": 1})
    return doc.get("_id") if doc else None


def _hash_admin_key(key: str) -> str:
    return hashlib.sha256((key or "").encode("utf-8")).hexdigest()


def _get_admins_collection(orders):
    try:
        return orders.database.get_collection("admins")
    except Exception:
        return mongo_db.get_collection("admins")


def _ensure_admin_indexes(admins):
    global _ADMIN_INDEXES_READY
    if _ADMIN_INDEXES_READY:
        return
    admins.create_index("key_hash", unique=True)
    admins.create_index("active")
    admins.create_index("created_at")
    _ADMIN_INDEXES_READY = True


def _seed_bootstrap_admin(*, admins):
    bootstrap_key = os.getenv("ADMIN_API_KEY")
    if not bootstrap_key:
        return
    now = datetime.now(timezone.utc)
    key_hash = _hash_admin_key(bootstrap_key)
    admins.update_one(
        {"key_hash": key_hash},
        {
            "$set": {
                "name": "bootstrap",
                "source": "env",
                "active": True,
                "updated_at": now,
            },
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )

def get_orders_collection():
    return orders_collection

app = FastAPI(title="Cafe 1 Cr API")


def require_admin(
    orders=Depends(get_orders_collection),
    x_admin_key: Optional[str] = Header(default=None, alias="X-Admin-Key"),
):
    admins = _get_admins_collection(orders)
    _ensure_admin_indexes(admins)
    _seed_bootstrap_admin(admins=admins)

    if not x_admin_key:
        raise HTTPException(status_code=403, detail="Unauthorized")

    key_hash = _hash_admin_key(x_admin_key)
    admin = admins.find_one({"key_hash": key_hash, "active": True})
    if not admin:
        # If no bootstrap key and no admin keys exist, return config error
        any_admin = admins.find_one({"active": True}, {"_id": 1})
        if not any_admin and not os.getenv("ADMIN_API_KEY"):
            raise HTTPException(status_code=503, detail="Admin key not configured")
        raise HTTPException(status_code=403, detail="Unauthorized")

    admins.update_one(
        {"_id": admin.get("_id")},
        {"$set": {"last_used_at": datetime.now(timezone.utc)}},
    )
    return True

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
    path = request.url.path
    
    # Don't cache admin endpoints or write operations
    if (
        "/admin/" in path
        or request.method in ["POST", "PUT", "PATCH", "DELETE"]
        or path.startswith("/api/orders/status/")
        or path.startswith("/api/orders/history/")
    ):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    elif path == "/api/menu":
        # Menu is safe to cache briefly
        response.headers["Cache-Control"] = "private, max-age=60, s-maxage=0, must-revalidate"
    else:
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    
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
    id: str
    qty: int
    name: str
    price: float

    @field_validator("id", mode="before")
    @classmethod
    def coerce_id_to_str(cls, v):
        return str(v)

class OrderRequest(BaseModel):
    items: List[OrderItem]
    total: float
    address: str
    phone: str
    customer_name: Optional[str] = None

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
        customer_id = upsert_customer(
            orders=orders,
            phone=data.orderData.phone,
            name=getattr(data.orderData, "customer_name", "") or "",
            address=data.orderData.address,
        )
        new_order = {
            "payment_method": "ONLINE",
            "razorpay_order_id": data.order_id,
            "customer_id": customer_id,
            "customer_phone": _normalize_phone(data.orderData.phone),
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

        order_display_id = "ORD-" + db_order_id[-6:].upper()
        orders.update_one({"_id": result.inserted_id}, {"$set": {"order_display_id": order_display_id}})

        print(f"Verified payment for {data.orderData.phone}. Saved Order #{db_order_id}")
        return {
            "success": True,
            "message": "Payment verified and order placed",
            "order_id": data.order_id,
            "db_order_id": db_order_id,
            "order_display_id": order_display_id,
        }
    except Exception as e:
        # For our mock testing with dummy keys
        if data.order_id.startswith("order_"):
            # Mock save
            customer_id = upsert_customer(
                orders=orders,
                phone=data.orderData.phone,
                name=getattr(data.orderData, "customer_name", "") or "",
                address=data.orderData.address,
            )
            new_order = {
                "payment_method": "ONLINE_MOCK",
                "razorpay_order_id": data.order_id,
                "customer_id": customer_id,
                "customer_phone": _normalize_phone(data.orderData.phone),
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

            order_display_id = "ORD-" + db_order_id[-6:].upper()
            orders.update_one({"_id": result.inserted_id}, {"$set": {"order_display_id": order_display_id}})

            return {
                "success": True,
                "message": "[MOCK] Payment verified and order placed",
                "order_id": data.order_id,
                "db_order_id": db_order_id,
                "order_display_id": order_display_id,
            }
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/order")
def place_order(order: OrderRequest, orders=Depends(get_orders_collection)):
    # Cash on delivery / Pay at counter
    customer_id = upsert_customer(
        orders=orders,
        phone=order.phone,
        name=order.customer_name or "",
        address=order.address,
    )
    new_order = {
        "payment_method": "CASH",
        "customer_name": order.customer_name or "",
        "customer_id": customer_id,
        "customer_phone": _normalize_phone(order.phone),
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

    order_display_id = "ORD-" + db_order_id[-6:].upper()
    orders.update_one({"_id": result.inserted_id}, {"$set": {"order_display_id": order_display_id}})

    print(f"Received CA$H order: {order.total} from {order.phone} at {order.address}. Saved Order #{db_order_id}")
    return {
        "message": "Order placed successfully via Pay at Counter!",
        "db_order_id": db_order_id,
        "order_display_id": order_display_id,
        # Back-compat for older frontend flows that used order_id
        "order_id": f"ORD-CASH-{db_order_id}",
    }

@app.get("/api/orders/history/{phone}")
def get_order_history(phone: str, orders=Depends(get_orders_collection)):
    cursor = orders.find({"customer_phone": _normalize_phone(phone)}).sort("created_at", -1)
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
def get_today_revenue(orders=Depends(get_orders_collection), _=Depends(require_admin)):
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


@app.get("/api/admin/keys")
def list_admin_keys(orders=Depends(get_orders_collection), _=Depends(require_admin)):
    admins = _get_admins_collection(orders)
    _ensure_admin_indexes(admins)
    cursor = admins.find({}, {"key_hash": 0}).sort("created_at", -1)
    result = []
    for a in cursor:
        result.append(
            {
                "id": str(a.get("_id")),
                "name": a.get("name", ""),
                "source": a.get("source", "generated"),
                "active": bool(a.get("active", True)),
                "created_at": a.get("created_at").isoformat() if a.get("created_at") else None,
                "updated_at": a.get("updated_at").isoformat() if a.get("updated_at") else None,
                "last_used_at": a.get("last_used_at").isoformat() if a.get("last_used_at") else None,
                "revoked_at": a.get("revoked_at").isoformat() if a.get("revoked_at") else None,
            }
        )
    return {"keys": result}

# ── Real-time order status (polled by LiveTracking every 500ms) ──────────────
@app.get("/api/orders/status/{order_id}")
def get_order_status(order_id: str, orders=Depends(get_orders_collection)):
    order = None
    try:
        order = orders.find_one({"_id": ObjectId(order_id)})
    except Exception:
        # Allow lookup by human-friendly display id (e.g. ORD-123ABC)
        if order_id.upper().startswith("ORD-"):
            order = orders.find_one({"order_display_id": order_id})
        else:
            raise HTTPException(status_code=400, detail="Invalid order ID")
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    status = order.get("status", "Received")
    approved_at_raw = order.get("approved_at")
    prep_time_minutes = order.get("prep_time_minutes", 10)

    approved_at: Optional[datetime] = None
    if isinstance(approved_at_raw, datetime):
        approved_at = approved_at_raw
    elif isinstance(approved_at_raw, str) and approved_at_raw:
        try:
            approved_at = datetime.fromisoformat(approved_at_raw.replace("Z", "+00:00"))
        except Exception:
            approved_at = None

    # MongoDB/PyMongo often returns naive UTC datetimes; normalize to UTC-aware
    if approved_at is not None and approved_at.tzinfo is None:
        approved_at = approved_at.replace(tzinfo=timezone.utc)

    # Compute remaining prep seconds server-side for initial sync
    prep_seconds_left = None
    if approved_at and status not in ["Completed", "Declined"]:
        elapsed = (datetime.now(timezone.utc) - approved_at).total_seconds()
        prep_seconds_left = max(0, int(prep_time_minutes * 60 - elapsed))

    return {
        "id": str(order.get("_id")) if order.get("_id") else order_id,
        "order_id": order_id,
        "order_display_id": order.get("order_display_id"),
        "status": status,
        "approved_at": approved_at.isoformat() if approved_at else None,
        "prep_time_minutes": prep_time_minutes,
        "prep_seconds_left": prep_seconds_left,
        "items": [
            {"name": i.get("name"), "qty": i.get("qty"), "price": i.get("price")}
            for i in order.get("items", [])
        ],
    }


class StatusUpdate(BaseModel):
    status: str
    prep_time_minutes: Optional[int] = 10


class AdminKeyCreateRequest(BaseModel):
    name: str


@app.post("/api/admin/keys")
def create_admin_key(
    body: AdminKeyCreateRequest,
    orders=Depends(get_orders_collection),
    _=Depends(require_admin),
):
    name = (body.name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")

    admins = _get_admins_collection(orders)
    _ensure_admin_indexes(admins)

    # Return the raw key once; only the hash is stored
    raw_key = secrets.token_urlsafe(32)
    key_hash = _hash_admin_key(raw_key)
    now = datetime.now(timezone.utc)

    try:
        result = admins.insert_one(
            {
                "name": name,
                "source": "generated",
                "key_hash": key_hash,
                "active": True,
                "created_at": now,
                "updated_at": now,
            }
        )
    except Exception:
        # Extremely unlikely collision; retry once
        raw_key = secrets.token_urlsafe(32)
        key_hash = _hash_admin_key(raw_key)
        result = admins.insert_one(
            {
                "name": name,
                "source": "generated",
                "key_hash": key_hash,
                "active": True,
                "created_at": now,
                "updated_at": now,
            }
        )

    return {"id": str(result.inserted_id), "name": name, "key": raw_key}


@app.delete("/api/admin/keys/{key_id}")
def revoke_admin_key(key_id: str, orders=Depends(get_orders_collection), _=Depends(require_admin)):
    try:
        oid = ObjectId(key_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid key id")

    admins = _get_admins_collection(orders)
    _ensure_admin_indexes(admins)
    doc = admins.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Key not found")
    if doc.get("source") == "env":
        raise HTTPException(status_code=400, detail="Cannot revoke bootstrap env key; remove ADMIN_API_KEY")

    now = datetime.now(timezone.utc)
    admins.update_one(
        {"_id": oid},
        {"$set": {"active": False, "revoked_at": now, "updated_at": now}},
    )
    return {"success": True}


# ── Admin: update order status ────────────────────────────────────────────────
@app.put("/api/admin/orders/{order_id}/status")
def update_order_status(
    order_id: str,
    update: StatusUpdate,
    orders=Depends(get_orders_collection),
    _=Depends(require_admin),
):
    try:
        oid = ObjectId(order_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid order ID")

    allowed_statuses = {"Received", "Approved", "Preparing", "Completed", "Declined"}
    if update.status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")

    changes: dict = {"status": update.status}
    if update.status == "Approved":
        changes["approved_at"] = datetime.now(timezone.utc)
        changes["prep_time_minutes"] = update.prep_time_minutes

    result = orders.update_one({"_id": oid}, {"$set": changes})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")

    # Fetch updated order to return full details
    updated_order = orders.find_one({"_id": oid})
    order_data = {
        "id": str(updated_order.get("_id")),
        "order_display_id": updated_order.get("order_display_id") or ("ORD-" + str(updated_order["_id"])[-6:].upper()),
        "total_amount": updated_order.get("total_amount"),
        "status": updated_order.get("status"),
        "payment_method": updated_order.get("payment_method"),
        "customer_name": updated_order.get("customer_name", ""),
        "customer_phone": updated_order.get("customer_phone", ""),
        "customer_address": updated_order.get("customer_address", ""),
        "created_at": updated_order.get("created_at").isoformat() if updated_order.get("created_at") else None,
        "approved_at": updated_order.get("approved_at").isoformat() if updated_order.get("approved_at") else None,
        "prep_time_minutes": updated_order.get("prep_time_minutes"),
        "items": [
            {"name": i.get("name"), "qty": i.get("qty"), "price": i.get("price")}
            for i in updated_order.get("items", [])
        ],
    }

    print(f"[Admin] Order {order_id} → {update.status}")
    return {"success": True, "order": order_data}


# ── Admin: get all orders ─────────────────────────────────────────────────────
@app.get("/api/admin/orders")
def get_all_orders(orders=Depends(get_orders_collection), _=Depends(require_admin)):
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
