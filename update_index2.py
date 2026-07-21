import re

with open("api/index.py", "r", encoding="utf-8") as f:
    content = f.read()

# Add CRUD menu endpoints before @app.post("/api/payment/create")
menu_crud = """
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

"""

if "@app.post(\"/api/menu\")" not in content:
    content = content.replace('@app.post("/api/payment/create")', menu_crud + '\n@app.post("/api/payment/create")')

# Replace the analytics endpoint
old_analytics = """@app.get("/api/admin/revenue/today")
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
    }"""

new_analytics = """@app.get("/api/admin/revenue/today")
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
"""

if "def get_analytics(" not in content:
    content = content.replace(old_analytics, new_analytics)

with open("api/index.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated api/index.py successfully!")
