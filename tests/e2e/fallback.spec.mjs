// Seam 3 — static-fallback floor for v2.html (Slice 6, DG4).
// Two fallback triggers, same contract: a complete, readable, motion-free
// document with all five checkpoints and zero console errors.
import { test, expect } from '@playwright/test';

const LABELS = ['00 · OVERWATCH', '01 · EXPERIENCE', '02 · WORK', '03 · ABOUT', '04 · ESTABLISH COMMS'];
// one load-bearing content string per checkpoint
const CONTENT = [
  'I build things that',
  'Multi-cloud orchestrator',
  'second-brain',
  "A builder who doesn't pick sides",
  'ssbajpai9@gmail.com',
];

const collectErrors = (page) => {
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  return errors;
};

const expectStaticFloor = async (page) => {
  await expect(page.locator('body')).toHaveClass(/static-mode/);
  const panels = page.locator('#infoLayer .panel');
  await expect(panels).toHaveCount(5);
  for (let i = 0; i < 5; i++) {
    await expect(panels.nth(i)).toBeVisible();
    await expect(panels.nth(i)).toContainText(LABELS[i]);
    await expect(panels.nth(i)).toContainText(CONTENT[i]);
  }
  // a real document: taller than the viewport and nav anchors reach the end
  const scrollable = await page.evaluate(() => document.body.scrollHeight > innerHeight * 2);
  expect(scrollable).toBe(true);
  await page.click('.topbar .cp-jump[data-cp="4"]');
  const nearComms = await page.evaluate(() => {
    const r = document.querySelector('.panel[data-cp="4"]').getBoundingClientRect();
    return r.top >= 0 && r.top < innerHeight;
  });
  expect(nearComms).toBe(true);
};

test('no WebGL: complete readable static page, no blank/broken state', async ({ page }) => {
  const errors = collectErrors(page);
  // a genuinely failed context: getContext returns null for webgl types
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      if (typeof type === 'string' && type.includes('webgl')) return null;
      return orig.call(this, type, ...rest);
    };
  });
  await page.goto('/index.html');
  await expectStaticFloor(page);
  // no opt-in to a 3D mode that cannot render
  await expect(page.locator('#enter3d')).toBeHidden();
  expect(errors).toEqual([]);
});

test.describe('prefers-reduced-motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('reduce-motion: static document, no fly-in, ENTER 3D offered', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/index.html');
    await expectStaticFloor(page);
    // no camera motion: the intro never arms and the HUD never reads INBOUND
    await expect(page.locator('#intro')).toBeHidden();
    // WebGL works here, so the dampened 3D path is offered as an opt-in
    await expect(page.locator('#enter3d')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('ENTER 3D opt-in boots the dampened 3D experience', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/index.html');
    await expect(page.locator('#enter3d')).toBeVisible();
    await page.click('#enter3d');
    await expect(page.locator('body')).not.toHaveClass(/static-mode/, { timeout: 5000 });
    // docked at Overwatch in INFO mode; no intro under reduced motion
    await expect(page.locator('#hudMode')).toHaveText('TARGET ACQUIRED', { timeout: 10000 });
    await expect(page.locator('.panel.active .cp')).toHaveText('00 · OVERWATCH');
    await expect(page.locator('#intro')).toBeHidden();
    expect(errors).toEqual([]);
  });
});
