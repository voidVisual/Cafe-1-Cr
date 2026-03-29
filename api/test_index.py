from fastapi.testclient import TestClient # type: ignore
import sys
import os
import mongomock # type: ignore

# Ensure the local api folder is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from index import app, get_orders_collection # type: ignore

mongo_client = mongomock.MongoClient()
test_db = mongo_client.get_database("test_cafe_orders")
test_orders = test_db.get_collection("orders")

def override_get_orders_collection():
    return test_orders

app.dependency_overrides[get_orders_collection] = override_get_orders_collection

client = TestClient(app)

def test_get_menu():
    response = client.get("/api/menu")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "name" in data[0]

def test_place_cash_order():
    order_payload = {
        "items": [{"id": 1, "qty": 2, "name": "Cappuccino", "price": 320}],
        "total": 640.0,
        "address": "123 Test St",
        "phone": "9999999999",
        "customer_name": "Test User"
    }
    response = client.post("/api/order", json=order_payload)
    assert response.status_code == 200
    data = response.json()
    assert "Order placed successfully" in data["message"]
    assert "db_order_id" in data
    assert "order_display_id" in data
    assert data["order_display_id"].startswith("ORD-")

def test_get_order_history():
    response = client.get("/api/orders/history/9999999999")
    assert response.status_code == 200
    data = response.json()
    assert "history" in data
    assert len(data["history"]) == 1
    
    order = data["history"][0]
    assert order["total_amount"] == 640.0
    assert order["payment_method"] == "CASH"
    assert order["status"] == "Received"
    assert len(order["items"]) == 1
    assert order["items"][0]["name"] == "Cappuccino"

def test_get_today_revenue():
    response = client.get("/api/admin/revenue/today")
    assert response.status_code == 200
    data = response.json()
    assert "total_revenue" in data
    assert "order_count" in data
    assert data["order_count"] >= 1
    assert data["total_revenue"] >= 640.0

def test_admin_get_all_orders():
    response = client.get("/api/admin/orders")
    assert response.status_code == 200
    data = response.json()
    assert "orders" in data
    assert len(data["orders"]) >= 1
    order = data["orders"][0]
    assert "id" in order
    assert "status" in order
    assert "items" in order
    assert "customer_phone" in order

def test_admin_update_order_status():
    # First, get an order ID
    orders_resp = client.get("/api/admin/orders")
    orders_data = orders_resp.json()
    order_id = orders_data["orders"][0]["id"]

    # Update to Approved
    response = client.put(f"/api/admin/orders/{order_id}/status", json={"status": "Approved"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["order"]["status"] == "Approved"
    assert data["order"]["approved_at"] is not None

    # Update to Preparing
    response = client.put(f"/api/admin/orders/{order_id}/status", json={"status": "Preparing"})
    assert response.status_code == 200
    assert response.json()["order"]["status"] == "Preparing"

    # Update to Completed
    response = client.put(f"/api/admin/orders/{order_id}/status", json={"status": "Completed"})
    assert response.status_code == 200
    assert response.json()["order"]["status"] == "Completed"

    # Invalid status
    response = client.put(f"/api/admin/orders/{order_id}/status", json={"status": "InvalidStatus"})
    assert response.status_code == 400

def test_user_get_order_status():
    # Get an order ID
    orders_resp = client.get("/api/admin/orders")
    order_id = orders_resp.json()["orders"][0]["id"]

    response = client.get(f"/api/orders/status/{order_id}")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "prep_time_minutes" in data
    assert "items" in data
    assert data["id"] == order_id

    # Invalid ID
    response = client.get("/api/orders/status/invalidid")
    assert response.status_code == 400
