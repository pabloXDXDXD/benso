import type { MetadataRoute } from 'next';

const SITE_URL = 'https://bensofcg.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
changeFrequency: 'weekly',
    priority: 1.0,
    },
    {
      url: `${SITE_URL}/servicios`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/productos`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/eventos`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/nosotros`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/contacto`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];
}
