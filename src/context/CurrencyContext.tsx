'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import useSWR from 'swr';
import { supabase } from '@/lib/supabase';
import {
  DEFAULT_RATES,
  normalizeRates,
  type Currency,
  type ExchangeRates,
} from '@/lib/currencyUtils';

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  toggleCurrency: () => void;
  /** Rates used to convert the USD base price into the selected currency. */
  rates: ExchangeRates;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const STORAGE_KEY = 'benso-currency';
const CYCLE: Currency[] = ['CUP', 'USD', 'EUR'];
const RATES_KEY = 'currency-settings';

/** Reads the admin-managed rates. Falls back to the defaults when unavailable. */
async function fetchExchangeRates(): Promise<ExchangeRates> {
  const { data, error } = await supabase
    .from('currency_settings')
    .select('cup_per_usd, cup_per_eur')
    .eq('id', 1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return DEFAULT_RATES;

  return normalizeRates({
    cupPerUsd: Number(data.cup_per_usd),
    cupPerEur: Number(data.cup_per_eur),
  });
}

export function CurrencyProvider({
  children,
  initialRates,
}: {
  children: ReactNode;
  /** Rates resolved on the server so the first paint matches the client. */
  initialRates?: ExchangeRates;
}) {
  const [currency, setCurrencyState] = useState<Currency>('CUP');
  const [ready, setReady] = useState(false);

  const fallbackRates = useMemo(
    () => normalizeRates(initialRates ?? DEFAULT_RATES),
    [initialRates]
  );

  // The server provides the first value; SWR keeps it fresh so a rate change
  // made in the admin reaches open tabs without a redeploy.
  const { data: rates } = useSWR<ExchangeRates>(RATES_KEY, fetchExchangeRates, {
    fallbackData: fallbackRates,
    refreshInterval: 60_000,
    revalidateOnFocus: true,
    shouldRetryOnError: false,
  });

  const activeRates = useMemo(() => normalizeRates(rates ?? fallbackRates), [rates, fallbackRates]);

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
    return (
      <CurrencyContext.Provider value={{ currency: 'CUP', setCurrency, toggleCurrency, rates: activeRates }}>
        {children}
      </CurrencyContext.Provider>
    );
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, toggleCurrency, rates: activeRates }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
