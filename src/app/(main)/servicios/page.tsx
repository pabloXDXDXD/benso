import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';
import { ServicesPage } from '@/components/pages/ServicesPage';
import type { Servicio } from '@/hooks/useData';

export const metadata: Metadata = {
  title: 'Servicios | BENSO',
  description: 'Consultoría empresarial, capacitación estratégica y herramientas digitales para PyMEs. Impulsa tu negocio con asesoría profesional en contabilidad, marketing y automatización.',
  openGraph: {
    title: 'Servicios | BENSO',
    description: 'Consultoría empresarial, capacitación estratégica y herramientas digitales para PyMEs.',
  },
};

export default async function Page() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: servicios } = await supabase
    .from('servicios')
    .select('*')
    .eq('is_active', true);

  return <ServicesPage initialServicios={(servicios || []) as Servicio[]} />;
}
