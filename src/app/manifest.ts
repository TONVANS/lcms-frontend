import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.title,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#070d1e',
    theme_color: '#0b1329',
    lang: 'lo',
    icons: [
      {
        src: '/logo/logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}

