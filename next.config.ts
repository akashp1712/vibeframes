import type { NextConfig } from "next";
import { resolve } from "node:path";

const nextConfig: NextConfig = {
  // Absolute path — Next/Turbopack warns when this is relative.
  turbopack: {
    root: resolve("."),
  },

  // The Cascade browser preview proxies to 127.0.0.1:<port>, which Next.js
  // treats as cross-origin from the canonical http://localhost:3000 and
  // blocks dev-only resources (HMR socket, _next/static, _next/webpack-hmr).
  // Without this, the JS bundle never attaches in the preview iframe, so
  // form submits fall back to default browser GET behavior and the page
  // just reloads on Send. Allow 127.0.0.1 and any local/LAN origin in dev.
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.1.4", "*.local-credentialless.webcontainer.io"],
};

export default nextConfig;
