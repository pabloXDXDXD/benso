import type { MetadataRoute } from 'next';
import type { Producto, Servicio } from '@/hooks/useData';
import { productSlug, serviceSlug } from '@/lib/slugify';
import { supabase } from '@/lib/supabase';

const baseUrl = 'https://www.bensofcg.com';

// Single-language site (Spanish only)
const pages = [
  { path: '' },
  { path: '/servicios' },
  { path: '/productos' },
  { path: '/formacion/talleres' },
  { path: '/formacion/cursos' },
  { path: '/formacion/eventos' },
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

  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('is_active', true);
    if (!error && data) {
      const productos = data as Producto[];
      productEntries = productos.map((product) => ({
        url: `${baseUrl}/productos/${productSlug(product, productos)}/`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      }));
    }
  } catch {
    productEntries = [];
  }

  return [...staticEntries, ...serviceEntries, ...productEntries];
}