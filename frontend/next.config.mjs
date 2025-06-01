/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:9000/:path*',
      },
    ]
  },
  // Remove the experimental.esmExternals line completely
}

export default nextConfig
