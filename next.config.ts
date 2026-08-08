import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  async redirects() {
    return [
      // Old /eventos route moved under /formacion (categorized by tipo).
      // Destination includes trailing slash to avoid a second redirect hop.
      { source: '/eventos', destination: '/formacion/eventos/', permanent: true },
      // Locale-prefixed eventos redirect directly to the final route.
      { source: '/es/eventos', destination: '/formacion/eventos/', permanent: true },
      { source: '/en/eventos', destination: '/formacion/eventos/', permanent: true },
      // Locale prefixes no longer exist; consolidate to single-language Spanish URLs.
      // Destinations end with "/" so trailingSlash: true does not add a second hop.
      { source: '/es/:path+', destination: '/:path+/', permanent: true },
      { source: '/en/:path+', destination: '/:path+/', permanent: true },
      { source: '/es', destination: '/', permanent: true },
      { source: '/en', destination: '/', permanent: true },
    ];
  },
};

export default nextConfig;