"use client";

import { useState } from "react";
import { Clock, MoreVertical } from "lucide-react";
import clsx from "clsx";

type OrderStatus = "New" | "Preparing" | "Ready" | "Completed";

interface Order {
  id: string;
  customerName: string;
  tableNumber: number;
  items: { name: string; quantity: number }[];
  status: OrderStatus;
  time: string;
  total: number;
}

const initialOrders: Order[] = [
  {
    id: "#1023",
    customerName: "Alice Smith",
    tableNumber: 4,
    items: [{ name: "Iced Caramel Macchiato", quantity: 2 }, { name: "Avocado Toast", quantity: 1 }],
    status: "New",
    time: "10:42 AM",
    total: 18.5,
  },
  {
    id: "#1024",
    customerName: "Bob Jones",
    tableNumber: 2,
    items: [{ name: "Espresso", quantity: 1 }],
    status: "New",
    time: "10:45 AM",
    total: 3.5,
  },
  {
    id: "#1021",
    customerName: "Charlie Brown",
    tableNumber: 7,
    items: [{ name: "Matcha Latte", quantity: 1 }, { name: "Blueberry Muffin", quantity: 2 }],
    status: "Preparing",
    time: "10:35 AM",
    total: 12.0,
  },
  {
    id: "#1019",
    customerName: "Diana Prince",
    tableNumber: 1,
    items: [{ name: "Americano", quantity: 1 }],
    status: "Ready",
    time: "10:28 AM",
    total: 4.0,
  },
];

const columns: OrderStatus[] = ["New", "Preparing", "Ready", "Completed"];

export default function LiveOrders() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  const moveOrder = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Live Orders</h1>
        <div className="flex items-center gap-2">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-sm font-medium text-gray-600">Receiving live updates</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 overflow-hidden pb-4">
        {columns.map((column) => (
          <div key={column} className="flex flex-col rounded-xl bg-gray-100/50 p-4">
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
                    className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 cursor-grab hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-orange-600">{order.id}</span>
                      <div className="flex items-center text-xs text-gray-500 font-medium">
                        <Clock className="w-3 h-3 mr-1" />
                        {order.time}
                      </div>
                    </div>

                    <div className="mb-3 flex justify-between items-start">
                      <p className="font-medium text-gray-900">{order.customerName}</p>
                      <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded">
                        Table {order.tableNumber}
                      </span>
                    </div>

                    <div className="space-y-1 mb-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            <span className="font-medium text-gray-900 mr-2">{item.quantity}x</span>
                            {item.name}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                      <span className="font-semibold text-gray-900">₹{order.total.toFixed(2)}</span>
                      
                      {/* Simple action buttons based on status */}
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
