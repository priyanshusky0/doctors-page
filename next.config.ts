import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static files only: served from a CDN, so traffic never slows the page down.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
