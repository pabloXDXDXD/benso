import { getTranslations, setRequestLocale } from 'next-intl/server';
import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';
import { ProductsPage } from '@/components/pages/ProductsPage';
import type { Producto } from '@/hooks/useData';
import { localizeItems } from '@/lib/supabase-i18n';
import { routing } from '@/i18n/routing';

export const revalidate = 300;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata.productos' });

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

  const { data: productos, error: productosError } = await supabase
    .from('productos')
    .select('*')
    .eq('is_active', true)
    .order('popular', { ascending: false });

  const items = productosError ? undefined : localizeItems((productos || []) as Producto[], locale);

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: (items || []).map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: item.title,
        description: item.description,
        image: item.image ? `https://bensofcg.com${item.image}` : undefined,
        category: item.category,
        offers: {
          '@type': 'Offer',
          price: item.price_num,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <ProductsPage initialProductos={items} />
    </>
  );
}