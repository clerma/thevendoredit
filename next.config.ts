import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow _vendors/ and _data/ to be read at build time
  serverExternalPackages: ['gray-matter', 'js-yaml'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
