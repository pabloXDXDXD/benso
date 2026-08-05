import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BadgeCheck, Info } from 'lucide-react';
import { CalendarIcon, StatusIcon } from '@/components';
import { EventRegistrationButton } from '@/components/EventRegistrationButton';
import { NotifyMeButton } from '@/components/NotifyMeButton';
import type { Evento } from '@/hooks/useData';
import { imgSrc } from '@/lib/imageLoader';
import { eventoSlug, findEventoBySlug } from '@/lib/slugify';
import { supabase } from '@/lib/supabase';
import { withRetry } from '@/lib/withRetry';

export const revalidate = 300;

const SITE_URL = 'https://www.bensofcg.com';

const CATEGORY_BACK: Record<string, { path: string; label: string }> = {
  taller: { path: '/formacion/talleres', label: 'Talleres' },
  curso: { path: '/formacion/cursos', label: 'Cursos' },
  evento: { path: '/formacion/eventos', label: 'Eventos' },
};

async function getActiveEventos(): Promise<Evento[]> {
  const { data, error } = await withRetry(() =>
    supabase
      .from('eventos')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
  );
  return error ? [] : (data as Evento[]) || [];
}

function truncate(text: string, max = 155): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max + 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export async function generateStaticParams() {
  const eventos = await getActiveEventos();
  return eventos.map((event) => ({ slug: eventoSlug(event, eventos) }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const eventos = await getActiveEventos();
  const event = findEventoBySlug(eventos, slug);
  if (!event) notFound();
  const canonicalUrl = `/formacion/${slug}`;
  const description = truncate(event.description);
  return {
    title: event.title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: event.title,
      description,
      type: 'website',
      url: `${SITE_URL}${canonicalUrl}`,
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const eventos = await getActiveEventos();
  const event = findEventoBySlug(eventos, slug);
  if (!event) notFound();

  const canonicalUrl = `${SITE_URL}/formacion/${slug}`;
  const categoria = event.categoria || 'evento';
  const back = CATEGORY_BACK[categoria] ?? CATEGORY_BACK.evento;
  const imageUrl = event.image ? imgSrc(event.image) : '';

  const eventStatus =
    event.status === 'Proximamente'
      ? 'https://schema.org/EventScheduled'
      : event.status === 'En Curso'
        ? 'https://schema.org/EventActive'
        : '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'EducationEvent',
        name: event.title,
        description: event.description,
        url: canonicalUrl,
        ...(event.date && { startDate: event.date }),
        ...(eventStatus && { eventStatus }),
        organizer: { '@type': 'Organization', name: 'BENSO', url: SITE_URL },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: back.label, item: `${SITE_URL}${back.path}` },
          { '@type': 'ListItem', position: 3, name: event.title },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container">
        <article className="service-detail">
          <Link href={back.path} className="service-detail-back">← Volver a {back.label.toLowerCase()}</Link>
          <div className="service-detail-header">
            <h1 className="service-detail-title">{event.title}</h1>
            <div className="event-tags-row" style={{ marginTop: '0.75rem' }}>
              <span className="event-status-tag"><StatusIcon status={event.status} />{event.status || 'Proximamente'}</span>
              {event.date && (<span className="event-date-tag"><CalendarIcon />{event.date}</span>)}
              <span className="event-cert-tag"><BadgeCheck size={13} />Incluye certificado</span>
            </div>
          </div>
          <p className="service-detail-label">Descripción</p>
          <p className="service-detail-desc">{event.description}</p>
          {event.duracion && (
            <>
              <p className="service-detail-label">Duración</p>
              <p className="service-detail-desc">{event.duracion}</p>
            </>
          )}
          {event.modalidad && (
            <>
              <p className="service-detail-label">Modalidad</p>
              <p className="service-detail-desc">{event.modalidad}</p>
            </>
          )}
          {event.modulos && event.modulos.length > 0 && (
            <>
              <p className="service-detail-includes-label">Plan temático</p>
              <ol className="service-detail-includes">
                {event.modulos.map((mod, index) => (
                  <li key={index}>
                    {mod.title}
                    {mod.description ? ` — ${mod.description}` : ''}
                  </li>
                ))}
              </ol>
            </>
          )}
          {event.date && (
            <>
              <p className="service-detail-label">Fecha de inicio</p>
              <p className="service-detail-desc">{event.date}</p>
            </>
          )}
          {imageUrl && (
            <Image src={imageUrl} alt={event.title} width={1200} height={675} loading="lazy" unoptimized className="service-detail-image" style={{ width: '100%', height: 'auto' }} />
          )}
          {event.disclaimer && (
            <div className="service-detail-notice">
              <Info size={18} />
              <p>{event.disclaimer}</p>
            </div>
          )}
          <div className="service-detail-cta-row">
            {event.status === 'En desarrollo' ? (
              <NotifyMeButton evento={event} />
            ) : (
              <EventRegistrationButton evento={event} tipo={categoria as 'taller' | 'curso' | 'evento'} />
            )}
          </div>
        </article>
      </div>
    </>
  );
}
