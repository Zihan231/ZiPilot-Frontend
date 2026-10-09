import type { NextConfig } from 'next';

const FIREBASE_AUTH_HOST = 'https://zipilot24x7.firebaseapp.com';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /**
   * Serve Firebase's auth handler from our own domain (Firebase "proxy auth requests" setup).
   * Google sign-in then completes on zipilot.vercel.app instead of *.firebaseapp.com, so browsers
   * that partition third-party storage (Chrome, Safari, Firefox) don't drop the sign-in result.
   */
  async rewrites() {
    return [
      { source: '/__/auth/:path*', destination: `${FIREBASE_AUTH_HOST}/__/auth/:path*` },
      { source: '/__/firebase/:path*', destination: `${FIREBASE_AUTH_HOST}/__/firebase/:path*` },
    ];
  },
};

export default nextConfig;
