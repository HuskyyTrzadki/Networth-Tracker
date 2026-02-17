import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  reactCompiler: true,
  transpilePackages: ["echarts", "zrender"],
  images: {
    localPatterns: [
      {
        pathname: "/api/public/image",
      },
    ],
  },
};

export default nextConfig;
