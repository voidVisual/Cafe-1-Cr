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
menu_collection = mongo_db.get_collection("menu")


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
  {
    "id": 1,
    "name": "Thick Cold Coffee (Offer)",
    "sub": "",
    "category": "cold",
    "price": 20.0,
    "rating": 4.8,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "12 Months Special Offer"
  },
  {
    "id": 2,
    "name": "Thick Coffee with Crush",
    "sub": "",
    "category": "cold",
    "price": 35.0,
    "rating": 4.5,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Refreshing blend"
  },
  {
    "id": 3,
    "name": "Plane / Thick Cold Coffee",
    "sub": "",
    "category": "cold",
    "price": 40.0,
    "rating": 4.6,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Simple and thick"
  },
  {
    "id": 4,
    "name": "Thick Coffee with Icecream",
    "sub": "",
    "category": "cold",
    "price": 50.0,
    "rating": 4.9,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Rich icecream topping"
  },
  {
    "id": 5,
    "name": "Caramel Thick Coffee / Crush",
    "sub": "",
    "category": "cold",
    "price": 70.0,
    "rating": 4.7,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Sweet caramel flavor"
  },
  {
    "id": 6,
    "name": "French Vanilla Thick Coffee",
    "sub": "",
    "category": "cold",
    "price": 80.0,
    "rating": 4.8,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Smooth vanilla taste"
  },
  {
    "id": 7,
    "name": "Black Coffee",
    "sub": "",
    "category": "hot",
    "price": 20.0,
    "rating": 4.5,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Strong and bold"
  },
  {
    "id": 8,
    "name": "Hot Coffee",
    "sub": "",
    "category": "hot",
    "price": 30.0,
    "rating": 4.7,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Classic hot brew"
  },
  {
    "id": 9,
    "name": "Hot Chocolate",
    "sub": "",
    "category": "hot",
    "price": 50.0,
    "rating": 4.9,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Rich cocoa goodness"
  },
  {
    "id": 10,
    "name": "Lemone Ice Tea (Jumbo)",
    "sub": "",
    "category": "hot",
    "price": 60.0,
    "rating": 4.6,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Zesty and cool"
  },
  {
    "id": 11,
    "name": "Peach Ice Tea (Jumbo)",
    "sub": "",
    "category": "hot",
    "price": 60.0,
    "rating": 4.8,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Sweet peach infusion"
  },
  {
    "id": 12,
    "name": "Strawberry Shake",
    "sub": "",
    "category": "shakes",
    "price": 50.0,
    "rating": 4.5,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Fruity delight"
  },
  {
    "id": 13,
    "name": "Chocolate Shake",
    "sub": "",
    "category": "shakes",
    "price": 50.0,
    "rating": 4.8,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Chocolate heaven"
  },
  {
    "id": 14,
    "name": "Vanilla Shake",
    "sub": "",
    "category": "shakes",
    "price": 60.0,
    "rating": 4.4,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Classic vanilla"
  },
  {
    "id": 15,
    "name": "Oreo Shake",
    "sub": "",
    "category": "shakes",
    "price": 70.0,
    "rating": 4.9,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Loaded with oreos"
  },
  {
    "id": 16,
    "name": "Kit-Kat Shake",
    "sub": "",
    "category": "shakes",
    "price": 80.0,
    "rating": 4.8,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Crunchy kit-kat blend"
  },
  {
    "id": 17,
    "name": "Salted Fries",
    "sub": "",
    "category": "fries",
    "price": 70.0,
    "rating": 4.6,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Crispy and salted"
  },
  {
    "id": 18,
    "name": "Masala Fries",
    "sub": "",
    "category": "fries",
    "price": 90.0,
    "rating": 4.7,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Spicy Indian twist"
  },
  {
    "id": 19,
    "name": "BBQ Fries",
    "sub": "",
    "category": "fries",
    "price": 80.0,
    "rating": 4.5,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Smoky BBQ flavor"
  },
  {
    "id": 20,
    "name": "Peri Peri Fries / Cheese",
    "sub": "",
    "category": "fries",
    "price": 110.0,
    "rating": 4.8,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Spicy peri peri"
  },
  {
    "id": 21,
    "name": "Cheese Fries",
    "sub": "",
    "category": "fries",
    "price": 100.0,
    "rating": 4.9,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Loaded with cheese"
  },
  {
    "id": 22,
    "name": "Melted Cheese Fries",
    "sub": "",
    "category": "fries",
    "price": 140.0,
    "rating": 4.8,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Extra gooey cheese"
  },
  {
    "id": 23,
    "name": "Tandoori Melted Cheese",
    "sub": "",
    "category": "fries",
    "price": 150.0,
    "rating": 4.7,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Tandoori spice twist"
  },
  {
    "id": 24,
    "name": "White Sauce Macaroni",
    "sub": "",
    "category": "pasta",
    "price": 130.0,
    "rating": 4.8,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Creamy and cheesy"
  },
  {
    "id": 25,
    "name": "Masala Pasta",
    "sub": "",
    "category": "pasta",
    "price": 140.0,
    "rating": 4.6,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Indian style pasta"
  },
  {
    "id": 26,
    "name": "Red Paprika Pasta",
    "sub": "",
    "category": "pasta",
    "price": 150.0,
    "rating": 4.7,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Spicy red sauce"
  },
  {
    "id": 27,
    "name": "Plane Maggie",
    "sub": "",
    "category": "pasta",
    "price": 50.0,
    "rating": 4.5,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Classic instant noodles"
  },
  {
    "id": 28,
    "name": "Veg Maggie",
    "sub": "",
    "category": "pasta",
    "price": 60.0,
    "rating": 4.6,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "With fresh veggies"
  },
  {
    "id": 29,
    "name": "Masala Maggie",
    "sub": "",
    "category": "pasta",
    "price": 60.0,
    "rating": 4.8,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Extra spicy masala"
  },
  {
    "id": 30,
    "name": "Veg Masala Maggie",
    "sub": "",
    "category": "pasta",
    "price": 70.0,
    "rating": 4.7,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Veggies and spice"
  },
  {
    "id": 31,
    "name": "Hara Bhara Kabab",
    "sub": "",
    "category": "snack",
    "price": 70.0,
    "rating": 4.5,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Healthy green snack"
  },
  {
    "id": 32,
    "name": "Crispy Onion Rings",
    "sub": "",
    "category": "snack",
    "price": 80.0,
    "rating": 4.7,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Golden and crunchy"
  },
  {
    "id": 33,
    "name": "Cheese Potato Shots",
    "sub": "",
    "category": "snack",
    "price": 80.0,
    "rating": 4.8,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Cheesy potato bites"
  },
  {
    "id": 34,
    "name": "Chilli Garlic Shots",
    "sub": "",
    "category": "snack",
    "price": 99.0,
    "rating": 4.6,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Spicy garlic twist"
  },
  {
    "id": 35,
    "name": "Veg Fingers",
    "sub": "",
    "category": "snack",
    "price": 90.0,
    "rating": 4.4,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Crispy veggie sticks"
  },
  {
    "id": 36,
    "name": "Chicken Nuggets",
    "sub": "",
    "category": "snack",
    "price": 99.0,
    "rating": 4.8,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Classic chicken snack"
  },
  {
    "id": 37,
    "name": "Chicken Cheesy Popcorn",
    "sub": "",
    "category": "snack",
    "price": 120.0,
    "rating": 4.9,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Cheesy chicken bites"
  },
  {
    "id": 38,
    "name": "Chocolate - M",
    "sub": "",
    "category": "dessert",
    "price": 90.0,
    "rating": 4.6,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Medium chocolate cream"
  },
  {
    "id": 39,
    "name": "Chocolate - B",
    "sub": "",
    "category": "dessert",
    "price": 99.0,
    "rating": 4.8,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Big chocolate cream"
  },
  {
    "id": 40,
    "name": "Chilli Cheese Tost",
    "sub": "",
    "category": "snack",
    "price": 99.0,
    "rating": 4.7,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Spicy cheese toast"
  },
  {
    "id": 41,
    "name": "Corn Cheese Tost",
    "sub": "",
    "category": "sandwich",
    "price": 99.0,
    "rating": 4.8,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Sweet corn and cheese"
  },
  {
    "id": 42,
    "name": "Plane Veg Sandwich",
    "sub": "",
    "category": "sandwich",
    "price": 50.0,
    "rating": 4.4,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Non-grilled plain veg"
  },
  {
    "id": 43,
    "name": "Chocolat Sandwich",
    "sub": "",
    "category": "sandwich",
    "price": 50.0,
    "rating": 4.5,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Sweet chocolate spread"
  },
  {
    "id": 44,
    "name": "Veg Grilled / Cheese",
    "sub": "",
    "category": "snack",
    "price": 70.0,
    "rating": 4.8,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Grilled with cheese"
  },
  {
    "id": 45,
    "name": "Veg Cheese Corn",
    "sub": "",
    "category": "snack",
    "price": 80.0,
    "rating": 4.7,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Corn and cheese grilled"
  },
  {
    "id": 46,
    "name": "Tandoori Sandwich",
    "sub": "",
    "category": "sandwich",
    "price": 90.0,
    "rating": 4.8,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Spicy tandoori mix"
  },
  {
    "id": 47,
    "name": "Paneer Cheese Sandwich",
    "sub": "",
    "category": "sandwich",
    "price": 99.0,
    "rating": 4.9,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Soft paneer and cheese"
  },
  {
    "id": 48,
    "name": "BBQ Cheese Sandwich",
    "sub": "",
    "category": "sandwich",
    "price": 99.0,
    "rating": 4.6,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Smoky BBQ flavor"
  },
  {
    "id": 49,
    "name": "Club Grilled Sandwich",
    "sub": "",
    "category": "sandwich",
    "price": 149.0,
    "rating": 4.8,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Triple layer loaded"
  },
  {
    "id": 50,
    "name": "1CR Spl. Loded Sandwich",
    "sub": "",
    "category": "sandwich",
    "price": 179.0,
    "rating": 4.9,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "House special loaded"
  },
  {
    "id": 51,
    "name": "Margherita Cheese Pizza",
    "sub": "",
    "category": "pizza",
    "price": 99.0,
    "rating": 4.7,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Classic cheese pizza"
  },
  {
    "id": 52,
    "name": "Veg's Cheese Pizza",
    "sub": "",
    "category": "pizza",
    "price": 120.0,
    "rating": 4.6,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Fresh veggies and cheese"
  },
  {
    "id": 53,
    "name": "Chilli Cheese Pizza",
    "sub": "",
    "category": "pizza",
    "price": 130.0,
    "rating": 4.5,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Spicy chili touch"
  },
  {
    "id": 54,
    "name": "Veg's Corn Cheese Pizza",
    "sub": "",
    "category": "pizza",
    "price": 140.0,
    "rating": 4.8,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Sweet corn and cheese"
  },
  {
    "id": 55,
    "name": "Tandoori Veg Cheese Pizza",
    "sub": "",
    "category": "pizza",
    "price": 150.0,
    "rating": 4.9,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Tandoori flavored paneer"
  },
  {
    "id": 56,
    "name": "Veg's Paneer Cheese Pizza",
    "sub": "",
    "category": "pizza",
    "price": 160.0,
    "rating": 4.8,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Loaded with paneer chunks"
  },
  {
    "id": 57,
    "name": "Chicken Cheese Pizza",
    "sub": "",
    "category": "pizza",
    "price": 170.0,
    "rating": 4.9,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Grilled chicken toppings"
  },
  {
    "id": 58,
    "name": "Chilli Chicken Cheese Pizza",
    "sub": "",
    "category": "pizza",
    "price": 180.0,
    "rating": 4.7,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Spicy chicken slices"
  },
  {
    "id": 59,
    "name": "Tandoori Chicken Pizza",
    "sub": "",
    "category": "pizza",
    "price": 190.0,
    "rating": 4.8,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Tandoori marinated chicken"
  },
  {
    "id": 60,
    "name": "1 CR Loded Pizza",
    "sub": "",
    "category": "pizza",
    "price": 210.0,
    "rating": 4.9,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "House special veg/non-veg"
  },
  {
    "id": 61,
    "name": "Veg Burger / Cheese",
    "sub": "",
    "category": "burger",
    "price": 70.0,
    "rating": 4.6,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Classic veg cheese burger"
  },
  {
    "id": 62,
    "name": "Crispy Burger / Cheese",
    "sub": "",
    "category": "burger",
    "price": 90.0,
    "rating": 4.7,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Extra crispy patty"
  },
  {
    "id": 63,
    "name": "Tandoori Veg Burger",
    "sub": "",
    "category": "burger",
    "price": 99.0,
    "rating": 4.8,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Tandoori sauce spread"
  },
  {
    "id": 64,
    "name": "Paneer Duble Decker",
    "sub": "",
    "category": "burger",
    "price": 120.0,
    "rating": 4.9,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Double paneer patty"
  },
  {
    "id": 65,
    "name": "Chicken Burger / Cheese",
    "sub": "",
    "category": "burger",
    "price": 130.0,
    "rating": 4.8,
    "reviews": 120,
    "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
    "desc": "Crispy chicken patty"
  }
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
    items = list(menu_collection.find({}, {"_id": 0}))
    if len(items) < 65 and any(i.get("name") == "Cappuccino" for i in items):
        menu_collection.delete_many({})
        items = []
        
    if not items:
        menu_collection.insert_many(menu_data)
        items = list(menu_collection.find({}, {"_id": 0}))
    return items


class MenuItem(BaseModel):
    name: str
    category: str
    price: float
    desc: str
    img: Optional[str] = "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80"
    rating: Optional[float] = 4.5
    reviews: Optional[int] = 0
    sub: Optional[str] = ""

@app.post("/api/menu")
def add_menu_item(item: MenuItem, _=Depends(require_admin)):
    max_id_doc = menu_collection.find_one(sort=[("id", -1)])
    new_id = (max_id_doc["id"] + 1) if max_id_doc else 1
    new_item = item.model_dump()
    new_item["id"] = new_id
    menu_collection.insert_one(new_item)
    return {"success": True, "item": new_item}

@app.put("/api/menu/{item_id}")
def update_menu_item(item_id: int, item: MenuItem, _=Depends(require_admin)):
    updated = menu_collection.find_one_and_update(
        {"id": item_id},
        {"$set": item.model_dump()},
        return_document=True
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Item not found")
    if "_id" in updated:
        del updated["_id"]
    return {"success": True, "item": updated}

@app.delete("/api/menu/{item_id}")
def delete_menu_item(item_id: int, _=Depends(require_admin)):
    result = menu_collection.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"success": True}

from fastapi import Request
@app.post("/api/menu/upload")
async def upload_menu_image(request: Request):
    # Dummy upload that just returns the form data and a placeholder image
    form = await request.form()
    
    max_id_doc = menu_collection.find_one(sort=[("id", -1)])
    new_id = (max_id_doc["id"] + 1) if max_id_doc else 1
    
    new_item = {
        "id": new_id,
        "name": str(form.get("name", "New Item")),
        "category": str(form.get("category", "snack")),
        "price": float(form.get("price", 0)),
        "desc": str(form.get("desc", "")),
        "img": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80",
        "rating": 4.5,
        "reviews": 0,
        "sub": ""
    }
    menu_collection.insert_one(new_item)
    return {"success": True, "item": new_item}


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
    today_orders = list(orders.find({"created_at": {"$gte": start_of_day, "$lt": end_of_day}}))
    total_rev = sum(o.get("total_amount", 0) for o in today_orders)
    return {"date": start_of_day.date().isoformat(), "total_revenue": total_rev, "order_count": len(today_orders)}

@app.get("/api/analytics")
def get_analytics(orders=Depends(get_orders_collection)):
    now = datetime.now(timezone.utc)
    start_of_day = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    
    # Orders today
    today_orders = list(orders.find({"created_at": {"$gte": start_of_day}}))
    revenue_today = sum(o.get("total_amount", 0) for o in today_orders)
    
    # Chart data (last 7 days)
    chart_data = []
    for i in range(6, -1, -1):
        day_start = start_of_day - timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        day_orders = list(orders.find({"created_at": {"$gte": day_start, "$lt": day_end}}))
        day_rev = sum(o.get("total_amount", 0) for o in day_orders)
        chart_data.append({
            "name": day_start.strftime("%a"),
            "revenue": day_rev,
            "orders": len(day_orders)
        })
        
    # Top items (all time for simplicity)
    item_counts = {}
    for o in orders.find({}):
        for item in o.get("items", []):
            name = item.get("name", "Unknown")
            item_counts[name] = item_counts.get(name, 0) + item.get("qty", 1)
            
    top_items = [{"name": k, "sales": v} for k, v in sorted(item_counts.items(), key=lambda x: x[1], reverse=True)[:5]]
    
    return {
        "revenueToday": revenue_today,
        "ordersToday": len(today_orders),
        "chartData": chart_data,
        "topItems": top_items
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
