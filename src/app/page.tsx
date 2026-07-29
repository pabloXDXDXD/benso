'use client';

import { useEffect } from 'react';

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export default function RootPage() {
  useEffect(() => {
    const savedLocale = getCookie('NEXT_LOCALE');
    if (savedLocale === 'en' || savedLocale === 'es') {
      const path = window.location.pathname.replace(/\/+$/, '') || '';
      window.location.replace(`/${savedLocale}${path}/`);
      return;
    }

    const detectedLang = navigator.language || '';
    const locale = detectedLang.startsWith('en') ? 'en' : 'es';
    const path = window.location.pathname.replace(/\/+$/, '') || '';
    window.location.replace(`/${locale}${path}/`);
  }, []);

  return (
    <>
      <meta httpEquiv="refresh" content="0;url=/es/" />
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'system-ui, sans-serif',
        color: '#666',
      }}>
        <p>Redirigiendo / Redirecting...</p>
      </div>
    </>
  );
}