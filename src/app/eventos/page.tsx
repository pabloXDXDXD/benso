import type { Metadata } from 'next';
import { EventsPage } from '@/components/pages/EventsPage';
import type { Evento } from '@/hooks/useData';
import { supabase } from '@/lib/supabase';
import { withRetry } from '@/lib/withRetry';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Eventos y Talleres para Emprendedores en Cuba',
  description: 'Talleres, cursos y eventos para emprendedores en Cuba. Inscríbete y adquiere las habilidades clave para hacer crecer tu negocio con BENSO.',
  openGraph: {
    title: 'Eventos y Talleres - BENSO',
    description: 'Talleres, cursos y eventos para emprendedores en Cuba. Inscríbete ya.',
  },
};

export default async function Page() {
  const { data: eventos, error: eventosError } = await withRetry(() =>
    supabase
      .from('eventos')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
  );

  const items = eventosError ? undefined : (eventos || []) as Evento[];

  const eventJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: (items || []).map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Event',
        name: item.title,
        description: item.description,
        eventStatus: item.status === 'En Curso'
          ? 'https://schema.org/EventScheduled'
          : 'https://schema.org/EventScheduled',
        startDate: item.date,
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }} />
      <EventsPage initialEventos={items} />
    </>
  );
}
