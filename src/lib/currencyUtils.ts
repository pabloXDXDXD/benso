export type Currency = 'CUP' | 'USD' | 'EUR';

/**
 * Base currency of the catalog. Every stored price (productos, servicios,
 * variants, pedidos) is expressed in this currency.
 */
export const BASE_CURRENCY: Currency = 'USD';

/**
 * Exchange rates, editable from the admin panel ("Moneda" tab).
 * - cupPerUsd: how many CUP one USD is worth
 * - cupPerEur: how many CUP one EUR is worth
 */
export interface ExchangeRates {
  cupPerUsd: number;
  cupPerEur: number;
}

/**
 * Fallback rates used when the settings table is unavailable.
 * 1 USD = 820 CUP, 1 EUR = 960 CUP (same EUR/USD ratio as 790/675).
 */
export const DEFAULT_RATES: ExchangeRates = { cupPerUsd: 820, cupPerEur: 960 };

const SYMBOLS: Record<Currency, string> = { CUP: '$', USD: '$', EUR: '€' };

export const CURRENCIES: Currency[] = ['CUP', 'USD', 'EUR'];

/**
 * Guards against a missing or corrupted settings row: an unusable rate would
 * silently turn every price into 0 or Infinity.
 */
export function normalizeRates(rates?: Partial<ExchangeRates> | null): ExchangeRates {
  const cupPerUsd = Number(rates?.cupPerUsd);
  const cupPerEur = Number(rates?.cupPerEur);
  return {
    cupPerUsd: Number.isFinite(cupPerUsd) && cupPerUsd > 0 ? cupPerUsd : DEFAULT_RATES.cupPerUsd,
    cupPerEur: Number.isFinite(cupPerEur) && cupPerEur > 0 ? cupPerEur : DEFAULT_RATES.cupPerEur,
  };
}

/** How many CUP one unit of each currency is worth. */
function cupPerUnit(currency: Currency, rates: ExchangeRates): number {
  switch (currency) {
    case 'USD':
      return rates.cupPerUsd;
    case 'EUR':
      return rates.cupPerEur;
    default:
      return 1;
  }
}

/**
 * Converts an amount between currencies through the CUP pivot.
 * The catalog stores USD; CUP and EUR are derived from the admin rates.
 */
export function convertPrice(
  priceNum: number,
  from: Currency,
  to: Currency,
  rates: Partial<ExchangeRates> | null = DEFAULT_RATES
): number {
  if (from === to) return priceNum;
  const safe = normalizeRates(rates);
  const inCup = priceNum * cupPerUnit(from, safe);
  return inCup / cupPerUnit(to, safe);
}

/**
 * Formats a base-currency (USD) amount in the given currency.
 * CUP is rendered as a whole number, USD/EUR with 2 decimals.
 */
export function formatPriceInCurrency(
  price: number,
  currency: Currency,
  rates: Partial<ExchangeRates> | null = DEFAULT_RATES
): string {
  if (price === 0 || isNaN(price)) return 'Gratis';

  const safe = normalizeRates(rates);
  const converted = convertPrice(price, BASE_CURRENCY, currency, safe);

  if (currency === 'CUP') {
    const fmt = Math.round(converted).toLocaleString('en-US');
    return `${SYMBOLS.CUP}${fmt} CUP`;
  }

  const rounded = Math.round(converted * 100) / 100;
  const fmt = rounded.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${SYMBOLS[currency]}${fmt} ${currency}`;
}
