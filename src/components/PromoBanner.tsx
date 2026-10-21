'use client';

import { useEffect, useRef, useState } from 'react';
import { JobApplicationModal } from './JobApplicationModal';

const BANNER_TEXT = 'Buscamos nuevos integrantes para BENSO';
const BANNER_HIGHLIGHT = '¿Quieres formar parte del equipo?';

export function PromoBanner() {
  const bannerRef = useRef<HTMLButtonElement>(null);
  const [isApplyOpen, setIsApplyOpen] = useState(false);

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

  return (
    <>
      <button
        className="promo-banner"
        ref={bannerRef}
        onClick={() => setIsApplyOpen(true)}
        aria-label="Postular al equipo de BENSO"
      >
        <div className="promo-banner-track">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="promo-banner-item">
              {BANNER_TEXT} <span className="promo-highlight">{BANNER_HIGHLIGHT}</span>
            </span>
          ))}
        </div>
      </button>

      <JobApplicationModal open={isApplyOpen} onClose={() => setIsApplyOpen(false)} />
    </>
  );
}
