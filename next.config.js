/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { dev }) => {
    // Fix for Windows filesystem case sensitivity issues
    if (process.platform === 'win32' && dev) {
      // Disable caching in development to avoid case sensitivity issues
      config.cache = false

      // Disable filesystem cache
      config.snapshot = {
        ...config.snapshot,
        managedPaths: [],
      }
    }
    return config
  },
}

module.exports = nextConfig
