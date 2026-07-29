'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { ScrollReveal, AnimatedCard, BentoCard, Icon, ImageGallery, RequestModal } from '@/components';
import Grainient from '@/components/Grainient';
import { useTranslations } from 'next-intl';

interface RequestItem {
  title: string;
  price: string;
  priceNum: number;
  whatsappLink: string;
  type: 'servicio' | 'producto' | 'evento';
}

const coloredCardStyle = {
  primary: { background: 'var(--primary)', color: 'var(--white)', textShadow: '0 1px 2px rgba(0,0,0,0.2)' },
  secondary: { background: 'var(--secondary)', color: 'var(--white)', textShadow: '0 1px 2px rgba(0,0,0,0.2)' },
  accent: { background: 'var(--accent)', color: 'var(--white)', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }
};

const whiteH3Style = { color: 'var(--white)', textShadow: '0 1px 2px rgba(0,0,0,0.3)' };
const whitePStyle = { color: 'var(--white)', textShadow: '0 1px 2px rgba(0,0,0,0.2)' };
const whiteIconStyle = { color: 'var(--white)', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' };

export function AboutPage() {
  const [requestItem, setRequestItem] = useState<RequestItem | null>(null);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const t = useTranslations('about');
  const home = useTranslations('home');
  const common = useTranslations('common');

  return (
    <>
      <ScrollReveal className="cards-wrap">
        <div className="container cards-section">
          <div className="section-title page-intro-title">
            <h2>{t('sectionTitle')}</h2>
          </div>

          <div className="bento-grid">
            <AnimatedCard>
              <BentoCard style={coloredCardStyle.secondary as any}>
                <Icon name="money" style={whiteIconStyle} />
                <h3 style={whiteH3Style}>{t('cards.investment.title')}</h3>
                <p style={whitePStyle}>{t('cards.investment.description')}</p>
              </BentoCard>
            </AnimatedCard>

            <AnimatedCard index={1}>
              <BentoCard style={coloredCardStyle.accent as any}>
                <Icon name="people" style={whiteIconStyle} />
                <h3 style={whiteH3Style}>{t('cards.personalized.title')}</h3>
                <p style={whitePStyle}>{t('cards.personalized.description')}</p>
              </BentoCard>
            </AnimatedCard>

            <AnimatedCard index={2}>
              <BentoCard style={coloredCardStyle.primary as any}>
                <Icon name="check" style={whiteIconStyle} />
                <h3 style={whiteH3Style}>{t('cards.support.title')}</h3>
                <p style={whitePStyle}>{t('cards.support.description')}</p>
              </BentoCard>
            </AnimatedCard>

            <AnimatedCard index={3}>
              <BentoCard style={coloredCardStyle.secondary as any}>
                <Icon name="chart" style={whiteIconStyle} />
                <h3 style={whiteH3Style}>{t('cards.results.title')}</h3>
                <p style={whitePStyle}>{t('cards.results.description')}</p>
              </BentoCard>
            </AnimatedCard>
          </div>
        </div>
      </ScrollReveal>

      <section className="gallery-section-wrap">
        <div className="container">
          <div className="section-title">
            <h2>{t('gallery')}</h2>
          </div>
        </div>
        <ImageGallery />
      </section>

      <div className="cta-card">
        <div className="cta-card-grainient">
          <Grainient className="absolute inset-0" />
        </div>
        <div className="container section-cta after-gallery cta-card-content">
          <h2>{home('sections.ctaTitle')}</h2>
          <p>{home('sections.ctaText')}</p>
          <button
            className="cta-button cta-button--light"
            onClick={() => {
              setRequestItem({ title: common('appointmentTitle'), price: '', priceNum: 0, whatsappLink: '', type: 'servicio' });
              setIsRequestOpen(true);
            }}
          >
            <Calendar size={18} />
            {home('sections.ctaButton')}
          </button>
        </div>
      </div>

      <RequestModal
        item={requestItem}
        isOpen={isRequestOpen}
        onClose={() => setIsRequestOpen(false)}
      />
    </>
  );
}
