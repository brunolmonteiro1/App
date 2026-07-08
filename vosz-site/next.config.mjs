/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      // Rotas antigas preservadas após a reorganização do sitemap.
      { source: "/como-apoiar", destination: "/apoie", permanent: true },
      { source: "/nossa-historia", destination: "/quem-somos", permanent: true },
    ];
  },
};

export default nextConfig;
