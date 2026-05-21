/** @type {import('next').NextConfig} */
const path = require('path');
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  async rewrites(){
    return [
      { source: '/api/:path*', destination: `${apiUrl}/api/:path*` }
    ];
  }
};
module.exports = nextConfig;
