import { getTranslations, setRequestLocale } from 'next-intl/server';
import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';
import { ServicesPage } from '@/components/pages/ServicesPage';
import type { Servicio } from '@/hooks/useData';
import { localizeItems } from '@/lib/supabase-i18n';
import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata.servicios' });

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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: servicios } = await supabase
    .from('servicios')
    .select('*')
    .eq('is_active', true);

  const items = localizeItems((servicios || []) as Servicio[], locale);

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, i) => ({
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