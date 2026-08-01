-- ============================================
-- Services Without Pricing — Request Flow
-- 1) New content columns on servicios
-- 2) New service request table + RLS
-- 3) Seed the 13 real services (verbatim from Web Servicios.docx)
-- ============================================

-- 1) Content columns: subtitle (short selling line) + includes ("Qué incluye" bullets)
ALTER TABLE public.servicios
  ADD COLUMN IF NOT EXISTS subtitle TEXT,
  ADD COLUMN IF NOT EXISTS subtitle_en TEXT,
  ADD COLUMN IF NOT EXISTS includes TEXT[],
  ADD COLUMN IF NOT EXISTS includes_en TEXT[];

-- 2) Service request table (precedent: evento_inscripciones — serial PK, nullable FK + title snapshot)
CREATE TABLE IF NOT EXISTS public.servicio_solicitudes (
  id SERIAL PRIMARY KEY,
  servicio_id INTEGER REFERENCES public.servicios(id),
  servicio_titulo TEXT,
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  mensaje TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.servicio_solicitudes ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a service request (public form)
CREATE POLICY "Anyone can request a service" ON public.servicio_solicitudes
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only authenticated/admin (service role) can view requests — NO anon SELECT
CREATE POLICY "Authenticated users can view service requests" ON public.servicio_solicitudes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can view service requests" ON public.servicio_solicitudes
  FOR SELECT
  TO service_role
  USING (true);

-- 3) Seed the 13 services (table currently has 0 rows; no unique constraint on title)
DELETE FROM public.servicios;

INSERT INTO public.servicios
  (category, title, subtitle, subtitle_en, includes, includes_en, description, description_en)
VALUES
  -- Contabilidad y Finanzas
  ('contabilidad-finanzas', 'Modelos Contables a Medida',
   'Gestionar tu empresa debe ser fácil.', 'Gestionar tu empresa debe ser fácil.',
   ARRAY['Análisis y evaluación inicial', 'Diseño de la arquitectura técnica del programa', 'Programación e implementación de módulos (compras, ventas, inventario, RRHH, finanzas)', 'Integración multiplataforma', 'Soporte y acompañamiento profesional'],
   ARRAY['Análisis y evaluación inicial', 'Diseño de la arquitectura técnica del programa', 'Programación e implementación de módulos (compras, ventas, inventario, RRHH, finanzas)', 'Integración multiplataforma', 'Soporte y acompañamiento profesional'],
   'Diseñamos e implementamos un modelo de gestión contable, desarrollado exclusivamente para los flujos y necesidades reales de tu empresa. Desde las ventas hasta el cierre mensual, todo en piloto automático para que tomes decisiones seguras.',
   'Diseñamos e implementamos un modelo de gestión contable, desarrollado exclusivamente para los flujos y necesidades reales de tu empresa. Desde las ventas hasta el cierre mensual, todo en piloto automático para que tomes decisiones seguras.'),

  ('contabilidad-finanzas', 'Auditoría Financiera y Contable Integral',
   'Descubre el verdadero estado de salud de tus proyectos de inversión.', 'Descubre el verdadero estado de salud de tus proyectos de inversión.',
   ARRAY['Revisión y análisis de libros contables', 'Verificación de arqueos de caja-bancos', 'Análisis de Estados e Información Financiera', 'Identificación de riesgos', 'Informe ejecutivo y plan de acción'],
   ARRAY['Revisión y análisis de libros contables', 'Verificación de arqueos de caja-bancos', 'Análisis de Estados e Información Financiera', 'Identificación de riesgos', 'Informe ejecutivo y plan de acción'],
   'Revisión profesional de registros contables para identificar riesgos, fugas de capital y oportunidades de mejora.',
   'Revisión profesional de registros contables para identificar riesgos, fugas de capital y oportunidades de mejora.'),

  ('contabilidad-finanzas', 'Presupuestos y Proyecciones Financieras',
   'Planificación financiera de corto y largo plazo.', 'Planificación financiera de corto y largo plazo.',
   ARRAY['Análisis de datos históricos', 'Presupuestos de ingresos y gastos', 'Modelo de flujo de caja proyectado', 'Análisis de sensibilidad y plan de seguimiento'],
   ARRAY['Análisis de datos históricos', 'Presupuestos de ingresos y gastos', 'Modelo de flujo de caja proyectado', 'Análisis de sensibilidad y plan de seguimiento'],
   'Construimos los presupuestos por ti; basados en los datos históricos, el comportamiento del mercado y los objetivos de crecimiento de tu negocio, con proyecciones de amplio horizonte temporal.',
   'Construimos los presupuestos por ti; basados en los datos históricos, el comportamiento del mercado y los objetivos de crecimiento de tu negocio, con proyecciones de amplio horizonte temporal.'),

  ('contabilidad-finanzas', 'Análisis de Costos y Rentabilidad',
   'Contabilidad de costos aplicada para mejorar los índices de rentabilidad económica.', 'Contabilidad de costos aplicada para mejorar los índices de rentabilidad económica.',
   ARRAY['Mapeo de procesos productivos', 'Identificación de centros de costos', 'Cálculo de costos unitarios y fichas de costo', 'Análisis de punto de equilibrio y estrategia de precios'],
   ARRAY['Mapeo de procesos productivos', 'Identificación de centros de costos', 'Cálculo de costos unitarios y fichas de costo', 'Análisis de punto de equilibrio y estrategia de precios'],
   'Para cada línea de negocio se determinan costos directos, indirectos, fijos y variables para optimizar la estructura de costos y el margen de retribución de cada producto o servicio vendido.',
   'Para cada línea de negocio se determinan costos directos, indirectos, fijos y variables para optimizar la estructura de costos y el margen de retribución de cada producto o servicio vendido.'),

  ('contabilidad-finanzas', 'Evaluación de Proyectos de Inversión',
   'El primer paso antes de invertir recursos en nuevos proyectos de Inversión.', 'El primer paso antes de invertir recursos en nuevos proyectos de Inversión.',
   ARRAY['Definición de flujo de caja', 'Cálculo de costo de capitales', 'Evaluación de indicadores VAN/TIR', 'Análisis de riesgo y sensibilidad', 'Informe Ejecutivo'],
   ARRAY['Definición de flujo de caja', 'Cálculo de costo de capitales', 'Evaluación de indicadores VAN/TIR', 'Análisis de riesgo y sensibilidad', 'Informe Ejecutivo'],
   'La evaluación de proyectos es una técnica de evaluación financiera (VPN, TIR, Payback) para decidir con certeza a qué proyectos destinar tu dinero y esfuerzos.',
   'La evaluación de proyectos es una técnica de evaluación financiera (VPN, TIR, Payback) para decidir con certeza a qué proyectos destinar tu dinero y esfuerzos.'),

  -- Marketing y Marca
  ('marketing-marca', 'Estrategia de Marketing Digital',
   'La manera correcta de convertir la presencia digital en un multiplicador de ventas.', 'La manera correcta de convertir la presencia digital en un multiplicador de ventas.',
   ARRAY['Auditoría de redes', 'Análisis de competencia y tendencias', 'Buyer persona y objetivos SMART', 'Estrategia y creación de contenidos', 'Calendario de publicaciones', 'Embudos de ventas multiplataforma'],
   ARRAY['Auditoría de redes', 'Análisis de competencia y tendencias', 'Buyer persona y objetivos SMART', 'Estrategia y creación de contenidos', 'Calendario de publicaciones', 'Embudos de ventas multiplataforma'],
   'Desarrollamos una estrategia de marketing digital completa con embudos de conversión, y alineada con tus objetivos de ventas, posicionamiento o fidelización.',
   'Desarrollamos una estrategia de marketing digital completa con embudos de conversión, y alineada con tus objetivos de ventas, posicionamiento o fidelización.'),

  ('marketing-marca', 'Diseño de Marca e Identidad Visual',
   'Desarrollo de marcas inteligentes y competitivas.', 'Desarrollo de marcas inteligentes y competitivas.',
   ARRAY['Definición administrativa de la marca', 'Diseño de identificadores visuales', 'Manual de identidad corporativa', 'Diseño y desarrollo de propuestas de valor'],
   ARRAY['Definición administrativa de la marca', 'Diseño de identificadores visuales', 'Manual de identidad corporativa', 'Diseño y desarrollo de propuestas de valor'],
   'Construimos la identidad visual y la estrategia de tu marca desde cero o la renovamos profundamente.',
   'Construimos la identidad visual y la estrategia de tu marca desde cero o la renovamos profundamente.'),

  ('marketing-marca', 'Investigación de Mercado',
   'Conoce a tu cliente y a tu competencia para anticipar tu respuesta.', 'Conoce a tu cliente y a tu competencia para anticipar tu respuesta.',
   ARRAY['Objetivos de investigación', 'Diseño de instrumentos', 'Recolección y análisis de datos', 'Mapa de posicionamiento y plan de diferenciación'],
   ARRAY['Objetivos de investigación', 'Diseño de instrumentos', 'Recolección y análisis de datos', 'Mapa de posicionamiento y plan de diferenciación'],
   'La investigación de mercado es el método único para crear las fuentes primarias de información cualitativa y cuantitativa para entender a tu cliente ideal y analizar a la competencia, para identificar oportunidades de diferenciación.',
   'La investigación de mercado es el método único para crear las fuentes primarias de información cualitativa y cuantitativa para entender a tu cliente ideal y analizar a la competencia, para identificar oportunidades de diferenciación.'),

  ('marketing-marca', 'Diseño de Material Publicitario',
   'Primero se ve, luego se lee. Que tu material venda desde el primer vistazo.', 'Primero se ve, luego se lee. Que tu material venda desde el primer vistazo.',
   ARRAY['Propuestas creativas', 'Diseño en alta resolución', 'Versiones para diferentes formatos (impresión, digital, redes)'],
   ARRAY['Propuestas creativas', 'Diseño en alta resolución', 'Versiones para diferentes formatos (impresión, digital, redes)'],
   'Diseño de piezas gráficas profesionales para tus campañas offline y online: flyers, catálogos, banners, carteles, presentaciones.',
   'Diseño de piezas gráficas profesionales para tus campañas offline y online: flyers, catálogos, banners, carteles, presentaciones.'),

  -- Soluciones BI y Digital
  ('soluciones-bi-digital', 'Instalación de Agentes IA',
   'Atiende a tus clientes con operadores inteligentes que responden 24/7.', 'Atiende a tus clientes con operadores inteligentes que responden 24/7.',
   ARRAY['Diseño del flujo conversacional', 'Integración con WhatsApp Business', 'Configuración de respuestas automáticas', 'Pruebas de usuario', 'Soporte y monitoreo'],
   ARRAY['Diseño del flujo conversacional', 'Integración con WhatsApp Business', 'Configuración de respuestas automáticas', 'Pruebas de usuario', 'Soporte y monitoreo'],
   'Implementamos un asistente virtual (bot) para WhatsApp u otras plataformas que automatiza la atención al cliente, responde preguntas frecuentes, cierra ventas y deriva casos complejos a equipo comercial.',
   'Implementamos un asistente virtual (bot) para WhatsApp u otras plataformas que automatiza la atención al cliente, responde preguntas frecuentes, cierra ventas y deriva casos complejos a equipo comercial.'),

  ('soluciones-bi-digital', 'Desarrollo de Páginas Web',
   'Incluir una web en tu plan de negocios, es construir tu casa digital.', 'Incluir una web en tu plan de negocios, es construir tu casa digital.',
   ARRAY['Diseño y desarrollo del sitio', 'Dominio y hosting', 'UI/UX y frontend/backend', 'Velocidad y SEO on-page', 'Soporte y monitoreo'],
   ARRAY['Diseño y desarrollo del sitio', 'Dominio y hosting', 'UI/UX y frontend/backend', 'Velocidad y SEO on-page', 'Soporte y monitoreo'],
   'Desarrollo de sitios web profesionales y optimizados para velocidad, SEO y conversión. Desde landing pages, sitios corporativos o catálogos digitales etc.',
   'Desarrollo de sitios web profesionales y optimizados para velocidad, SEO y conversión. Desde landing pages, sitios corporativos o catálogos digitales etc.'),

  -- Administración y Gestión
  ('administracion-gestion', 'Elaboración del Plan de Negocios',
   'El documento rector de toda la estrategia en tu empresa.', 'El documento rector de toda la estrategia en tu empresa.',
   ARRAY['Análisis FODA', 'Análisis de mercado y competencia', 'Propuesta de valor', 'Plan de marketing, ventas, operaciones y financiero', 'Informe ejecutivo legal'],
   ARRAY['Análisis FODA', 'Análisis de mercado y competencia', 'Propuesta de valor', 'Plan de marketing, ventas, operaciones y financiero', 'Informe ejecutivo legal'],
   'Construimos un plan de negocios profesional con análisis de mercado, modelo de ingresos, estrategia operativa y financiera.',
   'Construimos un plan de negocios profesional con análisis de mercado, modelo de ingresos, estrategia operativa y financiera.'),

  ('administracion-gestion', 'Auditoría Admón. y Organizacional',
   'Mejora la eficiencia operativa y logística de tu negocio con asesoramiento profesional.', 'Mejora la eficiencia operativa y logística de tu negocio con asesoramiento profesional.',
   ARRAY['Evaluación de procesos administrativos', 'Revisión de organigrama y flujos de información', 'Revisión de políticas y procedimientos', 'Informe ejecutivo con plan de acciones'],
   ARRAY['Evaluación de procesos administrativos', 'Revisión de organigrama y flujos de información', 'Revisión de políticas y procedimientos', 'Informe ejecutivo con plan de acciones'],
   'Diagnóstico profundo de la estructura, procesos y gestión administrativa de tu empresa. Identificamos áreas de mejora en eficiencia, líneas de comunicación y toma de decisiones.',
   'Diagnóstico profundo de la estructura, procesos y gestión administrativa de tu empresa. Identificamos áreas de mejora en eficiencia, líneas de comunicación y toma de decisiones.');
