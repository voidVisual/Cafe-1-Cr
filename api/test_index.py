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
        "phone": "9999999999"
    }
    response = client.post("/api/order", json=order_payload)
    assert response.status_code == 200
    data = response.json()
    assert "Order placed successfully" in data["message"]
    assert "db_order_id" in data

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
