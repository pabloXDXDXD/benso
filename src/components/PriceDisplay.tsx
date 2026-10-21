'use client';

import { useCurrency } from '@/context/CurrencyContext';
import { extractNumberFromPrice } from '@/lib/priceUtils';
import { formatPriceInCurrency } from '@/lib/currencyUtils';

interface PriceDisplayProps {
  price: string;
  priceNum?: number;
  className?: string;
}

export function PriceDisplay({ price, priceNum, className }: PriceDisplayProps) {
  const { currency, rates } = useCurrency();
  const num = priceNum ?? extractNumberFromPrice(price);

  if (price && price.toLowerCase().includes('desde')) {
    const formatted = formatPriceInCurrency(num, currency, rates);
    if (formatted === 'Gratis') {
      return <span className={className}>Gratis</span>;
    }
    return <span className={className}>Desde {formatted}</span>;
  }

  const formatted = formatPriceInCurrency(num, currency, rates);
  return <span className={className}>{formatted}</span>;
}
