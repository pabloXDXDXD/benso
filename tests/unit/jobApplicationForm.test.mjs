// Regression net for the hiring feature (commit 5642e65).
// Covers: ODD S1 (banner), S2 (public application form), S3 (admin tab) and the
// RLS requirement "public INSERT, no public SELECT".
//
// The form has no UI runner in this repo, so the shipped EMAIL_RE constant is
// extracted from the source and exercised directly, and the rest is guarded
// structurally against the source files.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');

const MODAL = read('src', 'components', 'JobApplicationModal.tsx');
const SERVICE_MODAL = read('src', 'components', 'ServiceRequestModal.tsx');
const BANNER = read('src', 'components', 'PromoBanner.tsx');
const SIDEBAR = read('src', 'app', 'admin', 'AppSidebar.tsx');
const ADMIN_PAGE = read('src', 'app', 'admin', 'page.tsx');
const EDGE = read('supabase', 'functions', 'admin-query', 'index.ts');
const ROUTE = read('src', 'app', 'api', 'admin', 'query', 'route.ts');
const MIGRATION = read('supabase', 'migrations', '202610210003_create_empleo_solicitudes.sql');

/** Extracts `const NAME = /.../;` from a source file and returns the RegExp. */
function extractRegex(source, name) {
  const m = source.match(new RegExp(`const\\s+${name}\\s*=\\s*(/.*?/[a-z]*)`));
  assert.ok(m, `could not find the ${name} regex`);
  return new RegExp(m[1].slice(1, m[1].lastIndexOf('/')), m[1].slice(m[1].lastIndexOf('/') + 1));
}

test('the application form uses the same email regex as the service request form', () => {
  const jobRe = extractRegex(MODAL, 'EMAIL_RE');
  const svcRe = extractRegex(SERVICE_MODAL, 'EMAIL_RE');
  assert.equal(jobRe.source, svcRe.source);
  assert.equal(jobRe.flags, svcRe.flags);
});

test('the email regex rejects malformed addresses and accepts real ones', () => {
  const re = extractRegex(MODAL, 'EMAIL_RE');
  for (const bad of ['', 'no-at-sign', 'a@b', 'a b@c.com', '@b.com', 'a@.com', 'a@b.']) {
    assert.equal(re.test(bad), false, `"${bad}" must be rejected`);
  }
  for (const good of ['a@b.com', 'nombre.apellido@dominio.cu', 'x+tag@mail.co']) {
    assert.equal(re.test(good), true, `"${good}" must be accepted`);
  }
});

test('the form marks nombre, email and area as required', () => {
  assert.match(MODAL, /id="job-nombre"[\s\S]*?required/);
  assert.match(MODAL, /id="job-email"[\s\S]*?required/);
  assert.match(MODAL, /id="job-area"[\s\S]*?required/);
});

test('the form writes into empleo_solicitudes', () => {
  assert.match(MODAL, /\.from\('empleo_solicitudes'\)/);
  assert.match(MODAL, /\.insert\(\{[\s\S]*?nombre: name[\s\S]*?email: mail[\s\S]*?area,/);
});

test('the form cannot be submitted twice while it is saving', () => {
  assert.match(MODAL, /if \(saving\) return;/);
  assert.match(MODAL, /disabled=\{saving\}/);
});

test('closing the modal resets every field and the success state', () => {
  const close = MODAL.slice(MODAL.indexOf('const handleClose'), MODAL.indexOf('const handleSubmit'));
  for (const setter of ['setView(\'form\')', 'setNombre(\'\')', 'setEmail(\'\')', 'setTelefono(\'\')', 'setArea(', 'setExperiencia(\'\')', 'setError(null)', 'setSaving(false)']) {
    assert.ok(close.includes(setter), `handleClose must call ${setter}`);
  }
});

test('the form shows a success state after a successful insert', () => {
  assert.match(MODAL, /setView\('success'\)/);
  assert.match(MODAL, /¡Postulación enviada!/);
});

test('the migration allows an anonymous INSERT and grants no anonymous SELECT', () => {
  assert.match(MIGRATION, /CREATE POLICY[^;]*FOR INSERT[^;]*TO anon[^;]*WITH CHECK \(true\)/s);
  assert.ok(
    !/CREATE POLICY[^;]*FOR SELECT[^;]*TO anon/s.test(MIGRATION),
    'no policy may grant SELECT to anon on empleo_solicitudes'
  );
  assert.match(MIGRATION, /CREATE POLICY[^;]*FOR SELECT[^;]*TO service_role/s);
});

test('the admin query allow-lists empleo_solicitudes as read only in both entry points', () => {
  for (const src of [EDGE, ROUTE]) {
    const allowed = src.match(/ALLOWED_TABLES\s*=\s*\[([^\]]*)\]/)[1];
    assert.ok(allowed.includes("'empleo_solicitudes'"), 'empleo_solicitudes must be allow-listed');
    const readOnly = src.match(/READ_ONLY_TABLES\s*=\s*\[([^\]]*)\]/)[1];
    assert.ok(readOnly.includes("'empleo_solicitudes'"), 'empleo_solicitudes must be read only');
  }
});

test('the admin reads the applications through the service role edge function', () => {
  assert.match(EDGE, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(ADMIN_PAGE, /adminFetch\('select', \{ table: 'empleo_solicitudes'/);
});

test('the admin sidebar shows the Empleo tab with its counter', () => {
  assert.match(SIDEBAR, /tab: 'empleo', label: 'Empleo'[\s\S]*?countKey: 'empleo_solicitudes'/);
  assert.match(ADMIN_PAGE, /empleo_solicitudes: empleoData\.length/);
});

test('the admin table for Empleo shows name, area, contacts, experience and date', () => {
  const cols = ADMIN_PAGE.slice(ADMIN_PAGE.indexOf('const empleoColumns'), ADMIN_PAGE.indexOf('const inscripcionesColumns'));
  for (const label of ['Nombre', 'Área', 'Contactos', 'Experiencia', 'Fecha']) {
    assert.ok(cols.includes(`label: '${label}'`), `missing column ${label}`);
  }
  assert.ok(!/alwaysVisible: true/.test(cols), 'the Empleo table must stay read only (no action column)');
});

test('the admin toolbar hides the Añadir button on the Empleo tab', () => {
  assert.match(
    ADMIN_PAGE,
    /activeTab !== 'empleo' && \(\s*<button onClick=\{\(\) => \{ setShowCreateModal/
  );
});

test('the banner announces the hiring and opens the application form', () => {
  assert.match(BANNER, /Buscamos nuevos integrantes para BENSO/);
  assert.match(BANNER, /aria-label="Postular al equipo de BENSO"/);
  assert.match(BANNER, /onClick=\{\(\) => setIsApplyOpen\(true\)\}/);
  assert.match(BANNER, /<JobApplicationModal open=\{isApplyOpen\}/);
});

test('the banner still measures its height for the sticky layout', () => {
  assert.match(BANNER, /--banner-height/);
  assert.match(BANNER, /offsetHeight/);
});

test('the event registration is still reachable outside the banner', () => {
  const slug = read('src', 'app', 'formacion', '[slug]', 'page.tsx');
  assert.match(slug, /EventRegistrationButton/);
  assert.ok(!BANNER.includes('EventRegistrationForm'), 'the banner must not register for events any more');
});

