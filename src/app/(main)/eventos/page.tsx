import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';
import { EventsPage } from '@/components/pages/EventsPage';
import type { Evento } from '@/hooks/useData';

export const metadata: Metadata = {
  title: 'Eventos',
  description: 'Próximos eventos, talleres y capacitaciones para emprendedores. Mantente al día con las últimas tendencias en negocios y marketing digital.',
  openGraph: {
    title: 'Eventos - BENSO',
    description: 'Próximos eventos, talleres y capacitaciones para emprendedores en Cuba.',
  },
};

export default async function Page() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: eventos } = await supabase
    .from('eventos')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  const items = (eventos || []) as Evento[];

  const eventJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, i) => ({
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />
      <EventsPage initialEventos={items} />
    </>
  );
}
