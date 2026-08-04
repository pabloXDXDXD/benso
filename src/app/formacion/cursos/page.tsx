import type { Metadata } from 'next';
import { FormacionPage } from '@/components/pages/FormacionPage';
import type { Evento } from '@/hooks/useData';
import { supabase } from '@/lib/supabase';
import { withRetry } from '@/lib/withRetry';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Cursos para Emprendedores en Cuba | BENSO',
  description: 'Cursos para emprendedores en Cuba. Formación especializada para llevar tu negocio al siguiente nivel con BENSO.',
  openGraph: {
    title: 'Cursos para Emprendedores - BENSO',
    description: 'Cursos para emprendedores en Cuba. Inscríbete ya.',
  },
};

export default async function Page() {
  const { data: eventos, error: eventosError } = await withRetry(() =>
    supabase
      .from('eventos')
      .select('*')
      .eq('is_active', true)
      .eq('categoria', 'curso')
      .order('created_at', { ascending: false })
  );

  const items = eventosError ? undefined : (eventos || []) as Evento[];

  return <FormacionPage categoria="curso" initialEventos={items} />;
}
