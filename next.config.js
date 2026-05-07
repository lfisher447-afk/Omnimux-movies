const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns:[
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: 'api.dicebear.com' }
    ],
  },
  webpack: (config, { isServer }) => {
    // Prevent webtorrent and node-specific modules from attempting to bundle in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        os: false,
        path: false,
        stream: false,
        zlib: false,
        http: false,
        https: false,
      };
    }

    // Silence the pesky "fs-native-extensions" and "require-addon" warnings from WebTorrent
    config.ignoreWarnings =[
      { module: /node_modules\/webtorrent/ },
      { module: /node_modules\/fs-native-extensions/ },
      { module: /node_modules\/require-addon/ },
      /Critical dependency: the request of a dependency is an expression/,
      /Critical dependency: require function is used in a way/,
    ];

    return config;
  },
};

module.exports = withPWA(nextConfig);
