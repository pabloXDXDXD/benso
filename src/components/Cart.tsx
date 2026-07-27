'use client';

import { useCart } from '@/hooks/useCart';
import { CheckoutModal } from './CheckoutModal';
import { ShoppingCart, X, Plus, Minus, Trash2, ArrowRight, Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useCurrency } from '@/context/CurrencyContext';
import { formatPriceInCurrency } from '@/lib/currencyUtils';

export function Cart() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice, isOpen, setIsOpen, setIsCheckoutOpen } = useCart();
  const { currency } = useCurrency();
  const prevItemsRef = useRef(items.length);
  const prevTotalRef = useRef(totalItems);
  const lastAddedRef = useRef<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const handleCheckout = () => {
    setIsOpen(false);
    setIsCheckoutOpen(true);
  };

  // Track cart changes and show toast when item is added
  useEffect(() => {
    setIsMounted(true);
    
    // Skip notification on first mount (page load with existing items)
    if (totalItems === 0 || prevTotalRef.current === 0) {
      prevTotalRef.current = totalItems;
      prevItemsRef.current = items.length;
      return;
    }
    
    // Check if totalItems increased (new item added)
    if (totalItems > prevTotalRef.current && totalItems > 0) {
      // Find the newly added item (one that wasn't in previous state)
      const prevIds = prevItemsRef.current > 0 
        ? items.slice(0, prevItemsRef.current).map(i => i.id)
        : [];
      const newItem = items.find(i => !prevIds.includes(i.id));
      
      if (newItem && lastAddedRef.current !== newItem.id) {
        lastAddedRef.current = newItem.id;
        toast.custom((t) => (
          <div
            className={`cart-toast ${t.visible ? 'show' : 'hide'}`}
          >
            <Check size={16} />
            <span>"{newItem.productTitle} — {newItem.variant}" añadido</span>
          </div>
        ), { duration: 2500 });
      }
    }
    prevTotalRef.current = totalItems;
    prevItemsRef.current = items.length;
  }, [items, totalItems]);

  return (
    <>
      {totalItems > 0 && (
        <button
          className="cart-fab"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir carrito"
        >
          <ShoppingCart size={22} />
          <span className="cart-fab-badge">{totalItems}</span>
        </button>
      )}

      <div
        className={`cart-overlay${isOpen ? ' open' : ''}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <div 
        className={`cart-panel${isOpen ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
      >
        <div className="cart-panel-header">
          <h3>Tu carrito</h3>
          <button className="cart-panel-close" onClick={() => setIsOpen(false)} aria-label="Cerrar carrito">
            <X size={20} />
          </button>
        </div>

        <div className="cart-panel-body">
          {items.length === 0 ? (
            <div className="cart-empty">
              <ShoppingCart size={48} strokeWidth={1.5} />
              <p>Carrito vacío</p>
              <span className="cart-empty-hint">Explora nuestros productos y agrega lo que necesites</span>
              <button 
                className="btn-browse"
                onClick={() => setIsOpen(false)}
              >
                Ver productos
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-info">
                  <h4>{item.productTitle} — {item.variant}</h4>
                  <span className="cart-item-price">{formatPriceInCurrency(item.priceNum * item.quantity, currency)}</span>
                </div>
                <div className="cart-item-actions">
                  <div className="cart-item-qty">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                      disabled={item.quantity <= 1}
                      aria-label="Reducir cantidad"
                    >
                      <Minus size={14} />
                    </button>
                    <span>{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label="Aumentar cantidad"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button 
                    className="cart-item-remove" 
                    onClick={() => removeItem(item.id)} 
                    aria-label={`Eliminar ${item.productTitle}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-panel-footer">
            <div className="cart-total">
              <span>Total</span>
               <span className="cart-total-amount">{formatPriceInCurrency(totalPrice, currency)}</span>
            </div>
            <button
              className="cart-checkout-btn"
              onClick={handleCheckout}
            >
              Continuar
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>

      <CheckoutModal />

      <style jsx>{`
        .cart-empty {
          text-align: center;
          padding: 3rem 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .cart-empty svg {
          color: var(--light-gray);
          margin-bottom: 1rem;
        }
        
        .cart-empty p {
          color: var(--dark);
          font-size: 1.1rem;
          font-weight: 500;
          font-family: var(--font-main);
          margin: 0 0 0.5rem;
        }
        
        .cart-empty-hint {
          color: var(--dark);
          opacity: 0.5;
          font-size: 0.9rem;
          font-family: var(--font-main);
          margin-bottom: 1.5rem;
        }
        
        .btn-browse {
          background: transparent;
          color: var(--primary);
          border: 1.5px solid var(--primary);
          padding: 0.65rem 1.5rem;
          border-radius: 6px;
          font-weight: 600;
          font-family: var(--font-main);
          font-size: 0.9rem;
          cursor: pointer;
          transition: var(--transition);
        }
        
        .btn-browse:hover {
          background: var(--primary);
          color: white;
        }
        
        .cart-item {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1rem 0;
          border-bottom: 1px solid var(--light-gray);
        }
        
        .cart-item:last-child {
          border-bottom: none;
        }
        
        .cart-item-info h4 {
          color: var(--primary);
          font-size: 0.95rem;
          font-weight: 600;
          font-family: var(--font-main);
        }
        
        .cart-item-price {
          color: var(--accent);
          font-weight: 400;
          font-size: 0.85rem;
          font-family: var(--font-main);
        }
        
        .cart-item-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .cart-item-qty {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background: var(--light);
          border-radius: 6px;
          padding: 0.15rem;
        }
        
        .cart-item-qty button {
          width: 28px;
          height: 28px;
          border-radius: 4px;
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: var(--transition);
          color: var(--dark);
        }
        
        .cart-item-qty button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        
        .cart-item-qty button:not(:disabled):hover {
          background: var(--primary);
          color: white;
        }
        
        .cart-item-qty span {
          font-weight: 600;
          min-width: 2rem;
          text-align: center;
          font-size: 0.9rem;
          color: var(--dark);
        }
        
        .cart-item-remove {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.35rem;
          border-radius: 4px;
          transition: var(--transition);
          color: var(--dark);
          opacity: 0.5;
        }
        
        .cart-item-remove:hover {
          opacity: 1;
          color: #e53935;
          background: rgba(229, 57, 53, 0.1);
        }
        
        .cart-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0 1rem;
          border-top: 1px solid var(--light-gray);
          margin-top: 0.5rem;
        }
        
        .cart-total span:first-child {
          color: var(--dark);
          font-weight: 600;
          font-size: 0.95rem;
          font-family: var(--font-main);
        }
        
        .cart-total-amount {
          font-weight: 700;
          font-size: 1.25rem;
          color: var(--primary);
          font-family: var(--font-main);
        }
        
        .cart-checkout-btn {
          width: 100%;
          padding: 0.9rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.95rem;
          font-weight: 600;
          font-family: var(--font-main);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: var(--transition);
        }
        
        .cart-checkout-btn:hover {
          background: var(--secondary);
          transform: translateY(-1px);
        }
      `}</style>
    </>
  );
}