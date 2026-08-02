import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { HomePage } from '@/components/pages/HomePage';
import type { Testimonial, Faq } from '@/hooks/useData';

export const metadata: Metadata = {
  title: 'Consultoría y Soluciones Digitales para PyMEs en Cuba',
  description: 'Consultoría empresarial, marketing digital y automatización para PyMEs en Cuba. Agenda tu cita gratis y recibe asesoría personalizada para impulsar tu rentabilidad.',
  openGraph: {
    title: 'BENSO | Consultoría y Soluciones Digitales para PyMEs en Cuba',
    description: 'Consultoría empresarial, marketing digital y automatización para PyMEs en Cuba. Agenda tu cita gratis.',
  },
};

export default async function Page() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [{ data: testimonialsData }, { data: faqsData }] = await Promise.all([
    supabase.from('testimonials').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    supabase.from('faqs').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
  ]);

  const fallbackTestimonials = (testimonialsData || []) as Testimonial[];
  const fallbackFaqs = (faqsData || []) as Faq[];

  return (
    <HomePage
      fallbackTestimonials={fallbackTestimonials}
      fallbackFaqs={fallbackFaqs}
    />
  );
}
