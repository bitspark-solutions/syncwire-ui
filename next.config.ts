import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle (.next/standalone) so the Docker
  // runtime stage only needs `node server.js` — no node_modules copy.
  output: "standalone",
};

export default nextConfig;
