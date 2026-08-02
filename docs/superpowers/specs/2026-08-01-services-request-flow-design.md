# Services Without Pricing — Request Flow Redesign

Date: 2026-08-01
Status: Approved design (visual mockup validated by user)

## 1. Goal

Remove pricing and cart interactions from the services catalog. Service cards now show a
"Ver más info" action that opens a centered modal with details (subtitle, full description,
"What's included" bullets) and a "Solicitar servicio" CTA leading to a request form inside the
same modal. Requests land in a new dedicated table visible in the admin panel under its own tab.

## 2. Approved UX Flow (Option A — Centered Modal)

1. **Card (grid)**: icon + title + **subtitle** (new field, short selling line) + short
   description + "Ver más info" button. NO price. NO add-to-cart.
2. **Modal (centered)**: category kicker + title + subtitle + full description + "Qué incluye"
   bullet list + "Solicitar servicio" button. WhatsApp link as alternative contact (optional).
3. **Form (inside modal, same view)**: name, email, phone, optional message. "Sin compromiso"
   hint. Submit → success screen "te contactaremos en breve". No order ID (not a sale).
4. Modal can be dismissed; "← Volver" returns from form to details.

This flow applies to `ServicesPage` (full grid). The HomePage services preview (first 3
services) uses the same card pattern; clicking opens the same modal (or links to /servicios —
see §7 Decision D).

## 3. Data Model Changes

### 3.1 `servicios` table — new columns

| Column        | Type     | Notes                                  |
| ------------- | -------- | -------------------------------------- |
| `subtitle`    | text     | Short selling line under the title     |
| `subtitle_en` | text     | English variant (nullable)             |
| `includes`    | text[]   | "Qué incluye" bullets                  |
| `includes_en` | text[]   | English bullets (nullable)             |

`price` / `price_num` stay in the schema (products share tooling) but are no longer displayed
for services. `title_en` / `description_en` already exist.

### 3.2 New table `servicio_solicitudes`

| Column             | Type                     | Notes                                    |
| ------------------ | ------------------------ | ---------------------------------------- |
| `id`               | serial PK                |                                          |
| `servicio_id`      | integer nullable         | FK to servicios.id (denormalized: keep)  |
| `servicio_titulo`  | text                     | Snapshot of the service title            |
| `nombre`           | text NOT NULL            |                                          |
| `email`            | text                     |                                          |
| `telefono`         | text                     |                                          |
| `mensaje`          | text                     |                                          |
| `created_at`       | timestamptz default now()|                                          |

RLS: enable; allow anon INSERT (same pattern as `pedidos`/`citas`), admin SELECT via service
role through the existing admin query route. Table added to `ALLOWED_TABLES` in
`src/app/api/admin/query/route.ts`.

## 4. Frontend Changes

### 4.1 `ServicesPage.tsx`
- Remove `PriceDisplay`, `useCart`, `addItem`, `ShoppingCart` usage.
- Card: header (icon + title) → **subtitle** → description → "Ver más info" button.
- Category filters updated to the 4 real categories:
  `contabilidad-finanzas`, `marketing-marca`, `soluciones-bi-digital`, `administracion-gestion`.
- Replace `RequestModal` usage for services with the new `ServiceRequestModal` (or repurpose —
  see §7 Decision C).

### 4.2 New component: `ServiceRequestModal.tsx`
Three internal views: details → form → success. Props: `service`, `isOpen`, `onClose`.
- Details: kicker (category label), title, subtitle, description, includes list,
  "Solicitar servicio", optional WhatsApp link.
- Form: nombre, email, teléfono, mensaje (optional), submit → insert into
  `servicio_solicitudes` (with servicio_id + servicio_titulo).
- Success: confirmation message, close button.

### 4.3 `HomePage.tsx` services preview
Update the same card markup: remove price + cart button, add subtitle + "Ver más info"
opening the same modal.

### 4.4 Skeletons
`ServiceSkeleton`: replace price skeleton line with subtitle line (minor).

### 4.5 CSS (`globals.css`)
- `.service-card-subtitle` style (accent color, smaller, semibold).
- Modal styles: reuse/extend `.request-modal` family or add `.svc-modal-*` classes
  (overlay, centered box, kicker, includes list with check marks, form fields).
- Remove/keep `.card-price` (still used by products — KEEP).

### 4.6 i18n (`messages/es.json`, `messages/en.json`)
- `services.*`: new keys — `viewMoreInfo`, `requestService`, `whatsIncluded`, `requestSent`,
  `form.name`, `form.email`, `form.phone`, `form.message`, `noCommitment`, `submitRequest`,
  `backToDetails`, `contactWhatsApp`.
- Category filter labels: `filterFinanzas`, `filterMarketing`, `filterBIDigital`, `filterAdmon`.

### 4.7 Static fallback data
`src/data/services.json`, `src/data/es/services.json`, `src/data/en/services.json`:
replace `price` with `subtitle` + `includes` for the 13 real services; keep `whatsappLink`,
`icon`, `category` (new slugs), `featured` subset (3 first or curated).

## 5. Admin Panel Changes

- `AdminTab` union in `AppSidebar.tsx`: add `'solicitudes'`.
- Sidebar: new item under OPERACIONES (icon `Inbox`/`Send`), countKey `servicio_solicitudes`.
- `admin/page.tsx`: new read-only table view listing solicitudes (fecha, servicio, nombre,
  email, teléfono, mensaje) with the existing admin table pattern.
- `admin/page.tsx` Servicio editor: add fields for `subtitle` and `includes` (bullets editor,
  textarea one-per-line or JSON text[]).
- `ALLOWED_TABLES`: add `servicio_solicitudes`.
- Dashboard counts: include new table count.

## 6. Real Service Data (13 services, 4 categories)

Category slugs: `contabilidad-finanzas`, `marketing-marca`, `soluciones-bi-digital`,
`administracion-gestion`.

### Contabilidad y Finanzas
1. **Modelos Contables a Medida**
   - Sub: "Gestionar tu empresa debe ser fácil."
   - Desc: full text from source (see services.json)
   - Incluye: Análisis y evaluación inicial / Diseño de la arquitectura técnica del programa /
     Programación e implementación de módulos (compras, ventas, inventario, RRHH, finanzas) /
     Integración multiplataforma / Soporte y acompañamiento profesional
2. **Auditoría Financiera y Contable Integral**
   - Sub: "Descubre el verdadero estado de salud de tus proyectos de inversión."
   - Incluye: Revisión y análisis de libros contables / Verificación de arqueos de caja-bancos /
     Análisis de Estados e Información Financiera / Identificación de riesgos /
     Informe ejecutivo y plan de acción
3. **Presupuestos y Proyecciones Financieras**
   - Sub: "Planificación financiera de corto y largo plazo."
   - Incluye: Análisis de datos históricos / Presupuestos de ingresos y gastos /
     Modelo de flujo de caja proyectado / Análisis de sensibilidad y plan de seguimiento
4. **Análisis de Costos y Rentabilidad**
   - Sub: "Contabilidad de costos aplicada para mejorar los índices de rentabilidad económica."
   - Incluye: Mapeo de procesos productivos / Identificación de centros de costos /
     Cálculo de costos unitarios y fichas de costo / Análisis de punto de equilibrio y estrategia de precios
5. **Evaluación de Proyectos de Inversión**
   - Sub: "El primer paso antes de invertir recursos en nuevos proyectos de Inversión."
   - Incluye: Definición de flujo de caja / Cálculo de costo de capitales /
     Evaluación de indicadores VAN/TIR / Análisis de riesgo y sensibilidad / Informe Ejecutivo

### Marketing y Marca
6. **Estrategia de Marketing Digital**
   - Sub: "La manera correcta de convertir la presencia digital en un multiplicador de ventas."
   - Incluye: Auditoría de redes / Análisis de competencia y tendencias /
     Buyer persona y objetivos SMART / Estrategia y creación de contenidos /
     Calendario de publicaciones / Embudos de ventas multiplataforma
7. **Diseño de Marca e Identidad Visual**
   - Sub: "Desarrollo de marcas inteligentes y competitivas."
   - Incluye: Definición administrativa de la marca / Diseño de identificadores visuales /
     Manual de identidad corporativa / Diseño y desarrollo de propuestas de valor
8. **Investigación de Mercado**
   - Sub: "Conoce a tu cliente y a tu competencia para anticipar tu respuesta."
   - Incluye: Objetivos de investigación / Diseño de instrumentos /
     Recolección y análisis de datos / Mapa de posicionamiento y plan de diferenciación
9. **Diseño de Material Publicitario**
   - Sub: "Primero se ve, luego se lee. Que tu material venda desde el primer vistazo."
   - Incluye: Propuestas creativas / Diseño en alta resolución /
     Versiones para diferentes formatos (impresión, digital, redes)

### Soluciones BI y Digital
10. **Instalación de Agentes IA**
    - Sub: "Atiende a tus clientes con operadores inteligentes que responden 24/7."
    - Incluye: Diseño del flujo conversacional / Integración con WhatsApp Business /
      Configuración de respuestas automáticas / Pruebas de usuario / Soporte y monitoreo
11. **Desarrollo de Páginas Web**
    - Sub: "Incluir una web en tu plan de negocios, es construir tu casa digital."
    - Incluye: Diseño y desarrollo del sitio / Dominio y hosting /
      UI/UX y frontend/backend / Velocidad y SEO on-page / Soporte y monitoreo

### Administración y Gestión
12. **Elaboración del Plan de Negocios**
    - Sub: "El documento rector de toda la estrategia en tu empresa."
    - Incluye: Análisis FODA / Análisis de mercado y competencia / Propuesta de valor /
      Plan de marketing, ventas, operaciones y financiero / Informe ejecutivo legal
13. **Auditoría Admón. y Organizacional**
    - Sub: "Mejora la eficiencia operativa y logística de tu negocio con asesoramiento profesional."
    - Incluye: Evaluación de procesos administrativos / Revisión de organigrama y flujos de información /
      Revisión de políticas y procedimientos / Informe ejecutivo con plan de acciones

Full descriptions: exact copy from user-provided source (`Web Servicios.docx` / chat paste);
store verbatim in the data files and DB seed.

## 7. Open Decisions

- **A. Data source**: services table currently has 0 rows. Populate via DB seed (migration) and/or
  static JSON fallback? → Default: seed the DB with the 13 services AND update static JSONs
  (fallback for Contact page dropdown + offline).
- **B. English content**: only ES provided. `*_en` fields stay null → `localizeItems` falls back
  to ES. Later pass for EN translations.
- **C. RequestModal reuse**: `RequestModal` inserts into `pedidos` (order flow with price) — NOT
  suitable. New `ServiceRequestModal` targets `servicio_solicitudes`. Existing RequestModal stays
  for products/events.
- **D. HomePage preview behavior**: card "Ver más info" opens the same modal inline (recommended,
  consistent) — no navigation to /servicios required.

## 8. Scope Notes / Non-Goals

- Products keep price + cart flow untouched.
- Events untouched.
- `servicio_solicitudes` is read-only in admin (no edit/delete) for this iteration.
- No WhatsApp deep link auto-fill in form (field `whatsapp_link` shown as contact alternative only).
