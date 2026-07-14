import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins:["10.185.60.83"],
  experimental:{
    serverActions:{
      allowedOrigins:[
        "10.185.60.83:3000",
        "localhost:3000",
      ]
    }
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;