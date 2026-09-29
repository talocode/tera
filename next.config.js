/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: '.',
  },
  webpack: (config) => {
    if (process.env.DISABLE_WEBPACK_CACHE === "1") {
      config.cache = false;
    }

    return config;
  },
  async rewrites() {
    return [
      {
        source: '/v1/:path*',
        destination: '/api/v1/:path*',
      },
    ]
  },
}

export default nextConfig
