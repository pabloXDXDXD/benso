'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Calendar, BadgeCheck, RefreshCw } from 'lucide-react';
import { BentoCard, ScrollReveal, AnimatedCard, AnimatedSection, StaggerReveal, StatusIcon, CalendarIcon, EventsGridSkeleton, RequestModal, Icon } from '@/components';
import Grainient from '@/components/Grainient';
import { useEventos, type Evento } from '@/hooks/useData';
import { eventoSlug } from '@/lib/slugify';

interface RequestItem {
  title: string;
  price: string;
  priceNum: number;
  whatsappLink: string;
  type: 'servicio' | 'producto' | 'evento';
}

const CATEGORY_TITLES: Record<'taller' | 'curso' | 'evento', string> = {
  taller: 'Talleres',
  curso: 'Cursos',
  evento: 'Eventos',
};

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const MONTH_MAP: Record<string, number> = {
  'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4,
  'mayo': 5, 'junio': 6, 'julio': 7, 'agosto': 8,
  'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12,
};

// Los registros anteriores a la columna `categoria` no la tienen definida;
// se tratan como 'evento' para conservar el comportamiento histórico.
function categoriaOf(event: Evento): string {
  return event.categoria || 'evento';
}

function getDateValue(dateStr: string): number {
  const lower = dateStr.toLowerCase();
  const monthMatch = Object.entries(MONTH_MAP).find(([name]) => lower.includes(name));
  const monthNum = monthMatch ? monthMatch[1] : 0;
  const yearMatch = dateStr.match(/\b(20\d{2})\b/);
  const year = yearMatch ? parseInt(yearMatch[1]) : 0;
  return year * 12 + monthNum;
}

function getMonthLabel(dateStr: string): string {
  const parts = dateStr.split(' - ').map(s => s.trim());
  const labeled = parts.map(p => {
    const key = Object.keys(MONTH_MAP).find(m => p.toLowerCase().includes(m));
    if (key) {
      const idx = MONTH_MAP[key]! - 1;
      const name = MONTH_NAMES[idx];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return p;
  });
  return labeled.join(' — ');
}

export function FormacionPage({ categoria, initialEventos }: { categoria: 'taller' | 'curso' | 'evento'; initialEventos?: Evento[] }) {
  const [mounted, setMounted] = useState(false);
  const { eventos, loading, error, retry } = useEventos(initialEventos);
  const [requestItem, setRequestItem] = useState<RequestItem | null>(null);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [fillTop, setFillTop] = useState(0);
  const [fillHeight, setFillHeight] = useState(0);

  const isEvento = categoria === 'evento';
  const title = CATEGORY_TITLES[categoria];

  useEffect(() => { setMounted(true); }, []);
  const showLoading = !mounted || (loading && (initialEventos || []).length === 0);

  // El fetch de SWR trae TODOS los eventos activos; se filtra por categoría
  // (el `initialEventos` del servidor ya llega filtrado por categoría).
  const categoryEventos = eventos.filter(e => categoriaOf(e) === categoria);
  const currentEvents = categoryEventos.filter(e => e.status === 'En Curso');
  const upcomingEvents = categoryEventos.filter(e => e.status === 'Proximamente');

  const timelineEvents = [
    ...currentEvents.slice().sort((a, b) => getDateValue(b.date) - getDateValue(a.date)),
    ...upcomingEvents.slice().sort((a, b) => getDateValue(a.date) - getDateValue(b.date)),
  ];
  const activeCount = timelineEvents.filter(e => e.status === 'En Curso').length;

  // Measure: track top (first dot center) + fill height (to last active dot center)
  useEffect(() => {
    if (!timelineRef.current || timelineEvents.length === 0) return;
    const container = timelineRef.current;
    const rect = container.getBoundingClientRect();
    const firstDot = container.querySelector('.timeline19-dot') as HTMLElement;
    if (!firstDot) return;
    const fdr = firstDot.getBoundingClientRect();
    const trackStart = fdr.top - rect.top + fdr.height / 2;
    setFillTop(trackStart);

    if (activeCount > 0) {
      const filledDots = container.querySelectorAll('.timeline19-dot.filled');
      if (filledDots.length > 0) {
        const lastFilled = filledDots[filledDots.length - 1];
        const ldr = lastFilled.getBoundingClientRect();
        const fillEnd = ldr.top - rect.top + ldr.height / 2;
        setFillHeight(fillEnd - trackStart);
      }
    } else {
      setFillHeight(0);
    }
  }, [activeCount, timelineEvents]);

  const renderCard = (event: Evento, index: number) => (
    <AnimatedCard key={event.id} index={index}>
      <BentoCard className="interactive-card toned-card">
        <div className="service-card-header">
          <Icon name={event.icon || 'calendar'} />
          <h3>{event.title}</h3>
        </div>
        <div className="event-tags-row">
          <span className="event-status-tag"><StatusIcon status={event.status} />{event.status || 'Proximamente'}</span>
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
          <Link href={`/formacion/${eventoSlug(event, eventos)}`} className="event-cta-link">
            <span>Ver detalles</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="arrow-right"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Link>
        </div>
      </BentoCard>
    </AnimatedCard>
  );
  return (
    <>
      {error && eventos.length === 0 && (
      <ScrollReveal>
        <div className="container">
          <div className="bento-grid">
            <div className="bento-card">
              <p>No pudimos cargar los eventos. Revisa tu conexión e inténtalo de nuevo.</p>
              <button onClick={retry} className="btn-add-cart btn-add-cart-full">
                <RefreshCw size={16} />
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </ScrollReveal>
      )}

      {isEvento ? (
        <>
          <ScrollReveal className="formacion-intro">
            <div className="container">
              <div className="section-title page-intro-title formacion-intro-title">
                <h2>{title}</h2>
              </div>

              {!showLoading && currentEvents.length === 0 && upcomingEvents.length === 0 && (
                <div className="empty-section">
                  <p>No hay eventos por el momento.</p>
                </div>
              )}
            </div>
          </ScrollReveal>

          {currentEvents.length > 0 && (
          <ScrollReveal className="formacion-block">
            <div className="container">
              <div className="section-title">
                <h2>Eventos actuales</h2>
              </div>

              {showLoading ? (
                <EventsGridSkeleton count={2} />
              ) : (
              <div className="bento-grid-events">
                {currentEvents.map((event, index) => renderCard(event, index))}
              </div>
              )}
            </div>
          </ScrollReveal>
          )}

          {upcomingEvents.length > 0 && (
          <ScrollReveal className="formacion-block">
            <div className="container">
              <div className="section-title">
                <h2>Próximamente</h2>
              </div>

              {showLoading ? (
                <EventsGridSkeleton count={2} />
              ) : (
              <div className="bento-grid-events">
                {upcomingEvents.map((event, index) => renderCard(event, index))}
              </div>
              )}
            </div>
          </ScrollReveal>
          )}
        </>
      ) : (
        <>
          <ScrollReveal className="formacion-intro">
            <div className="container">
              <div className="section-title page-intro-title formacion-intro-title">
                <h2>{title}</h2>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal className="formacion-block">
            <div className="container">
              {showLoading ? (
                <EventsGridSkeleton count={3} />
              ) : categoryEventos.length > 0 ? (
                <div className="bento-grid-events">
                  {categoryEventos.map((event, index) => renderCard(event, index))}
                </div>
              ) : (
                <div className="empty-section">
                  <p>No hay {title.toLowerCase()} por el momento.</p>
                </div>
              )}
            </div>
          </ScrollReveal>
        </>
      )}

      {timelineEvents.length > 0 && (
        <ScrollReveal className="formacion-block">
          <div className="container">
            <div className="section-title-center">
              <h2>Línea del tiempo</h2>
            </div>

            <div className="timeline19" ref={timelineRef}>
              {/* Track fill — animated blue */}
              {activeCount > 0 && (
                <motion.div
                  className="timeline19-fill"
                  initial={{ height: 0 }}
                  whileInView={{ height: fillHeight }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                  style={{ position: 'absolute', left: '15px', top: fillTop, width: '2px', background: 'var(--primary)', borderRadius: '2px', transformOrigin: 'top', pointerEvents: 'none' }}
                />
              )}

              {timelineEvents.map((event, i) => (
                <div key={event.id} className="timeline19-item">
                  <div className="timeline19-dot-col">
                    <div className={`timeline19-dot${i < activeCount ? ' filled' : ''}`} />
                  </div>
                  <div className="timeline19-content">
                    <span className="timeline19-date">{getMonthLabel(event.date)}</span>
                    <h4 className="timeline19-title">{event.title}</h4>
                    <span className={`timeline19-status${event.status === 'En Curso' ? ' active' : ''}`}>
                      {event.status || 'Proximamente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      )}

      <AnimatedSection>
        <div className="cta-card">
          <div className="cta-card-grainient">
            <Grainient className="absolute inset-0" />
          </div>
          <div className="container section-cta cta-card-content">
            <StaggerReveal>
              <h2>¿Listo para transformar tu negocio?</h2>
              <p>Agenda una cita y descubre cómo podemos ayudarte a escalar tus proyectos.</p>
              <button 
                className="cta-button cta-button--light"
                onClick={() => {
                  setRequestItem({
                    title: 'Cita de consulta',
                    price: '',
                    priceNum: 0,
                    whatsappLink: '',
                    type: 'servicio'
                  });
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
