import type {NextConfig} from "next";

const nextConfig: NextConfig = {
    devIndicators: false,
    output: 'standalone',
    async rewrites() {
        const shortlinerBackendUrl = process.env.SHORTLINER_BACKEND_URL || 'http://localhost:8080';
        const analyticsBackendUrl = process.env.ANALYTICS_BACKEND_URL || 'http://localhost:8082';
        return [
            {source: '/api/shortliner/:path*', destination: `${shortlinerBackendUrl}/:path*`},
            {source: '/api/analytics/:path*', destination: `${analyticsBackendUrl}/:path*`},
        ];
    },
};

export default nextConfig;
