'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Bell, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface NotificacionFormProps {
  eventoId: number;
  eventoTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  nombre: string;
  correo_electronico: string;
  telefono: string;
}

interface FormErrors {
  [key: string]: string;
}

const initialFormData: FormData = {
  nombre: '',
  correo_electronico: '',
  telefono: '',
};

export function NotificacionForm({ eventoId, eventoTitle, isOpen, onClose }: NotificacionFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      setFormData(initialFormData);
      setErrors({});
      setSuccess(false);
      setSubmitError(null);
      setSaving(false);
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.correo_electronico.trim()) {
      newErrors.correo_electronico = 'Este campo es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo_electronico)) {
      newErrors.correo_electronico = 'Correo electrónico no válido';
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'Este campo es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setSubmitError(null);

    try {
      const { error } = await supabase.from('evento_inscripciones').insert({
        evento_id: eventoId,
        evento_titulo: eventoTitle,
        correo_electronico: formData.correo_electronico.trim(),
        telefono: formData.telefono.trim(),
        nombre_negocio: formData.nombre.trim() || null,
        tipo_solicitud: 'aviso',
        notificaciones: true,
      });

      if (error) throw error;
      setSuccess(true);
    } catch {
      setSubmitError('Error al procesar la solicitud. Intente de nuevo.');
    }

    setSaving(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="reg-overlay" onClick={onClose} aria-hidden="true" />
      <div className="reg-modal" role="dialog" aria-modal="true" aria-labelledby="reg-title">
        <button className="reg-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>

        {success ? (
          <div className="reg-success">
            <div className="reg-success-icon">
              <CheckCircle2 size={40} />
            </div>
            <h2 id="reg-title">¡Solicitud registrada!</h2>
            <p className="reg-success-event">{eventoTitle}</p>
            <p className="reg-success-message">
              Te avisaremos cuando este programa esté disponible para inscripción.
            </p>
            <div className="reg-success-actions">
              <button className="reg-btn-primary" onClick={onClose}>
                Continuar navegando
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="reg-header">
              <h2 id="reg-title">Avísame de este programa</h2>
              <p className="reg-event-name">{eventoTitle}</p>
            </div>

            <div className="reg-content">
              <form onSubmit={handleSubmit} noValidate>
                <p className="reg-required-note">Los campos marcados con * son obligatorios.</p>

                {/* Nombre (opcional) */}
                <div className="form-group">
                  <label htmlFor="reg-nombre">Nombre</label>
                  <input
                    type="text"
                    id="reg-nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={(e) => handleChange('nombre', e.target.value)}
                    placeholder="Tu nombre"
                    autoComplete="name"
                  />
                </div>

                {/* Correo electrónico */}
                <div className={`form-group ${errors.correo_electronico ? 'reg-field-error' : ''}`}>
                  <label htmlFor="reg-email">Correo electrónico *</label>
                  <input
                    type="email"
                    id="reg-email"
                    name="correo_electronico"
                    value={formData.correo_electronico}
                    onChange={(e) => handleChange('correo_electronico', e.target.value)}
                    placeholder="tu@email.com"
                    autoComplete="email"
                    aria-required="true"
                    aria-invalid={!!errors.correo_electronico}
                    aria-describedby={errors.correo_electronico ? 'err-correo_electronico' : undefined}
                  />
                  {errors.correo_electronico && (
                    <span className="form-error" id="err-correo_electronico" role="alert">{errors.correo_electronico}</span>
                  )}
                </div>

                {/* Teléfono */}
                <div className={`form-group ${errors.telefono ? 'reg-field-error' : ''}`}>
                  <label htmlFor="reg-phone">Teléfono / WhatsApp *</label>
                  <input
                    type="tel"
                    id="reg-phone"
                    name="telefono"
                    value={formData.telefono}
                    onChange={(e) => handleChange('telefono', e.target.value)}
                    placeholder="+53 XXXX XXXX"
                    autoComplete="tel"
                    aria-required="true"
                    aria-invalid={!!errors.telefono}
                    aria-describedby={errors.telefono ? 'err-telefono' : undefined}
                  />
                  {errors.telefono && (
                    <span className="form-error" id="err-telefono" role="alert">{errors.telefono}</span>
                  )}
                </div>

                {/* Submit error banner */}
                {submitError && (
                  <div className="reg-submit-error" role="alert">
                    <AlertCircle size={20} />
                    {submitError}
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="reg-spinner"></span>
                      Enviando solicitud...
                    </>
                  ) : (
                    <>
                      <Bell size={20} />
                      Enviar solicitud
                    </>
                  )}
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .reg-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: 9998;
          backdrop-filter: blur(4px);
          overscroll-behavior: contain;
        }
        .reg-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: #fff;
          border-radius: 16px;
          width: 95%;
          max-width: 560px;
          max-height: 90vh;
          overflow-y: auto;
          overscroll-behavior: contain;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          font-family: var(--font-main, sans-serif);
          z-index: 9999;
        }
        .reg-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          font-size: 2rem;
          line-height: 1;
          color: #666;
          cursor: pointer;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
          z-index: 2;
        }
        .reg-close:hover {
          background: #f0f0f0;
          color: #333;
        }
        .reg-header {
          padding: 2rem 2rem 1rem;
          border-bottom: 1px solid #e6e6e6;
        }
        .reg-header h2 {
          color: var(--primary);
          font-size: 1.4rem;
          font-weight: 600;
          margin: 0 0 0.5rem;
          font-family: var(--font-main);
        }
        .reg-event-name {
          color: var(--dark);
          font-weight: 600;
          font-size: 1.05rem;
          margin: 0;
        }
        .reg-content {
          padding: 1.5rem 2rem 2rem;
        }
        .reg-required-note {
          font-size: 0.82rem;
          color: #888;
          margin: 0 0 1.25rem;
        }
        .reg-field-error input,
        .reg-field-error textarea,
        .reg-field-error select {
          border-color: #e74c3c;
        }
        .reg-submit-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #ffebee;
          color: #c62828;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }
        .reg-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid white;
          border-top-color: transparent;
          border-radius: 50%;
          animation: reg-spin 0.8s linear infinite;
        }
        @keyframes reg-spin {
          to { transform: rotate(360deg); }
        }
        .reg-success {
          padding: 3rem 2rem;
          text-align: center;
        }
        .reg-success-icon {
          width: 72px;
          height: 72px;
          margin: 0 auto 1.5rem;
          background: #4CAF50;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }
        .reg-success-icon svg {
          width: 36px;
          height: 36px;
        }
        .reg-success h2 {
          color: var(--primary);
          font-size: 1.5rem;
          margin: 0 0 0.5rem;
          font-weight: 600;
          font-family: var(--font-main);
        }
        .reg-success-event {
          color: var(--dark);
          font-weight: 600;
          font-size: 1rem;
          margin: 0 0 0.5rem;
        }
        .reg-success-message {
          font-size: 0.95rem;
          color: #444;
          line-height: 1.6;
          margin: 0 0 0.75rem;
          font-family: var(--font-main);
        }
        .reg-success-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 1.5rem;
        }
        .reg-btn-primary {
          padding: 0.875rem 2rem;
          background: var(--primary);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          font-family: var(--font-main);
          cursor: pointer;
          transition: var(--transition);
        }
        .reg-btn-primary:hover {
          background: var(--secondary);
        }
        @media (max-width: 480px) {
          .reg-modal {
            width: 100%;
            max-width: 100%;
            border-radius: 16px 16px 0 0;
            top: auto;
            bottom: 0;
            left: 0;
            right: 0;
            transform: none;
            max-height: 95vh;
          }
          .reg-header {
            padding: 1.5rem 1.25rem 0.75rem;
          }
          .reg-content {
            padding: 1.25rem 1.25rem 1.5rem;
          }
          .reg-success {
            padding: 2rem 1.25rem;
          }
        }
      `}</style>
    </>
  );
}
