'use client';

import { useEffect, useRef, type ReactNode } from 'react';

export function FooterReveal({ children }: { children: ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateSpacing = () => {
      if (contentRef.current && footerRef.current) {
        const footerHeight = footerRef.current.offsetHeight;
        contentRef.current.style.paddingBottom = `${footerHeight}px`;
      }
    };

    updateSpacing();

    const observer = new ResizeObserver(updateSpacing);
    if (footerRef.current) observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="page-reveal-container">
      <div ref={contentRef} className="page-reveal-content">
        {children}
      </div>
      <div ref={footerRef} className="page-reveal-footer">
        <footer className="footer">
          {/* El footer se renderiza inline para medirlo, pero su contenido se puebla desde children */}
        </footer>
      </div>
    </div>
  );
}
