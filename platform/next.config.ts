import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root (multiple lockfiles exist in parent dirs).
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
