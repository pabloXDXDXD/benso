import type { Metadata } from 'next';
import { AboutPage } from '@/components/pages/AboutPage';

export const metadata: Metadata = {
  title: 'Sobre Nosotros — Consultoría Digital en Cuba',
  description: 'BENSO nació para impulsar emprendedores cubanos con consultoría accesible, atención personalizada y resultados medibles. Conoce nuestra historia y por qué elegirnos.',
  openGraph: {
    title: 'Sobre Nosotros — BENSO',
    description: 'Consultoría accesible, atención personalizada y resultados medibles para emprendedores cubanos.',
  },
};

export default function Page() {
  return <AboutPage />;
}
