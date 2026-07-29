'use client';

import { useState, useMemo, type FormEvent } from 'react';
import { BentoCard, FAQAccordion, ScrollReveal, AnimatedSection, ShinyText } from '@/components';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';
import { useFaqs } from '@/hooks/useData';

interface ServiceItem {
  title: string;
  price: string;
  description: string;
  icon: string;
  image: string;
  category?: string;
  whatsappLink: string;
}

export function ContactPage({ servicesData = { featured: [], all: [] } }: { servicesData?: { featured: ServiceItem[]; all: ServiceItem[] } }) {
  const { faqs: faqItems } = useFaqs();
  const serviceOptions = useMemo(() => servicesData.all.map((s) => s.title), [servicesData]);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    fecha: '',
    servicio: '',
    mensaje: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const t = useTranslations('contact');

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'nombre':
        return value.trim() ? '' : t('validation.nameRequired');
      case 'email':
        if (!value.trim()) return t('validation.emailRequired');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t('validation.validEmail');
        return '';
      case 'telefono':
        if (!value.trim()) return t('validation.phoneRequired');
        if (!/^[+]?[\d\s-]{7,}$/.test(value)) return t('validation.validPhone');
        return '';
      case 'fecha':
        return value.trim() ? '' : t('validation.dateRequired');
      default:
        return '';
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    for (const field of ['nombre', 'email', 'telefono', 'fecha'] as const) {
      const msg = validateField(field, formData[field]);
      if (msg) newErrors[field] = msg;
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return;
    }
    
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('citas')
        .insert({
          nombre: formData.nombre.trim(),
          email: formData.email.trim() || null,
          telefono: formData.telefono.trim(),
          mensaje: `${formData.servicio ? `Servicio: ${formData.servicio}\n` : ''}Fecha preferida: ${formData.fecha}${formData.mensaje ? `\n\nMensaje:\n${formData.mensaje}` : ''}`
        });
      
      if (error) {
        console.error('Error saving cita:', error);
        newErrors.general = t('error.saveError');
        setErrors(newErrors);
      } else {
        setSuccess(true);
        setFormData({
          nombre: '',
          email: '',
          telefono: '',
          fecha: '',
          servicio: '',
          mensaje: ''
        });
      }
    } catch (err) {
      console.error('Error:', err);
      newErrors.general = t('error.processError');
      setErrors(newErrors);
    }
    
    setSaving(false);
  };

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      const msg = validateField(field, value);
      setErrors(prev => {
        const next = { ...prev };
        if (msg) {
          next[field] = msg;
        } else {
          delete next[field];
        }
        return next;
      });
    }
  };

  if (success) {
    return (
      <>
        <div className="modal-overlay" onClick={() => setSuccess(false)} />
        <div className="modal-success">
          <div className="modal-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2>{t('success.title')}</h2>
          <p className="modal-message">
            {t('success.message')}
          </p>
          <div className="modal-note">
            {t('success.note')}
          </div>
          <button 
            className="btn-modal"
            onClick={() => setSuccess(false)}
          >
            {t('success.acceptButton')}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <ScrollReveal>
        <div className="container">
          <div className="section-title-center page-intro-title">
            <h2>{t('sectionTitle')}</h2>
          </div>
          
          <div className="text-center">
            <BentoCard className="contact-form-card" style={{ maxWidth: '600px', margin: '0 auto' } as any}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>{t('formTitle')}</h3>
              <form id="appointment-form" style={{ textAlign: 'left' }} onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                  <label htmlFor="nombre">{t('form.name')}</label>
                  <input 
                    type="text" 
                    id="nombre" 
                    name="nombre" 
                    autoComplete="name"
                    required 
                    aria-required="true"
                    aria-invalid={!!errors.nombre}
                    value={formData.nombre}
                    onChange={handleChange('nombre')}
                    style={{ borderColor: errors.nombre ? '#e74c3c' : undefined }}
                  />
                  {errors.nombre && <span className="form-error">{errors.nombre}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">{t('form.email')}</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    autoComplete="email"
                    required 
                    aria-required="true"
                    aria-invalid={!!errors.email}
                    value={formData.email}
                    onChange={handleChange('email')}
                    placeholder={t('form.emailPlaceholder')}
                    style={{ borderColor: errors.email ? '#e74c3c' : undefined }}
                  />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="telefono">{t('form.phone')}</label>
                  <input 
                    type="tel" 
                    id="telefono" 
                    name="telefono" 
                    autoComplete="tel"
                    required 
                    aria-required="true"
                    aria-invalid={!!errors.telefono}
                    value={formData.telefono}
                    onChange={handleChange('telefono')}
                    placeholder={t('form.phonePlaceholder')}
                    style={{ borderColor: errors.telefono ? '#e74c3c' : undefined }}
                  />
                  {errors.telefono && <span className="form-error">{errors.telefono}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="fecha">{t('form.date')}</label>
                  <input 
                    type="date" 
                    id="fecha" 
                    name="fecha" 
                    required 
                    aria-required="true"
                    aria-invalid={!!errors.fecha}
                    value={formData.fecha}
                    onChange={handleChange('fecha')}
                    style={{ borderColor: errors.fecha ? '#e74c3c' : undefined }}
                  />
                  {errors.fecha && <span className="form-error">{errors.fecha}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="servicio">{t('form.service')}</label>
                  <select
                    id="servicio"
                    name="servicio"
                    value={formData.servicio}
                    onChange={handleChange('servicio')}
                  >
                    <option value="">{t('form.servicePlaceholder')}</option>
                    {serviceOptions.map((option: string) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="mensaje">{t('form.message')}</label>
                  <textarea
                    id="mensaje"
                    name="mensaje"
                    value={formData.mensaje}
                    onChange={handleChange('mensaje')}
                    placeholder={t('form.messagePlaceholder')}
                    rows={3}
                  />
                </div>

                {errors.general && (
                  <div className="form-error" style={{ marginBottom: '1rem', padding: '0.75rem', background: '#ffebee' }}>
                    {errors.general}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="btn-submit" 
                  style={{ background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner" style={{ borderColor: 'white', borderTopColor: 'transparent' }}></span>
                      {t('submitting')}
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                      {t('submit')}
                    </>
                  )}
                </button>
              </form>
            </BentoCard>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <div className="container">
          <div className="section-title-center">
            <h2>{t('faqTitle')}</h2>
          </div>
          
          <AnimatedSection>
            <FAQAccordion items={faqItems} />
          </AnimatedSection>
        </div>
      </ScrollReveal>

      <style jsx>{`
        .success-icon-large {
          width: 80px;
          height: 80px;
          margin: 0 auto 1.5rem;
          background: #4CAF50;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .success-icon-large svg {
          width: 40px;
          height: 40px;
          color: white;
        }
        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          z-index: 9998;
          backdrop-filter: blur(4px);
        }
        .modal-success {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          padding: 2.5rem 2rem;
          border-radius: 16px;
          z-index: 9999;
          text-align: center;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .modal-icon {
          width: 72px;
          height: 72px;
          margin: 0 auto 1.5rem;
          background: #4CAF50;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-icon svg {
          width: 36px;
          height: 36px;
          color: white;
        }
        .modal-success h2 {
          color: var(--primary);
          font-size: 1.5rem;
          margin: 0 0 1rem;
        }
        .modal-message {
          color: #666;
          line-height: 1.6;
          margin: 0 0 1rem;
        }
        .modal-note {
          background: #fff8e1;
          color: #f57c00;
          padding: 0.875rem 1rem;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
        }
        .btn-modal {
          width: 100%;
          padding: 0.875rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-modal:hover {
          background: var(--secondary);
        }
      `}</style>
    </>
  );
}
