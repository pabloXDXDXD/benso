'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { CurrencySelector } from '@/components/CurrencySelector';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFormacionOpen, setIsFormacionOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  // Solo en dispositivos con hover real: el menú se abre al pasar el cursor.
  // En táctil (hover: none) se mantiene el toggle por click.
  const hoverCapable = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;

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
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isMenuOpen]);

  const isActive = (path: string) => {
    const normalizedPathname = pathname.replace(/\/$/, '');
    const normalizedPath = path.replace(/\/$/, '');
    return normalizedPathname === normalizedPath ? 'active' : '';
  };

  const isFormacionActive = pathname.replace(/\/$/, '').startsWith('/formacion');

  // Cierra el submenú de Formación al navegar a otra ruta
  useEffect(() => {
    setIsFormacionOpen(false);
  }, [pathname]);

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsFormacionOpen(false);
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
          <CurrencySelector />
        </div>

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
              <li
                className="nav-dropdown"
                onMouseEnter={() => { if (hoverCapable()) setIsFormacionOpen(true); }}
                onMouseLeave={() => { if (hoverCapable()) setIsFormacionOpen(false); }}
              >
                <button
                  className={`nav-dropdown-toggle${isFormacionActive ? ' active' : ''}`}
                  onClick={() => setIsFormacionOpen(prev => (hoverCapable() ? true : !prev))}
                  onBlur={(e) => {
                    const next = e.relatedTarget as Node | null;
                    if (next && e.currentTarget.contains(next)) return;
                    setIsFormacionOpen(false);
                  }}
                  aria-haspopup="true"
                  aria-expanded={isFormacionOpen}
                >
                  <span className="nav-dropdown-label">Formación</span>
                  <ChevronDown size={14} className={`nav-dropdown-chevron${isFormacionOpen ? ' open' : ''}`} />
                </button>
                {isFormacionOpen && (
                  <ul className="nav-dropdown-menu">
                    <li><Link href="/formacion/talleres" onClick={closeMenu}>Talleres</Link></li>
                    <li><Link href="/formacion/cursos" onClick={closeMenu}>Cursos</Link></li>
                    <li><Link href="/formacion/eventos" onClick={closeMenu}>Eventos</Link></li>
                  </ul>
                )}
              </li>
              <li><Link href="/nosotros" className={isActive('/nosotros')} onClick={closeMenu}>Nosotros</Link></li>
              <li><Link href="/contacto" className={isActive('/contacto')} onClick={closeMenu}>Contacto</Link></li>
            </ul>
            <div className="mobile-nav-footer">
              <div className="mobile-nav-toggles">
                <CurrencySelector />
              </div>
            </div>
          </nav>
      </div>
    </header>
  );
}
