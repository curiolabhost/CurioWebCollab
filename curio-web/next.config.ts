import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Any path under the lesson app should serve the Expo index.html
        source: "/lesson-apps/electric-status-board/:path*",
        destination: "/lesson-apps/electric-status-board/index.html",
      },
    ];
  },
};

export default nextConfig;
