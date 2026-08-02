import type { MetadataRoute } from 'next';

const baseUrl = 'https://www.bensofcg.com';

// Single-language site (Spanish only)
const pages = [
  { path: '' },
  { path: '/servicios' },
  { path: '/productos' },
  { path: '/eventos' },
  { path: '/nosotros' },
  { path: '/contacto' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map((page) => ({
    url: `${baseUrl}${page.path}/`,
    lastModified: new Date(),
    changeFrequency: page.path === '' ? 'weekly' as const : 'monthly' as const,
    priority: page.path === '' ? 1.0 : 0.8,
  }));
}
