import type {NextConfig} from "next";

const nextConfig: NextConfig = {
    devIndicators: false,
    output: 'standalone',
    serverExternalPackages: ['pino', 'prom-client'],
};

export default nextConfig;
