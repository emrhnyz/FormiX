/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
      topLevelAwait: true,
    };

    config.optimization.moduleIds = "named";

    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });

    if (isServer) {
      config.output.webassemblyModuleFilename = "./../static/wasm/tfhe_bg.wasm";
    } else {
      config.output.webassemblyModuleFilename = "static/wasm/tfhe_bg.wasm";
    }

    if (!isServer) {
      config.output.environment = {
        ...config.output.environment,
        asyncFunction: true,
      };
    }

    return config;
  },
};

export default nextConfig;
