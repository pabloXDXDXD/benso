import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { HomePage } from '@/components/pages/HomePage';
import { routing } from '@/i18n/routing';
import { localizeItems } from '@/lib/supabase-i18n';
import type { Testimonial, Faq } from '@/hooks/useData';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata.home' });

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
    },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [{ data: testimonialsData }, { data: faqsData }] = await Promise.all([
    supabase.from('testimonials').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    supabase.from('faqs').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
  ]);

  const fallbackTestimonials = localizeItems(testimonialsData || [], locale) as Testimonial[];

  const fallbackFaqs = (faqsData || []).map((item: any) => ({
    ...item,
    question: locale === 'en' ? (item.question_en || item.question) : item.question,
    answer: locale === 'en' ? (item.answer_en || item.answer) : item.answer,
  })) as Faq[];

  return (
    <HomePage
      fallbackTestimonials={fallbackTestimonials}
      fallbackFaqs={fallbackFaqs}
    />
  );
}