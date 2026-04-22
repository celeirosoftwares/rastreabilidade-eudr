/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Necessário para o Mapbox GL funcionar no servidor
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'mapbox-gl': 'mapbox-gl',
    }
    return config
  },
}

module.exports = nextConfig
