'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { EventRegistrationForm } from './EventRegistrationForm';

export function PromoBanner() {
  const bannerRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const [evento, setEvento] = useState<{ id: number; title: string; tipo: 'taller' | 'curso' | 'evento' } | null>(null);
  const [isRegOpen, setIsRegOpen] = useState(false);

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
      .select('id, title, categoria')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setEvento({
          id: data.id,
          title: data.title,
          tipo: (data.categoria || 'evento') as 'taller' | 'curso' | 'evento',
        });
      });
  }, []);

  const handleClick = () => {
    if (evento) {
      setIsRegOpen(true);
    } else {
      router.push('/contacto');
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
          tipo={evento.tipo}
          isOpen={isRegOpen}
          onClose={() => setIsRegOpen(false)}
        />
      )}
    </>
  );
}
