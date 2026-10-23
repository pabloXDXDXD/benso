-- ============================================
-- MIGRATION: postulaciones de empleo (banner de contratación)
-- ============================================
-- Tabla de postulaciones al equipo de BENSO. La escribe el formulario
-- público del banner (cliente anónimo) y la lee el admin por la edge function
-- admin-query (service role).
-- Patrón equivalente a servicio_solicitudes / evento_inscripciones.
-- ============================================

CREATE TABLE IF NOT EXISTS public.empleo_solicitudes (
  id          SERIAL PRIMARY KEY,
  nombre      TEXT NOT NULL,
  email       TEXT NOT NULL,
  telefono    TEXT,
  area        TEXT NOT NULL,
  experiencia TEXT,
  mensaje     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.empleo_solicitudes ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede postular (formulario público)
DROP POLICY IF EXISTS "Anyone can apply to BENSO" ON public.empleo_solicitudes;
CREATE POLICY "Anyone can apply to BENSO" ON public.empleo_solicitudes
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Sin SELECT para anon ni authenticated: cada postulación lleva datos
-- personales (email, teléfono). El admin las lee con la edge function
-- admin-query, que usa la service role key y no pasa por RLS.
DROP POLICY IF EXISTS "Service role can view job applications" ON public.empleo_solicitudes;
CREATE POLICY "Service role can view job applications" ON public.empleo_solicitudes
  FOR SELECT
  TO service_role
  USING (true);

-- Verificación
SELECT COUNT(*) AS postulaciones FROM public.empleo_solicitudes;
