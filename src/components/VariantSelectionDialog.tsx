'use client';
import { useState, useEffect } from 'react';
import { ShoppingCart, X, Plus, Minus, Package } from 'lucide-react';
import Image from 'next/image';
import { useCart } from '@/hooks/useCart';
import { imgSrc } from '@/lib/imageLoader';
import { useCurrency } from '@/context/CurrencyContext';
import { formatPriceInCurrency } from '@/lib/currencyUtils';

interface Variant {
  label: string;
  unitPrice: number;
  totalPrice: number;
  description?: string;
}

interface VariantSelectionDialogProps {
  product: {
    id: number;
    title: string;
    description: string;
    image: string;
    variants: Variant[];
    category: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function VariantSelectionDialog({ product, isOpen, onClose }: VariantSelectionDialogProps) {
  const { addItem } = useCart();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const { currency } = useCurrency();
  const selectedVariant = product.variants[selectedIndex];
  const subtotal = selectedVariant.totalPrice * quantity;

  const handleAdd = () => {
    addItem(product.title, selectedVariant.label, selectedVariant.unitPrice, quantity);
    onClose();
  };

  const isSingleVariant = product.variants.length === 1;

  return (
    <div className="vsel-overlay" onClick={onClose}>
      <div className="vsel-dialog" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}
        aria-label={`Seleccionar variante de ${product.title}`}>
        <button className="vsel-close" onClick={onClose} aria-label="Cerrar">
          <X size={20} />
        </button>

        {/* Product image */}
        {product.image ? (
          <div className="vsel-img-wrap">
            <Image src={imgSrc(product.image)} alt={product.title} width={400} height={225}
              className="vsel-img" unoptimized style={{ width: '100%', height: 'auto' }} />
          </div>
        ) : (
          <div className="vsel-img-wrap vsel-img-placeholder">
            <Package size={48} opacity={0.25} />
          </div>
        )}

        <div className="vsel-body">
          <h3 className="vsel-title">{product.title}</h3>

          {/* Variant selector — only show when there are multiple options */}
          {!isSingleVariant && (
            <div className="vsel-section">
              <label className="vsel-label">Presentación</label>
              <div className="vsel-options">
                {product.variants.map((v, i) => (
                  <button key={v.label}
                    className={`vsel-option${i === selectedIndex ? ' vsel-option--sel' : ''}`}
                    onClick={() => { setSelectedIndex(i); setQuantity(1); }}>
                    <div className="vsel-option-info">
                      <span className="vsel-option-name">{v.label}</span>
                      {v.description && <span className="vsel-option-desc">{v.description}</span>}
                    </div>
                    <span className="vsel-option-price">{formatPriceInCurrency(v.totalPrice, currency)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="vsel-section">
            <label className="vsel-label">Cantidad</label>
            <div className="vsel-qty">
              <button className="vsel-qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1} aria-label="Reducir cantidad">
                <Minus size={16} />
              </button>
              <span className="vsel-qty-val">{quantity}</span>
              <button className="vsel-qty-btn" onClick={() => setQuantity(quantity + 1)}
                aria-label="Aumentar cantidad">
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Price breakdown */}
          <div className="vsel-totals">
            {isSingleVariant && (
              <div className="vsel-row">
                <span>Precio unitario</span>
                <span>{formatPriceInCurrency(selectedVariant.unitPrice, currency)}</span>
              </div>
            )}
            <div className="vsel-row vsel-row--final">
              <span>Subtotal</span>
              <span className="vsel-final">{formatPriceInCurrency(subtotal, currency)}</span>
            </div>
          </div>

          {/* Add button */}
          <button className="vsel-add" onClick={handleAdd}>
            <ShoppingCart size={18} />
            Añadir al carrito
          </button>
        </div>
      </div>

      <style jsx>{`
        .vsel-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 9998;
          backdrop-filter: blur(3px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        .vsel-dialog {
          background: #fff;
          border-radius: var(--radius, 12px);
          width: 100%;
          max-width: 440px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 60px rgba(0,0,0,0.3);
          font-family: var(--font-main, sans-serif);
          position: relative;
        }
        .vsel-close {
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
        .vsel-close:hover {
          background: rgba(0,0,0,0.12);
        }
        .vsel-img-wrap {
          width: 100%;
          aspect-ratio: 16 / 9;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: var(--radius, 12px) var(--radius, 12px) 0 0;
          background: #f8f8f8;
        }
        .vsel-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 1.25rem;
        }
        .vsel-img-placeholder {
          color: #bbb;
        }
        .vsel-body {
          padding: 1.25rem 1.5rem 1.5rem;
        }
        .vsel-title {
          color: var(--primary);
          font-size: 1.25rem;
          margin: 0 0 1.25rem;
          font-family: var(--font-heading);
          font-weight: 700;
        }
        .vsel-section {
          margin-bottom: 1.25rem;
        }
        .vsel-label {
          display: block;
          font-weight: 600;
          font-size: 0.8rem;
          color: var(--dark, #333);
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .vsel-options {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .vsel-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.7rem 1rem;
          border: 1.5px solid #e6e6e6;
          border-radius: 8px;
          background: #fff;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          font-family: var(--font-main);
          width: 100%;
        }
        .vsel-option:hover {
          border-color: var(--accent);
        }
        .vsel-option--sel {
          border-color: var(--primary);
          background: rgba(0,65,157,0.04);
          box-shadow: 0 0 0 1px var(--primary);
        }
        .vsel-option-info {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .vsel-option-name {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--dark, #333);
        }
        .vsel-option-desc {
          font-size: 0.8rem;
          color: #888;
        }
        .vsel-option-price {
          font-weight: 700;
          color: var(--primary);
          font-size: 0.95rem;
          white-space: nowrap;
        }
        .vsel-qty {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          background: #f5f5f5;
          border-radius: 8px;
          padding: 0.25rem;
        }
        .vsel-qty-btn {
          width: 34px;
          height: 34px;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--dark, #333);
          transition: background 0.2s;
        }
        .vsel-qty-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .vsel-qty-btn:not(:disabled):hover {
          background: var(--primary);
          color: #fff;
        }
        .vsel-qty-val {
          font-weight: 700;
          font-size: 1.05rem;
          min-width: 2.5rem;
          text-align: center;
          color: var(--dark, #333);
        }
        .vsel-totals {
          border-top: 1px solid #eee;
          padding-top: 0.75rem;
          margin-bottom: 1rem;
        }
        .vsel-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.3rem 0;
          font-size: 0.9rem;
          color: #555;
        }
        .vsel-row--final {
          border-top: 1px solid #eee;
          margin-top: 0.3rem;
          padding-top: 0.7rem;
          font-size: 1rem;
          font-weight: 700;
          color: var(--dark, #333);
        }
        .vsel-final {
          color: var(--primary);
          font-size: 1.25rem;
        }
        .vsel-add {
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
        .vsel-add:hover {
          background: var(--secondary);
        }

        @media (max-width: 480px) {
          .vsel-overlay {
            padding: 0;
            align-items: flex-end;
          }
          .vsel-dialog {
            max-width: 100%;
            max-height: 92vh;
            border-radius: var(--radius, 12px) var(--radius, 12px) 0 0;
          }
        }
      `}</style>
    </div>
  );
}
