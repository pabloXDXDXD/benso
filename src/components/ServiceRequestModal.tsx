'use client';

import { useState } from 'react';
import { CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';
import type { Servicio } from '@/hooks/useData';

type View = 'details' | 'form' | 'success';

interface ServiceRequestModalProps {
  servicio: Servicio | null;
  open: boolean;
  onClose: () => void;
}

// Category slug -> i18n filter label key (services.*)
const CATEGORY_LABEL_KEYS: Record<string, string> = {
  'contabilidad-finanzas': 'filterFinanzas',
  'marketing-marca': 'filterMarketing',
  'soluciones-bi-digital': 'filterBIDigital',
  'administracion-gestion': 'filterAdmon',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ServiceRequestModal({ servicio, open, onClose }: ServiceRequestModalProps) {
  const t = useTranslations('services');
  const common = useTranslations('common');
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

  const categoryLabelKey = CATEGORY_LABEL_KEYS[servicio.category];
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
      setError(t('formError'));
      return;
    }
    if (!EMAIL_RE.test(mail)) {
      setError(t('formError'));
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
      setError(t('submitError'));
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
        <button className="svc-modal-close" onClick={handleClose} aria-label={common('close')}>
          ×
        </button>

        {view === 'details' && (
          <>
            <div className="svc-modal-head">
              {categoryLabelKey && <p className="svc-modal-kicker">{t(categoryLabelKey)}</p>}
              <h3 className="svc-modal-title" id="svc-modal-title">{servicio.title}</h3>
              {servicio.subtitle && <p className="svc-modal-subtitle">{servicio.subtitle}</p>}
            </div>
            <div className="svc-modal-body">
              <p className="svc-modal-desc">{servicio.description}</p>
              {servicio.includes && servicio.includes.length > 0 && (
                <>
                  <p className="svc-modal-includes-label">{t('whatsIncluded')}</p>
                  <ul className="svc-modal-includes">
                    {servicio.includes.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </>
              )}
              <button className="svc-modal-btn" onClick={() => setView('form')}>
                <Send size={16} />
                {t('requestService')}
              </button>
              {whatsappLink && (
                <p className="svc-modal-note">
                  {t.rich('whatsappNote', {
                    whatsapp: (chunks) => (
                      <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                        {chunks}
                      </a>
                    ),
                  })}
                </p>
              )}
            </div>
          </>
        )}

        {view === 'form' && (
          <>
            <div className="svc-modal-head">
              <p className="svc-modal-kicker">{t('requestService')}</p>
              <h3 className="svc-modal-title" id="svc-modal-title">{servicio.title}</h3>
              <p className="svc-modal-subtitle">{t('formIntro')}</p>
            </div>
            <div className="svc-modal-body svc-modal-form">
              <form onSubmit={handleSubmit} noValidate>
                <span className="svc-modal-chip">{t('noCommitment')}</span>

                <label htmlFor="svc-nombre">{t('form.name')}</label>
                <input
                  type="text"
                  id="svc-nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />

                <label htmlFor="svc-email">{t('form.email')}</label>
                <input
                  type="email"
                  id="svc-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <label htmlFor="svc-telefono">{t('form.phone')}</label>
                <input
                  type="tel"
                  id="svc-telefono"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />

                <label htmlFor="svc-mensaje">{t('form.message')}</label>
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
                  {t('submitRequest')}
                </button>
                <button
                  type="button"
                  className="svc-modal-btn svc-modal-btn--secondary"
                  style={{ marginTop: '0.65rem' }}
                  onClick={() => { setError(null); setView('details'); }}
                >
                  ← {t('backToDetails')}
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
            <h3 id="svc-modal-title">{t('requestSent')}</h3>
            <p>{t('requestSentDetail', { servicio: servicio.title })}</p>
            <button className="svc-modal-btn" onClick={handleClose}>
              {common('close')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
