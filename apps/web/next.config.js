/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@bluedev/shared-types"],
  generateBuildId: async () => "keyword-radar-mvp",
  eslint: {
    ignoreDuringBuilds: true
  }
};

module.exports = nextConfig;
