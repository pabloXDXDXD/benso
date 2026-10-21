import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_RATES,
  convertPrice,
  formatPriceInCurrency,
} from '../../src/lib/currencyUtils.ts';

const RATES = { cupPerUsd: 820, cupPerEur: 960 };

/** Non-terminating divisions (e.g. 820/960) need a tolerance. */
function close(actual, expected, epsilon = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) < epsilon,
    `expected ${actual} to be within ${epsilon} of ${expected}`
  );
}

test('default rates are 820 CUP per USD and 960 CUP per EUR', () => {
  assert.deepEqual(DEFAULT_RATES, RATES);
});

test('USD is the base currency: converting USD to USD is identity', () => {
  assert.equal(convertPrice(10, 'USD', 'USD', RATES), 10);
  assert.equal(convertPrice(1234.56, 'USD', 'USD', RATES), 1234.56);
});

test('USD converts to CUP using cupPerUsd', () => {
  assert.equal(convertPrice(10, 'USD', 'CUP', RATES), 8200);
  assert.equal(convertPrice(1, 'USD', 'CUP', RATES), 820);
});

test('USD converts to EUR using the cup_per_eur / cup_per_usd ratio', () => {
  // 1 USD = 820 CUP and 1 EUR = 960 CUP, so 1 USD = 820/960 EUR
  close(convertPrice(820, 'USD', 'EUR', RATES), (820 * 820) / 960);
  close(convertPrice(10, 'USD', 'EUR', RATES), (10 * 820) / 960);
  close(convertPrice(1, 'USD', 'EUR', RATES), 820 / 960);
});

test('CUP converts back to USD', () => {
  assert.equal(convertPrice(820, 'CUP', 'USD', RATES), 1);
  assert.equal(convertPrice(8200, 'CUP', 'USD', RATES), 10);
});

test('CUP converts to EUR through the shared pivot', () => {
  assert.equal(convertPrice(960, 'CUP', 'EUR', RATES), 1);
});

test('EUR converts to CUP and USD', () => {
  assert.equal(convertPrice(1, 'EUR', 'CUP', RATES), 960);
  close(convertPrice(960, 'EUR', 'USD', RATES), (960 * 960) / 820);
});

test('admin-editable rates drive the conversion, not the defaults', () => {
  const custom = { cupPerUsd: 700, cupPerEur: 800 };
  assert.equal(convertPrice(10, 'USD', 'CUP', custom), 7000);
  // 10 USD = 7000 CUP = 7000/800 EUR
  close(convertPrice(10, 'USD', 'EUR', custom), (10 * 700) / 800);
});

test('omitting the rates falls back to 820/960', () => {
  assert.equal(convertPrice(10, 'USD', 'CUP'), 8200);
  assert.equal(formatPriceInCurrency(10, 'CUP'), '$8,200 CUP');
});

test('formatPriceInCurrency renders the base currency with 2 decimals', () => {
  assert.equal(formatPriceInCurrency(10, 'USD', RATES), '$10.00 USD');
  assert.equal(formatPriceInCurrency(6.1, 'USD', RATES), '$6.10 USD');
});

test('formatPriceInCurrency renders CUP without decimals', () => {
  assert.equal(formatPriceInCurrency(10, 'CUP', RATES), '$8,200 CUP');
  assert.equal(formatPriceInCurrency(6.1, 'CUP', RATES), '$5,002 CUP');
});

test('formatPriceInCurrency renders EUR with 2 decimals', () => {
  assert.equal(formatPriceInCurrency(820, 'EUR', RATES), '€700.42 EUR');
});

test('a zero or invalid price is free', () => {
  assert.equal(formatPriceInCurrency(0, 'USD', RATES), 'Gratis');
  assert.equal(formatPriceInCurrency(0, 'CUP', RATES), 'Gratis');
  assert.equal(formatPriceInCurrency(NaN, 'USD', RATES), 'Gratis');
});

test('a migrated CUP price keeps its CUP value within rounding drift', () => {
  // 5000 CUP -> 6.10 USD base (2 decimals) -> 5002 CUP at 820 CUP per USD
  const usd = Math.round((5000 / RATES.cupPerUsd) * 100) / 100;
  assert.equal(usd, 6.1);
  assert.equal(formatPriceInCurrency(usd, 'CUP', RATES), '$5,002 CUP');
});

/**
 * Mirrors the migration SQL
 * (supabase/migrations/202610210002_convert_prices_to_usd.sql):
 *   usd = CEIL(cup / rate)
 * The price is rounded UP to a whole dollar, so it never drops below the
 * value the customer was paying.
 */
function migrateCupToUsd(cup, rate = 820) {
  return Math.ceil(cup / rate);
}

test('the migration rounds up to a whole dollar', () => {
  // 4669 CUP = 5,69 USD -> 6 USD
  assert.equal(migrateCupToUsd(4669), 6);
  assert.equal(migrateCupToUsd(5000), 7);
  assert.equal(migrateCupToUsd(8100), 10);
  assert.equal(migrateCupToUsd(2350), 3);
  assert.equal(migrateCupToUsd(12500), 16);
  // Cheap items land on the 1 USD floor instead of a fraction of a dollar
  assert.equal(migrateCupToUsd(65), 1);
  assert.equal(migrateCupToUsd(35), 1);
  // An exact conversion stays exact
  assert.equal(migrateCupToUsd(820), 1);
  assert.equal(migrateCupToUsd(8200), 10);
});

test('the migration never lowers the price the customer pays', () => {
  for (let cup = 1; cup <= 20000; cup += 7) {
    const usd = migrateCupToUsd(cup);
    assert.ok(
      usd * 820 >= cup,
      `${cup} CUP became ${usd} USD, which is worth ${usd * 820} CUP`
    );
  }
});
