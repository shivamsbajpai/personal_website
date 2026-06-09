// Seam 3 — desktop full-loop smoke (Slice 7, DH2).
// Fresh context per test (Playwright default), so the fly-in plays on the
// first-load test; the others pre-mark the session to start docked.
import { test, expect } from '@playwright/test';

const PAGE = '/index.html';

const collectErrors = (page) => {
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  return errors;
};
const skipIntro = (page) => page.addInitScript(() => sessionStorage.setItem('reconIntroSeen', '1'));
const hudMode = (page) => page.locator('#hudMode');

// drive real wheel scroll until the HUD reports the wanted mode (or fail)
async function wheelUntil(page, re, delta = 320, max = 200) {
  for (let i = 0; i < max; i++) {
    await page.mouse.wheel(0, delta);
    await page.waitForTimeout(45);
    if (re.test(await hudMode(page).textContent())) return;
  }
  throw new Error(`HUD never matched ${re}`);
}

test('first load: WebGL ready, fly-in completes and settles at Overwatch, 0 errors', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(PAGE);
  // WebGL context up and first frame rendered
  await expect(page.locator('#bg')).toHaveClass(/ready/, { timeout: 15000 });
  // the cinematic plays from the start…
  await expect(hudMode(page)).toHaveText('INBOUND');
  await expect(page.locator('#intro')).toBeVisible();
  // …and lands docked at Overwatch as assets complete
  await expect(hudMode(page)).toHaveText('TARGET ACQUIRED', { timeout: 20000 });
  await expect(page.locator('.panel.active .cp')).toHaveText('00 · OVERWATCH');
  await expect(page.locator('.panel.active')).toContainText('I build things that');
  await expect(page.locator('#infoLayer')).toHaveCSS('opacity', '1', { timeout: 5000 });
  expect(errors).toEqual([]);
});

test('scroll advances to the next checkpoint and flips INFO; reverse returns', async ({ page }) => {
  const errors = collectErrors(page);
  await skipIntro(page);
  await page.goto(PAGE);
  await expect(page.locator('#bg')).toHaveClass(/ready/, { timeout: 15000 });
  // forward: read through Overwatch, release into TRAVEL, dock at Experience
  await wheelUntil(page, /TRAVERSING/);
  await wheelUntil(page, /TARGET ACQUIRED/, 280);
  await expect(page.locator('.panel.active .cp')).toHaveText('01 · EXPERIENCE', { timeout: 8000 });
  await expect(page.locator('.panel.active')).toContainText("Where I've shipped");
  // reverse: back out and return to Overwatch
  await wheelUntil(page, /TRAVERSING/, -320);
  await wheelUntil(page, /TARGET ACQUIRED/, -280);
  await expect(page.locator('.panel.active .cp')).toHaveText('00 · OVERWATCH', { timeout: 8000 });
  expect(errors).toEqual([]);
});

test('⌘K fast-travel: open by keyboard, filter by name, fly + dock', async ({ page }) => {
  const errors = collectErrors(page);
  await skipIntro(page);
  await page.goto(PAGE);
  await expect(page.locator('#bg')).toHaveClass(/ready/, { timeout: 15000 });
  await page.keyboard.press('ControlOrMeta+k');
  await expect(page.locator('#fc')).toHaveClass(/open/);
  await expect(page.locator('#fcInput')).toBeFocused();
  await page.keyboard.type('about');
  await page.keyboard.press('Enter');
  await expect(hudMode(page)).toHaveText('TRAVERSING');
  await expect(hudMode(page)).toHaveText('TARGET ACQUIRED', { timeout: 10000 });
  await expect(page.locator('.panel.active .cp')).toHaveText('03 · ABOUT');
  await expect(page.locator('.panel.active')).toContainText("A builder who doesn't pick sides");
  expect(errors).toEqual([]);
});
