'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { ServiceRequestModal } from '@/components/ServiceRequestModal';
import type { Servicio } from '@/hooks/useData';

export function ServiceRequestButton({ servicio }: { servicio: Servicio }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="cta-button" onClick={() => setOpen(true)}>
        <Send size={16} />
        Solicitar servicio
      </button>
      <ServiceRequestModal servicio={servicio} open={open} onClose={() => setOpen(false)} />
    </>
  );
}