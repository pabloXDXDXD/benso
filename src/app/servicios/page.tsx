import type { Metadata } from 'next';
import { ServicesPage } from '@/components/pages/ServicesPage';
import type { Servicio } from '@/hooks/useData';
import { supabase } from '@/lib/supabase';
import { withRetry } from '@/lib/withRetry';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Servicios de Consultoría y Capacitación para PyMEs',
  description: 'Descubre nuestros servicios de consultoría estratégica, capacitación y herramientas digitales para PyMEs en Cuba. Agenda tu cita gratis y lleva tu emprendimiento al siguiente nivel.',
  openGraph: {
    title: 'Servicios de Consultoría y Capacitación - BENSO',
    description: 'Consultoría estratégica, capacitación y herramientas digitales para PyMEs en Cuba. Agenda tu cita gratis.',
  },
};

export default async function Page() {
  const { data: servicios, error: serviciosError } = await withRetry(() =>
    supabase
      .from('servicios')
      .select('*')
      .eq('is_active', true)
  );

  const items = serviciosError ? undefined : (servicios || []) as Servicio[];

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: (items || []).map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Service',
        name: item.title,
        description: item.description,
        provider: { '@type': 'Organization', name: 'BENSO' },
        offers: { '@type': 'Offer', price: item.price_num, priceCurrency: 'USD' },
        category: item.category,
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
      <ServicesPage initialServicios={items} />
    </>
  );
}
