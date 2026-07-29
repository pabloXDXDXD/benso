'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { CurrencySelector } from '@/components/CurrencySelector';

export function Header() {
  const t = useTranslations('header');
  const locale = useLocale();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    if (isHomePage) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
      return () => window.removeEventListener('scroll', handleScroll);
    } else {
      setIsScrolled(true);
    }
  }, [isHomePage]);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const isActive = (path: string) => {
    const normalizedPathname = pathname.replace(/\/$/, '');
    const normalizedPath = path.replace(/\/$/, '');
    return normalizedPathname === normalizedPath ? 'active' : '';
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const switchLocale = (newLocale: string) => {
    const path = pathname || '/';
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`;
    router.replace(path, { locale: newLocale });
    closeMenu();
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (isHomePage) {
      e.preventDefault();
      scrollToTop();
    }
    closeMenu();
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    if (isHomePage) {
      e.preventDefault();
      scrollToTop();
    }
    closeMenu();
  };

  const headerClass = isHomePage 
    ? (isScrolled ? 'header-sticky header-scrolled' : 'header-sticky header-hero')
    : 'header-sticky';

  return (
    <header className={headerClass}>
      <div className="header-container">
        <Link href="/" className="logo" onClick={handleLogoClick}>
          <img src="/assets/logos/Isotipo Benso Claro.svg" alt="BENSO" className="logo-img" fetchPriority="high" />
        </Link>

        <div className="header-actions">
          <button
            className="locale-switcher"
            onClick={() => switchLocale(locale === 'es' ? 'en' : 'es')}
            aria-label={locale === 'es' ? 'Switch to English' : 'Cambiar a Español'}
            title={locale === 'es' ? 'English' : 'Español'}
          >
            {locale === 'es' ? 'EN' : 'ES'}
          </button>
          <CurrencySelector />
        </div>

        <button
          className={`menu-toggle${isMenuOpen ? ' open' : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? t('aria.closeMenu') : t('aria.openMenu')}
          aria-controls="main-nav"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

<nav id="main-nav" className={isMenuOpen ? 'active' : ''}>
            <ul>
              <li><Link href="/" className={isActive('/')} onClick={handleHomeClick}>{t('nav.home')}</Link></li>
              <li><Link href="/servicios" className={isActive('/servicios')} onClick={closeMenu}>{t('nav.services')}</Link></li>
              <li><Link href="/productos" className={isActive('/productos')} onClick={closeMenu}>{t('nav.products')}</Link></li>
              <li><Link href="/eventos" className={isActive('/eventos')} onClick={closeMenu}>{t('nav.events')}</Link></li>
              <li><Link href="/nosotros" className={isActive('/nosotros')} onClick={closeMenu}>{t('nav.about')}</Link></li>
              <li><Link href="/contacto" className={isActive('/contacto')} onClick={closeMenu}>{t('nav.contact')}</Link></li>
            </ul>
            <div className="mobile-nav-footer">
              <button
                className="locale-switcher"
                onClick={() => switchLocale(locale === 'es' ? 'en' : 'es')}
                aria-label={locale === 'es' ? 'Switch to English' : 'Cambiar a Español'}
              >
                {locale === 'es' ? 'EN' : 'ES'}
              </button>
              <CurrencySelector />
            </div>
          </nav>
      </div>
    </header>
  );
}
