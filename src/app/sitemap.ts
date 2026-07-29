import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const SITE_URL = 'https://www.bensofcg.com';

const locales = ['es', 'en'] as const;

const routes = [
  { path: '', priority: 1.0, changeFrequency: 'weekly' as const },
  { path: 'servicios', priority: 0.9, changeFrequency: 'weekly' as const },
  { path: 'productos', priority: 0.9, changeFrequency: 'weekly' as const },
  { path: 'eventos', priority: 0.9, changeFrequency: 'weekly' as const },
  { path: 'nosotros', priority: 0.6, changeFrequency: 'monthly' as const },
  { path: 'contacto', priority: 0.6, changeFrequency: 'monthly' as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // Root URLs (x-default)
  entries.push({
    url: `${SITE_URL}/`,
    changeFrequency: 'weekly',
    priority: 1.0,
    alternates: {
      languages: {
        es: `${SITE_URL}/es/`,
        en: `${SITE_URL}/en/`,
      },
    },
  });

  for (const locale of locales) {
    for (const route of routes) {
      if (!route.path) continue; // root already handled above

      const url = `${SITE_URL}/${locale}/${route.path}/`;

      const alternates: Record<string, string> = {};
      for (const altLocale of locales) {
        alternates[altLocale] = `${SITE_URL}/${altLocale}/${route.path}/`;
      }

      entries.push({
        url,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: {
          languages: alternates,
        },
      });
    }
  }

  return entries;
}