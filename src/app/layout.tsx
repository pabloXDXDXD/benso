import type { Viewport, Metadata } from 'next';
import Script from 'next/script';
import { cocogoose, ttCommons } from './fonts';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { SWRProvider } from '@/components/SWRProvider';
import { SiteChrome } from '@/components/SiteChrome';
import { supabase } from '@/lib/supabase';
import { DEFAULT_RATES, normalizeRates, type ExchangeRates } from '@/lib/currencyUtils';

// Exchange rates are read on the server so the rendered HTML and the client
// convert with the same rates. The client also refreshes them via SWR.
export const revalidate = 300;

async function getExchangeRates(): Promise<ExchangeRates> {
  try {
    const { data, error } = await supabase
      .from('currency_settings')
      .select('cup_per_usd, cup_per_eur')
      .eq('id', 1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return DEFAULT_RATES;

    return normalizeRates({
      cupPerUsd: Number(data.cup_per_usd),
      cupPerEur: Number(data.cup_per_eur),
    });
  } catch {
    // Settings table missing or unreachable: keep the site working.
    return DEFAULT_RATES;
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1b4696',
};

export const metadata: Metadata = {
  title: {
    default: 'BENSO | Consultoría y Soluciones Digitales para PyMEs en Cuba',
    template: '%s | BENSO',
  },
  description: 'Consultoría empresarial, marketing digital y automatización para PyMEs en Cuba. Contáctanos al +53 55609099. Estrategia digital para impulsar tu rentabilidad.',
  metadataBase: new URL('https://www.bensofcg.com'),
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    url: 'https://www.bensofcg.com',
    siteName: 'BENSO',
    type: 'website',
    locale: 'es_ES',
    images: [{ url: 'https://www.bensofcg.com/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@benso_fcg',
    images: [{ url: 'https://www.bensofcg.com/twitter-image.png', width: 1200, height: 630 }],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const rates = await getExchangeRates();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BENSO',
    url: 'https://www.bensofcg.com',
    logo: 'https://www.bensofcg.com/assets/logos/Isotipo%20Benso%20Claro.svg',
    description: 'Consultoría empresarial, marketing digital y automatización para PyMEs en Cuba. Contáctanos al +53 55609099.',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+53-5560-9099',
      contactType: 'customer service',
      availableLanguage: ['Spanish', 'English'],
    },
    sameAs: [
      'https://www.instagram.com/benso.fcg',
    ],
  };

  return (
    <html className={`${cocogoose.variable} ${ttCommons.variable}`} lang="es">
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        {/* Fallback OG tags — pages defining their own openGraph lose the layout's
            og:image because Next.js shallow-merges metadata objects */}
        <meta property="og:image" content="https://www.bensofcg.com/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://www.bensofcg.com" />
        <meta property="og:locale" content="es_ES" />
      </head>
      <body>
        {/* next/script dedupes by id; a raw <script> here gets re-inserted by
            hydration when the document is still streaming (duplicate JSON-LD + #418) */}
        <Script
          id="organization-jsonld"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <CurrencyProvider initialRates={rates}>
          <CartProvider>
            <SWRProvider>
              <a href="#main-content" className="skip-link">Saltar al contenido principal</a>
              <SiteChrome>{children}</SiteChrome>
            </SWRProvider>
          </CartProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
