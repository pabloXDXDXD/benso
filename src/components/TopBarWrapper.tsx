'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { PromoBanner } from './PromoBanner';
import { Header } from './Header';

export function TopBarWrapper() {
  const pathname = usePathname();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const bannerOffsetRef = useRef(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (wrapperRef.current) {
      wrapperRef.current.style.transform = 'translateY(0px)';
    }
  }, [pathname]);

  useEffect(() => {
    const updateNavbarHeight = () => {
      if (wrapperRef.current) {
        const banner = wrapperRef.current.querySelector('.promo-banner') as HTMLElement;
        const header = wrapperRef.current.querySelector('header:not(.admin-header)') as HTMLElement;
        const bHeight = banner?.offsetHeight || 0;
        const hHeight = header?.offsetHeight || 0;
        bannerOffsetRef.current = bHeight;
        document.documentElement.style.setProperty('--navbar-height', `${bHeight + hHeight}px`);
        document.documentElement.style.setProperty('--banner-height', `${bHeight}px`);
      }
    };

    const handleScroll = () => {
      if (!wrapperRef.current) return;
      const offset = Math.min(window.scrollY, bannerOffsetRef.current);
      wrapperRef.current.style.transform = `translateY(${-offset}px)`;
    };

    updateNavbarHeight();
    const resizeObserver = new ResizeObserver(updateNavbarHeight);
    if (wrapperRef.current) {
      resizeObserver.observe(wrapperRef.current);
    }
    window.addEventListener('resize', updateNavbarHeight);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('resize', updateNavbarHeight);
      window.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      document.documentElement.style.setProperty('--navbar-height', '0px');
      document.documentElement.style.setProperty('--banner-height', '0px');
    };
  }, []);

  return (
    <div ref={wrapperRef} className="nav-wrapper">
      <PromoBanner />
      <Header />
    </div>
  );
}
