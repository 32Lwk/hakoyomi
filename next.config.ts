import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // デモSKUのパッケージ写真（ゆうが取得、L-40）
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.yutok.dev", pathname: "/otc/**" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
