'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Currency } from '@/lib/currencyUtils';

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  toggleCurrency: () => void;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const STORAGE_KEY = 'benso-currency';
const CYCLE: Currency[] = ['CUP', 'USD', 'EUR'];

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('CUP');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && (stored === 'CUP' || stored === 'USD' || stored === 'EUR')) {
        setCurrencyState(stored);
      }
    } catch { /* localStorage unavailable */ }
    setReady(true);
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    try { localStorage.setItem(STORAGE_KEY, c); } catch { /* noop */ }
  }, []);

  const toggleCurrency = useCallback(() => {
    const idx = CYCLE.indexOf(currency);
    const next = CYCLE[(idx + 1) % CYCLE.length];
    setCurrency(next);
  }, [currency, setCurrency]);

  if (!ready) {
    // Render children with default CUP until hydration
    return <CurrencyContext.Provider value={{ currency: 'CUP', setCurrency, toggleCurrency }}>{children}</CurrencyContext.Provider>;
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, toggleCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
