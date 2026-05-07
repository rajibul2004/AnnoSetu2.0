import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins:["10.154.5.83"],
  experimental:{
    serverActions:{
      allowedOrigins:[
        "10.221.17.83:3000",
        "localhost:3000",
        "10.154.5.83:3000"
      ]
    }
  }
};

export default nextConfig;