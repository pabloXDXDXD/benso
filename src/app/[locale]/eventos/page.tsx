import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { EventsPage } from '@/components/pages/EventsPage';
import type { Evento } from '@/hooks/useData';
import { supabase } from '@/lib/supabase';
import { localizeItems } from '@/lib/supabase-i18n';
import { withRetry } from '@/lib/withRetry';
import { routing } from '@/i18n/routing';

export const revalidate = 300;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata.eventos' });

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
    },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { data: eventos, error: eventosError } = await withRetry(() =>
    supabase
      .from('eventos')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
  );

  const items = eventosError ? undefined : localizeItems((eventos || []) as Evento[], locale);

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