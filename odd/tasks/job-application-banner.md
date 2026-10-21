# Job application banner

Objetivo: convertir el banner superior en un anuncio de contratación de BENSO con un formulario de postulación, y que las postulaciones aparezcan en el admin.
Rama: `feature/usd-base-pricing` (misma rama, feature independiente) · Entrega: `ask-on-risk` (work-unit commits) · Test runner: `npm run test:unit` + `npm run build` (no hay runner de UI)

## Specs

### S1 — El banner anuncia la contratación
"en el banner ese quiero poner un anuncio para buscar más personas para benso"

Alcance: el texto del marquee superior (`src/components/PromoBanner.tsx`) pasa de "Nuevo curso de Marketing Digital! 20% de descuento" al anuncio de equipo.

Criterios de aceptación:
- El banner muestra el anuncio de contratación, con la parte destacada en el estilo `promo-highlight` ya existente.
- Al hacer clic se abre el formulario de postulación (no la inscripción al evento).
- El `aria-label` del botón describe la nueva acción.

### S2 — Formulario de postulación
"básicamente un formulario para empleo"

Alcance: modal público con los campos nombre, correo, teléfono, área de interés, experiencia y mensaje. Escribe en la tabla `empleo_solicitudes` con el cliente anónimo de Supabase (patrón de `servicio_solicitudes`).

Criterios de aceptación:
- Nombre, correo y área son obligatorios; el correo se valida con el mismo regex que el formulario de servicios.
- Tras enviar, se muestra la confirmación de éxito y no se puede reenviar el mismo formulario.
- El modal reutiliza las clases `svc-modal-*` existentes (sin duplicar CSS del sitio).

### S3 — Las postulaciones salen en el admin
"y que salgan las solicitudes en admin"

Alcance: pestaña **Empleo** en el admin que lista las postulaciones (solo lectura, igual que Solicitudes).

Criterios de aceptación:
- `empleo_solicitudes` está en la allow-list de `admin-query` (edge function y route Next) y es de solo lectura.
- La tabla muestra nombre, área, contactos, experiencia y fecha, con buscador por nombre/área/contacto y contador en el sidebar.

## Tasks

| ID | Task | Specs | Route | Riesgo | Status |
|----|------|-------|-------|--------|--------|
| T1 | Migración `empleo_solicitudes` + RLS (INSERT público, SELECT solo admin/service role) | S2, S3 | inline | item 1 (datos) | completada |
| T2 | `JobApplicationModal` (formulario público) + estilos del `select` | S2 | inline | item 2 (PII/spam) | completada |
| T3 | `PromoBanner`: copy de contratación y apertura del modal | S1 | inline | item 3 (contrato) | completada |
| T4 | Admin: allow-list, pestaña Empleo, columnas, contador y buscador | S3 | inline | item 3 (contrato) | completada |
| T5 | Verificación: `npm run test:unit` (43 tests), `npm run build`, revisión del flujo | S1–S3 | inline + verificador | item 2 | completada |

## Log

### L1 — 2026-10-21 — Solicitud (verbatim)
> en el banner ese quiero poner un anuncio para buscar más personas para benso. básicamente un formulario para empleo, y que salgan las solicitudes en admin

### L2 — 2026-10-21 — Copy propuesto (verbatim)
> algo asi como, buscamos nuevos integrantes para benso, o quieres formar parte del equipo dseudo? dame sugerencias

Notas de análisis:
- El banner (`PromoBanner`) hoy está cableado al evento activo más reciente y abre `EventRegistrationForm`. El anuncio de contratación lo sustituye; la inscripción a eventos sigue accesible desde su propio botón en la web, así que no se pierde ninguna función.
- El texto del banner sigue en el código (como hoy). Si quieres editarlo desde el admin, hace falta una tabla de contenido para el banner — queda fuera de esta fase.
- La tabla de postulaciones expone PII (nombre, correo, teléfono): el INSERT es público pero el SELECT solo lo permite `authenticated`/`service_role`, igual que `servicio_solicitudes`. Sin CAPTCHA: el sitio no lo usa en ningún otro formulario.
- El `select` de "área de interés" no está cubierto por el CSS global de `.svc-modal-form` (solo `input` y `textarea`), y `src/app/globals.css` tiene cambios sin commitear de otra feature: los estilos nuevos van en un CSS propio del componente para no tocar ese archivo.
- El verificador independiente marcó que faltaba el campo `mensaje` que la propia spec pedía: se añadió al formulario, al insert y a la tabla del admin. Los tests de regresión que dejó el verificador se commitean como `tests/unit/jobApplicationForm.test.mjs` y `tests/unit/usd_migration_variants.test.mjs` (43 tests en total).
