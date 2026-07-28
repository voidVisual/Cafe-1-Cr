import type { NextConfig } from "next";

const API_URL = process.env.ADMIN_GATEWAY_URL || process.env.NEXT_PUBLIC_API_URL || "https://cafe-1-cr-v2-123.vercel.app";
const ANALYTICS_URL = process.env.ANALYTICS_URL || "http://analytics:3004";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/analytics/:path*",
        destination: `${ANALYTICS_URL}/api/analytics/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
      }
    ];
  },
};

export default nextConfig;
