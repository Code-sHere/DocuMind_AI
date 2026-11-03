import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
};
module.exports = {
  allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev'],
}

export default nextConfig;
