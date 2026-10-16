import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // pin the project root so a lockfile in a parent folder is not picked up
  outputFileTracingRoot: fileURLToPath(new URL('.', import.meta.url)),
};

export default nextConfig;
