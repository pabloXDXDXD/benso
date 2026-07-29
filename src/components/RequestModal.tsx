'use client';

import { useState } from 'react';
import { CheckCircle2, Clipboard, AlertCircle, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';

interface RequestModalItem {
  title: string;
  price: string;
  priceNum: number;
  whatsappLink: string;
  type: 'servicio' | 'producto' | 'evento';
}

interface RequestModalProps {
  item: RequestModalItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RequestModal({ item, isOpen, onClose }: RequestModalProps) {
  const t = useTranslations('requestModal');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setSuccess(false);
      setError(null);
      setOrderId(null);
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !item) return;

    setSaving(true);
    setError(null);

    const orderItem = {
      title: item.title,
      price: item.price,
      priceNum: item.priceNum,
      quantity: 1,
    };

    try {
      const { data, error: dbError } = await supabase
        .from('pedidos')
        .insert({
          customer_name: name.trim() || 'Cliente web',
          customer_email: email.trim() || null,
          items: [orderItem],
          total_price: item.priceNum,
          status: 'pendiente',
        })
        .select('id')
        .single();

      if (dbError) {
        setError(dbError.message);
        setSaving(false);
        return;
      }

      setOrderId(data.id);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || t('error.processError'));
    }

    setSaving(false);
  };

  if (!isOpen || !item) return null;

  return (
    <>
      <div className="request-overlay" onClick={handleClose} />
      <div className="request-modal" role="dialog" aria-modal="true" aria-labelledby="request-title">
        <button className="request-close" onClick={handleClose} aria-label={t('ariaClose')}>
          ×
        </button>

        {success ? (
          <div className="request-success">
            <div className="success-icon">
              <CheckCircle2 size={40} />
            </div>
            <h2 id="request-title">{t('success.title')}</h2>
            <div className="order-id-box">
              <span className="order-label">{t('success.orderLabel')}</span>
              <span className="order-number">#{orderId}</span>
              <button
                className="copy-btn"
                onClick={() => navigator.clipboard.writeText(String(orderId))}
                title="Copiar ID"
              >
                <Clipboard size={16} />
{t('success.copy')}
              </button>
            </div>
            <p className="success-message">
              {t('success.message', { title: item.title })}<strong> {t('success.paymentNote')}</strong>
              {t('success.paymentDetail').replace(t('success.paymentNote'), '')}
            </p>
            <p className="success-note">
              {t('success.contactNote')}
            </p>
            <div className="success-actions">
              <button className="btn-primary" onClick={handleClose}>
                {t('success.continue')}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="request-header">
              <h2 id="request-title">
                {item.type === 'evento' ? t('titleEvent') : t('titleDefault')}
              </h2>
              <p className="request-item-name">{item.title}</p>
              <p className="request-item-price">{item.price}</p>
            </div>

            <div className="request-content">
              <form onSubmit={handleSubmit}>
                <div className="form-section">
                  <h3>{t('contactSection')}</h3>

                  <div className="form-group">
                    <label htmlFor="request-name">{t('form.name')}</label>
                    <input
                      type="text"
                      id="request-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('form.namePlaceholder')}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="request-email">{t('form.email')}</label>
                    <input
                      type="email"
                      id="request-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('form.emailPlaceholder')}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="request-phone">{t('form.phone')}</label>
                    <input
                      type="tel"
                      id="request-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t('form.phonePlaceholder')}
                      required
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h3>{t('messageSection')} <span style={{ fontWeight: 400, opacity: 0.6 }}>({t('messageOptional')})</span></h3>
                  <div className="form-group">
                    <textarea
                      id="request-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t('form.messagePlaceholder')}
                      rows={3}
                    />
                  </div>
                </div>

                {error && (
                  <div className="form-error">
                    <AlertCircle size={20} />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-submit"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner"></span>
                      {t('submitting')}
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      {t('submit')}
                    </>
                  )}
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .request-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: 9998;
          backdrop-filter: blur(4px);
        }

        .request-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 95%;
          max-width: 500px;
          max-height: 90vh;
          background: white;
          border-radius: 16px;
          z-index: 9999;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .request-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          font-size: 2rem;
          color: #666;
          cursor: pointer;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .request-close:hover {
          background: #f0f0f0;
          color: #333;
        }

        .request-header {
          padding: 2rem 2rem 1rem;
          border-bottom: 1px solid #e6e6e6;
        }

        .request-header h2 {
          color: var(--primary);
          font-size: 1.4rem;
          font-weight: 600;
          margin: 0 0 0.5rem;
          font-family: var(--font-main);
        }

        .request-item-name {
          color: var(--dark);
          font-weight: 600;
          font-size: 1.05rem;
          margin: 0 0 0.25rem;
        }

        .request-item-price {
          color: var(--accent);
          font-weight: 700;
          font-size: 1.2rem;
          margin: 0;
        }

        .request-content {
          padding: 1.5rem 2rem 2rem;
        }

        .form-section {
          margin-bottom: 1.5rem;
        }

        .form-section h3 {
          font-size: 1rem;
          color: var(--primary);
          margin: 0 0 1rem;
          font-family: var(--font-main);
          font-weight: 600;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid var(--light-gray);
        }

        .form-group label {
          font-family: var(--font-main);
        }

        .form-group input,
        .form-group textarea {
          font-family: var(--font-main);
        }

        .form-error {
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

        .btn-submit {
          width: 100%;
          padding: 1rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          font-family: var(--font-main);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: var(--transition);
          margin-bottom: 1rem;
        }

        .btn-submit:hover:not(:disabled) {
          background: var(--secondary);
        }

        .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid white;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Success state */
        .request-success {
          padding: 3rem 2rem;
          text-align: center;
        }

        .success-icon {
          width: 72px;
          height: 72px;
          margin: 0 auto 1.5rem;
          background: #4CAF50;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .success-icon svg {
          width: 36px;
          height: 36px;
          color: white;
        }

        .request-success h2 {
          color: var(--primary);
          font-size: 1.5rem;
          margin: 0 0 0.5rem;
          font-weight: 600;
        }

        .order-id-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          background: var(--light);
          padding: 1rem 1.5rem;
          border-radius: 12px;
          margin: 1rem 0;
        }

        .order-label {
          font-size: 0.85rem;
          color: #666;
          font-family: var(--font-main);
        }

        .order-id-box .order-number {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--primary);
          margin: 0;
          font-family: var(--font-main);
        }

        .copy-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: transparent;
          color: var(--accent);
          border: 1px solid var(--accent);
          padding: 0.4rem 0.75rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 0.25rem;
        }

        .copy-btn:hover {
          background: var(--accent);
          color: white;
        }

        .success-message {
          font-size: 0.95rem;
          color: #444;
          line-height: 1.6;
          margin: 0 0 0.75rem;
          font-family: var(--font-main);
        }

        .success-message strong {
          color: var(--primary);
        }

        .success-note {
          background: #fff8e1;
          color: #f57c00;
          padding: 0.875rem 1rem;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
        }

        .success-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 1.5rem;
        }

        .btn-primary {
          padding: 0.875rem 2rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          font-family: var(--font-main);
          cursor: pointer;
          transition: var(--transition);
        }

        .btn-primary:hover {
          background: var(--secondary);
        }
      `}</style>
    </>
  );
}
