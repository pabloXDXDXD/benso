import type { Metadata } from 'next';
import { AboutPage } from '@/components/pages/AboutPage';

export const metadata: Metadata = {
  title: 'Nosotros',
  description: 'Descubre por qué elegir BENSO para impulsar tu emprendimiento: inversión accesible, atención personalizada y resultados medibles. Galería de nuestro trabajo.',
  openGraph: {
    title: 'Nosotros - BENSO',
    description: 'Descubre por qué elegir BENSO para impulsar tu emprendimiento.',
  },
};

export default function Page() {
  return <AboutPage />;
}
