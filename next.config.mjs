/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      '/api/*': ['./kactl/**/*', './arena/**/*'],
    },
  },
};

export default nextConfig;
