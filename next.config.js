/** @type {import('next').NextConfig} */

// When deploying to GitHub Pages (project site), the app is served from
// https://<user>.github.io/<repo>/, so we need a basePath. The Pages
// workflow sets PAGES_BASE_PATH to "/<repo>". Locally it's empty.
const basePath = process.env.PAGES_BASE_PATH || "";

const nextConfig = {
  reactStrictMode: true,
  output: "export", // static HTML export -> works on GitHub Pages
  images: { unoptimized: true },
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  env: {
    // Exposed to the client so OAuth redirects target the right base URL.
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

module.exports = nextConfig;
