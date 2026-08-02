import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ServiceRequestButton } from '@/components/ServiceRequestButton';
import type { Servicio } from '@/hooks/useData';
import { imgSrc } from '@/lib/imageLoader';
import { findBySlug, serviceSlug } from '@/lib/slugify';
import { supabase } from '@/lib/supabase';
import { withRetry } from '@/lib/withRetry';

export const revalidate = 300;

const SITE_URL = 'https://www.bensofcg.com';

// Category slug -> display label
const CATEGORY_LABELS: Record<string, string> = {
  'contabilidad-finanzas': 'Contabilidad y Finanzas',
  'marketing-marca': 'Marketing y Marca',
  'soluciones-bi-digital': 'Soluciones BI y Digital',
  'administracion-gestion': 'Administración y Gestión',
};

async function getActiveServicios(): Promise<Servicio[]> {
  const { data, error } = await withRetry(() =>
    supabase
      .from('servicios')
      .select('*')
      .eq('is_active', true)
  );
  return error ? [] : (data as Servicio[]) || [];
}

function truncate(text: string, max = 155): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max + 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export async function generateStaticParams() {
  const servicios = await getActiveServicios();
  return servicios.map((service) => ({ slug: serviceSlug(service, servicios) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const servicios = await getActiveServicios();
  const service = findBySlug(servicios, slug);
  if (!service) notFound();
  const canonicalUrl = `/servicios/${slug}`;
  const description = truncate(service.subtitle || service.description);
  return {
    title: service.title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: service.title,
      description,
      type: 'website',
      url: `${SITE_URL}${canonicalUrl}`,
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const servicios = await getActiveServicios();
  const service = findBySlug(servicios, slug);
  if (!service) notFound();

  const canonicalUrl = `${SITE_URL}/servicios/${slug}`;
  const categoryLabel = CATEGORY_LABELS[service.category];
  const imageUrl = service.image ? imgSrc(service.image) : '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        '@id': `${canonicalUrl}#service`,
        name: service.title,
        description: service.description,
        category: categoryLabel || service.category,
        url: canonicalUrl,
        provider: {
          '@type': 'Organization',
          name: 'BENSO',
          url: SITE_URL,
        },
        offers: {
          '@type': 'Offer',
          url: canonicalUrl,
          price: service.price_num,
          priceCurrency: 'USD',
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Servicios', item: `${SITE_URL}/servicios` },
          { '@type': 'ListItem', position: 3, name: service.title },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container">
        <article className="service-detail">
          <Link href="/servicios" className="service-detail-back">
            ← Volver a servicios
          </Link>

          <div className="service-detail-header">
            <h1 className="service-detail-title">{service.title}</h1>
            {service.subtitle && <p className="service-detail-subtitle">{service.subtitle}</p>}
          </div>

          <p className="service-detail-label">Descripción</p>
          <p className="service-detail-desc">{service.description}</p>

          {service.includes && service.includes.length > 0 && (
            <>
              <p className="service-detail-includes-label">Qué incluye</p>
              <ul className="service-detail-includes">
                {service.includes.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </>
          )}

          {imageUrl && (
            <Image
              src={imageUrl}
              alt={service.title}
              width={1200}
              height={675}
              loading="lazy"
              unoptimized
              className="service-detail-image"
              style={{ width: '100%', height: 'auto' }}
            />
          )}

          <div className="service-detail-cta-row">
            <ServiceRequestButton servicio={service} />
          </div>
        </article>
      </div>
    </>
  );
}