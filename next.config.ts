import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '100mb',
        }
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    images: { 
        remotePatterns: [
            { 
                protocol: 'https', 
                hostname: 'covers.openlibrary.org' 
            },
            { 
                protocol: 'https', 
                hostname: '*.public.blob.vercel-storage.com',  // Add wildcard
            },
            // Keep your specific one as well (optional)
            { 
                protocol: 'https', 
                hostname: 'lspfdyhgsrgsxcju.public.blob.vercel-storage.com' 
            },
        ]
    }
};

export default nextConfig;