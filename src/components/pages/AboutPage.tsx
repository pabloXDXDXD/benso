'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { ScrollReveal, AnimatedCard, BentoCard, Icon, ImageGallery, RequestModal } from '@/components';

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

  return (
    <>
      <ScrollReveal className="cards-wrap">
        <div className="container cards-section">
          <div className="section-title page-intro-title">
            <h2>¿Por qué elegirnos?</h2>
          </div>

          <div className="bento-grid">
            <AnimatedCard>
              <BentoCard style={coloredCardStyle.secondary as any}>
                <Icon name="money" style={whiteIconStyle} />
                <h3 style={whiteH3Style}>Inversión Accesible</h3>
                <p style={whitePStyle}>Ofrecemos servicios de máxima calidad con facilidades de pago justas y personalizables.</p>
              </BentoCard>
            </AnimatedCard>

            <AnimatedCard index={1}>
              <BentoCard style={coloredCardStyle.accent as any}>
                <Icon name="people" style={whiteIconStyle} />
                <h3 style={whiteH3Style}>Atención Personalizada</h3>
                <p style={whitePStyle}>Nuestro asesoramiento se basa en conocer tu negocio en profundidad y ajustar las estrategias a tu realidad única.</p>
              </BentoCard>
            </AnimatedCard>

            <AnimatedCard index={2}>
              <BentoCard style={coloredCardStyle.primary as any}>
                <Icon name="check" style={whiteIconStyle} />
                <h3 style={whiteH3Style}>Acompañamiento Continuo</h3>
                <p style={whitePStyle}>Te mostramos el camino y te acompañamos en cada paso de la implementación.</p>
              </BentoCard>
            </AnimatedCard>

            <AnimatedCard index={3}>
              <BentoCard style={coloredCardStyle.secondary as any}>
                <Icon name="chart" style={whiteIconStyle} />
                <h3 style={whiteH3Style}>Resultados Medibles</h3>
                <p style={whitePStyle}>Medimos el rendimiento de nuestras estrategias por el impacto real que tengan sobre tu proyecto.</p>
              </BentoCard>
            </AnimatedCard>
          </div>
        </div>
      </ScrollReveal>

      <section className="gallery-section-wrap">
        <div className="container">
          <div className="section-title">
            <h2>Galería</h2>
          </div>
        </div>
        <ImageGallery />
      </section>

      <div className="container section-cta after-gallery">
        <h2>¿Listo para transformar tu negocio?</h2>
        <p>Agenda una cita y descubre cómo podemos ayudarte a alcanzar tus metas.</p>
        <button
          className="cta-button"
          onClick={() => {
            setRequestItem({ title: 'Cita de consulta', price: '', priceNum: 0, whatsappLink: '', type: 'servicio' });
            setIsRequestOpen(true);
          }}
        >
          <Calendar size={18} />
          Agendar cita
        </button>
      </div>

      <RequestModal
        item={requestItem}
        isOpen={isRequestOpen}
        onClose={() => setIsRequestOpen(false)}
      />
    </>
  );
}
