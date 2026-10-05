import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Turbopack doesn't support the "style" export condition natively,
    // so we alias the CSS packages to their dist paths directly
    resolveAlias: {
      "tw-animate-css": "tw-animate-css/dist/tw-animate.css",
      "shadcn/tailwind.css": "shadcn/dist/tailwind.css",
    },
  },
  webpack: (config) => {
    // Add 'style' condition so webpack can resolve CSS exports from
    // packages like tw-animate-css and shadcn that use the "style" condition
    config.resolve.conditionNames = [
      ...(config.resolve.conditionNames || []),
      "style",
    ];
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
