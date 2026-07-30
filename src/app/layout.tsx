import type { Viewport, Metadata } from 'next';
import { cocogoose, ttCommons } from './fonts';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: 'BENSO | Consultoría y Soluciones Digitales para PyMEs en Cuba',
    template: '%s | BENSO',
  },
  description: 'Consultoría empresarial, marketing digital y automatización para PyMEs en Cuba. Contáctanos al +53 55609099. Estrategia digital para impulsar tu rentabilidad.',
  metadataBase: new URL('https://www.bensofcg.com'),
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  alternates: {
    canonical: '/',
    languages: {
      es: '/es',
      en: '/en',
      'x-default': '/es',
    },
  },
  openGraph: {
    siteName: 'BENSO',
    type: 'website',
    locale: 'es_ES',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@benso_fcg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}