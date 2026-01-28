/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Docker va boshqa deployment'lar uchun
  // Production uchun optimizatsiya
  compress: true,
  poweredByHeader: false,
  // Static fayllar uchun
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig
