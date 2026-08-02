'use client';

import { useState, useRef, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { CURRENCIES, type Currency } from '@/lib/currencyUtils';

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (c: Currency) => {
    setCurrency(c);
    setOpen(false);
  };

  return (
    <div className="currency-dropdown" ref={ref}>
      <button
        className="currency-dropdown-trigger"
        onClick={() => setOpen(!open)}
        aria-label={`Moneda: ${currency}. Click para cambiar`}
        aria-expanded={open}
      >
        <DollarSign size={14} />
        <span>{currency}</span>
      </button>

      {open && (
        <div className="currency-dropdown-menu">
          {CURRENCIES.map((c) => (
            <button
              key={c}
              className={`currency-dropdown-item${c === currency ? ' active' : ''}`}
              onClick={() => select(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
