'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import './JobApplicationModal.css';

type View = 'form' | 'success';

interface JobApplicationModalProps {
  open: boolean;
  onClose: () => void;
}

/** Áreas del equipo — el perfil de BENSO según los servicios que ofrece. */
export const JOB_AREAS = [
  'Diseño gráfico y marca',
  'Marketing digital y contenido',
  'Desarrollo web y tecnología',
  'Contabilidad y finanzas',
  'Comercial y atención al cliente',
  'Formaciones y capacitación',
  'Otro',
] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function JobApplicationModal({ open, onClose }: JobApplicationModalProps) {
  const [view, setView] = useState<View>('form');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [area, setArea] = useState<string>(JOB_AREAS[0]);
  const [experiencia, setExperiencia] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lock background scroll while the modal is open (same behavior as the other modals).
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

  if (!open) return null;

  const handleClose = () => {
    onClose();
    setView('form');
    setNombre('');
    setEmail('');
    setTelefono('');
    setArea(JOB_AREAS[0]);
    setExperiencia('');
    setMensaje('');
    setError(null);
    setSaving(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const name = nombre.trim();
    const mail = email.trim();

    if (!name || !mail || !area) {
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
      .from('empleo_solicitudes')
      .insert({
        nombre: name,
        email: mail,
        telefono: telefono.trim() || null,
        area,
        experiencia: experiencia.trim() || null,
        mensaje: mensaje.trim() || null,
      });

    if (dbError) {
      setError('No pudimos enviar tu postulación. Inténtalo de nuevo.');
      setSaving(false);
      return;
    }

    setSaving(false);
    setView('success');
  };

  // Portal to <body>: the banner subtree has a transformed ancestor, which would
  // otherwise make `position: fixed` resolve against that ancestor instead of
  // the viewport and break the modal centering.
  return createPortal(
    <>
      <div className="svc-modal-overlay" onClick={handleClose} />
      <div className="svc-modal-panel" role="dialog" aria-modal="true" aria-labelledby="job-modal-title">
        <button className="svc-modal-close" onClick={handleClose} aria-label="Cerrar">
          ×
        </button>

        {view === 'form' && (
          <>
            <div className="svc-modal-head">
              <h3 className="svc-modal-title" id="job-modal-title">Postula al equipo de BENSO</h3>
              <p className="svc-modal-subtitle">
                Estamos formando un equipo multidisciplinario. Cuéntanos quién eres y te contactamos.
              </p>
            </div>
            <div className="svc-modal-body svc-modal-form job-modal-form">
              <form onSubmit={handleSubmit} noValidate>
                <p className="svc-modal-required-note">Los campos marcados con * son obligatorios.</p>

                <label htmlFor="job-nombre">Nombre completo *</label>
                <input
                  type="text"
                  id="job-nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre completo"
                  required
                />

                <label htmlFor="job-email">Correo electrónico *</label>
                <input
                  type="email"
                  id="job-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                />

                <label htmlFor="job-telefono">Teléfono / WhatsApp</label>
                <input
                  type="tel"
                  id="job-telefono"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="+53 XXXX XXXX"
                />

                <label htmlFor="job-area">Área de interés *</label>
                <select id="job-area" value={area} onChange={(e) => setArea(e.target.value)} required>
                  {JOB_AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>

                <label htmlFor="job-experiencia">Experiencia o lo que puedes aportar</label>
                <textarea
                  id="job-experiencia"
                  rows={4}
                  value={experiencia}
                  onChange={(e) => setExperiencia(e.target.value)}
                  placeholder="Cuéntanos tu experiencia, tus habilidades o lo que te gustaría aportar al equipo…"
                />

                <label htmlFor="job-mensaje">Mensaje (opcional)</label>
                <textarea
                  id="job-mensaje"
                  rows={3}
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Disponibilidad, enlaces a tu portafolio o cualquier otra cosa que quieras contarnos…"
                />

                {error && (
                  <div className="svc-modal-error" role="alert">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}

                <button type="submit" className="svc-modal-btn" disabled={saving}>
                  <Send size={16} />
                  Enviar postulación
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
            <h3 id="job-modal-title">¡Postulación enviada! Te contactaremos en breve.</h3>
            <p>
              Recibimos tu postulación para {area}. Nuestro equipo revisará tu perfil y te escribirá
              para seguir en el proceso.
            </p>
            <button className="svc-modal-btn" onClick={handleClose}>
              Cerrar
            </button>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
