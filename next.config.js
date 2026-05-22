/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack: (config) => {
    if (process.env.DISABLE_WEBPACK_CACHE === "1") {
      config.cache = false;
    }

    return config;
  },
}

export default nextConfig
