import { test, expect } from '@playwright/test';

const ADMIN_URL = 'http://localhost:3000/admin/';
// Admin auth now goes through the deployed `admin-auth` edge function (ADMIN_PASSWORD env)
const ADMIN_PASSWORD = 'bensoadmin+2026';

test.describe('Admin Sidebar', () => {

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(ADMIN_URL);
    await page.fill('input[aria-label="Contraseña de administrador"]', ADMIN_PASSWORD);
    await page.click('text=Entrar');
    await page.waitForSelector('.app-sidebar', { timeout: 10000 });
    await page.waitForTimeout(800);
  });

  test('sidebar is 200px wide on desktop', async ({ page }) => {
    const width = await page.evaluate(
      () => document.querySelector('.app-sidebar')!.getBoundingClientRect().width
    );
    expect(Math.round(width)).toBe(200);
  });

  test('sidebar collapses to 64px and expands back', async ({ page }) => {
    // Initial: 200px
    let w = await page.evaluate(() => 
      document.querySelector('.app-sidebar')!.getBoundingClientRect().width
    );
    expect(Math.round(w)).toBe(200);

    // Collapse via native JS click (Playwright click has React event issues)
    await page.evaluate(() => {
      (document.querySelector('.sidebar-toggle') as HTMLButtonElement)?.click();
    });
    await page.waitForTimeout(500);

    w = await page.evaluate(() =>
      document.querySelector('.app-sidebar')!.getBoundingClientRect().width
    );
    expect(Math.round(w)).toBe(64);

    // Expand again
    await page.evaluate(() => {
      (document.querySelector('.sidebar-toggle') as HTMLButtonElement)?.click();
    });
    await page.waitForTimeout(500);

    w = await page.evaluate(() =>
      document.querySelector('.app-sidebar')!.getBoundingClientRect().width
    );
    expect(Math.round(w)).toBe(200);
  });

  test('sidebar has correct action-oriented icons', async ({ page }) => {
    // Sidebar is OPEN → should show PanelLeftClose (left arrow ←)
    const openSvg = await page.evaluate(() => {
      const svg = document.querySelector('.sidebar-toggle svg');
      return svg ? svg.innerHTML : '';
    });
    expect(openSvg).toContain('m16 15-3-3'); // PanelLeftClose path

    // Collapse sidebar
    await page.evaluate(() => {
      (document.querySelector('.sidebar-toggle') as HTMLButtonElement)?.click();
    });
    await page.waitForTimeout(500);

    // Sidebar is COLLAPSED → should show PanelLeftOpen (right arrow →)
    const closedSvg = await page.evaluate(() => {
      const svg = document.querySelector('.sidebar-toggle svg');
      return svg ? svg.innerHTML : '';
    });
    expect(closedSvg).toContain('m14 9 3 3'); // PanelLeftOpen path
  });

  test('footer buttons are visible on desktop', async ({ page }) => {
    const footerButtons = await page.evaluate(() => {
      const footer = document.querySelector('.sidebar-footer');
      if (!footer) return null;
      return Array.from(footer.querySelectorAll('button')).map(b => ({
        text: b.textContent?.trim() || '',
        html: b.innerHTML.substring(0, 100),
      }));
    });
    // Both buttons should exist (one may say "Cargando..." if data is loading)
    expect(footerButtons).not.toBeNull();
    expect(footerButtons!.length).toBe(2);
    // The "Salir" button is always present
    expect(footerButtons!.some(b => b.text.includes('Salir'))).toBe(true);
    // And there's a refresh/loading button (text depends on loading state)
    expect(footerButtons!.some(b => b.text.includes('Actualizar') || b.text.includes('Cargando'))).toBe(true);
  });

  test('navigation items navigate between tabs', async ({ page }) => {
    const tabs = ['Pedidos', 'Citas', 'Productos', 'Servicios', 'Eventos'];
    for (const tab of tabs) {
      await page.evaluate((t: string) => {
        const buttons = document.querySelectorAll('button.sidebar-item');
        for (const btn of buttons) {
          if (btn.textContent?.includes(t)) {
            (btn as HTMLButtonElement).click();
            break;
          }
        }
      }, tab);
      await page.waitForTimeout(300);
      await expect(page.locator('.admin-toolbar')).toBeVisible();
    }
  });
});

test.describe('Admin Responsive', () => {

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(ADMIN_URL);
    await page.fill('input[aria-label="Contraseña de administrador"]', ADMIN_PASSWORD);
    await page.click('text=Entrar');
    await page.waitForSelector('.app-sidebar', { timeout: 10000 });
    await page.waitForTimeout(600);
  });

  test('sidebar collapses automatically on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const width = await page.evaluate(() =>
      document.querySelector('.app-sidebar')!.getBoundingClientRect().width
    );
    expect(Math.round(width)).toBe(64);
  });

  test('dashboard grid stacks to 1 column on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    const gridCols = await page.evaluate(() => {
      const grid = document.querySelector('.dashboard-grid');
      if (!grid) return null;
      return getComputedStyle(grid).gridTemplateColumns;
    });

    // If data loaded, should be 1 column on mobile
    if (gridCols) {
      const parts = gridCols.split(' ').filter(Boolean);
      expect(parts.length).toBe(1);
    }
  });

  test('popular bento visible on both mobile and desktop', async ({ page }) => {
    // Check on mobile: if bento exists, it should be visible
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    const mobileDisplay = await page.evaluate(() => {
      const bento = document.querySelector('.popular-bento');
      if (!bento) return 'not-found';
      return getComputedStyle(bento).display;
    });
    
    if (mobileDisplay !== 'not-found') {
      expect(mobileDisplay).not.toBe('none');
    }

    // Back to desktop: should be visible (if data has popular items)
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);

    const desktopDisplay = await page.evaluate(() => {
      const bento = document.querySelector('.popular-bento');
      if (!bento) return 'not-found';
      return getComputedStyle(bento).display;
    });

    if (desktopDisplay !== 'not-found') {
      // On desktop, bento should be in its normal grid display
      expect(desktopDisplay === 'grid' || desktopDisplay === 'not-found').toBe(true);
    }
  });

  test('sidebar expands as overlay on mobile when toggle clicked', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Verify collapsed first
    let w = await page.evaluate(() =>
      document.querySelector('.app-sidebar')!.getBoundingClientRect().width
    );
    expect(Math.round(w)).toBe(64);

    // Expand via native JS click
    await page.evaluate(() => {
      (document.querySelector('.sidebar-toggle') as HTMLButtonElement)?.click();
    });
    await page.waitForTimeout(500);

    w = await page.evaluate(() =>
      document.querySelector('.app-sidebar')!.getBoundingClientRect().width
    );
    expect(Math.round(w)).toBe(200);

    // Backdrop should be visible (mobile overlay pattern)
    const hasBackdrop = await page.evaluate(() => !!document.querySelector('.sidebar-backdrop'));
    expect(hasBackdrop).toBe(true);
  });
});

// Solicitudes tab coverage (R5/R11/R12, S11/S12). The list is read-only: no add button in the
// toolbar and no edit/delete actions in the rows. Expects at least one request row to exist
// (tests are seeded externally with the service role, marker: "Admin E2E Seed").
test.describe('Admin Solicitudes tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(ADMIN_URL);
    await page.fill('input[aria-label="Contraseña de administrador"]', ADMIN_PASSWORD);
    await page.click('text=Entrar');
    await page.waitForSelector('.app-sidebar', { timeout: 10000 });
  });

  test('shows Solicitudes in the sidebar under OPERACIONES with a count badge', async ({ page }) => {
    const item = page.locator('.sidebar-item', { hasText: 'Solicitudes' });
    await expect(item).toBeVisible();
    // badge starts at 0 and updates once the solicitudes query resolves
    await expect(item.locator('.badge')).not.toHaveText('0', { timeout: 15000 });
    const count = Number(await item.locator('.badge').innerText());
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('solicitudes table is read-only and lists the seeded request newest-first', async ({ page }) => {
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button.sidebar-item');
      for (const btn of buttons) {
        if (btn.textContent?.includes('Solicitudes')) {
          (btn as HTMLButtonElement).click();
          break;
        }
      }
    });

    await expect(page.locator('.admin-toolbar')).toBeVisible();

    // R11: no "Añadir" button for read-only tabs
    await expect(page.locator('.toolbar-right .btn-add')).toHaveCount(0);

    // Seeded request row is listed with service snapshot + contact info
    const row = page.locator('.data-table tbody tr', { hasText: 'Admin E2E Seed' });
    await expect(row).toHaveCount(1, { timeout: 15000 });
    await expect(row).toContainText('Modelos Contables a Medida');
    await expect(row).toContainText('admin-e2e-seed@benso.test');

    // R11: read-only table — no action (edit/delete/copy) cells at all
    await expect(page.locator('.data-table .actions-cell')).toHaveCount(0);

    // Headers of the solicitudes table
    for (const header of ['Servicio', 'Nombre', 'Contactos', 'Mensaje', 'Fecha']) {
      await expect(page.locator('.data-table th', { hasText: header }).first()).toBeVisible();
    }
  });
});
