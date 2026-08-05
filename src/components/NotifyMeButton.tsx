'use client';
import { useState } from 'react';
import { Bell } from 'lucide-react';
import { NotificacionForm } from '@/components/NotificacionForm';
import type { Evento } from '@/hooks/useData';

export function NotifyMeButton({ evento }: { evento: Evento }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="cta-button" onClick={() => setOpen(true)}>
        <Bell size={16} />
        Avísame de este programa
      </button>
      <NotificacionForm eventoId={evento.id} eventoTitle={evento.title} isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
