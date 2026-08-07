import type { Metadata } from 'next';
import { ProductsPage } from '@/components/pages/ProductsPage';
import type { Producto } from '@/hooks/useData';
import { imgSrc } from '@/lib/imageLoader';
import { supabase } from '@/lib/supabase';
import { withRetry } from '@/lib/withRetry';

export const revalidate = 300;

const SITE_URL = 'https://www.bensofcg.com';

export const metadata: Metadata = {
  title: 'Productos Digitales y Diseño para tu Negocio',
  description: 'Soluciones digitales, papelería, cartelería y diseño profesional para tu negocio en Cuba. Explora nuestra tienda y encuentra productos que potencien tu marca.',
  openGraph: {
    title: 'Productos Digitales y Diseño - BENSO',
    description: 'Soluciones digitales, papelería y diseño profesional para tu negocio en Cuba.',
  },
};

export default async function Page() {
  const { data: productos, error: productosError } = await withRetry(
    () =>
      supabase
        .from('productos')
        .select('*')
        .eq('is_active', true)
        .order('popular', { ascending: false }),
    1
  );

  const items = productosError ? undefined : (productos || []) as Producto[];

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: (items || []).map((item, i) => {
      const image = item.image ? imgSrc(item.image) : '';
      return {
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: item.title,
          description: item.description,
          ...(image ? { image: image.startsWith('http') ? image : `${SITE_URL}${image}` } : {}),
          category: item.category,
          brand: { '@type': 'Brand', name: 'BENSO' },
          sku: String(item.id),
          offers: {
            '@type': 'Offer',
            price: item.price_num,
            priceCurrency: 'CUP',
            availability: 'https://schema.org/InStock',
            hasMerchantReturnPolicy: {
              '@type': 'MerchantReturnPolicy',
              applicableCountry: 'CU',
              returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
            },
          },
        },
      };
    }),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <ProductsPage initialProductos={items} />
    </>
  );
}
