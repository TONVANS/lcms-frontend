import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: '', priority: 1.0, changeFrequency: 'weekly' as const },
    { path: '/login', priority: 0.9, changeFrequency: 'monthly' as const },
    { path: '/ppa', priority: 0.8, changeFrequency: 'daily' as const },
    { path: '/contracts', priority: 0.8, changeFrequency: 'daily' as const },
    { path: '/legal', priority: 0.8, changeFrequency: 'daily' as const },
    { path: '/support', priority: 0.5, changeFrequency: 'monthly' as const },
  ];

  return routes.map((route) => ({
    url: `${siteConfig.url}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

