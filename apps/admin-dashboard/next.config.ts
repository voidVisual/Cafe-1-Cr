import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Menu CRUD — proxied to admin-gateway (NestJS, port 3002)
        source: "/api/menu/:path*",
        destination: "http://localhost:3002/api/menu/:path*",
      },
      {
        // Admin orders + status update — proxied to admin-gateway (port 3002)
        source: "/api/admin/:path*",
        destination: "http://localhost:3002/api/admin/:path*",
      },
      {
        // Kitchen display — proxied to kitchen-display service (port 3003)
        source: "/api/kitchen/:path*",
        destination: "http://localhost:3003/api/kitchen/:path*",
      },
      {
        // Analytics — proxied to analytics service (port 3004)
        source: "/api/analytics/:path*",
        destination: "http://localhost:3004/api/analytics/:path*",
      },
      {
        // Analytics root (no subpath) — needed for exact match
        source: "/api/analytics",
        destination: "http://localhost:3004/api/analytics",
      },
    ];
  },
};

export default nextConfig;
