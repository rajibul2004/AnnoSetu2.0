import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins:["172.30.144.1"],
  experimental:{
    serverActions:{
      allowedOrigins:[
        "172.30.144.1:3000",
        "localhost:3000",
      ]
    }
  }
};

export default nextConfig;