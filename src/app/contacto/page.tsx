import type { Metadata } from 'next';
import { ContactPage } from '@/components/pages/ContactPage';
import servicesData from '@/data/services.json';

export const metadata: Metadata = {
  title: 'Contacto — Agenda tu Cita Gratis',
  description: 'Agenda tu cita de consultoría gratis. Contáctanos por WhatsApp al +53 55609099 y recibe asesoría personalizada para impulsar tu emprendimiento en Cuba.',
  alternates: { canonical: '/contacto/' },
  openGraph: {
    title: 'Contacto — BENSO',
    description: 'Agenda tu cita de consultoría gratis. Contáctanos por WhatsApp al +53 55609099.',
  },
};

export default function Page() {
  return <ContactPage servicesData={servicesData} />;
}
