'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, BadgeCheck, ArrowRight } from 'lucide-react';
import { BentoCard, Icon, FAQAccordion, ScrollReveal, AnimatedCard, AnimatedSection, StatusIcon, CalendarIcon, PriceDisplay, LogoLoop, ProductsGridSkeleton, ServicesGridSkeleton, EventsGridSkeleton, EventRegistrationForm } from '@/components';
import Grainient from '@/components/Grainient';

import TestimonialsLoop from '@/components/TestimonialsLoop';
import { useProductos, useServicios, useEventos, useTestimonials, useFaqs } from '@/hooks/useData';
import type { Producto, Testimonial, Faq, Evento } from '@/hooks/useData';
import { imgSrc } from '@/lib/imageLoader';
import { serviceSlug, productSlug } from '@/lib/slugify';

const CATEGORIA_LABELS: Record<string, string> = {
  taller: 'Taller',
  curso: 'Curso',
  evento: 'Evento',
};

function categoriaLabel(event: Evento): string {
  return CATEGORIA_LABELS[event.categoria || 'evento'] || 'Evento';
}

function getProductImage(category: string, productImage: string): string {
  if (productImage && productImage.trim() !== '') {
    return productImage;
  }
  return '';
}

export function HomePage({ fallbackTestimonials, fallbackFaqs }: {
  fallbackTestimonials?: Testimonial[];
  fallbackFaqs?: Faq[];
} = {}) {
  const [mounted, setMounted] = useState(false);

  const [registrationEvent, setRegistrationEvent] = useState<{ id: number; title: string } | null>(null);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const { productos, loading: productosLoading } = useProductos();
  const { servicios, loading: serviciosLoading } = useServicios();
  const { eventos, loading: eventosLoading } = useEventos();
  const { testimonials } = useTestimonials(fallbackTestimonials);
  const { faqs: faqItems } = useFaqs(fallbackFaqs);
  const showServicios = !mounted || serviciosLoading;
  const showProductos = !mounted || productosLoading;
  const showEventos = !mounted || eventosLoading;

  const openRegistration = (eventId: number, eventTitle: string) => {
    setRegistrationEvent({ id: eventId, title: eventTitle });
    setIsRegistrationOpen(true);
  };

  useEffect(() => { setMounted(true); }, []);

  const featuredProducts = useMemo(() => {
    const hasImage = (p: Producto) => p.image && p.image.trim() !== '';
    const popular = productos.filter(p => p.popular);
    const popularWithImages = popular.filter(hasImage);
    const popularWithoutImages = popular.filter(p => !hasImage(p));

    if (popular.length >= 3) {
      const sorted = [...popularWithImages, ...popularWithoutImages];
      return sorted.slice(0, 3);
    }

    const others = productos.filter(p => !p.popular);
    const othersWithImages = others.filter(hasImage);
    const othersWithoutImages = others.filter(p => !hasImage(p));

    const fillers = [...othersWithImages, ...othersWithoutImages];
    return [...popular, ...fillers].slice(0, 3);
  }, [productos]);

  const upcomingEvents = eventos
    .filter(e => e.status === 'Proximamente')
    .slice(0, 2);

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-grainient-bg">
          <Grainient className="absolute inset-0" />
        </div>
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="hero-content">
            <h1>
              <span>Asesoramiento, Herramientas Digitales y Capacitación</span>{' '}
              <span className="hero-highlight">
                para Emprendedores
              </span>
            </h1>
            <p className="slogan">
              Hacemos tu negocio rentable y sostenible con automatización financiera, estrategias de marca y formación de equipos
            </p>
            <div className="hero-buttons">
              <Link href="/contacto" className="hero-cta">
                Agendar cita
              </Link>
              <Link href="/nosotros" className="hero-cta-outline">
                Conócenos
              </Link>
            </div>
          </div>
        </div>

      </section>

      {/* ✨ HIDDEN — Brands Marquee Section (restore by removing the comment wrapper)
      <ScrollReveal>
        <div className="container">
          <div className="section-title">
            <h2 style={{ margin: 0, color: 'var(--primary)', marginBottom: '1rem' }}>
              Emprendimientos que confían en nosotros
            </h2>
          </div>
        </div>
        <LogoLoop
          logos={[
            { node: <img src="/assets/logos/MARAYOSVA (1).svg" alt="MARAYOSVA" /> },
            { node: <img src="/assets/logos/Info Impress.svg" alt="Info Impress" /> },
            { node: <img src="/assets/logos/Divas'Store.svg" alt="Divas Store" /> },
            { node: <img src="/assets/logos/Estilo Natural3.svg" alt="Estilo Natural" /> },
            { node: <img src="/assets/logos/AfroDiSiAcá .svg" alt="AfroDiSiAcá" /> },
          ]}
          direction="left"
          speed={50}
        />
      </ScrollReveal>
      */}

      <div className="home-content">

      {/* Services Preview Section */}
      <ScrollReveal>
        <div className="container">
          <div className="section-title section-title-home">
            <h2><span>Nuestros servicios</span></h2>
            <Link href="/servicios" className="text-cta-link">
              Ver todos →
            </Link>
          </div>
          
          {showServicios ? (
            <ServicesGridSkeleton count={3} />
          ) : servicios.length === 0 ? (
            <div className="empty-section">
              <p>No hay servicios disponibles por el momento.</p>
            </div>
          ) : (
          <div className="bento-grid bento-grid-center">
            {servicios.slice(0, 3).map((service, index) => (
              <AnimatedCard key={service.id} index={index}>
                <BentoCard className="interactive-card service-card toned-card">
                  <div className="service-card-header">
                    <Icon name={service.icon} />
                    <h3>{service.title}</h3>
                  </div>
                  {service.subtitle && <p className="service-card-subtitle">{service.subtitle}</p>}
                  <div className="card-actions">
                    <Link href={`/servicios/${serviceSlug(service, servicios)}`} className="event-cta-link">
                      <span>Ver más info</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="arrow-right"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </Link>
                  </div>
                </BentoCard>
              </AnimatedCard>
            ))}
          </div>
          )}
        </div>
      </ScrollReveal>

{/* Featured Products Section */}
      <ScrollReveal>
        <div className="container">
          <div className="section-title section-title-home">
            <h2><span>Productos destacados</span></h2>
            <Link href="/productos" className="text-cta-link">
              Ver más →
            </Link>
          </div>
          
          {showProductos ? (
            <ProductsGridSkeleton count={3} />
          ) : featuredProducts.length === 0 ? (
            <div className="empty-section">
              <p>No hay productos destacados por el momento.</p>
              <Link href="/productos" className="text-cta-link">Ver todos los productos →</Link>
            </div>
          ) : (
          <div className="bento-grid bento-grid-center">
            {featuredProducts.map((product, index) => (
              <AnimatedCard key={product.id} index={index}>
                <BentoCard
                  className={`interactive-card service-card${product.popular ? ' popular-card' : ''}`}
                  dataCategory={product.category}
                >
                  {product.popular && <span className="popular-tag">#popular</span>}
                  {product.image ? (
                    <div className="product-image-container">
                      <Image src={imgSrc(product.image)} alt={product.title} width={600} height={200} loading="lazy" unoptimized />
                    </div>
                  ) : (
                    <div className="product-image-placeholder">
                      <span>Imagen no disponible</span>
                    </div>
                  )}
                  <h3>{product.title}</h3>
                  <p>{product.description}</p>
                  <span className="card-price"><PriceDisplay price={product.price} priceNum={product.price_num} /></span>
                  <div className="card-actions">
                    <Link href={`/productos/${productSlug(product, productos)}`} className="event-cta-link">
                      <span>Ver detalles</span>
                      <ArrowRight size={16} className="arrow-right" />
                    </Link>
                  </div>
                </BentoCard>
              </AnimatedCard>
))}
          </div>
          )}
        </div>
      </ScrollReveal>

{/* Current Events Section */}
      <ScrollReveal>
        <div className="container">
          <div className="section-title section-title-home">
            <h2><span>Próximas formaciones</span></h2>
            <Link href="/formacion/talleres" className="text-cta-link">
              Ver más →
            </Link>
          </div>
          
          {showEventos ? (
            <EventsGridSkeleton count={2} />
          ) : upcomingEvents.length === 0 ? (
            <div className="empty-section">
              <p>No hay próximas formaciones por el momento.</p>
              <Link href="/formacion/talleres" className="text-cta-link">Ver toda la formación →</Link>
            </div>
          ) : (
          <div className="bento-grid-events">
            {upcomingEvents.map((event, index) => (
              <AnimatedCard key={event.id} index={index}>
                <BentoCard className="interactive-card toned-card">
                  <div className="service-card-header">
                    <Icon name={event.icon || 'calendar'} />
                    <h3>{event.title}</h3>
                  </div>
                  <div className="event-tags-row">
                    <span className="event-category-tag">{categoriaLabel(event)}</span>
                    <span className="event-status-tag"><StatusIcon status={event.status} />{event.status === 'En Curso' ? 'En Curso' : 'Proximamente'}</span>
                    {event.date && (
                      <span className="event-date-tag">
                        <CalendarIcon />
                        {event.date}
                      </span>
                    )}
                    <span className="event-cert-tag">
                      <BadgeCheck size={13} />
                      Incluye certificado
                    </span>
                  </div>
                  <p>{event.description}</p>
                  <div className="card-actions event-card-actions">
                    <button
                      className="event-cta-link"
                      onClick={() => openRegistration(event.id, event.title)}
                    >
                      <span>Inscribirme</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="arrow-right"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </button>
                  </div>
                </BentoCard>
              </AnimatedCard>
))}
          </div>
          )}
        </div>
      </ScrollReveal>

{/* Testimonials Section */}
      <ScrollReveal>
        <div className="container">
          <div className="section-title section-title-home">
            <h2>Lo que dicen nuestros clientes</h2>
          </div>

          <div className="testimonials-section">
            {/* Fila 1: primeros 4 testimonios */}
            <TestimonialsLoop testimonials={testimonials.slice(0, 4)} direction="left" speed={50} />
            {/* Fila 2: últimos 3 testimonios */}
            <TestimonialsLoop testimonials={testimonials.slice(4)} direction="right" speed={50} />
          </div>
        </div>
      </ScrollReveal>

      {/* FAQ Section */}
      <ScrollReveal>
        <div className="container">
          <div className="section-title-center">
            <h2 style={{ margin: 0 }}>
              Preguntas Frecuentes
            </h2>
          </div>
          
          <AnimatedSection>
            <FAQAccordion items={faqItems} />
          </AnimatedSection>
        </div>
      </ScrollReveal>

      <div className="cta-card">
        <div className="cta-card-grainient">
          <Grainient className="absolute inset-0" />
        </div>
        <div className="container section-cta cta-card-content">
          <h2>¿Listo para transformar tu negocio?</h2>
          <p>Agenda una cita y descubre cómo podemos ayudarte a escalar tus proyectos.</p>
          <Link href="/contacto" className="cta-button cta-button--light">
            <Calendar size={18} />
            Agendar cita
          </Link>
        </div>
      </div>
      </div>

      {registrationEvent && (
        <EventRegistrationForm
          eventoId={registrationEvent.id}
          eventoTitle={registrationEvent.title}
          isOpen={isRegistrationOpen}
          onClose={() => { setIsRegistrationOpen(false); setRegistrationEvent(null); }}
        />
      )}
    </>
  );
}
