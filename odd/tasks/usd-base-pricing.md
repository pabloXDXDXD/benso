# USD Base Pricing

Objetivo: que el precio base del catálogo sea USD (editable desde admin) y que la conversión a CUP/EUR se controle con tasas editables desde admin.
Rama: `feature/usd-base-pricing` · Entrega: `ask-on-risk` (work-unit commits) · Test runner: `node --test` (unit) + `npm run test:e2e` (Playwright)

## Specs

### S1 — El precio base es USD
"que el precio base de las cosas sea USD"

Alcance: `productos.price_num`, `productos.price`, `productos.variants[].unit_price/total_price`, `servicios.price_num`, `servicios.price`, `pedidos.total_price` y `pedidos.items[].priceNum` almacenan **USD**. `formatPriceInCurrency` pivota en USD, no en CUP.

Criterios de aceptación:
- Un precio base de `10` USD se muestra `$10.00 USD` en USD, `8,200 CUP` en CUP (tasa 820) y `€8.54 EUR` en EUR (tasa 960: 1 USD = 820/960 EUR).
- La conversión solo depende de las tasas de `currency_settings`; no queda ninguna constante de tasa en el código.
- Los precios ya guardados (en CUP) se convierten a **dólares enteros, redondeados hacia arriba** (`CEIL(cup / 820)`): el precio en USD nunca queda por debajo del valor que tenía el producto.

Checks: test unitario de `currencyUtils` (RED→GREEN), `npm run build`.

### S2 — El precio base se modifica desde admin
"es lo que puedes modificar desde admin"

Alcance: el admin edita el precio base en USD. Campo y columna lo declaran explícitamente.

Criterios de aceptación:
- Campo de precio (crear y editar producto/servicio) etiquetado `Precio (USD)` con placeholder `Ej: $50.00 USD`.
- La columna de precio de productos y servicios muestra el sufijo `USD`.
- El valor guardado sigue siendo numérico en `price_num` (nada de strings con símbolo).

Checks: `npm run build`, recorrido manual del admin.

### S3 — Las tasas de conversión se controlan desde admin
"entonces puedes controlar el cambio a CUP y EUR manualmente"

Alcance: tabla `currency_settings` (una fila) con `cup_per_usd` y `cup_per_eur`, escritura solo por admin, lectura pública para el storefront.

Criterios de aceptación:
- Pestaña **Moneda** en el admin con los dos campos y botón de guardar.
- Guardar actualiza la fila y el storefront refleja la tasa nueva.
- La lectura pública de `currency_settings` está habilitada por RLS.

Checks: `npm run build`, `supabase` CLI para aplicar la migración.

### S4 — La conversión usa la tasa editable
"por una tasa de conversion tambien editable desde admin se convierte a CUP o EUR"

Alcance: `src/lib/currencyUtils.ts` recibe las tasas en runtime; el servidor las entrega al provider.

Criterios de aceptación:
- `convertPrice` y `formatPriceInCurrency` toman las tasas como parámetro (con default 820/960).
- El servidor lee `currency_settings` y las pasa a `CurrencyProvider`; el HTML renderizado y el cliente usan las mismas tasas (sin mismatch de hidratación).
- CUP se redondea a entero; USD/EUR a 2 decimales.

Checks: test unitario (RED→GREEN), `npm run build`.

### S5 — Tasa por defecto 820
"los precios que yaponlo por defecto ya a 820 si puedes"
"o sea la tasa"

Alcance: `cup_per_usd = 820` por defecto. `cup_per_eur = 960` (conserva la relación EUR/USD previa 790/675 ≈ 1,1704 → 820 × 1,1704 ≈ 960).

Criterios de aceptación:
- La fila semilla de `currency_settings` es `820 / 960`.
- El fallback del cliente (si la tabla no existe o falla la lectura) es `820 / 960`.

Checks: test unitario (RED→GREEN).

## Tasks

| ID | Task | Specs | Route | Riesgo | Status |
|----|------|-------|-------|--------|--------|
| T1 | Migración `currency_settings`: tabla, RLS, fila semilla 820/960 | S3, S5 | inline | item 1 (datos) | completada |
| T2 | Migración de datos CUP→USD (`CEIL(cup/820)`, dólares enteros) en productos, servicios, variantes y pedidos + tabla de respaldo + SQL de restauración | S1 | inline | item 1 (datos) | completada |
| T3 | `currencyUtils`: pivote USD, tasas en runtime, default 820/960 | S1, S4, S5 | inline | item 3 (contrato) | completada |
| T4 | `layout.tsx` lee `currency_settings` en servidor y lo pasa a `CurrencyProvider` (refresco SWR en cliente) | S3, S4 | inline | item 3 (contrato) | completada |
| T5 | Storefront: `PriceDisplay`, carrito, checkout, panel de compra, diálogo de variantes y JSON-LD (`priceCurrency`) | S1, S4 | inline | item 3 (contrato) | completada |
| T6 | Admin: allow-list `currency_settings` (edge function + route Next), pestaña Moneda, etiquetas USD en precios y pedidos, campo de precio en servicios | S2, S3, S5 | inline | item 3 (contrato) | completada |
| T7 | Verificación: tests unitarios de la aritmética, `npm run build`, revisión de regresión de precios, verificador independiente | S1–S5 | inline + verificador | item 1 (datos) | en curso |

## Log

### L1 — 2026-10-21 — Solicitud original (verbatim)
> quiero hacer unos cambios ne benso, para comenzar que el precio base de las cosas sea USD, o sea es lo que puedes modificar desde admin, entonces puedes controlar el cambio a CUP y EUR manualmente

### L2 — 2026-10-21 — Tasa por defecto (verbatim)
> los precios que yaponlo por defecto ya a 820 si puedes

### L3 — 2026-10-21 — Aclaración (verbatim)
> o sea la tasa

### L4 — 2026-10-21 — Redondeo de la conversión (verbatim)
> ponle en usd el precio que tenian antriormente, redodndeando los decimales hacia arriba

### L5 — 2026-10-21 — Precisión del redondeo (verbatim)
> nono, el precio en usd que vas a poner ahora que sea el que tenia antes, pero rredondeado hacia arriba, o sea si era 5.69 que sea 6 usd ahora

Notas de análisis:
- La base actual de `price_num` es CUP implícita: `currencyUtils` pivota por CUP con tasas fijas (675/790) y el admin guarda el número sin moneda. Cambiar el pivote a USD obliga a migrar los datos; no migrarlos multiplicaría cada precio por 820.
- Los datos existentes se convierten dividiendo entre 820 (no 675) para que el importe en CUP que ve hoy el cliente se mantenga estable con la tasa nueva.
- La conversión se hace vía `currency_settings` (base de datos) y no vía constantes: es lo que pide "tasa de conversion tambien editable desde admin".
- Redondeo **a dólares enteros hacia arriba** en la migración (`CEIL(cup / 820)`): 4669 CUP → 6 USD (era 5,69), 5000 CUP → 7 USD, 8100 CUP → 10 USD. El precio en USD nunca baja; el importe en CUP mostrado sube como consecuencia del redondeo y de la tasa nueva (820). Los artículos baratos caen en el suelo de 1 USD (35 CUP → 1 USD = 820 CUP).
- Los datos reales de `productos` (23 filas, precios CUP enteros, `price` = el mismo número en texto, todos `price_type = 'fijo'`) y `servicios` (13 filas, todas con `price_num = 0` → siguen en 0) se migran con la misma regla. `pedidos` tiene 1 sola fila: el total se recalcula como la suma de sus items convertidos para que el pedido siga cuadrando.
- Las descripciones de variante con precio incrustado ("$65 por unidad") se actualizan con la misma regla ("$1 por unidad").
- El redondeo en pantalla (CUP entero, USD/EUR 2 decimales) es al más cercano; el redondeo hacia arriba es solo de la migración.
- `src/data/products.json` es una semilla no importada por la app: se convierte también para no reintroducir CUP en un reseed futuro.
- Cambios preexistentes en el worktree (`src/app/globals.css`, `src/components/pages/ProductsPage.tsx`, `benso-launch-reel.html`) pertenecen a otra feature ("kits") y NO se commitean aquí.
