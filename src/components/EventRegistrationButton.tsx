'use client';
import { useState } from 'react';
import { Send } from 'lucide-react';
import { EventRegistrationForm } from '@/components';
import type { Evento } from '@/hooks/useData';

export function EventRegistrationButton({
  evento,
  tipo = 'evento',
}: {
  evento: Evento;
  tipo?: 'taller' | 'curso' | 'evento';
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="cta-button" onClick={() => setOpen(true)}>
        <Send size={16} />
        Inscribirme
      </button>
      <EventRegistrationForm
        eventoId={evento.id}
        eventoTitle={evento.title}
        tipo={tipo}
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
