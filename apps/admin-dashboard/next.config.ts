import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/menu/:path*",
        destination: "http://localhost:3002/api/menu/:path*",
      },
      {
        source: "/api/kitchen/:path*",
        destination: "http://localhost:3003/api/kitchen/:path*",
      },
      {
        source: "/api/analytics/:path*",
        destination: "http://localhost:3004/api/analytics/:path*",
      },
    ];
  },
};

export default nextConfig;
