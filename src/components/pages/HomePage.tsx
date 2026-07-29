'use client';

import { useState, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { ShoppingCart, Calendar } from 'lucide-react';
import { BentoCard, Icon, FAQAccordion, ScrollReveal, AnimatedCard, AnimatedSection, StatusIcon, CalendarIcon, PriceDisplay, LogoLoop, ProductsGridSkeleton, ServicesGridSkeleton, EventsGridSkeleton, VariantSelectionDialog, EventRegistrationForm } from '@/components';
import Grainient from '@/components/Grainient';
import { useTranslations } from 'next-intl';

import TestimonialsLoop from '@/components/TestimonialsLoop';
import { useCart } from '@/hooks/useCart';
import { useProductos, useServicios, useEventos, useTestimonials, useFaqs } from '@/hooks/useData';
import type { Producto, Variant, Testimonial, Faq } from '@/hooks/useData';
import { imgSrc } from '@/lib/imageLoader';

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

  const [variantProduct, setVariantProduct] = useState<Producto | null>(null);
  const [isVariantOpen, setIsVariantOpen] = useState(false);
  const [registrationEvent, setRegistrationEvent] = useState<{ id: number; title: string } | null>(null);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const { addItem } = useCart();
  const t = useTranslations('home');
  const common = useTranslations('common');
  const products = useTranslations('products');
  const events = useTranslations('events');
  const { productos, loading: productosLoading } = useProductos();
  const { servicios, loading: serviciosLoading } = useServicios();
  const { eventos, loading: eventosLoading } = useEventos();
  const { testimonials } = useTestimonials(fallbackTestimonials);
  const { faqs: faqItems } = useFaqs(fallbackFaqs);
  const showServicios = !mounted || serviciosLoading;
  const showProductos = !mounted || productosLoading;
  const showEventos = !mounted || eventosLoading;

  const openVariantDialog = (product: Producto) => {
    setVariantProduct(product);
    setIsVariantOpen(true);
  };

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
              <span>{t('hero.titleLine1')}</span>{' '}
              <span className="hero-highlight">
                {t('hero.titleLine2')}
              </span>
            </h1>
            <p className="slogan">
              {t('hero.slogan')}
            </p>
            <div className="hero-buttons">
              <Link href="/contacto" className="hero-cta">
                {t('hero.appointment')}
              </Link>
              <Link href="/nosotros" className="hero-cta-outline">
                {t('hero.aboutUs')}
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
            <h2><span>{t('sections.services')}</span></h2>
            <Link href="/servicios" className="text-cta-link">
              {common('viewAll')} →
            </Link>
          </div>
          
          {showServicios ? (
            <ServicesGridSkeleton count={3} />
          ) : servicios.length === 0 ? (
            <div className="empty-section">
              <p>{t('empty.services')}</p>
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
                  <p>{service.description}</p>
                  <span className="card-price"><PriceDisplay price={service.price} priceNum={service.price_num} /></span>
                  <div className="card-actions">
                    <button
                      className="btn-add-cart btn-add-cart-full"
                      onClick={() => addItem(service.title, 'Único', service.price_num)}
                    >
                      <ShoppingCart size={16} />
                      <span>{common('addToCart')}</span>
                    </button>
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
            <h2><span>{t('sections.featuredProducts')}</span></h2>
            <Link href="/productos" className="text-cta-link">
              {common('seeMore')} →
            </Link>
          </div>
          
          {showProductos ? (
            <ProductsGridSkeleton count={3} />
          ) : featuredProducts.length === 0 ? (
            <div className="empty-section">
              <p>{t('empty.products')}</p>
              <Link href="/productos" className="text-cta-link">{common('viewAllProducts')} →</Link>
            </div>
          ) : (
          <div className="bento-grid bento-grid-center">
            {featuredProducts.map((product, index) => (
              <AnimatedCard key={product.id} index={index}>
                <BentoCard className="interactive-card service-card">
                  {product.popular && <span className="popular-tag">{products('popularTag')}</span>}
                  {product.image ? (
                    <div className="product-image-container">
                      <Image src={imgSrc(product.image)} alt={product.title} width={600} height={200} loading="lazy" unoptimized style={{ width: '100%', height: 'auto' }} />
                    </div>
                  ) : (
                    <div className="product-image-placeholder">
                      <span>{products('imageNotAvailable')}</span>
                    </div>
                  )}
                  <h3>{product.title}</h3>
                  <p>{product.description}</p>
                  <span className="card-price"><PriceDisplay price={product.price} priceNum={product.price_num} /></span>
                  <div className="card-actions">
                    <button
                      className="btn-add-cart btn-add-cart-full"
                      onClick={() => {
                        if (product.variants && product.variants.length > 0) {
                          openVariantDialog(product);
                        } else {
                          addItem(product.title, 'Único', product.price_num);
                        }
                      }}
                    >
                      <ShoppingCart size={16} />
                      <span>{common('addToCart')}</span>
                    </button>
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
            <h2><span>{t('sections.upcomingEvents')}</span></h2>
            <Link href="/eventos" className="text-cta-link">
              {common('seeMore')} →
            </Link>
          </div>
          
          {showEventos ? (
            <EventsGridSkeleton count={2} />
          ) : upcomingEvents.length === 0 ? (
            <div className="empty-section">
              <p>{t('empty.events')}</p>
              <Link href="/eventos" className="text-cta-link">{common('viewHistory')} →</Link>
            </div>
          ) : (
          <div className="bento-grid-events">
            {upcomingEvents.map((event, index) => (
              <AnimatedCard key={event.id} index={index}>
                <BentoCard className="interactive-card toned-card">
                  <h3>{event.title}</h3>
                  <div className="event-tags-row">
                    <span className="event-status-tag"><StatusIcon status={event.status} />{event.status}</span>
                    <span className="event-date-tag">
                      <CalendarIcon />
                      {event.date}
                    </span>
                  </div>
                  <p>{event.description}</p>
                  <div className="card-actions event-card-actions">
                    <button
                      className="event-cta-link"
                      onClick={() => openRegistration(event.id, event.title)}
                    >
                      <span>{events('register')}</span>
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
            <h2>{t('sections.testimonials')}</h2>
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
              {t('sections.faq')}
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
          <h2>{t('sections.ctaTitle')}</h2>
          <p>{t('sections.ctaText')}</p>
          <Link href="/contacto" className="cta-button cta-button--light">
            <Calendar size={18} />
            {t('sections.ctaButton')}
          </Link>
        </div>
      </div>
      </div>

      {variantProduct && (
        <VariantSelectionDialog
          product={variantProduct}
          isOpen={isVariantOpen}
          onClose={() => { setIsVariantOpen(false); setVariantProduct(null); }}
        />
      )}

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
