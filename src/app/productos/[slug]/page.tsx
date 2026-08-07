import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Package } from 'lucide-react';
import { PriceDisplay } from '@/components';
import { ProductPurchasePanel } from '@/components/ProductPurchasePanel';
import type { Producto } from '@/hooks/useData';
import { mapVariants } from '@/lib/variants';
import { imgSrc } from '@/lib/imageLoader';
import { findProductBySlug, productSlug } from '@/lib/slugify';
import { supabase } from '@/lib/supabase';
import { withRetry } from '@/lib/withRetry';

export const revalidate = 300;

const SITE_URL = 'https://www.bensofcg.com';

async function getActiveProductos(): Promise<Producto[]> {
  const { data, error } = await withRetry(() =>
    supabase
      .from('productos')
      .select('*')
      .eq('is_active', true)
      .order('popular', { ascending: false })
  );
  return error ? [] : ((data as Producto[]) || []).map(mapVariants);
}

function truncate(text: string, max = 155): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max + 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export async function generateStaticParams() {
  const productos = await getActiveProductos();
  return productos.map((product) => ({ slug: productSlug(product, productos) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const productos = await getActiveProductos();
  const product = findProductBySlug(productos, slug);
  if (!product) notFound();
  const canonicalUrl = `/productos/${slug}`;
  const description = truncate(product.description);
  return {
    title: product.title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: product.title,
      description,
      type: 'website',
      url: `${SITE_URL}${canonicalUrl}`,
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const productos = await getActiveProductos();
  const product = findProductBySlug(productos, slug);
  if (!product) notFound();

  const canonicalUrl = `${SITE_URL}/productos/${slug}`;
  const imageUrl = product.image ? imgSrc(product.image) : '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        '@id': `${canonicalUrl}#product`,
        name: product.title,
        description: product.description,
        ...(product.image ? { image: imageUrl.startsWith('http') ? imageUrl : `${SITE_URL}${imageUrl}` } : {}),
        category: product.category,
        brand: { '@type': 'Brand', name: 'BENSO' },
        sku: String(product.id),
        offers: {
          '@type': 'Offer',
          url: canonicalUrl,
          price: product.price_num,
          priceCurrency: 'CUP',
          availability: 'https://schema.org/InStock',
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Productos', item: `${SITE_URL}/productos` },
          { '@type': 'ListItem', position: 3, name: product.title },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container">
        <article className="product-detail">
          <Link href="/productos" className="product-detail-back">← Volver a productos</Link>
          <div className="product-detail-grid">
            <div className="product-detail-media">
              {imageUrl ? (
                <Image src={imageUrl} alt={product.title} width={1200} height={900} loading="lazy" unoptimized className="product-detail-image" />
              ) : (
                <div className="product-detail-image product-detail-image-placeholder"><Package size={48} opacity={0.25} /></div>
              )}
            </div>
            <div className="product-detail-info">
              <h1 className="product-detail-title">{product.title}</h1>
              <p className="product-detail-desc">{product.description}</p>
              <span className="product-detail-price"><PriceDisplay price={product.price} priceNum={product.price_num} /></span>
              <ProductPurchasePanel product={product} />
            </div>
          </div>
        </article>
      </div>
    </>
  );
}
