-- Formación programs: new content columns + "avísame" request type + seed of the
-- training programs from the Centro de Formación brief (Web Centro de Formacion.docx).

-- 1. Content columns for training programs (talleres/cursos)
ALTER TABLE eventos
  ADD COLUMN IF NOT EXISTS duracion TEXT,
  ADD COLUMN IF NOT EXISTS modalidad TEXT,
  ADD COLUMN IF NOT EXISTS modulos JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS disclaimer TEXT;

-- 2. Registration requests: allow light "notify me" requests (only contact fields)
ALTER TABLE evento_inscripciones
  ALTER COLUMN nivel_estudios DROP NOT NULL,
  ALTER COLUMN sector DROP NOT NULL,
  ALTER COLUMN motivacion DROP NOT NULL;

ALTER TABLE evento_inscripciones
  ADD COLUMN IF NOT EXISTS tipo_solicitud TEXT NOT NULL DEFAULT 'inscripcion'
    CHECK (tipo_solicitud IN ('inscripcion', 'aviso'));

-- 3. Seed: training programs from the brief. date is free-text UI (no dates given yet).
--    status: 'Proximamente' = open for registration; 'En desarrollo' = methodology in progress.
INSERT INTO eventos (title, description, date, status, is_active, image, icon, categoria, duracion, modalidad, modulos, disclaimer)
VALUES
(
  'Marketing y Transformación Digital',
  'Si tu negocio no está en internet, todavía no existe. Aprende el verdadero funcionamiento de las plataformas digitales para aumentar ventas en línea; y las estrategias clave para posicionar tu marca en redes sociales, crear contenido de alto enganche y convertir seguidores en clientes. Este taller incluye el estudio de casos de éxito reales cubanos.',
  '', 'Proximamente', true, '', 'trending', 'taller', '2 semanas', 'Presencial o Virtual',
  '[{"title":"Introducción al marketing digital","description":"Redes sociales, algoritmos y publicidad digital."},{"title":"Método funcional para activar embudos de venta online","description":"Estrategia de redes, creación de contenido y análisis de métricas."}]'::jsonb,
  NULL
),
(
  'Técnicas de Negociación y Ventas',
  'Tu habilidad para negociar, es la única que puede generarte ingresos. Domina las técnicas de negociación bajo el Método Harvard, aplicadas al entorno empresarial y profesional para cerrar más ventas, manejar objeciones y construir relaciones comerciales duraderas.',
  '', 'Proximamente', true, '', 'people', 'taller', '2 semanas', 'Presencial o Virtual',
  '[{"title":"Introducción al método «Harvard» de negociación","description":"Los estilos, los intereses, las posiciones, objeciones y alternativas."},{"title":"Técnicas de negociación efectivas","description":"El regateo, la persuasión y el manejo de objeciones."}]'::jsonb,
  NULL
),
(
  'Productividad con Herramientas Digitales',
  'Programas prácticos para facilitar el aprendizaje del uso de herramientas indispensables desde Excel hasta aplicaciones de diseño gráfico o de inteligencia artificial.',
  '', 'En desarrollo', true, '', 'tools', 'taller', NULL, NULL, '[]'::jsonb,
  'Este programa de capacitación está en desarrollo metodológico, y próximamente estará disponible su primera edición.'
),
(
  'Contabilidad Básica para Emprendedores',
  'Este programa no te volverá contador, te volverá capaz de gestionar cualquier proyecto de negocio, y hacerlo rentable, una vez que sepas usar su información financiera. Aprende a organizar tus recursos monetarios y tomar decisiones con alta probabilidad de éxito.',
  '', 'Proximamente', true, '', 'money', 'curso', '4 semanas', 'Presencial o Virtual',
  '[{"title":"Introducción a las cuentas básicas de la contabilidad","description":""},{"title":"El uso y valor real de la información contable","description":"Los estados financieros."},{"title":"El ciclo de la contabilidad por dentro","description":"La planificación de la rentabilidad."},{"title":"Software contables para emprendedores","description":"Cómo usarlos."}]'::jsonb,
  NULL
),
(
  'Operaciones y Logística 4.0 para PYMES',
  'Plan de estudios orientado a mejorar la toma de decisiones de los gerentes sobre los procesos logísticos que optimizan recursos de manera eficiente y garantizan la calidad final de sus productos y servicios.',
  '', 'En desarrollo', true, '', 'box', 'curso', NULL, NULL, '[]'::jsonb,
  'Este programa de capacitación está en desarrollo metodológico, y próximamente estará disponible su primera edición.'
),
(
  'Liderazgo y Gestión del Talento Humano',
  'Plan de estudios orientado a formar líderes con habilidades formales de comunicación efectiva e influencia positiva para guiar equipos de cualquier tamaño.',
  '', 'En desarrollo', true, '', 'people', 'curso', NULL, NULL, '[]'::jsonb,
  'Este programa de capacitación está en desarrollo metodológico, y próximamente estará disponible su primera edición.'
),
(
  'Dirección Estratégica y Economía de Empresa',
  'Este pretende ser el más completo de nuestros programas para la formación de administradores de empresas que se proyectan hacia el futuro y persiguen una rentabilidad sostenible frente a los cambios.',
  '', 'En desarrollo', true, '', 'chart', 'curso', NULL, NULL, '[]'::jsonb,
  'Este programa de capacitación está en desarrollo metodológico, y próximamente estará disponible su primera edición.'
);
