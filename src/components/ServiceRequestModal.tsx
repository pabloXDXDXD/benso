'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Servicio } from '@/hooks/useData';

type View = 'form' | 'success';

interface ServiceRequestModalProps {
  servicio: Servicio | null;
  open: boolean;
  onClose: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ServiceRequestModal({ servicio, open, onClose }: ServiceRequestModalProps) {
  const [view, setView] = useState<View>('form');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lock background scroll while the modal is open (same behavior as the other modals).
  // Block both <body> AND <html>: this site sets `html { overflow-x: clip }`, which breaks
  // body->viewport overflow propagation, so body-only locking does NOT stop scrolling.
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [open]);

  if (!open || !servicio) return null;

  const handleClose = () => {
    onClose();
    setView('form');
    setNombre('');
    setEmail('');
    setTelefono('');
    setMensaje('');
    setError(null);
    setSaving(false);
  };

  // Static JSON ids are display-only and may not match DB ids (sequence drift);
  // only forward a plausible DB id, otherwise snapshot the title with null id.
  const servicioId = Number.isInteger(servicio.id) && servicio.id > 0 ? servicio.id : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const name = nombre.trim();
    const mail = email.trim();

    if (!name || !mail) {
      setError('Completa los campos obligatorios con datos válidos.');
      return;
    }
    if (!EMAIL_RE.test(mail)) {
      setError('Completa los campos obligatorios con datos válidos.');
      return;
    }

    setSaving(true);
    setError(null);

    const { error: dbError } = await supabase
      .from('servicio_solicitudes')
      .insert({
        servicio_id: servicioId,
        servicio_titulo: servicio.title,
        nombre: name,
        email: mail,
        telefono: telefono.trim() || null,
        mensaje: mensaje.trim() || null,
      });

    if (dbError) {
      setError('No pudimos enviar tu solicitud. Inténtalo de nuevo.');
      setSaving(false);
      return;
    }

    setSaving(false);
    setView('success');
  };

  return (
    <>
      <div className="svc-modal-overlay" onClick={handleClose} />
      <div className="svc-modal-panel" role="dialog" aria-modal="true" aria-labelledby="svc-modal-title">
        <button className="svc-modal-close" onClick={handleClose} aria-label="Cerrar">
          ×
        </button>

        {view === 'form' && (
          <>
            <div className="svc-modal-head">
              <h3 className="svc-modal-title" id="svc-modal-title">Solicitud de servicio</h3>
              <p className="svc-modal-subtitle">Completa el formulario y un especialista te contactará.</p>
            </div>
            <div className="svc-modal-body svc-modal-form">
              <form onSubmit={handleSubmit} noValidate>
                <p className="svc-modal-required-note">Los campos marcados con * son obligatorios.</p>

                <label htmlFor="svc-nombre">Nombre completo *</label>
                <input
                  type="text"
                  id="svc-nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre completo"
                  required
                />

                <label htmlFor="svc-email">Correo electrónico *</label>
                <input
                  type="email"
                  id="svc-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                />

                <label htmlFor="svc-telefono">Teléfono / WhatsApp</label>
                <input
                  type="tel"
                  id="svc-telefono"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="+53 XXXX XXXX"
                />

                <label htmlFor="svc-mensaje">Mensaje (opcional)</label>
                <textarea
                  id="svc-mensaje"
                  rows={3}
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Cuéntanos brevemente qué necesitas…"
                />

                {error && (
                  <div className="svc-modal-error" role="alert">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="svc-modal-btn"
                  disabled={saving}
                >
                  <Send size={16} />
                  Enviar solicitud
                </button>
              </form>
            </div>
          </>
        )}

        {view === 'success' && (
          <div className="svc-modal-success">
            <div className="svc-modal-success-icon">
              <CheckCircle2 size={36} />
            </div>
            <h3 id="svc-modal-title">¡Solicitud enviada! Te contactaremos en breve.</h3>
            <p>Hemos recibido tu solicitud para {servicio.title}. Nuestro equipo te contactará en breve.</p>
            <button className="svc-modal-btn" onClick={handleClose}>
              Cerrar
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .svc-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 9998;
          backdrop-filter: blur(3px);
          overscroll-behavior: contain;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
      `}</style>
    </>
  );
}