"use client";

import { useState, useEffect } from "react";
import { Clock, RefreshCw } from "lucide-react";


type OrderStatus = "New" | "Preparing" | "Ready" | "Completed";

interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

interface Order {
  id: string;
  order_display_id: string;
  customerName: string;
  tableNumber: number | null;
  items: OrderItem[];
  status: OrderStatus;
  time: string;
  total: number;
}

const columns: OrderStatus[] = ["New", "Preparing", "Ready", "Completed"];

// Map backend status strings to our kanban columns
function normalizeStatus(status: string): OrderStatus {
  const s = (status || "").toLowerCase();
  if (s === "paid" || s === "pending_payment" || s === "received" || s === "new") return "New";
  if (s === "preparing" || s === "approved") return "Preparing";
  if (s === "ready") return "Ready";
  if (s === "completed" || s === "delivered") return "Completed";
  return "New";
}

export default function LiveOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const connected = true; // Kept to show UI state

  // Fetch existing orders from backend
  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders");
      if (!res.ok) return;
      const data = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: Order[] = (data.orders || []).map((o: any) => ({
        id: o.id,
        order_display_id: o.order_display_id || o.id,
        customerName: o.customer_name || "Guest",
        tableNumber: o.table_number ?? null,
        items: o.items || [],
        status: normalizeStatus(o.status),
        time: new Date(o.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        total: parseFloat(o.total_amount) || 0,
      }));
      setOrders(mapped);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  // Smart polling for live updates
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();

    const intervalId = setInterval(() => {
      fetchOrders();
    }, 10000); // Poll every 10 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const moveOrder = async (orderId: string, newStatus: OrderStatus) => {
    // Optimistic update
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );

    // Persist to backend
    try {
      await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error("Failed to update order status:", err);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Live Orders</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              {connected ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-400"></span>
              )}
            </span>
            <span className="text-sm font-medium text-gray-600">
              {connected ? "Smart polling active" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 overflow-hidden pb-4">
          {columns.map((column) => (
            <div key={column} className="flex flex-col rounded-xl bg-gray-100/50 p-4 min-h-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">{column}</h2>
                <span className="bg-white text-gray-600 text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                  {orders.filter((o) => o.status === column).length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4">
                {orders
                  .filter((o) => o.status === column)
                  .map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-orange-600">{order.order_display_id}</span>
                        <div className="flex items-center text-xs text-gray-500 font-medium">
                          <Clock className="w-3 h-3 mr-1" />
                          {order.time}
                        </div>
                      </div>

                      <div className="mb-3 flex justify-between items-start">
                        <p className="font-medium text-gray-900">{order.customerName}</p>
                        {order.tableNumber !== null && (
                          <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded">
                            Table {order.tableNumber}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 mb-4">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              <span className="font-medium text-gray-900 mr-2">{item.qty}x</span>
                              {item.name}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                        <span className="font-semibold text-gray-900">
                          ₹{order.total.toFixed(2)}
                        </span>

                        <div className="flex gap-2">
                          {column === "New" && (
                            <button
                              onClick={() => moveOrder(order.id, "Preparing")}
                              className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md font-medium hover:bg-blue-100 transition-colors"
                            >
                              Prepare
                            </button>
                          )}
                          {column === "Preparing" && (
                            <button
                              onClick={() => moveOrder(order.id, "Ready")}
                              className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-md font-medium hover:bg-green-100 transition-colors"
                            >
                              Ready
                            </button>
                          )}
                          {column === "Ready" && (
                            <button
                              onClick={() => moveOrder(order.id, "Completed")}
                              className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-md font-medium hover:bg-gray-800 transition-colors"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                {orders.filter((o) => o.status === column).length === 0 && (
                  <div className="flex flex-col items-center justify-center h-24 text-gray-400 text-sm">
                    <p>No orders</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
