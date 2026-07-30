import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { CartProvider } from '@/context/CartContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { SWRProvider } from '@/components/SWRProvider';
import { PromoBanner, Header, Footer, Cart, TopBarWrapper } from '@/components';
import { HtmlLang } from '@/components/HtmlLang';
import { Toaster } from 'react-hot-toast';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    title: {
      default: t('title'),
      template: '%s | BENSO',
    },
    description: t('description'),
    alternates: {
      canonical: `https://www.bensofcg.com/${locale}/`,
      languages: {
        es: 'https://www.bensofcg.com/es/',
        en: 'https://www.bensofcg.com/en/',
        'x-default': 'https://www.bensofcg.com/es/',
      },
    },
    openGraph: {
      images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
      siteName: 'BENSO',
      locale: locale === 'en' ? 'en_US' : 'es_ES',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@benso_fcg',
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: 'common' });

  return (
    <NextIntlClientProvider messages={messages}>
      <HtmlLang />
      <CurrencyProvider>
      <CartProvider>
        <SWRProvider>
          <a href="#main-content" className="skip-link">{t('skipToContent')}</a>
          <TopBarWrapper />
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
          <Footer />
          <Cart />
          <Toaster position="bottom-left" toastOptions={{ duration: 3000 }} />
        </SWRProvider>
      </CartProvider>
      </CurrencyProvider>
    </NextIntlClientProvider>
  );
}