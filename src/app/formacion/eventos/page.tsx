import type { Metadata } from 'next';
import { FormacionPage } from '@/components/pages/FormacionPage';
import type { Evento } from '@/hooks/useData';
import { imgSrc } from '@/lib/imageLoader';
import { eventoSlug } from '@/lib/slugify';
import { supabase } from '@/lib/supabase';
import { withRetry } from '@/lib/withRetry';

export const revalidate = 300;

const SITE_URL = 'https://www.bensofcg.com';

export const metadata: Metadata = {
  title: 'Eventos para Emprendedores en Cuba | BENSO',
  description: 'Eventos para emprendedores en Cuba. Mantente al día con las actividades y encuentros de BENSO.',
  alternates: { canonical: '/formacion/eventos/' },
  openGraph: {
    title: 'Eventos para Emprendedores - BENSO',
    description: 'Eventos para emprendedores en Cuba. Participa ya.',
  },
};

export default async function Page() {
  const { data: eventos, error: eventosError } = await withRetry(() =>
    supabase
      .from('eventos')
      .select('*')
      .eq('is_active', true)
      .eq('categoria', 'evento')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
  );

  const items = eventosError ? undefined : (eventos || []) as Evento[];

  // La columna `date` guarda texto libre de UI (ej. "Septiembre 2026", "Noviembre - Enero").
  // Google exige ISO 8601 y recomienda solo fecha cuando no se conoce la hora exacta
  // (https://developers.google.com/search/docs/data-types/event), así que se convierte al
  // primer día del mes (2026-09-01). Devuelve undefined si no hay mes y año parseables;
  // esos eventos se omiten del JSON-LD en lugar de emitir fechas falsas.
  const MONTHS: Record<string, number> = {
    enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
    julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
  };
  function toIsoDate(dateStr: string): string | undefined {
    const lower = dateStr.toLowerCase();
    const isoMatch = lower.match(/\d{4}-\d{2}-\d{2}/);
    if (isoMatch) return isoMatch[0];
    const yearMatch = lower.match(/\b(20\d{2})\b/);
    const monthMatch = lower.match(/\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/);
    if (!monthMatch || !yearMatch) return undefined;
    const month = MONTHS[monthMatch[1]];
    return `${yearMatch[1]}-${String(month).padStart(2, '0')}-01`;
  }

  // Google recomienda `endDate` cuando el evento dura varios días. La columna `duracion`
  // guarda texto libre (ej. "2 semanas"); si es parseable se suma al inicio (día final
  // inclusive). Se usa Date.UTC para no depender de la zona horaria del servidor.
  function toEndDate(startDate: string, duracion?: string): string | undefined {
    if (!duracion) return undefined;
    const match = duracion.toLowerCase().match(/\b(\d+)\s*semanas?\b/);
    if (!match) return undefined;
    const weeks = parseInt(match[1], 10);
    if (!Number.isFinite(weeks) || weeks <= 0) return undefined;
    const [year, month, day] = startDate.split('-').map(Number);
    const end = new Date(Date.UTC(year, month - 1, day + weeks * 7 - 1));
    return end.toISOString().slice(0, 10);
  }

  const eventJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: (items || [])
      .map((item, i) => {
        const startDate = toIsoDate(item.date);
        const endDate = toEndDate(startDate ?? '', item.duracion);
        if (!startDate) return null;
        const image = item.image ? imgSrc(item.image) : '';
        return {
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Event',
            name: item.title,
            description: item.description,
            url: `${SITE_URL}/formacion/${eventoSlug(item, items || [])}`,
            eventStatus: 'https://schema.org/EventScheduled',
            startDate,
            ...(endDate ? { endDate } : {}),
            // Google solo acepta `location` con @type Place + address (PostalAddress);
            // `VirtualLocation` genera el error GSC "El tipo de objeto del campo location no es válido".
            location: {
              '@type': 'Place',
              name: item.modalidad || 'Online',
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'La Habana',
                addressCountry: 'CU',
              },
            },
            organizer: {
              '@type': 'Organization',
              name: 'BENSO',
              url: SITE_URL,
            },
            ...(image ? { image: image.startsWith('http') ? image : `${SITE_URL}${image}` } : {}),
          },
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }} />
      <FormacionPage categoria="evento" initialEventos={items} />
    </>
  );
}
