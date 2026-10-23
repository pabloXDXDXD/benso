// Regression net for supabase/migrations/202610210002_convert_prices_to_usd.sql
// Covers: Scope A item 1 (variant descriptions survive), item 2 (total respects
// quantity) and item 3 (idempotency markers).
//
// The SQL cannot be executed here (no Postgres available), so the jsonb expression
// is emulated with the exact PostgreSQL semantics:
//   - `jsonb || jsonb`  : shallow concat, the RIGHT operand wins on duplicate keys
//   - `jsonb - 'key'`   : deletes the key
//   - ROUND(x, 2)       : half-up rounding to cents, computed on integer cents
//                         so sums stay exact (no float drift in order totals)
//   - regexp_replace()  : the replacement supports ONLY \1..\9 and \& (PG docs);
//                         `$1` in the replacement is LITERAL text, not a backreference.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SQL_PATH = path.join(ROOT, 'supabase', 'migrations', '202610210002_convert_prices_to_usd.sql');
const SQL = fs.readFileSync(SQL_PATH, 'utf8');

const RATE = 820n;
// ROUND(a / b, 2) expressed in cents: floor((2 * a * 100 + b) / (2 * b)).
const toCents = (a, b = RATE) => (2n * BigInt(Math.trunc(Number(a))) * 100n + b) / (2n * b);
const toUsd = (n) => Number(toCents(n)) / 100;
const jConcat = (a, b) => ({ ...a, ...b });
const jDel = (o, k) => { const c = { ...o }; delete c[k]; return c; };

const RE_POR_UNIDAD = /^\$([0-9]+(\.[0-9]+)?)\s*por unidad$/;
const RE_PRICE_PREFIX = /^\$[0-9]+(\.[0-9]+)?/;
const RE_NUM = /^\$([0-9]+(\.[0-9]+)?)/;

/** Emulates the `variants` expression of the migration. */
function convertVariant(v) {
  let out = jDel(jDel(v, 'unit_price'), 'total_price');
  out = jConcat(out, 'unit_price' in v ? { unit_price: toUsd(v.unit_price) } : {});
  out = jConcat(out, 'total_price' in v ? { total_price: toUsd(v.total_price) } : {});
  if (typeof v.description === 'string' && RE_POR_UNIDAD.test(v.description)) {
    const num = RE_NUM.exec(v.description)[1];
    const rep = '$' + toUsd(num); // '$' || ROUND(num/rate, 2)::float8::text -> literal replacement
    out = jConcat(out, { description: v.description.replace(RE_PRICE_PREFIX, () => rep) });
  }
  return out;
}

/** Emulates the `items` / `total_price` expression of the migration. */
function convertOrder(order) {
  const items = order.items == null ? null : order.items.map((i) => {
    let out = jDel(jDel(i, 'priceNum'), 'price');
    if ('priceNum' in i) {
      const u = toUsd(i.priceNum);
      out = jConcat(out, { priceNum: u });
      out = jConcat(out, { price: '$' + u });
    }
    return out;
  });
  const rows = (order.items ?? []).map(
    (i) => toCents(i.priceNum ?? 0) * BigInt(Number(i.quantity) === 0 ? 1 : Number(i.quantity ?? 1))
  );
  const sum = rows.length ? rows.reduce((a, b) => a + b, 0n) : null;
  return { items, total_price: sum !== null ? Number(sum) / 100 : toUsd(order.total_price) };
}

/** Statement splitter that ignores `--` comments. */
function statements() {
  const clean = SQL.split('\n').filter((l) => !/^\s*--/.test(l)).join('\n');
  return clean.split(';').map((s) => s.trim()).filter(Boolean);
}

test('the migration keeps a variant description that embeds no price', () => {
  const before = { label: 'Único', unit_price: 850, description: 'PVC + Vinilo adhesivo.', total_price: 850 };
  const after = convertVariant(before);
  assert.equal(after.description, 'PVC + Vinilo adhesivo.');
  assert.equal(after.label, 'Único');
  assert.equal(after.unit_price, 1.04);
  assert.equal(after.total_price, 1.04);
});

test('the migration rewrites only a "$N por unidad" description', () => {
  const before = { label: 'Lote de 50', unit_price: 65, description: '$65 por unidad', total_price: 3250 };
  const after = convertVariant(before);
  assert.equal(after.description, '$0.08 por unidad');
  assert.equal(after.unit_price, 0.08);
  assert.equal(after.total_price, 3.96);
});

test('the migration rounds to 2 USD decimals instead of whole dollars', () => {
  assert.ok(!/CEIL\s*\(/i.test(SQL), 'CEIL inflated every item cheaper than 1 USD');
  const roundCalls = SQL.match(/ROUND\s*\(/gi) ?? [];
  const twoDecimals = SQL.match(/,\s*2\)/g) ?? [];
  assert.ok(roundCalls.length >= 12, `every conversion must use ROUND, found ${roundCalls.length}`);
  assert.equal(twoDecimals.length, roundCalls.length, 'every ROUND must specify 2 decimals');
});

test('the migration never deletes the variant description key', () => {
  // The pre-fix version ended the expression with `(v - ... - 'description')`.
  assert.ok(!/-\s*'description'/.test(SQL), 'the variants expression must not subtract the description key');
  assert.ok(/v\s*-\s*'unit_price'\s*-\s*'total_price'/.test(SQL), 'expected `(v - \'unit_price\' - \'total_price\')`');
});

test('the description rewrite is guarded by the "$N por unidad" pattern', () => {
  assert.ok(/\^\\\$\[0-9\]\+\(\[\.\]\[0-9\]\+\)\?/.test(SQL), 'missing the por-unidad guard regex');
  assert.ok(SQL.includes("ELSE '{}'::jsonb END"), 'a non matching description must fall back to an empty object');
});

test('a description that is not a price is left untouched even with a decimal amount', () => {
  const after = convertVariant({ label: 'x', unit_price: 100, description: 'Desde 10.50 por unidad', total_price: 100 });
  assert.equal(after.description, 'Desde 10.50 por unidad');
});

test('the order total is the sum of the converted price times the quantity', () => {
  assert.ok(/COALESCE\(NULLIF\(\(i->>'quantity'\)::numeric, 0\), 1\)/.test(SQL), 'the total must multiply by the item quantity');
  const out = convertOrder({ total_price: 3000, items: [{ priceNum: 1000, quantity: 3, price: '$1000' }] });
  assert.equal(out.total_price, 3.66); // round2(1000/820) = 1.22 ; 1.22 x 3
  assert.equal(out.items[0].priceNum, 1.22);
  assert.equal(out.items[0].price, '$1.22');
});

test('an order without items falls back to the converted total_price', () => {
  const empty = convertOrder({ total_price: 1650, items: [] });
  assert.equal(empty.total_price, 2.01);
  assert.deepEqual(empty.items, []);
  const nullItems = convertOrder({ total_price: 1650, items: null });
  assert.equal(nullItems.total_price, 2.01);
  assert.equal(nullItems.items, null);
});

test('the live order 27 shape converts to total 2.01 with item price "$2.01"', () => {
  const out = convertOrder({
    total_price: 1650,
    items: [{ id: 'Cuadro acrilico::21x14 cm', price: '$1650', variant: '21x14 cm', priceNum: 1650, quantity: 1, productTitle: 'Cuadro acrilico' }],
  });
  assert.equal(out.total_price, 2.01);
  assert.equal(out.items[0].priceNum, 2.01);
  assert.equal(out.items[0].price, '$2.01');
  assert.equal(out.items[0].quantity, 1);
  assert.equal(out.items[0].productTitle, 'Cuadro acrilico');
});

test('the products conversion is a single statement', () => {
  const updates = statements().filter((s) => /UPDATE\s+public\.productos\b/i.test(s));
  assert.equal(updates.length, 1, 'price_num + price + variants must be converted in ONE statement');
  assert.ok(/variants/.test(updates[0]), 'the single statement must also convert the variants');
});

test('every table is marked converted only after its data update', () => {
  const stmts = statements();
  for (const tbl of ['productos', 'servicios', 'pedidos']) {
    const dataIdx = stmts.findIndex((s) => new RegExp(`UPDATE\\s+public\\.${tbl}\\b`, 'i').test(s));
    const markIdx = stmts.findIndex((s) => new RegExp(`UPDATE\\s+public\\.price_backup_cup_to_usd[\\s\\S]*'${tbl}'`, 'i').test(s));
    assert.ok(dataIdx >= 0, `missing data update for ${tbl}`);
    assert.ok(markIdx > dataIdx, `the converted_at marker for ${tbl} must run after its data update`);
  }
});

test('the backup insert never overwrites an existing marker', () => {
  assert.ok(/ON CONFLICT \(tbl, row_id\) DO NOTHING/.test(SQL), 'the backup insert must not reset converted_at');
});

