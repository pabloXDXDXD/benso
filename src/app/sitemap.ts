import type { MetadataRoute } from 'next';
import type { Servicio } from '@/hooks/useData';
import { serviceSlug } from '@/lib/slugify';
import { supabase } from '@/lib/supabase';

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = pages.map((page) => ({
    url: `${baseUrl}${page.path}/`,
    lastModified: new Date(),
    changeFrequency: page.path === '' ? 'weekly' : 'monthly',
    priority: page.path === '' ? 1.0 : 0.8,
  }));

  let serviceEntries: MetadataRoute.Sitemap = [];
  try {
    const { data, error } = await supabase
      .from('servicios')
      .select('*')
      .eq('is_active', true);
    if (!error && data) {
      const servicios = data as Servicio[];
      serviceEntries = servicios.map((service) => ({
        url: `${baseUrl}/servicios/${serviceSlug(service, servicios)}/`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      }));
    }
  } catch {
    serviceEntries = [];
  }

  return [...staticEntries, ...serviceEntries];
}