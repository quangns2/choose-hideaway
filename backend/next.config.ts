import type { NextConfig } from 'next';
import path from 'node:path';
const config: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ['@choose-hideaway/contracts'],
  outputFileTracingRoot: path.resolve(process.cwd(), '..'),
  async rewrites() {
    // Serve the built React SPA; Next.js handles all /api routes.
    return {beforeFiles: [{source: '/', destination: '/index.html'}, {source: '/admin', destination: '/index.html'}]};
  },
};
export default config;
