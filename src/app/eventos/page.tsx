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

  // La columna `date` guarda texto libre de UI (ej. "Septiembre 2026", "Noviembre - Enero").
  // schema.org exige ISO 8601 (2026-09-01T00:00:00-05:00), así que se convierte al primer
  // día del mes a medianoche, zona horaria de Cuba (UTC-5). Devuelve undefined si no hay
  // mes y año parseables; esos eventos se omiten del JSON-LD en lugar de emitir fechas falsas.
  const MONTHS: Record<string, number> = {
    enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
    julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
  };
  function toIsoDate(dateStr: string): string | undefined {
    const lower = dateStr.toLowerCase();
    const isoMatch = lower.match(/\d{4}-\d{2}-\d{2}/);
    if (isoMatch) return `${isoMatch[0]}T00:00:00-05:00`;
    const yearMatch = lower.match(/\b(20\d{2})\b/);
    const monthMatch = lower.match(/\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/);
    if (!monthMatch || !yearMatch) return undefined;
    const month = MONTHS[monthMatch[1]];
    return `${yearMatch[1]}-${String(month).padStart(2, '0')}-01T00:00:00-05:00`;
  }

  const eventJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: (items || [])
      .map((item, i) => {
        const startDate = toIsoDate(item.date);
        if (!startDate) return null;
        return {
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Event',
            name: item.title,
            description: item.description,
            eventStatus: 'https://schema.org/EventScheduled',
            startDate,
            location: { '@type': 'VirtualLocation', name: 'Online' },
            organizer: {
              '@type': 'Organization',
              name: 'BENSO',
              url: 'https://www.bensofcg.com',
            },
            ...(item.image ? { image: item.image } : {}),
          },
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }} />
      <EventsPage initialEventos={items} />
    </>
  );
}
