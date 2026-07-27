import type { Metadata, Viewport } from 'next';
import { cocogoose, ttCommons } from './fonts';
import './globals.css';

const SITE_URL = 'https://bensofcg.com';
const SITE_NAME = 'BENSO';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'BENSO | Consultoría y Soluciones Digitales para PyMEs',
    template: '%s | BENSO',
  },
  description: 'Asesoramiento, herramientas y capacitación estratégica para impulsar la rentabilidad de tu emprendimiento en Cuba.',
  keywords: ['consultoría', 'PyMEs', 'emprendimiento', 'marketing digital', 'automatización', 'Cuba', 'capacitación', 'soluciones digitales'],
  authors: [{ name: 'BENSO' }],
  creator: 'BENSO',
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: SITE_NAME,
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    images: '/og-image.svg',
  },
  icons: {
    icon: '/favicon.ico',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${cocogoose.variable} ${ttCommons.variable}`}>
      <head>
        {/* Preconnects */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />

        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'BENSO',
              url: SITE_URL,
              description: 'Consultoría y Soluciones Digitales para la Rentabilidad Sostenible.',
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+53-5560-9099',
                contactType: 'customer service',
              },
              address: {
                '@type': 'PostalAddress',
                addressCountry: 'CU',
              },
            }),
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
