/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  async rewrites() {
    return [
      {
        source: "/onDate",
        destination: "/api/onDate",
      },
      {
        source: "/onMessage",
        destination: "/api/onMessage",
      },
      {
        source: "/onSchedule",
        destination: "/api/onSchedule",
      },
    ];
  },
};

export default nextConfig;
