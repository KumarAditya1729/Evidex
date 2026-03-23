/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@evidex/api",
    "@evidex/auth",
    "@evidex/database",
    "@evidex/storage",
    "@evidex/blockchain"
  ],
  experimental: {
    serverMinification: false, // Prevents SWC from emitting \00 octal escapes in bundled Node modules
    serverComponentsExternalPackages: [
      "@prisma/client",
      "prisma",
      "ioredis",
      "amqplib",
      "@polkadot/api",
      "@polkadot/util-crypto",
      "bitcoinjs-lib"
    ]
  },
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false
    };

    return config;
  }
};

export default nextConfig;
