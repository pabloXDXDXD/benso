'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header() {
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

        <button
          className={`menu-toggle${isMenuOpen ? ' open' : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
          aria-controls="main-nav"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav id="main-nav" className={isMenuOpen ? 'active' : ''}>
          <ul>
            <li><Link href="/" className={isActive('/')} onClick={handleHomeClick}>Inicio</Link></li>
            <li><Link href="/servicios" className={isActive('/servicios')} onClick={closeMenu}>Servicios</Link></li>
            <li><Link href="/productos" className={isActive('/productos')} onClick={closeMenu}>Productos</Link></li>
            <li><Link href="/eventos" className={isActive('/eventos')} onClick={closeMenu}>Eventos</Link></li>
            <li><Link href="/nosotros" className={isActive('/nosotros')} onClick={closeMenu}>Nosotros</Link></li>
            <li><Link href="/contacto" className={isActive('/contacto')} onClick={closeMenu}>Contacto</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
