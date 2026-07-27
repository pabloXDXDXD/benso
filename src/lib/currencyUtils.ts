export type Currency = 'CUP' | 'USD' | 'EUR';

/**
 * Static exchange rates (1 CUP = X target currency).
 * Source: https://eltoque.com/tasas-de-cambio-cuba
 * Rates shown in CUP per 1 USD/EUR, inverted to 1 CUP = target.
 */
export const RATES: Record<Currency, { symbol: string; code: string; rate: number }> = {
  CUP: { symbol: '$', code: 'CUP', rate: 1 },
  // 1 USD ≈ 120 CUP → 1 CUP ≈ 0.00833 USD (rounded)
  USD: { symbol: '$', code: 'USD', rate: 1 / 120 },
  // 1 EUR ≈ 130 CUP → 1 CUP ≈ 0.00769 EUR (rounded)
  EUR: { symbol: '€', code: 'EUR', rate: 1 / 130 },
};

export function convertPrice(priceNum: number, from: Currency, to: Currency): number {
  if (from === to) return priceNum;
  const cupValue = from === 'CUP' ? priceNum : priceNum / RATES[from].rate;
  return to === 'CUP' ? cupValue : cupValue * RATES[to].rate;
}

export function formatPriceInCurrency(price: number, currency: Currency): string {
  if (price === 0 || isNaN(price)) return 'Gratis';

  const cfg = RATES[currency];
  const converted = currency === 'CUP' ? price : price * cfg.rate;

  if (currency === 'CUP') {
    const fmt = converted.toLocaleString('en-US', {
      minimumFractionDigits: converted % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    });
    return `${cfg.symbol}${fmt} ${cfg.code}`;
  }

  // USD / EUR — always 2 decimals, cents rounded to nearest 10
  const rounded = Math.round(converted * 10) / 10;
  const fmt = rounded.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${cfg.symbol}${fmt} ${cfg.code}`;
}

export const CURRENCIES: Currency[] = ['CUP', 'USD', 'EUR'];
