import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  async redirects() {
    return [
      // Locale prefixes no longer exist; consolidate to single-language Spanish URLs.
      { source: '/es/:path*', destination: '/:path*', permanent: true },
      { source: '/en/:path*', destination: '/:path*', permanent: true },
      // Old /eventos route moved under /formacion (categorized by tipo).
      { source: '/eventos', destination: '/formacion/eventos', permanent: true },
    ];
  },
};

export default nextConfig;