'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { ScrollReveal, AnimatedCard, AnimatedSection, StaggerReveal, BentoCard, Icon, ImageGallery, RequestModal } from '@/components';
import Grainient from '@/components/Grainient';

interface RequestItem {
  title: string;
  price: string;
  priceNum: number;
  whatsappLink: string;
  type: 'servicio' | 'producto' | 'evento';
}

interface Commitment {
  icon: string;
  title: string;
  description: string;
}

const commitments: Commitment[] = [
  {
    icon: 'money',
    title: 'Rentabilidad sostenible',
    description:
      'El arte de construir negocios que sigan generando valor dentro de 20 años, para sus clientes y sus equipos.'
  },
  {
    icon: 'graduation',
    title: 'Formación profesional',
    description:
      'El conocimiento es el primer paso para cambiar cualquier aspecto de la realidad. Nuestro método de enseñanza está puesto a fomentar el pensamiento crítico en los sectores que liderarán el futuro empresarial.'
  },
  {
    icon: 'heart',
    title: 'Impacto social real',
    description:
      'Cada negocio que crece con nuestro acompañamiento genera empleo, dinamiza la economía y mejora la calidad de vida de toda su comunidad, porque toma las decisiones correctas.'
  }
];

interface Stat {
  icon: string;
  value: string;
  title: string;
  description: string;
}

const stats: Stat[] = [
  {
    icon: 'graduation',
    value: '+300',
    title: 'Emprendedores',
    description:
      'Formados en todo el país, con programas que van desde el marketing digital hasta la contabilidad básica y el liderazgo.'
  },
  {
    icon: 'trending',
    value: 'Récords',
    title: 'en ventas',
    description:
      'Clientes que baten récords luego de recibir asesorías personalizadas para el desarrollo visual y logístico de sus marcas.'
  },
  {
    icon: 'people',
    value: 'Comunidad',
    title: 'en crecimiento',
    description:
      'Nuestros alumnos se convierten en clientes y nuestros clientes en aliados de largo plazo.'
  },
  {
    icon: 'heart',
    value: '3',
    title: 'Alianzas de impacto social',
    description:
      'Hemos conectado con ONG nacionales que suman la red de apoyo local al bienestar animal y la salud mental en jóvenes y niños.'
  }
];

export function AboutPage() {
  const [requestItem, setRequestItem] = useState<RequestItem | null>(null);
  const [isRequestOpen, setIsRequestOpen] = useState(false);

  return (
    <>
      <ScrollReveal>
        <div className="container">
          <div className="section-title page-intro-title">
            <h2>Lo que nos mueve</h2>
          </div>

          <p className="about-intro">
            Trabajamos para que los emprendedores cubanos tengan la oportunidad de construir proyectos
            sólidos, sostenibles y con un acompañamiento profesional dedicado. Por eso, nuestra razón de
            ser no cabe en una misión ni en una visión tradicionales: nuestro equipo de jóvenes
            profesionales busca marcar la diferencia a través de un alto compromiso con:
          </p>

          <div className="bento-grid">
            {commitments.map((commitment, index) => (
              <AnimatedCard key={commitment.title} index={index}>
                <BentoCard className="toned-card about-commitment">
                  <Icon name={commitment.icon} />
                  <h3>{commitment.title}</h3>
                  <p>{commitment.description}</p>
                </BentoCard>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <div className="container">
          <div className="section-title">
            <h2>Somos un equipo joven, por eso estamos doblemente comprometidos</h2>
          </div>

          <div className="about-story">
            <p className="about-story-text">
              La idea del proyecto nació en 2023. Cursando la Licenciatura en Economía, Yissel, nuestra
              fundadora, entendió que el mundo no se cambia con grandes discursos, sino con acciones
              concretas. Inspirada en el modelo de las Big Four, inició dando los primeros pasos y, 2
              años después, el equipo del Proyecto ya ha formado a más de 300 emprendedores en el país y
              ha ampliado sus proyecciones hacia el desarrollo de herramientas automáticas para construir
              futuros rentables en el sector empresarial cubano.
            </p>

            <figure className="about-story-quote">
              <Icon name="quote" />
              <h3>El mundo no se cambia con grandes discursos, sino con acciones concretas.</h3>
              <figcaption className="about-story-author">— Yissel, fundadora de BENSO</figcaption>
            </figure>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <div className="container">
          <div className="section-title">
            <h2>En 2 años</h2>
          </div>

          <div className="about-stats">
            {stats.map((stat, index) => (
              <AnimatedCard className="about-stat" key={stat.title} index={index}>
                <Icon name={stat.icon} />
                <h3 className="about-stat-title">
                  <span className="about-stat-value">{stat.value}</span> {stat.title}
                </h3>
                <p className="about-stat-desc">{stat.description}</p>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <section className="gallery-section-wrap">
          <div className="container">
            <div className="section-title">
              <h2>Historias</h2>
            </div>
          </div>
          <ImageGallery />
          <div className="container">
            <p className="story-gallery-subtitle">
              Estas historias son un memorable viaje por los hitos, los talleres, los rostros y las
              experiencias que han marcado el camino del Proyecto BENSO.
            </p>
          </div>
        </section>
      </ScrollReveal>

      <AnimatedSection>
        <div className="cta-card">
          <div className="cta-card-grainient">
            <Grainient className="absolute inset-0" />
          </div>
          <div className="container section-cta after-gallery cta-card-content">
            <StaggerReveal>
              <h2>¿Listo para transformar tu negocio?</h2>
              <p>Agenda una cita y descubre cómo podemos ayudarte a escalar tus proyectos.</p>
              <button
                className="cta-button cta-button--light"
                onClick={() => {
                  setRequestItem({ title: 'Cita de consulta', price: '', priceNum: 0, whatsappLink: '', type: 'servicio' });
                  setIsRequestOpen(true);
                }}
              >
                <Calendar size={18} />
                Agendar cita
              </button>
            </StaggerReveal>
          </div>
        </div>
      </AnimatedSection>

      <RequestModal
        item={requestItem}
        isOpen={isRequestOpen}
        onClose={() => setIsRequestOpen(false)}
      />
    </>
  );
}
