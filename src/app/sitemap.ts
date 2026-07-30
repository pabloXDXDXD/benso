import { routing } from '@/i18n/routing';
import type { MetadataRoute } from 'next';

const baseUrl = 'https://www.bensofcg.com';
const locales = routing.locales;
const defaultLocale = routing.defaultLocale;

// Pages with no locale prefix for the default locale
const pages = [
  { path: '' },
  { path: '/servicios' },
  { path: '/productos' },
  { path: '/eventos' },
  { path: '/nosotros' },
  { path: '/contacto' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const page of pages) {
    for (const locale of locales) {
      const localizedPath = locale === defaultLocale ? page.path : `/${locale}${page.path}`;
      const url = `${baseUrl}${localizedPath}`;

      // Build alternate language versions
      const languages: Record<string, string> = {};
      for (const alt of locales) {
        languages[alt] = `${baseUrl}${alt === defaultLocale ? page.path : `/${alt}${page.path}`}`;
      }
      languages['x-default'] = `${baseUrl}${page.path}`;

      entries.push({
        url,
        lastModified: new Date(),
        changeFrequency: page.path === '' ? 'weekly' as const : 'monthly' as const,
        priority: page.path === '' ? 1.0 : 0.8,
        alternates: { languages },
      });
    }
  }

  return entries;
}
