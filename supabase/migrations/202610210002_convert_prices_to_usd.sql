-- ============================================
-- MIGRATION: precios CUP -> USD (base USD)
-- ============================================
-- Los precios se guardaban en CUP. Con la base USD (ver 202610210001), cada
-- precio se convierte a USD con la tasa actual de
-- currency_settings.cup_per_usd (820 por defecto) y se REDONDEA HACIA ARRIBA
-- a dólares enteros:
--
--     usd = CEIL(cup / cup_per_usd)
--
-- Ejemplo: un producto que valía 12,500 CUP (15.24 USD) pasa a 16 USD, y el
-- cliente lo vuelve a ver en CUP a la tasa actual (16 * 820 = 13,120 CUP).
-- Así el precio en CUP que paga el cliente solo cambia por el redondeo, y el
-- valor en USD queda consolidado como base editable desde el admin.
--
-- OJO con los artículos baratos: al redondear a dólares enteros, todo lo que
-- valga menos de una unidad de la tasa (820 CUP) queda en 1 USD = 820 CUP.
--
-- Es idempotente: cada bloque marca sus filas en price_backup_cup_to_usd
-- (converted_at) y solo convierte lo que todavía no se convirtió. Volver a
-- ejecutarlo no vuelve a dividir los precios.
--
-- además hay una guardia que ABORTA si la migración ya se aplicó: sin ella,
-- un producto creado después (con precio ya en USD) se volvería a dividir.
--
-- ANTES de ejecutar, revisa la sección ROLLBACK del final: este cambio es
-- reversible con la tabla price_backup_cup_to_usd (restauración exacta).
-- ============================================

-- ── Guardia: esta migración se aplica UNA sola vez ──
CREATE TABLE IF NOT EXISTS public.price_migration_usd_v1 (
  applied_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.price_migration_usd_v1) THEN
    RAISE EXCEPTION 'La migración de precios a USD ya se aplicó. No la ejecutes otra vez: los precios creados después se convertirían de nuevo.';
  END IF;
END $$;

-- ── Respaldo de los valores originales (necesario para el rollback) ──
CREATE TABLE IF NOT EXISTS public.price_backup_cup_to_usd (
  migrated_at  timestamptz NOT NULL DEFAULT now(),
  converted_at timestamptz,
  tbl          text NOT NULL,
  row_id       text NOT NULL,
  payload      jsonb NOT NULL,
  PRIMARY KEY (tbl, row_id)
);

-- Si la tabla del respaldo ya existía de una versión anterior del archivo,
-- le falta la columna del marcador de idempotencia
ALTER TABLE public.price_backup_cup_to_usd
  ADD COLUMN IF NOT EXISTS converted_at timestamptz;

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

-- ── productos: price_num + price + variantes (unit_price / total_price) ──
-- Una sola sentencia: si se dividiera en dos, el marcador de idempotencia
-- de la primera dejaría la segunda sin filas que convertir.
-- La descripción de cada variante se conserva tal cual; solo se reescribe
-- cuando lleva un precio incrustado ("$65 por unidad" -> "$1 por unidad"). El
-- `||` de jsonb reemplaza la clave, así que el CASE gana cuando aplica y la
-- descripción original sobrevive cuando no.
WITH rate AS (
  SELECT COALESCE((SELECT cup_per_usd FROM public.currency_settings WHERE id = 1), 820) AS r
)
UPDATE public.productos p
SET price_num = CEIL(p.price_num::numeric / rate.r),
    price     = CASE WHEN p.price_type = 'desde'
                     THEN 'Desde ' || (CEIL(p.price_num::numeric / rate.r))::text
                     ELSE (CEIL(p.price_num::numeric / rate.r))::text
                END,
    variants  = CASE WHEN p.variants IS NULL OR jsonb_typeof(p.variants) <> 'array'
                     THEN p.variants
                     ELSE (
                       SELECT COALESCE(jsonb_agg(
                         (v - 'unit_price' - 'total_price')
                         ||
                         (CASE WHEN v ? 'unit_price'
                               THEN jsonb_build_object('unit_price', CEIL((v->>'unit_price')::numeric / rate.r))
                               ELSE '{}'::jsonb END)
                         ||
                         (CASE WHEN v ? 'total_price'
                               THEN jsonb_build_object('total_price', CEIL((v->>'total_price')::numeric / rate.r))
                               ELSE '{}'::jsonb END)
                         ||
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
                       ), '[]'::jsonb)
                       FROM jsonb_array_elements(p.variants) AS v
                     )
                END
FROM rate,
     public.price_backup_cup_to_usd b
WHERE b.tbl = 'productos'
  AND b.row_id = p.id::text
  AND b.converted_at IS NULL
  AND p.price_num IS NOT NULL;

UPDATE public.price_backup_cup_to_usd
SET converted_at = now()
WHERE tbl = 'productos' AND converted_at IS NULL;

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
FROM rate,
     public.price_backup_cup_to_usd b
WHERE b.tbl = 'servicios'
  AND b.row_id = s.id::text
  AND b.converted_at IS NULL
  AND s.price_num IS NOT NULL;

UPDATE public.price_backup_cup_to_usd
SET converted_at = now()
WHERE tbl = 'servicios' AND converted_at IS NULL;

-- ── pedidos: items[].priceNum / items[].price y total_price ──
-- El total se recalcula como la suma de los items convertidos (precio x
-- cantidad, igual que el carrito), para que el pedido siga cuadrando.
WITH rate AS (
  SELECT COALESCE((SELECT cup_per_usd FROM public.currency_settings WHERE id = 1), 820) AS r
), converted AS (
  SELECT o.id,
         CASE WHEN o.items IS NULL THEN NULL ELSE (
           SELECT COALESCE(jsonb_agg(
             (i - 'priceNum' - 'price')
             ||
             (CASE WHEN i ? 'priceNum'
                   THEN jsonb_build_object('priceNum', CEIL((i->>'priceNum')::numeric / rate.r))
                   ELSE '{}'::jsonb END)
             ||
             (CASE WHEN i ? 'priceNum'
                   THEN jsonb_build_object('price', '$' || CEIL((i->>'priceNum')::numeric / rate.r)::text)
                   ELSE '{}'::jsonb END)
           ), '[]'::jsonb)
           FROM jsonb_array_elements(o.items) AS i
         ) END AS items,
         (
           SELECT COALESCE(
                    SUM(CEIL((i->>'priceNum')::numeric / rate.r) * COALESCE(NULLIF((i->>'quantity')::numeric, 0), 1)),
                    CEIL(o.total_price::numeric / rate.r)
                  )
           FROM jsonb_array_elements(COALESCE(o.items, '[]'::jsonb)) AS i
         ) AS total
  FROM public.pedidos o
  JOIN public.price_backup_cup_to_usd b
    ON b.tbl = 'pedidos' AND b.row_id = o.id::text AND b.converted_at IS NULL
  CROSS JOIN rate
)
UPDATE public.pedidos o
SET items       = converted.items,
    total_price = converted.total
FROM converted
WHERE converted.id = o.id;

UPDATE public.price_backup_cup_to_usd
SET converted_at = now()
WHERE tbl = 'pedidos' AND converted_at IS NULL;

-- ── Verificación ──
SELECT 'productos' AS tabla, COUNT(*) AS total, SUM(price_num) AS suma_price_num FROM public.productos
UNION ALL
SELECT 'servicios', COUNT(*), SUM(price_num) FROM public.servicios
UNION ALL
SELECT 'pedidos', COUNT(*), SUM(total_price) FROM public.pedidos;

-- ── Marca de "ya aplicada" (la guardia del inicio aborta si se repite) ──
INSERT INTO public.price_migration_usd_v1 (applied_at) VALUES (now());

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
--
-- UPDATE public.price_backup_cup_to_usd SET converted_at = NULL;
--
-- Libera la guardia para permitir una nueva ejecución tras el rollback:
-- DELETE FROM public.price_migration_usd_v1;
