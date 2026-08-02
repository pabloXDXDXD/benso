'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue } from 'motion/react';

interface ImgData {
  src: string;
  title: string;
  w: number;
  h: number;
  x: number;
  y: number;
}

const CANVAS_VW = 220;

export function ImageGallery() {
  const images: ImgData[] = [
    { src: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1000&q=80', title: 'Consultoría Estratégica', w: 34, h: 48, x: 3, y: 15 },
    { src: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80', title: 'Trabajo en Equipo', w: 22, h: 28, x: 40, y: 59 },
    { src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80', title: 'Atención Personalizada', w: 28, h: 36, x: 44, y: 19 },
    { src: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1000&q=80', title: 'Resultados Medibles', w: 32, h: 46, x: 78, y: 19 },
    { src: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80', title: 'Innovación Digital', w: 20, h: 30, x: 113, y: 13 },
    { src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80', title: 'Marketing Digital', w: 26, h: 32, x: 115, y: 57 },
    { src: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1000&q=80', title: 'Visión Estratégica', w: 36, h: 50, x: 148, y: 15 },
    { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80', title: 'Crecimiento', w: 18, h: 24, x: 190, y: 59 },
  ];
  const sectionRef = useRef<HTMLDivElement>(null);
  const translatePxRef = useRef(0);
  const x = useMotionValue(0);
  const [activeItem, setActiveItem] = useState<number | null>(null);

  /* Desktop scroll effect */
  useEffect(() => {
    const onScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const sh = rect.height;
      const vh = window.innerHeight;
      const scrollable = sh - vh;
      if (scrollable <= 0) return;

      const progress = Math.max(0, Math.min(1, -rect.top / scrollable));
      x.set(-progress * translatePxRef.current);
    };

    const calc = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isMobile = vw < 768;
      const spacing = isMobile ? 3 : 1;
      const minRatio = isMobile ? 4 / 3 : 0;
      const vhPx = vh * 0.01;

      document.documentElement.style.setProperty('--gallery-spacing', spacing.toString());
      document.documentElement.style.setProperty('--gallery-min-ratio', minRatio.toString());
      document.documentElement.style.setProperty('--gallery-vh', `${vhPx}px`);

      /* Calculate needed canvas translation: rightmost item edge - viewport */
      let maxRight = 0;
      images.forEach((img) => {
        const left = (img.x * vw * spacing) / 100;
        const itemW = Math.max(
          (img.w * vw) / 100,
          (img.h * vh * minRatio) / 100,
        );
        maxRight = Math.max(maxRight, left + itemW);
      });
      const needed = Math.max(maxRight - vw, 0);
      translatePxRef.current = needed;
      if (sectionRef.current) {
        sectionRef.current.style.height = `${vh + needed}px`;
      }
      onScroll();
    };

    calc();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', calc);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', calc);
    };
  }, [x]);

  const handleItemClick = (i: number) => {
    setActiveItem(activeItem === i ? null : i);
  };

  return (
    <>
      {/* Scroll-driven collage — same effect on all screen sizes */}
      <div ref={sectionRef} className="gallery-scroll-section">
        <div className="gallery-scroll-sticky">
          <motion.div className="gallery-canvas" style={{ x }}>
            {images.map((img, i) => (
              <div
                key={i}
                className="gallery-item"
                style={{
                  width: `max(${img.w}vw, calc(${img.h}vh * var(--gallery-min-ratio, 0)))`,
                  height: `${img.h}vh`,
                  left: `calc(${img.x}vw * var(--gallery-spacing, 1))`,
                  top: `${img.y}vh`,
                }}
                onClick={() => handleItemClick(i)}
              >
                <div
                  className="gallery-item-inner"
                  style={{ backgroundImage: `url(${img.src})` }}
                >
                  <div className={`gallery-item-overlay ${activeItem === i ? 'is-active' : ''}`}>
                    <h3>{img.title}</h3>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </>
  );
}
