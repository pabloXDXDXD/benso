'use client';

import { useState, useEffect, useRef } from 'react';
import { CheckCircle2, AlertCircle, Send, X } from 'lucide-react';
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

export function EventRegistrationForm({ eventoId, eventoTitle, isOpen, onClose }: EventRegistrationFormProps) {
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
      setFormData(initialFormData);
      setErrors({});
      setSuccess(false);
      setSubmitError(null);
      setSaving(false);
      setIsSubmitting(false);
      mountedRef.current = true;
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
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
          <X size={20} />
        </button>

        {success ? (
          <div className="reg-success">
            <div className="reg-success-icon">
              <CheckCircle2 size={40} />
            </div>
            <h2 id="reg-title">¡Inscripción completada!</h2>
            <p className="reg-success-event">{eventoTitle}</p>
            <p className="reg-success-message">Te contactaremos pronto.</p>
            <div className="reg-success-actions">
              <button className="reg-btn-primary" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="reg-header">
              <h2 id="reg-title">Inscripción al evento</h2>
              <p className="reg-event-name">{eventoTitle}</p>
            </div>

            <div className="reg-content">
              <form ref={formRef} onSubmit={handleSubmit} noValidate>
                {/* Correo electrónico */}
                <div className={`reg-field ${errors.correo_electronico ? 'reg-field-error' : ''}`}>
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
                  <span className="reg-helptext">Te enviaremos los materiales y el acceso al aula.</span>
                  {errors.correo_electronico && (
                    <span className="reg-error" id="err-correo_electronico" role="alert">{errors.correo_electronico}</span>
                  )}
                </div>

                {/* Teléfono */}
                <div className={`reg-field ${errors.telefono ? 'reg-field-error' : ''}`}>
                  <label htmlFor="reg-phone">Teléfono *</label>
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
                  <span className="reg-helptext">Facilita una vía de contacto directo.</span>
                  {errors.telefono && (
                    <span className="reg-error" id="err-telefono" role="alert">{errors.telefono}</span>
                  )}
                </div>

                {/* Nivel de estudios */}
                <div className={`reg-field ${errors.nivel_estudios ? 'reg-field-error' : ''}`}>
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
                    <span className="reg-error" id="err-nivel_estudios" role="alert">{errors.nivel_estudios}</span>
                  )}
                </div>

                {/* ¿Ya tienes un negocio/emprendimiento? */}
                <fieldset className={`reg-field ${errors.tiene_negocio ? 'reg-field-error' : ''}`}>
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
                    <span className="reg-error" role="alert">{errors.tiene_negocio}</span>
                  )}
                </fieldset>

                {/* Nombre de tu negocio — CONDITIONAL */}
                <div
                  className={`reg-field reg-conditional ${formData.tiene_negocio === 'si' ? 'reg-conditional-visible' : ''} ${errors.nombre_negocio ? 'reg-field-error' : ''}`}
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
                    <span className="reg-error" id="err-nombre_negocio" role="alert">{errors.nombre_negocio}</span>
                  )}
                </div>

                {/* Sector */}
                <div className={`reg-field ${errors.sector ? 'reg-field-error' : ''}`}>
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
                    <span className="reg-error" id="err-sector" role="alert">{errors.sector}</span>
                  )}
                </div>

                {/* Motivación */}
                <div className={`reg-field ${errors.motivacion ? 'reg-field-error' : ''}`}>
                  <label htmlFor="reg-motivacion">¿Qué te motiva a tomar este curso? *</label>
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
                    <span className="reg-error" id="err-motivacion" role="alert">{errors.motivacion}</span>
                  )}
                </div>

                {/* Acuerdo de aprendizaje */}
                <div className={`reg-field reg-checkbox-field ${errors.acuerdo_aprendizaje ? 'reg-field-error' : ''}`}>
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
                    <span className="reg-error" id="err-acuerdo_aprendizaje" role="alert">{errors.acuerdo_aprendizaje}</span>
                  )}
                </div>

                {/* Notificaciones */}
                <fieldset className="reg-field">
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
                  className="reg-btn-submit"
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
          background: rgba(0,0,0,0.5);
          z-index: 9998;
          backdrop-filter: blur(3px);
          overscroll-behavior: contain;
        }
        .reg-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: #fff;
          border-radius: var(--radius, 12px);
          width: 95%;
          max-width: 560px;
          max-height: 90vh;
          overflow-y: auto;
          overscroll-behavior: contain;
          box-shadow: 0 25px 60px rgba(0,0,0,0.3);
          font-family: var(--font-main, sans-serif);
          z-index: 9999;
        }
        .reg-close {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: rgba(0,0,0,0.06);
          border: none;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          color: #555;
          transition: background 0.2s;
        }
        .reg-close:hover {
          background: rgba(0,0,0,0.12);
        }
        .reg-header {
          padding: 1.5rem 1.5rem 0.25rem;
        }
        .reg-header h2 {
          color: var(--primary);
          font-size: 1.25rem;
          margin: 0 0 0.25rem;
          font-family: var(--font-heading);
          font-weight: 700;
        }
        .reg-event-name {
          color: var(--dark);
          font-weight: 600;
          font-size: 0.95rem;
          margin: 0;
        }
        .reg-content {
          padding: 1rem 1.5rem 1.5rem;
        }
        .reg-field {
          margin-bottom: 1.25rem;
        }
        fieldset.reg-field {
          border: none;
          padding: 0;
          margin: 0;
        }
        .reg-field label,
        .reg-field legend {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: var(--primary);
          font-size: 0.92rem;
        }
        .reg-field input[type="text"],
        .reg-field input[type="email"],
        .reg-field input[type="tel"],
        .reg-field textarea,
        .reg-field select {
          width: 100%;
          padding: 1rem;
          border: 2px solid var(--card-border, #e6e6e6);
          border-radius: 8px;
          font-family: inherit;
          font-size: 1rem;
          transition: border-color 0.2s;
          background-color: #fff;
          color: #333;
          box-sizing: border-box;
        }
        .reg-field input:focus,
        .reg-field textarea:focus,
        .reg-field select:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(0, 86, 208, 0.15);
        }
        .reg-field textarea {
          min-height: 100px;
          resize: vertical;
        }
        .reg-field select {
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 2.5rem;
          appearance: none;
        }
        .reg-field-error input,
        .reg-field-error textarea,
        .reg-field-error select {
          border-color: #e74c3c;
        }
        .reg-error {
          display: block;
          color: #e74c3c;
          font-size: 0.85rem;
          margin-top: 0.25rem;
        }
        .reg-helptext {
          display: block;
          font-size: 0.82rem;
          color: #888;
          margin-top: 0.3rem;
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
        }
        .reg-conditional {
          overflow: hidden;
          max-height: 0;
          opacity: 0;
          transform: translateY(-8px);
          transition: max-height 0.3s ease, opacity 0.25s ease, transform 0.25s ease, margin 0.25s ease;
          margin-bottom: 0;
          pointer-events: none;
        }
        .reg-conditional-visible {
          max-height: 200px;
          opacity: 1;
          transform: translateY(0);
          margin-bottom: 1.25rem;
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
        .reg-btn-submit {
          width: 100%;
          padding: 0.85rem;
          background: var(--primary);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          font-family: var(--font-main);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: background 0.25s;
        }
        .reg-btn-submit:hover:not(:disabled) {
          background: var(--secondary);
        }
        .reg-btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .reg-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid white;
          border-top-color: transparent;
          border-radius: 50%;
          animation: reg-spin 0.8s linear infinite;
        }
        @keyframes reg-spin {
          to { transform: rotate(360deg); }
        }
        .reg-success {
          padding: 2.5rem 1.5rem;
          text-align: center;
        }
        .reg-success-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 1.25rem;
          background: var(--primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }
        .reg-success h2 {
          color: var(--primary);
          font-size: 1.35rem;
          margin: 0 0 0.35rem;
          font-weight: 700;
          font-family: var(--font-heading);
        }
        .reg-success-event {
          color: var(--accent);
          font-weight: 600;
          font-size: 0.95rem;
          margin: 0 0 0.5rem;
        }
        .reg-success-message {
          font-size: 0.9rem;
          color: #666;
          margin: 0 0 1.25rem;
        }
        .reg-btn-primary {
          padding: 0.75rem 2rem;
          background: var(--primary);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 600;
          font-family: var(--font-main);
          cursor: pointer;
          transition: background 0.25s;
        }
        .reg-btn-primary:hover {
          background: var(--secondary);
        }
        @media (max-width: 480px) {
          .reg-modal {
            width: 100%;
            max-width: 100%;
            border-radius: var(--radius, 12px) var(--radius, 12px) 0 0;
            top: auto;
            bottom: 0;
            left: 0;
            right: 0;
            transform: none;
            max-height: 95vh;
          }
          .reg-header {
            padding: 1.25rem 1.25rem 0.25rem;
          }
          .reg-content {
            padding: 1rem 1.25rem 1.25rem;
          }
          .reg-success {
            padding: 2rem 1.25rem;
          }
        }
      `}</style>
    </>
  );
}
