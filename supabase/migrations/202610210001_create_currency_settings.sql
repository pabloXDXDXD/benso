-- ============================================
-- MIGRATION: currency_settings
-- Base de precio USD + tasas de conversión editables desde admin
-- ============================================
-- 1 USD = cup_per_usd CUP
-- 1 EUR = cup_per_eur CUP
-- Los precios del catálogo se guardan en USD; la conversión a CUP/EUR usa
-- estas tasas, que el admin puede cambiar desde la pestaña "Moneda".
-- ============================================

CREATE TABLE IF NOT EXISTS public.currency_settings (
  id          int PRIMARY KEY DEFAULT 1,
  cup_per_usd numeric NOT NULL DEFAULT 820 CHECK (cup_per_usd > 0),
  cup_per_eur numeric NOT NULL DEFAULT 960 CHECK (cup_per_eur > 0),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  -- Una sola fila: la configuración global de moneda
  CONSTRAINT currency_settings_single_row CHECK (id = 1)
);

-- Fila semilla: 1 USD = 820 CUP, 1 EUR = 960 CUP
INSERT INTO public.currency_settings (id, cup_per_usd, cup_per_eur)
VALUES (1, 820, 960)
ON CONFLICT (id) DO NOTHING;

-- El storefront necesita leer las tasas para convertir -> lectura pública.
-- Las escrituras NO se permiten por RLS: pasan por la edge function
-- admin-query (service role + JWT de admin).
ALTER TABLE public.currency_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read for currency_settings" ON public.currency_settings;
CREATE POLICY "Enable read for currency_settings"
  ON public.currency_settings FOR SELECT USING (true);

-- updated_at se refresca en cada escritura
CREATE OR REPLACE FUNCTION public.touch_currency_settings_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_currency_settings_updated_at ON public.currency_settings;
CREATE TRIGGER trg_currency_settings_updated_at
  BEFORE UPDATE ON public.currency_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_currency_settings_updated_at();

-- Verificación
SELECT id, cup_per_usd, cup_per_eur, updated_at FROM public.currency_settings;
