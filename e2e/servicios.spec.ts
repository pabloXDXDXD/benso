import { test, expect } from '@playwright/test';

// E2E coverage for the services request flow (services-request-flow change):
// catalog info-first cards, new category filters, ServiceRequestModal details/form/success
// views, and the HomePage services preview. Runs against a server on :3000 and the real
// Supabase project (same data path as production).
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

// Unique marker so rows inserted by this run can be identified and cleaned up afterwards
// (anon role can INSERT but not SELECT/DELETE on servicio_solicitudes, so cleanup is done
// externally with the service role: DELETE WHERE email LIKE 'e2e-%@benso.test').
const RUN_ID = Date.now().toString(36);
const E2E_EMAIL = `e2e-${RUN_ID}@benso.test`;

// The site is single-language Spanish (i18n removed). Force es-ES so any browser
// locale handling in tests matches the Spanish copy.
test.use({ locale: 'es-ES' });

test.describe('Servicios catalog (S1, S3, S8)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/servicios/`);
    await expect(page.locator('.service-card:has(.btn-view-more)')).toHaveCount(13, { timeout: 20000 });
  });

  test('renders 13 info-first cards without price or cart elements', async ({ page }) => {
    const cards = page.locator('.bento-grid .service-card');
    await expect(cards).toHaveCount(13);
    // every card shows subtitle + "Ver más info"
    await expect(cards.locator('.service-card-subtitle')).toHaveCount(13);
    await expect(cards.locator('.btn-view-more').first()).toHaveText(/Ver más info/);
    // no price or cart elements in the services catalog (R1/R6)
    await expect(cards.locator('.card-price')).toHaveCount(0);
    await expect(cards.locator('.btn-add-cart')).toHaveCount(0);
  });

  test('filter offers the 4 new categories and no legacy ones (R2)', async ({ page }) => {
    const options = await page.locator('.filter-select option').allTextContents();
    expect(options).toEqual([
      'Todos',
      'Contabilidad y Finanzas',
      'Marketing y Marca',
      'Soluciones BI y Digital',
      'Administración y Gestión',
    ]);
    await expect(
      page.locator('.filter-select option', { hasText: /Consultor|Capacitaci|Herramientas/i })
    ).toHaveCount(0);
  });

  test('selecting "Marketing y Marca" shows its 4 services (S3)', async ({ page }) => {
    await page.selectOption('.filter-select', { label: 'Marketing y Marca' });
    const cards = page.locator('.service-card:has(.btn-view-more)');
    await expect(cards).toHaveCount(4, { timeout: 10000 });
    for (const title of [
      'Estrategia de Marketing Digital',
      'Diseño de Marca e Identidad Visual',
      'Investigación de Mercado',
      'Diseño de Material Publicitario',
    ]) {
      await expect(cards.filter({ hasText: title })).toHaveCount(1);
    }
  });
});

test.describe('ServiceRequestModal (S4, S6, S7)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/servicios/`);
    await expect(page.locator('.service-card:has(.btn-view-more)')).toHaveCount(13, { timeout: 20000 });
  });

  test('opens on "Ver más info" with kicker, title, subtitle, description and includes (S4)', async ({ page }) => {
    // Target by title: the catalog fetch has no ORDER BY, so grid order is not guaranteed
    const card = page.locator('.service-card', { hasText: 'Modelos Contables a Medida' });
    await card.locator('.btn-view-more').click();
    const panel = page.locator('.svc-modal-panel');
    await expect(panel).toBeVisible();
    await expect(panel.locator('.svc-modal-kicker')).toHaveText('Contabilidad y Finanzas');
    await expect(panel.locator('.svc-modal-title')).toHaveText('Modelos Contables a Medida');
    await expect(panel.locator('.svc-modal-subtitle')).not.toHaveText('');
    await expect(panel.locator('.svc-modal-desc')).not.toHaveText('');
    await expect(panel.locator('.svc-modal-includes-label')).toHaveText('Qué incluye');
    await expect(panel.locator('.svc-modal-includes li').first()).toBeVisible();
    await expect(panel.locator('.svc-modal-btn', { hasText: 'Solicitar servicio' })).toBeVisible();

    // dismissible
    await panel.locator('.svc-modal-close').click();
    await expect(panel).not.toBeVisible();
  });

  test('blocks submit on missing/invalid fields and back returns to details (S6)', async ({ page }) => {
    await page.locator('.service-card').first().locator('.btn-view-more').click();
    const panel = page.locator('.svc-modal-panel');
    await panel.locator('.svc-modal-btn', { hasText: 'Solicitar servicio' }).click();
    await expect(panel.locator('.svc-modal-chip')).toHaveText('Sin compromiso');

    // empty submit is blocked with a visible error
    await panel.locator('button[type="submit"]').click();
    await expect(panel.locator('.svc-modal-error')).toBeVisible();
    await expect(panel.locator('.svc-modal-error')).toContainText('Completa los campos obligatorios');

    // invalid email is blocked too
    await panel.locator('#svc-nombre').fill('E2E Test User');
    await panel.locator('#svc-email').fill('not-an-email');
    await panel.locator('button[type="submit"]').click();
    await expect(panel.locator('.svc-modal-error')).toBeVisible();

    // back control returns to the details view
    await panel.locator('.svc-modal-btn--secondary').click();
    await expect(panel.locator('.svc-modal-includes-label')).toHaveText('Qué incluye');
  });

  test('valid submit persists a real request and shows success without an order id (S7, S9)', async ({ page }) => {
    // Capture the insert payload the browser sends to Supabase (real request, not mocked)
    let insertPayload: Record<string, unknown> | null = null;
    await page.route('**/rest/v1/servicio_solicitudes', async (route) => {
      if (route.request().method() === 'POST') {
        insertPayload = route.request().postDataJSON() as Record<string, unknown>;
      }
      await route.continue();
    });

    // Target by title: the catalog fetch has no ORDER BY, so grid order is not guaranteed
    const card = page.locator('.service-card', { hasText: 'Modelos Contables a Medida' });
    await card.locator('.btn-view-more').click();
    const panel = page.locator('.svc-modal-panel');
    await panel.locator('.svc-modal-btn', { hasText: 'Solicitar servicio' }).click();
    await panel.locator('#svc-nombre').fill('E2E Test User');
    await panel.locator('#svc-email').fill(E2E_EMAIL);
    await panel.locator('#svc-telefono').fill('+53 5555 1234');
    await panel.locator('#svc-mensaje').fill('Solicitud de prueba E2E');
    await panel.locator('button[type="submit"]').click();

    const success = panel.locator('.svc-modal-success');
    await expect(success).toBeVisible({ timeout: 15000 });
    await expect(success).toContainText('¡Solicitud enviada! Te contactaremos en breve.');

    // R5: no order/request id anywhere in the success view
    const successText = await success.innerText();
    expect(successText).not.toMatch(/#\s*\d/);

    // S9: the request carries the servicio snapshot + contact fields, and a real DB id
    expect(insertPayload).not.toBeNull();
    expect(insertPayload).toMatchObject({
      servicio_titulo: 'Modelos Contables a Medida',
      nombre: 'E2E Test User',
      email: E2E_EMAIL,
      telefono: '+53 5555 1234',
      mensaje: 'Solicitud de prueba E2E',
    });
    expect(typeof insertPayload!.servicio_id).toBe('number');
    expect(insertPayload!.servicio_id as number).toBeGreaterThan(0);
  });
});

test.describe('HomePage services preview (S2, S5)', () => {
  test('shows the first 3 services info-first and opens the same modal', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const previewCards = page.locator('.service-card:has(.btn-view-more)');
    await expect(previewCards).toHaveCount(3, { timeout: 20000 });
    await expect(previewCards.locator('.service-card-subtitle')).toHaveCount(3);
    // no price or cart in the preview (R1)
    await expect(previewCards.locator('.card-price')).toHaveCount(0);
    await expect(previewCards.locator('.btn-add-cart')).toHaveCount(0);

    await previewCards.first().locator('.btn-view-more').click();
    const panel = page.locator('.svc-modal-panel');
    await expect(panel).toBeVisible();
    await expect(panel.locator('.svc-modal-title')).not.toHaveText('');
    await expect(panel.locator('.svc-modal-includes-label')).toHaveText('Qué incluye');
  });
});
