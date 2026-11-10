import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // cPanel serves this export from the existing tejum.in document root.
  // Do not change without updating the deployment target.
  output: "export",
  basePath: "/perfumes",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
