import type { Metadata } from 'next';
import { FormacionPage } from '@/components/pages/FormacionPage';
import type { Evento } from '@/hooks/useData';
import { supabase } from '@/lib/supabase';
import { withRetry } from '@/lib/withRetry';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Talleres para Emprendedores en Cuba | BENSO',
  description: 'Talleres prácticos para emprendedores en Cuba. Aprende habilidades clave para hacer crecer tu negocio con BENSO.',
  openGraph: {
    title: 'Talleres para Emprendedores - BENSO',
    description: 'Talleres prácticos para emprendedores en Cuba. Inscríbete ya.',
  },
};

export default async function Page() {
  const { data: eventos, error: eventosError } = await withRetry(() =>
    supabase
      .from('eventos')
      .select('*')
      .eq('is_active', true)
      .eq('categoria', 'taller')
      .order('created_at', { ascending: false })
  );

  const items = eventosError ? undefined : (eventos || []) as Evento[];

  return <FormacionPage categoria="taller" initialEventos={items} />;
}
