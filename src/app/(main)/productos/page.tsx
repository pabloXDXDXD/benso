import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';
import { ProductsPage } from '@/components/pages/ProductsPage';
import type { Producto } from '@/hooks/useData';

export const metadata: Metadata = {
  title: 'Productos',
  description: 'Soluciones digitales y productos para potenciar tu negocio: pegatinas, posters, cuadros, tarjetas y más. Calidad y diseño profesional para emprendimientos.',
  openGraph: {
    title: 'Productos - BENSO',
    description: 'Soluciones digitales y productos para potenciar tu negocio con diseño profesional.',
  },
};

export default async function Page() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: productos } = await supabase
    .from('productos')
    .select('*')
    .eq('is_active', true)
    .order('popular', { ascending: false });

  const items = (productos || []) as Producto[];

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, i) => ({
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductsPage initialProductos={items} />
    </>
  );
}
