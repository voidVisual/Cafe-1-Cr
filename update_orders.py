import os

filepath = r"apps\admin-dashboard\src\app\(dashboard)\orders\page.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Replace imports
content = content.replace('import { io, Socket } from "socket.io-client";', '')
content = content.replace('const socketRef = useRef<Socket | null>(null);', '')
content = content.replace('const [connected, setConnected] = useState(false);', 'const [connected, setConnected] = useState(true);')

# Replace the useEffect block
old_effect = """  // Connect to admin-gateway WebSocket for live updates
  useEffect(() => {
    fetchOrders();

    // Admin-gateway Socket.IO runs on port 3002.
    // In production, set NEXT_PUBLIC_GATEWAY_URL to your server's address.
    const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 
      (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3002` : 'http://localhost:3002');
    const socket = io(gatewayUrl, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("order_created", (newOrder: any) => {
      const mapped: Order = {
        id: newOrder.id,
        order_display_id: newOrder.order_display_id || newOrder.id,
        customerName: newOrder.customer_name || "Guest",
        tableNumber: newOrder.table_number ?? null,
        items: newOrder.items || [],
        status: "New",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        total: parseFloat(newOrder.total_amount) || 0,
      };
      setOrders((prev) => {
        // Avoid duplicates
        if (prev.some((o) => o.id === mapped.id)) return prev;
        return [mapped, ...prev];
      });
    });

    socket.on("order_status", (update: any) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === update.order_id
            ? { ...o, status: normalizeStatus(update.status) }
            : o
        )
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);"""

new_effect = """  // Smart polling for live updates
  useEffect(() => {
    fetchOrders();

    const intervalId = setInterval(() => {
      fetchOrders();
    }, 10000); // Poll every 10 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, []);"""

if old_effect in content:
    content = content.replace(old_effect, new_effect)
else:
    print("Warning: old useEffect not found")

content = content.replace('"Receiving live updates" : "Connecting..."', '"Smart polling active" : "Disconnected"')

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated orders/page.tsx")
