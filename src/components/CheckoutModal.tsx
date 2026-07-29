'use client';

import { useState } from 'react';
import { CheckCircle2, Clipboard, AlertCircle, CreditCard } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useCurrency } from '@/context/CurrencyContext';
import { formatPriceInCurrency } from '@/lib/currencyUtils';
import { useTranslations } from 'next-intl';

export function CheckoutModal() {
  const { items, totalPrice, isCheckoutOpen, setIsCheckoutOpen, saveOrder } = useCart();
  const { currency } = useCurrency();
  const t = useTranslations('checkout');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isCheckoutOpen) return null;

  const handleClose = () => {
    setIsCheckoutOpen(false);
    setTimeout(() => {
      setSuccess(false);
      setError(null);
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setCustomerAddress('');
      setOrderId(null);
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    
    setSaving(true);
    setError(null);
    
    const result = await saveOrder(customerName, customerEmail);
    
    if (result.success && result.pedidoId) {
      setOrderId(result.pedidoId);
      setSuccess(true);
    } else {
      setError(result.error || t('error.saveError'));
    }
    
    setSaving(false);
  };

  return (
    <>
      <div className="checkout-overlay" onClick={handleClose} />
      <div className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
        <button className="checkout-close" onClick={handleClose} aria-label={t('ariaClose')}>
          ×
        </button>

        {success ? (
          <div className="checkout-success">
            <div className="success-icon">
              <CheckCircle2 size={40} />
            </div>
            <h2 id="checkout-title">{t('success.title')}</h2>
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
              {t('success.message')} <strong>{t('success.paymentNote')}</strong>
              {t('success.paymentDetail').replace(t('success.paymentNote'), '')}
            </p>
            <p className="success-note">
              {t('success.contactNote')}
            </p>
            <div className="success-actions">
              <button className="btn-primary" onClick={handleClose}>
                {t('success.continueShopping')}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="checkout-header">
              <h2 id="checkout-title">{t('title')}</h2>
              <p className="checkout-subtitle">{t('subtitle')}</p>
            </div>

            <div className="checkout-content">
              <form onSubmit={handleSubmit}>
                <div className="form-section">
                  <h3>{t('contactSection')}</h3>
                  
                  <div className="form-group">
                    <label htmlFor="checkout-name">{t('form.name')}</label>
                    <input
                      type="text"
                      id="checkout-name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={t('form.namePlaceholder')}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="checkout-email">{t('form.email')}</label>
                    <input
                      type="email"
                      id="checkout-email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder={t('form.emailPlaceholder')}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="checkout-phone">{t('form.phone')}</label>
                    <input
                      type="tel"
                      id="checkout-phone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder={t('form.phonePlaceholder')}
                      required
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h3>{t('deliverySection')}</h3>
                  
                  <div className="form-group">
                    <label htmlFor="checkout-address">{t('form.address')}</label>
                    <textarea
                      id="checkout-address"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder={t('form.addressPlaceholder')}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h3>{t('summarySection')}</h3>
                  <div className="order-items">
                    {items.map(item => (
                      <div key={item.id} className="order-item">
                        <div className="item-info">
                          <span className="item-name">{item.productTitle} — {item.variant}</span>
                          <span className="item-qty">x{item.quantity}</span>
                        </div>
                        <span className="item-price">{formatPriceInCurrency(item.priceNum * item.quantity, currency)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="order-total">
                    <span>Total:</span>
                    <span className="total-amount">{formatPriceInCurrency(totalPrice, currency)}</span>
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
                  disabled={saving || items.length === 0}
                >
                  {saving ? (
                    <>
                      <span className="spinner"></span>
                      {t('submitting')}
                    </>
                  ) : (
                    <>
                      <CreditCard size={20} />
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
        .checkout-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: 9998;
          backdrop-filter: blur(4px);
        }

        .checkout-modal {
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

        .checkout-close {
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

        .checkout-close:hover {
          background: #f0f0f0;
          color: #333;
        }

        .checkout-header {
          padding: 2rem 2rem 1rem;
          border-bottom: 1px solid #e6e6e6;
        }

        .checkout-header h2 {
          color: var(--primary);
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0 0 0.25rem;
          font-family: var(--font-main);
        }

        .checkout-subtitle {
          color: #666;
          font-size: 0.9rem;
          font-family: var(--font-main);
          margin: 0;
        }

        .checkout-content {
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
          background-color: var(--white);
        }

        .order-items {
          background: #f8f8f8;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .order-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid #e6e6e6;
        }

        .order-item:last-child {
          border-bottom: none;
        }

        .item-info {
          display: flex;
          gap: 0.5rem;
        }

        .item-name {
          color: #333;
        }

        .item-qty {
          color: #666;
          font-size: 0.9rem;
        }

        .item-price {
          font-weight: 600;
          color: var(--primary);
        }

        .order-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1rem;
          border-top: 2px solid var(--primary);
          font-size: 1.1rem;
          font-weight: 700;
        }

        .total-amount {
          color: var(--primary);
          font-size: 1.25rem;
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
        .checkout-success {
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

        .checkout-success h2 {
          color: var(--primary);
          font-size: 1.5rem;
          margin: 0 0 0.5rem;
          font-weight: 600;
        }

        .order-number {
          font-size: 1.25rem;
          color: var(--accent);
          font-weight: 700;
          margin: 0 0 1rem;
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

        .success-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
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

        .success-note strong {
          display: block;
          font-size: 1rem;
        }
      `}</style>
    </>
  );
}
