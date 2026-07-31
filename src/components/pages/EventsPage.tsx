'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Calendar, BadgeCheck, RefreshCw } from 'lucide-react';
import { BentoCard, ScrollReveal, AnimatedCard, StatusIcon, CalendarIcon, EventsGridSkeleton, EventRegistrationForm, RequestModal, ShinyText } from '@/components';
import Grainient from '@/components/Grainient';
import { useTranslations, useMessages } from 'next-intl';
import { useEventos, type Evento } from '@/hooks/useData';

interface RequestItem {
  title: string;
  price: string;
  priceNum: number;
  whatsappLink: string;
  type: 'servicio' | 'producto' | 'evento';
}

const MONTH_MAP: Record<string, number> = {
  'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4,
  'mayo': 5, 'junio': 6, 'julio': 7, 'agosto': 8,
  'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12,
};

function getDateValue(dateStr: string): number {
  const lower = dateStr.toLowerCase();
  const monthMatch = Object.entries(MONTH_MAP).find(([name]) => lower.includes(name));
  const monthNum = monthMatch ? monthMatch[1] : 0;
  const yearMatch = dateStr.match(/\b(20\d{2})\b/);
  const year = yearMatch ? parseInt(yearMatch[1]) : 0;
  return year * 12 + monthNum;
}

function getYear(dateStr: string): string {
  const match = dateStr.match(/\b(20\d{2})\b/);
  return match ? match[1] : '';
}

function getMonthLabel(dateStr: string, monthNames: string[]): string {
  const parts = dateStr.split(' - ').map(s => s.trim());
  const labeled = parts.map(p => {
    const key = Object.keys(MONTH_MAP).find(m => p.toLowerCase().includes(m));
    if (key) {
      const idx = MONTH_MAP[key]! - 1;
      const name = monthNames[idx];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return p;
  });
  return labeled.join(' — ');
}

export function EventsPage({ initialEventos }: { initialEventos?: Evento[] }) {
  const [mounted, setMounted] = useState(false);
  const { eventos, loading, error, retry } = useEventos(initialEventos);
  const [registrationEvent, setRegistrationEvent] = useState<{ id: number; title: string } | null>(null);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [requestItem, setRequestItem] = useState<RequestItem | null>(null);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [fillTop, setFillTop] = useState(0);
  const [fillHeight, setFillHeight] = useState(0);
  const t = useTranslations('events');
  const home = useTranslations('home');
  const common = useTranslations('common');
  const messages = useMessages();
  const monthNames = (messages as any).events.months as string[];

  useEffect(() => { setMounted(true); }, []);
  const showLoading = !mounted || (loading && (initialEventos || []).length === 0);
  const currentEvents = eventos.filter(e => e.status === 'En Curso');
  const upcomingEvents = eventos.filter(e => e.status === 'Proximamente');

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

  return (
    <>
      {error && eventos.length === 0 && (
      <ScrollReveal>
        <div className="container">
          <div className="bento-grid">
            <div className="bento-card">
              <p>{t('loadError')}</p>
              <button onClick={retry} className="btn-add-cart btn-add-cart-full">
                <RefreshCw size={16} />
                {t('retry')}
              </button>
            </div>
          </div>
        </div>
      </ScrollReveal>
      )}

      {currentEvents.length > 0 && (
      <ScrollReveal>
        <div className="container">
          <div className="section-title page-intro-title">
            <h2>{t('current')}</h2>
          </div>
          
          {showLoading ? (
            <EventsGridSkeleton count={2} />
          ) : (
          <div className="bento-grid-events">
            {currentEvents.map((event, index) => (
              <AnimatedCard key={event.id} index={index}>
                <BentoCard className="interactive-card toned-card">
                  <h3>{event.title}</h3>
                  <div className="event-tags-row">
                    <span className="event-status-tag"><StatusIcon status={event.status} />{event.status === 'En Curso' ? t('status.inProgress') : t('status.upcoming')}</span>
                    <span className="event-date-tag">
                      <CalendarIcon />
                      {event.date}
                    </span>
                    <span className="event-cert-tag">
                      <BadgeCheck size={13} />
                      {t('includesCertificate')}
                    </span>
                  </div>
                  <p>{event.description}</p>
                  <div className="card-actions event-card-actions">
                    <button
                      className="event-cta-link"
                      onClick={() => {
                        setRegistrationEvent({ id: event.id, title: event.title });
                        setIsRegistrationOpen(true);
                      }}
                    >
                      <span>{t('register')}</span>
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
      )}

      {upcomingEvents.length > 0 && (
      <ScrollReveal>
        <div className="container">
          <div className="section-title">
            <h2>{t('upcoming')}</h2>
          </div>
          
          {showLoading ? (
            <EventsGridSkeleton count={2} />
          ) : (
          <div className="bento-grid-events">
            {upcomingEvents.map((event, index) => (
              <AnimatedCard key={event.id} index={index}>
                <BentoCard className="interactive-card toned-card">
                  <h3>{event.title}</h3>
                  <div className="event-tags-row">
                    <span className="event-status-tag"><StatusIcon status={event.status} />{event.status === 'En Curso' ? t('status.inProgress') : t('status.upcoming')}</span>
                    <span className="event-date-tag">
                      <CalendarIcon />
                      {event.date}
                    </span>
                    <span className="event-cert-tag">
                      <BadgeCheck size={13} />
                      {t('includesCertificate')}
                    </span>
                  </div>
                  <p>{event.description}</p>
                  <div className="card-actions event-card-actions">
                    <button
                      className="event-cta-link"
                      onClick={() => {
                        setRegistrationEvent({ id: event.id, title: event.title });
                        setIsRegistrationOpen(true);
                      }}
                    >
                      <span>{t('register')}</span>
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
      )}

      {timelineEvents.length > 0 && (
      <ScrollReveal>
        <div className="container">
          <div className="section-title-center">
            <h2>{t('timeline')}</h2>
          </div>

          <div className="timeline19" ref={timelineRef}>
            {/* Track fill — animated blue */}
            {activeCount > 0 && (
              <motion.div
                className="timeline19-fill"
                initial={{ height: 0 }}
                animate={{ height: fillHeight }}
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
                  <span className="timeline19-date">{getMonthLabel(event.date, monthNames)}</span>
                  <h4 className="timeline19-title">{event.title}</h4>
                  <span className={`timeline19-status${event.status === 'En Curso' ? ' active' : ''}`}>
                    {event.status === 'En Curso' ? t('status.inProgress') : t('status.upcoming')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>
      )}

      <div className="cta-card">
        <div className="cta-card-grainient">
          <Grainient className="absolute inset-0" />
        </div>
        <div className="container section-cta cta-card-content">
          <h2>{home('sections.ctaTitle')}</h2>
          <p>{home('sections.ctaText')}</p>
          <button 
            className="cta-button cta-button--light"
            onClick={() => {
              setRequestItem({
                title: common('appointmentTitle'),
                price: '',
                priceNum: 0,
                whatsappLink: '',
                type: 'servicio'
              });
              setIsRequestOpen(true);
            }}
          >
            <Calendar size={18} />
            {home('sections.ctaButton')}
          </button>
        </div>
      </div>

      <EventRegistrationForm
        eventoId={registrationEvent?.id ?? 0}
        eventoTitle={registrationEvent?.title ?? ''}
        isOpen={isRegistrationOpen}
        onClose={() => setIsRegistrationOpen(false)}
      />

      <RequestModal
        item={requestItem}
        isOpen={isRequestOpen}
        onClose={() => setIsRequestOpen(false)}
      />
    </>
  );
}