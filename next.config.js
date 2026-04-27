/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/index-lp.html',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
