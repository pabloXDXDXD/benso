'use client';

import { useState, useEffect, useRef } from 'react';
import { CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const EDUCATION_LEVELS = [
  'Secundaria',
  'Preuniversitario',
  'Técnico Medio',
  'Universitario',
  'Postgrado',
];

const SECTORS = [
  'Tecnología',
  'Alimentos y bebidas',
  'Moda y diseño',
  'Servicios profesionales',
  'Comercio',
  'Salud y bienestar',
  'Educación',
  'Arte y cultura',
  'Otro',
];

interface EventRegistrationFormProps {
  eventoId: number;
  eventoTitle: string;
  tipo?: 'taller' | 'curso' | 'evento';
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  correo_electronico: string;
  telefono: string;
  nivel_estudios: string;
  tiene_negocio: string; // 'si' | 'no'
  nombre_negocio: string;
  sector: string;
  motivacion: string;
  acuerdo_aprendizaje: boolean;
  notificaciones: string; // 'si' | 'no'
}

interface FormErrors {
  [key: string]: string;
}

const initialFormData: FormData = {
  correo_electronico: '',
  telefono: '',
  nivel_estudios: '',
  tiene_negocio: '',
  nombre_negocio: '',
  sector: '',
  motivacion: '',
  acuerdo_aprendizaje: false,
  notificaciones: 'no',
};

export function EventRegistrationForm({ eventoId, eventoTitle, tipo = 'evento', isOpen, onClose }: EventRegistrationFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const mountedRef = useRef(false);

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
      setIsSubmitting(false);
      mountedRef.current = true;
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  // Clear nombre_negocio when tiene_negocio toggles to "no"
  useEffect(() => {
    if (formData.tiene_negocio === 'no') {
      setFormData(prev => ({ ...prev, nombre_negocio: '' }));
    }
  }, [formData.tiene_negocio]);

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user edits
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

    if (!formData.nivel_estudios) {
      newErrors.nivel_estudios = 'Selecciona una opción';
    }

    if (!formData.tiene_negocio) {
      newErrors.tiene_negocio = 'Selecciona una opción';
    }

    // nombre_negocio is only required if tiene_negocio === 'si'
    if (formData.tiene_negocio === 'si' && !formData.nombre_negocio.trim()) {
      newErrors.nombre_negocio = 'Este campo es obligatorio';
    }

    if (!formData.sector) {
      newErrors.sector = 'Selecciona una opción';
    }

    if (!formData.motivacion.trim()) {
      newErrors.motivacion = 'Este campo es obligatorio';
    } else if (formData.motivacion.trim().length < 10) {
      newErrors.motivacion = 'Debe tener al menos 10 caracteres';
    }

    if (!formData.acuerdo_aprendizaje) {
      newErrors.acuerdo_aprendizaje = 'Debes aceptar el acuerdo de aprendizaje';
    }

    setErrors(newErrors);

    // Focus first errored field
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0];
      const el = formRef.current?.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
      el?.focus();
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || isSubmitting) return;

    if (!validate()) return;

    setSaving(true);
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const { error: dbError } = await supabase
        .from('evento_inscripciones')
        .insert({
          correo_electronico: formData.correo_electronico.trim(),
          telefono: formData.telefono.trim(),
          nivel_estudios: formData.nivel_estudios,
          tiene_negocio: formData.tiene_negocio === 'si',
          nombre_negocio: formData.tiene_negocio === 'si' ? formData.nombre_negocio.trim() : null,
          sector: formData.sector,
          motivacion: formData.motivacion.trim(),
          acuerdo_aprendizaje: formData.acuerdo_aprendizaje,
          notificaciones: formData.notificaciones === 'si',
          evento_id: eventoId,
          evento_titulo: eventoTitle,
        });

      if (dbError) {
        setSubmitError('Error al procesar la inscripción. Intente de nuevo.');
        setSaving(false);
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch {
      setSubmitError('Error al procesar la inscripción. Intente de nuevo.');
    }

    setSaving(false);
    setIsSubmitting(false);
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
            <h2 id="reg-title">¡Inscripción completada!</h2>
            <p className="reg-success-event">{eventoTitle}</p>
            <p className="reg-success-message">
              Tu inscripción ha sido registrada correctamente. Te contactaremos para coordinar los detalles de pago y acceso.
            </p>
            <p className="reg-success-note">Te contactaremos en un plazo de 24-48 horas para confirmar tu lugar.</p>
            <div className="reg-success-actions">
              <button className="reg-btn-primary" onClick={onClose}>
                Continuar navegando
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="reg-header">
              <h2 id="reg-title">Inscripción al {tipo}</h2>
              <p className="reg-event-name">{eventoTitle}</p>
            </div>

            <div className="reg-content">
              <form ref={formRef} onSubmit={handleSubmit} noValidate>
                <p className="reg-required-note">Los campos marcados con * son obligatorios.</p>

                <div className="form-section">
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
                </div>

                <div className="form-section">
                  {/* Nivel de estudios */}
                  <div className={`form-group ${errors.nivel_estudios ? 'reg-field-error' : ''}`}>
                    <label htmlFor="reg-estudios">Nivel de estudios *</label>
                    <select
                      id="reg-estudios"
                      name="nivel_estudios"
                      value={formData.nivel_estudios}
                      onChange={(e) => handleChange('nivel_estudios', e.target.value)}
                      aria-required="true"
                      aria-invalid={!!errors.nivel_estudios}
                      aria-describedby={errors.nivel_estudios ? 'err-nivel_estudios' : undefined}
                    >
                      <option value="" disabled>Selecciona una opción</option>
                      {EDUCATION_LEVELS.filter(Boolean).map(op => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                    {errors.nivel_estudios && (
                      <span className="form-error" id="err-nivel_estudios" role="alert">{errors.nivel_estudios}</span>
                    )}
                  </div>

                  {/* ¿Ya tienes un negocio/emprendimiento? */}
                  <fieldset className={`form-group ${errors.tiene_negocio ? 'reg-field-error' : ''}`}>
                    <legend>¿Ya tienes un negocio/emprendimiento? *</legend>
                    <div className="reg-radio-group">
                      <label className="reg-radio-label">
                        <input
                          type="radio"
                          name="tiene_negocio"
                          value="si"
                          checked={formData.tiene_negocio === 'si'}
                          onChange={() => handleChange('tiene_negocio', 'si')}
                          aria-required="true"
                        />
                        <span>Sí</span>
                      </label>
                      <label className="reg-radio-label">
                        <input
                          type="radio"
                          name="tiene_negocio"
                          value="no"
                          checked={formData.tiene_negocio === 'no'}
                          onChange={() => handleChange('tiene_negocio', 'no')}
                          aria-required="true"
                        />
                        <span>No</span>
                      </label>
                    </div>
                    {errors.tiene_negocio && (
                      <span className="form-error" role="alert">{errors.tiene_negocio}</span>
                    )}
                  </fieldset>

                  {/* Nombre de tu negocio — CONDITIONAL */}
                  <div
                    className={`form-group reg-conditional ${formData.tiene_negocio === 'si' ? 'reg-conditional-visible' : ''} ${errors.nombre_negocio ? 'reg-field-error' : ''}`}
                    aria-hidden={formData.tiene_negocio !== 'si'}
                  >
                    <label htmlFor="reg-negocio">Nombre de tu negocio *</label>
                    <input
                      type="text"
                      id="reg-negocio"
                      name="nombre_negocio"
                      value={formData.nombre_negocio}
                      onChange={(e) => handleChange('nombre_negocio', e.target.value)}
                      placeholder="Nombre de tu negocio"
                      disabled={formData.tiene_negocio !== 'si'}
                      aria-required={formData.tiene_negocio === 'si'}
                      aria-invalid={!!errors.nombre_negocio}
                      aria-describedby={errors.nombre_negocio ? 'err-nombre_negocio' : undefined}
                    />
                    {errors.nombre_negocio && (
                      <span className="form-error" id="err-nombre_negocio" role="alert">{errors.nombre_negocio}</span>
                    )}
                  </div>

                  {/* Sector */}
                  <div className={`form-group ${errors.sector ? 'reg-field-error' : ''}`}>
                    <label htmlFor="reg-sector">¿A qué sector se dedica o en cuál espera emprender? *</label>
                    <select
                      id="reg-sector"
                      name="sector"
                      value={formData.sector}
                      onChange={(e) => handleChange('sector', e.target.value)}
                      aria-required="true"
                      aria-invalid={!!errors.sector}
                      aria-describedby={errors.sector ? 'err-sector' : undefined}
                    >
                      <option value="" disabled>Selecciona una opción</option>
                      {SECTORS.filter(Boolean).map(op => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                    {errors.sector && (
                      <span className="form-error" id="err-sector" role="alert">{errors.sector}</span>
                    )}
                  </div>
                </div>

                <div className="form-section">
                  {/* Motivación */}
                  <div className={`form-group ${errors.motivacion ? 'reg-field-error' : ''}`}>
                    <label htmlFor="reg-motivacion">¿Qué te motiva a tomar este {tipo}? *</label>
                    <textarea
                      id="reg-motivacion"
                      name="motivacion"
                      value={formData.motivacion}
                      onChange={(e) => handleChange('motivacion', e.target.value)}
                      placeholder="Cuéntanos qué esperas aprender…"
                      rows={4}
                      aria-required="true"
                      aria-invalid={!!errors.motivacion}
                      aria-describedby={errors.motivacion ? 'err-motivacion' : undefined}
                    />
                    {errors.motivacion && (
                      <span className="form-error" id="err-motivacion" role="alert">{errors.motivacion}</span>
                    )}
                  </div>
                </div>

                <div className="form-section">
                  {/* Acuerdo de aprendizaje */}
                  <div className={`form-group reg-checkbox-field ${errors.acuerdo_aprendizaje ? 'reg-field-error' : ''}`}>
                    <label className="reg-checkbox-label">
                      <input
                        type="checkbox"
                        name="acuerdo_aprendizaje"
                        checked={formData.acuerdo_aprendizaje}
                        onChange={(e) => handleChange('acuerdo_aprendizaje', e.target.checked)}
                        aria-required="true"
                        aria-invalid={!!errors.acuerdo_aprendizaje}
                        aria-describedby={errors.acuerdo_aprendizaje ? 'err-acuerdo_aprendizaje' : undefined}
                      />
                      <span>Me comprometo a asistir puntualmente, participar de manera activa; así como respetar el ambiente y normas del curso. *</span>
                    </label>
                    {errors.acuerdo_aprendizaje && (
                      <span className="form-error" id="err-acuerdo_aprendizaje" role="alert">{errors.acuerdo_aprendizaje}</span>
                    )}
                  </div>

                  {/* Notificaciones */}
                  <fieldset className="form-group">
                    <legend>¿Deseo recibir notificaciones sobre futuros eventos?</legend>
                    <div className="reg-radio-group">
                      <label className="reg-radio-label">
                        <input
                          type="radio"
                          name="notificaciones"
                          value="si"
                          checked={formData.notificaciones === 'si'}
                          onChange={() => handleChange('notificaciones', 'si')}
                        />
                        <span>Sí</span>
                      </label>
                      <label className="reg-radio-label">
                        <input
                          type="radio"
                          name="notificaciones"
                          value="no"
                          checked={formData.notificaciones === 'no'}
                          onChange={() => handleChange('notificaciones', 'no')}
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </fieldset>
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
                      Enviando inscripción...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Inscribirme
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
        .form-section {
          margin-bottom: 1.5rem;
        }
        .reg-required-note {
          font-size: 0.82rem;
          color: #888;
          margin: 0 0 1.25rem;
        }
        fieldset.form-group {
          border: none;
          padding: 0;
        }
        .form-group legend {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: var(--text-primary);
          font-size: 0.92rem;
        }
        .form-group select {
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 2.5rem;
          appearance: none;
        }
        .form-group textarea {
          min-height: 100px;
          resize: vertical;
        }
        .reg-field-error input,
        .reg-field-error textarea,
        .reg-field-error select {
          border-color: #e74c3c;
        }
        .reg-radio-group {
          display: flex;
          gap: 1.5rem;
        }
        .reg-radio-label {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          cursor: pointer;
          font-size: 0.95rem;
          color: #333;
        }
        .reg-radio-label input[type="radio"] {
          margin: 0;
          cursor: pointer;
          accent-color: var(--accent);
          width: auto;
          flex: 0 0 auto;
        }
        .reg-checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.9rem;
          line-height: 1.5;
          color: #333;
        }
        .reg-checkbox-label input[type="checkbox"] {
          margin: 0;
          margin-top: 3px;
          cursor: pointer;
          accent-color: var(--accent);
          width: auto;
          flex: 0 0 auto;
        }
        .reg-conditional {
          overflow: hidden;
          max-height: 0;
          opacity: 0;
          transform: translateY(-8px);
          transition: max-height 0.3s ease, opacity 0.25s ease, transform 0.25s ease;
          margin-bottom: 0;
          pointer-events: none;
        }
        .reg-conditional-visible {
          max-height: 200px;
          opacity: 1;
          transform: translateY(0);
          margin-bottom: 1.5rem;
          pointer-events: auto;
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
        .reg-success-note {
          background: #fff8e1;
          color: #f57c00;
          padding: 0.875rem 1rem;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
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
