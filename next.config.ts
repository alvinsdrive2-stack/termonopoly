import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      { pathname: "/tiles/**", search: "" },
      { pathname: "/bidak/**", search: "" },
      { pathname: "/charselect/**", search: "" },
      { pathname: "/main.png", search: "" },
    ],
  },
};

export default nextConfig;
