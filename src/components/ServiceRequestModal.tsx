'use client';

import { useState } from 'react';
import { CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Servicio } from '@/hooks/useData';

type View = 'details' | 'form' | 'success';

interface ServiceRequestModalProps {
  servicio: Servicio | null;
  open: boolean;
  onClose: () => void;
}

// Category slug -> display label
const CATEGORY_LABELS: Record<string, string> = {
  'contabilidad-finanzas': 'Contabilidad y Finanzas',
  'marketing-marca': 'Marketing y Marca',
  'soluciones-bi-digital': 'Soluciones BI y Digital',
  'administracion-gestion': 'Administración y Gestión',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ServiceRequestModal({ servicio, open, onClose }: ServiceRequestModalProps) {
  const [view, setView] = useState<View>('details');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || !servicio) return null;

  const handleClose = () => {
    onClose();
    setView('details');
    setNombre('');
    setEmail('');
    setTelefono('');
    setMensaje('');
    setError(null);
    setSaving(false);
  };

  const categoryLabel = CATEGORY_LABELS[servicio.category];
  const whatsappLink = (servicio as Servicio & { whatsappLink?: string }).whatsapp_link ||
    (servicio as Servicio & { whatsappLink?: string }).whatsappLink;

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

        {view === 'details' && (
          <>
            <div className="svc-modal-head">
              {categoryLabel && <p className="svc-modal-kicker">{categoryLabel}</p>}
              <h3 className="svc-modal-title" id="svc-modal-title">{servicio.title}</h3>
              {servicio.subtitle && <p className="svc-modal-subtitle">{servicio.subtitle}</p>}
            </div>
            <div className="svc-modal-body">
              <p className="svc-modal-desc">{servicio.description}</p>
              {servicio.includes && servicio.includes.length > 0 && (
                <>
                  <p className="svc-modal-includes-label">Qué incluye</p>
                  <ul className="svc-modal-includes">
                    {servicio.includes.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </>
              )}
              <button className="svc-modal-btn" onClick={() => setView('form')}>
                <Send size={16} />
                Solicitar servicio
              </button>
              {whatsappLink && (
                <p className="svc-modal-note">
                  ¿Prefieres hablar directo?{' '}
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    Contáctanos por WhatsApp
                  </a>{' '}
                  para resolver dudas antes de solicitar.
                </p>
              )}
            </div>
          </>
        )}

        {view === 'form' && (
          <>
            <div className="svc-modal-head">
              <p className="svc-modal-kicker">Solicitar servicio</p>
              <h3 className="svc-modal-title" id="svc-modal-title">{servicio.title}</h3>
              <p className="svc-modal-subtitle">Cuéntanos qué necesitas y un especialista te contactará.</p>
            </div>
            <div className="svc-modal-body svc-modal-form">
              <form onSubmit={handleSubmit} noValidate>
                <span className="svc-modal-chip">Sin compromiso</span>

                <label htmlFor="svc-nombre">Nombre completo *</label>
                <input
                  type="text"
                  id="svc-nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />

                <label htmlFor="svc-email">Correo electrónico *</label>
                <input
                  type="email"
                  id="svc-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <label htmlFor="svc-telefono">Teléfono / WhatsApp</label>
                <input
                  type="tel"
                  id="svc-telefono"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />

                <label htmlFor="svc-mensaje">Mensaje (opcional)</label>
                <textarea
                  id="svc-mensaje"
                  rows={3}
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                />

                {error && (
                  <div className="svc-modal-error" role="alert">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="svc-modal-btn svc-modal-btn--gradient"
                  disabled={saving}
                >
                  <Send size={16} />
                  Enviar solicitud
                </button>
                <button
                  type="button"
                  className="svc-modal-btn svc-modal-btn--secondary"
                  style={{ marginTop: '0.65rem' }}
                  onClick={() => { setError(null); setView('details'); }}
                >
                  ← Volver a los detalles
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
    </>
  );
}
