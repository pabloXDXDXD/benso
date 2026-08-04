'use client';

import { useState } from 'react';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useCurrency } from '@/context/CurrencyContext';
import { formatPriceInCurrency } from '@/lib/currencyUtils';
import type { Producto } from '@/hooks/useData';

export function ProductPurchasePanel({ product }: { product: Producto }) {
  const { addItem } = useCart();
  const { currency } = useCurrency();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const hasVariants = product.variants && product.variants.length > 0;
  const selectedVariant = hasVariants ? product.variants[selectedIndex] : null;
  const subtotal = selectedVariant ? selectedVariant.totalPrice * quantity : product.price_num * quantity;

  const handleAdd = () => {
    if (selectedVariant) {
      addItem(product.title, selectedVariant.label, selectedVariant.unitPrice, quantity);
    } else {
      addItem(product.title, 'Único', product.price_num, quantity);
    }
  };

  return (
    <div className="pdp">
      {hasVariants && product.variants.length > 1 && (
        <div className="pdp-section">
          <label className="pdp-label">Presentación</label>
          <div className="pdp-variants">
            {product.variants.map((v, i) => (
              <button
                key={v.label}
                className={`pdp-variant${i === selectedIndex ? ' pdp-variant--sel' : ''}`}
                onClick={() => { setSelectedIndex(i); setQuantity(1); }}
              >
                <div className="pdp-variant-info">
                  <span className="pdp-variant-name">{v.label}</span>
                  {v.description && <span className="pdp-variant-desc">{v.description}</span>}
                </div>
                <span className="pdp-variant-price">{formatPriceInCurrency(v.totalPrice, currency)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="pdp-section">
        <label className="pdp-label">Cantidad</label>
        <div className="pdp-qty">
          <button className="pdp-qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1} aria-label="Reducir cantidad">
            <Minus size={16} />
          </button>
          <span className="pdp-qty-val">{quantity}</span>
          <button className="pdp-qty-btn" onClick={() => setQuantity(quantity + 1)}
            aria-label="Aumentar cantidad">
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="pdp-totals">
        <div className="pdp-row pdp-row--final">
          <span>Subtotal</span>
          <span className="pdp-final">{formatPriceInCurrency(subtotal, currency)}</span>
        </div>
      </div>

      <button className="cta-button" onClick={handleAdd}>
        <ShoppingCart size={18} />
        Añadir al carrito
      </button>
    </div>
  );
}
