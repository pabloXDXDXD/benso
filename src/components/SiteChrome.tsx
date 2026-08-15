'use client';

import { usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { TopBarWrapper } from './TopBarWrapper';
import { Footer } from './Footer';
import { Cart } from './Cart';

// Áreas de app que NO llevan el chrome del sitio público (header/footer/cart)
const APP_AREAS = ['/admin', '/team'];

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAppArea = APP_AREAS.some((area) => pathname === area || pathname.startsWith(`${area}/`));

  return (
    <>
      {!isAppArea && <TopBarWrapper />}
      {isAppArea ? (
        // Áreas de app: sin wrapper — cada panel tiene su propio <main id="main-content">
        children
      ) : (
        <main id="main-content" tabIndex={-1} className="site-main">{children}</main>
      )}
      {!isAppArea && <Footer />}
      {!isAppArea && <Cart />}
      {/* El Toaster raíz solo en el sitio público: admin/team tienen el suyo propio */}
      {!isAppArea && <Toaster position="bottom-left" toastOptions={{ duration: 3000 }} />}
    </>
  );
}