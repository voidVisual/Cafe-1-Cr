import type { NextConfig } from "next";

// In production (DigitalOcean), these point to service hostnames or IPs.
// In development, they fall back to localhost.
const ADMIN_GATEWAY_URL = process.env.ADMIN_GATEWAY_URL || "http://localhost:3002";
const ORDER_SERVICE_URL  = process.env.ORDER_SERVICE_URL  || "http://localhost:3001";
const KITCHEN_SERVICE_URL = process.env.KITCHEN_SERVICE_URL || "http://localhost:3003";
const ANALYTICS_URL      = process.env.ANALYTICS_URL      || "http://localhost:3004";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Menu CRUD — proxied to admin-gateway (NestJS)
        source: "/api/menu/:path*",
        destination: `${ADMIN_GATEWAY_URL}/api/menu/:path*`,
      },
      {
        // Admin orders + status update — proxied to admin-gateway
        source: "/api/admin/:path*",
        destination: `${ADMIN_GATEWAY_URL}/api/admin/:path*`,
      },
      {
        // Kitchen display — proxied to kitchen-display service
        source: "/api/kitchen/:path*",
        destination: `${KITCHEN_SERVICE_URL}/api/kitchen/:path*`,
      },
      {
        // Analytics — proxied to analytics service (with subpath)
        source: "/api/analytics/:path*",
        destination: `${ANALYTICS_URL}/api/analytics/:path*`,
      },
      {
        // Analytics root (exact match, no subpath)
        source: "/api/analytics",
        destination: `${ANALYTICS_URL}/api/analytics`,
      },
    ];
  },
};

export default nextConfig;
