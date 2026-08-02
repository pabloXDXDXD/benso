'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { EventRegistrationForm } from './EventRegistrationForm';
import { RequestModal } from './RequestModal';

export function PromoBanner() {
  const bannerRef = useRef<HTMLButtonElement>(null);
  const [evento, setEvento] = useState<{ id: number; title: string } | null>(null);
  const [isRegOpen, setIsRegOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);

  // Measure banner height for layout
  useEffect(() => {
    if (bannerRef.current) {
      const height = bannerRef.current.offsetHeight;
      document.documentElement.style.setProperty('--banner-height', `${height}px`);
    }
    return () => {
      document.documentElement.style.setProperty('--banner-height', '0px');
    };
  }, []);

  // Look up the first active event (prefer Marketing-related)
  useEffect(() => {
    supabase
      .from('eventos')
      .select('id, title')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setEvento(data);
      });
  }, []);

  const handleClick = () => {
    if (evento) {
      setIsRegOpen(true);
    } else {
      setIsRequestOpen(true);
    }
  };

  return (
    <>
      <button
        className="promo-banner"
        ref={bannerRef}
        onClick={handleClick}
        aria-label="Acceder a la promoción de curso de Marketing Digital"
      >
        <div className="promo-banner-track">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="promo-banner-item">
              Nuevo curso de Marketing Digital! <span className="promo-highlight">20% de descuento</span>
            </span>
          ))}
        </div>
      </button>

      {evento && (
        <EventRegistrationForm
          eventoId={evento.id}
          eventoTitle={evento.title}
          isOpen={isRegOpen}
          onClose={() => setIsRegOpen(false)}
        />
      )}

      <RequestModal
        item={{
          title: 'Cita de consulta',
          price: '',
          priceNum: 0,
          whatsappLink: '',
          type: 'servicio' as const,
        }}
        isOpen={isRequestOpen}
        onClose={() => setIsRequestOpen(false)}
      />
    </>
  );
}
