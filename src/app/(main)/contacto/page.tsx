import type { Metadata } from 'next';
import { ContactPage } from '@/components/pages/ContactPage';

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Contáctanos para recibir asesoría personalizada. Agenda una cita y descubre cómo podemos ayudarte a impulsar la rentabilidad de tu emprendimiento.',
  openGraph: {
    title: 'Contacto - BENSO',
    description: 'Contáctanos para recibir asesoría personalizada para tu emprendimiento.',
  },
};

export default function Page() {
  return <ContactPage />;
}
