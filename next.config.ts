import type {NextConfig} from "next";

const nextConfig: NextConfig = {
    devIndicators: false,
    output: 'standalone',
    async rewrites() {
        return [
            {source: '/api/shortliner/:path*', destination: `${process.env.SHORTLINER_BACKEND_URL}/:path*`},
            {source: '/api/analytics/:path*', destination: `${process.env.ANALYTICS_BACKEND_URL}/:path*`},
        ];
    },
};

export default nextConfig;
