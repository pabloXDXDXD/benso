-- ============================================
-- MIGRATION: precios CUP -> USD (base USD)
-- ============================================
-- Los precios se guardaban en CUP. Con la base USD (ver 202610210001), cada
-- precio se convierte a USD con la tasa configurada en
-- currency_settings.cup_per_usd (820 por defecto) y se REDONDEA HACIA ARRIBA
-- a dólares enteros:
--
--     usd = CEIL(cup / cup_per_usd)
--
-- Ejemplo: un producto que valía 4669 CUP (5,69 USD) pasa a 6 USD.
-- El importe nunca baja: el precio en USD queda en el entero superior.
--
-- ANTES de ejecutar, revisa la sección ROLLBACK del final: este cambio es
-- reversible con la tabla price_backup_cup_to_usd (restauración exacta).
-- ============================================

-- ── Respaldo de los valores originales (necesario para el rollback) ──
CREATE TABLE IF NOT EXISTS public.price_backup_cup_to_usd (
  migrated_at timestamptz NOT NULL DEFAULT now(),
  tbl         text NOT NULL,
  row_id      text NOT NULL,
  payload     jsonb NOT NULL,
  PRIMARY KEY (tbl, row_id)
);

INSERT INTO public.price_backup_cup_to_usd (tbl, row_id, payload)
SELECT 'productos', p.id::text,
       jsonb_build_object('price', p.price, 'price_num', p.price_num, 'variants', p.variants)
FROM public.productos p
ON CONFLICT (tbl, row_id) DO NOTHING;

INSERT INTO public.price_backup_cup_to_usd (tbl, row_id, payload)
SELECT 'servicios', s.id::text,
       jsonb_build_object('price', s.price, 'price_num', s.price_num)
FROM public.servicios s
ON CONFLICT (tbl, row_id) DO NOTHING;

INSERT INTO public.price_backup_cup_to_usd (tbl, row_id, payload)
SELECT 'pedidos', o.id::text,
       jsonb_build_object('total_price', o.total_price, 'items', o.items)
FROM public.pedidos o
ON CONFLICT (tbl, row_id) DO NOTHING;

-- ── productos: price_num + price ──
WITH rate AS (
  SELECT COALESCE((SELECT cup_per_usd FROM public.currency_settings WHERE id = 1), 820) AS r
)
UPDATE public.productos p
SET price_num = CEIL(p.price_num::numeric / rate.r),
    price     = CASE WHEN p.price_type = 'desde'
                     THEN 'Desde ' || (CEIL(p.price_num::numeric / rate.r))::text
                     ELSE (CEIL(p.price_num::numeric / rate.r))::text
                END
FROM rate
WHERE p.price_num IS NOT NULL;

-- ── productos: variantes (unit_price / total_price y precio en la descripción) ──
WITH rate AS (
  SELECT COALESCE((SELECT cup_per_usd FROM public.currency_settings WHERE id = 1), 820) AS r
)
UPDATE public.productos p
SET variants = (
  SELECT COALESCE(jsonb_agg(
    (CASE WHEN v ? 'unit_price'
          THEN jsonb_build_object('unit_price', CEIL((v->>'unit_price')::numeric / rate.r))
          ELSE '{}'::jsonb END)
    ||
    (CASE WHEN v ? 'total_price'
          THEN jsonb_build_object('total_price', CEIL((v->>'total_price')::numeric / rate.r))
          ELSE '{}'::jsonb END)
    ||
    -- Descripciones con precio incrustado ("$65 por unidad" -> "$1 por unidad")
    (CASE WHEN (v->>'description') ~ '^\$[0-9]+([.][0-9]+)?[[:space:]]*por unidad$'
          THEN jsonb_build_object(
                 'description',
                 regexp_replace(
                   v->>'description',
                   '^\$[0-9]+([.][0-9]+)?',
                   '$' || CEIL(substring(v->>'description' from '^\$([0-9]+([.][0-9]+)?)')::numeric / rate.r)::text
                 )
               )
          ELSE '{}'::jsonb END)
    ||
    (v - 'unit_price' - 'total_price' - 'description')
  ), '[]'::jsonb)
  FROM jsonb_array_elements(COALESCE(p.variants, '[]'::jsonb)) AS v
)
FROM rate
WHERE p.variants IS NOT NULL
  AND jsonb_typeof(p.variants) = 'array';

-- ── servicios: price_num + price ──
WITH rate AS (
  SELECT COALESCE((SELECT cup_per_usd FROM public.currency_settings WHERE id = 1), 820) AS r
)
UPDATE public.servicios s
SET price_num = CEIL(s.price_num::numeric / rate.r),
    price     = CASE WHEN s.price_type = 'desde'
                     THEN 'Desde ' || (CEIL(s.price_num::numeric / rate.r))::text
                     ELSE (CEIL(s.price_num::numeric / rate.r))::text
                END
FROM rate
WHERE s.price_num IS NOT NULL;

-- ── pedidos: items[].priceNum / items[].price y total_price ──
-- El total se recalcula como la suma de los items convertidos para que el
-- pedido siga cuadrando (total = suma de los items).
WITH rate AS (
  SELECT COALESCE((SELECT cup_per_usd FROM public.currency_settings WHERE id = 1), 820) AS r
), converted AS (
  SELECT o.id,
         jsonb_agg(
           (CASE WHEN i ? 'priceNum'
                 THEN jsonb_build_object('priceNum', CEIL((i->>'priceNum')::numeric / rate.r))
                 ELSE '{}'::jsonb END)
           ||
           (CASE WHEN i ? 'priceNum'
                 THEN jsonb_build_object('price', '$' || CEIL((i->>'priceNum')::numeric / rate.r)::text)
                 ELSE '{}'::jsonb END)
           ||
           (i - 'priceNum' - 'price')
         ) AS items,
         SUM(COALESCE(CEIL((i->>'priceNum')::numeric / rate.r), 0)) AS total
  FROM public.pedidos o
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(o.items, '[]'::jsonb)) AS i
  CROSS JOIN rate
  GROUP BY o.id
)
UPDATE public.pedidos o
SET items       = converted.items,
    total_price = converted.total
FROM converted
WHERE converted.id = o.id;

-- ── Verificación ──
SELECT 'productos' AS tabla, COUNT(*) AS total, SUM(price_num) AS suma_price_num FROM public.productos
UNION ALL
SELECT 'servicios', COUNT(*), SUM(price_num) FROM public.servicios
UNION ALL
SELECT 'pedidos', COUNT(*), SUM(total_price) FROM public.pedidos;

-- ============================================
-- ROLLBACK (ejecutar solo si hay que revertir a la base CUP)
-- Restaura exactamente los valores guardados en el respaldo.
-- ============================================
-- UPDATE public.productos p
-- SET price_num = (b.payload->>'price_num')::numeric,
--     price     = b.payload->>'price',
--     variants  = CASE WHEN b.payload->'variants' = 'null'::jsonb
--                      THEN NULL ELSE b.payload->'variants' END
-- FROM public.price_backup_cup_to_usd b
-- WHERE b.tbl = 'productos' AND b.row_id = p.id::text;
--
-- UPDATE public.servicios s
-- SET price_num = (b.payload->>'price_num')::numeric,
--     price     = b.payload->>'price'
-- FROM public.price_backup_cup_to_usd b
-- WHERE b.tbl = 'servicios' AND b.row_id = s.id::text;
--
-- UPDATE public.pedidos o
-- SET total_price = (b.payload->>'total_price')::numeric,
--     items       = CASE WHEN b.payload->'items' = 'null'::jsonb
--                        THEN NULL ELSE b.payload->'items' END
-- FROM public.price_backup_cup_to_usd b
-- WHERE b.tbl = 'pedidos' AND b.row_id = o.id::text;
