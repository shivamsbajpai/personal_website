// Seam 3 — mobile (touch) full-3D smoke (Slice 7, DH2).
// Swipes are dispatched as real TouchEvents (the app listens on window),
// matching how a phone drives the optic.
import { test, expect } from '@playwright/test';

const PAGE = '/index.html';

// Cadence constants, imported through the BROWSER (which loads state.js as
// ESM) so tuning them doesn't break this spec. Importing into the runner
// directly fails: without "type":"module", Playwright's loader treats the
// bare-.js file as CJS (bare `node --test` auto-detects ESM; Playwright doesn't).
const cadence = (page) => page.evaluate(() => import('/scene/state.js')
  .then((m) => ({ TRAVEL_STEPS: m.TRAVEL_STEPS, EDGE_TAPS: m.EDGE_TAPS, SETTLE_TAPS: m.SETTLE_TAPS })));

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

const collectErrors = (page) => {
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  return errors;
};
const skipIntro = (page) => page.addInitScript(() => sessionStorage.setItem('reconIntroSeen', '1'));

// one upward swipe (scrolls forward); the app reads touchstart/move/end on window
const swipeUp = (page) => page.evaluate(() => {
  const mk = (type, y) => new TouchEvent(type, {
    touches: type === 'touchend' ? [] : [new Touch({ identifier: 1, target: document.body, clientX: 195, clientY: y })],
    bubbles: true, cancelable: true,
  });
  window.dispatchEvent(mk('touchstart', 640));
  for (let i = 1; i <= 8; i++) window.dispatchEvent(mk('touchmove', 640 - i * 50));
  window.dispatchEvent(mk('touchend', 240));
});

async function swipeUntil(page, re, max = 80) {
  for (let i = 0; i < max; i++) {
    await swipeUp(page);
    await page.waitForTimeout(70);
    if (re.test(await page.locator('#hudMode').textContent())) return;
  }
  throw new Error(`HUD never matched ${re}`);
}

test('touch: swipe drives reading, travel, and the next dock; 0 errors', async ({ page }) => {
  const errors = collectErrors(page);
  await skipIntro(page);
  await page.goto(PAGE);
  await expect(page.locator('#bg')).toHaveClass(/ready/, { timeout: 15000 });
  await expect(page.locator('.panel.active .cp')).toHaveText('00 · OVERWATCH');
  // in-panel reading first: swipes move the content while pinned
  const before = await page.evaluate(() => document.querySelector('.panel.active .panel-scroll').style.transform || 'none');
  await swipeUp(page);
  await page.waitForTimeout(250);
  const after = await page.evaluate(() => document.querySelector('.panel.active .panel-scroll').style.transform);
  expect(after).not.toBe(before);
  // …then release into travel and dock at Experience
  await swipeUntil(page, /TRAVERSING/);
  await swipeUntil(page, /TARGET ACQUIRED/);
  await expect(page.locator('.panel.active .cp')).toHaveText('01 · EXPERIENCE', { timeout: 8000 });
  await expect(page.locator('.panel.active')).toContainText("Where I've shipped");
  // panel fits and is readable on the phone viewport
  const fits = await page.evaluate(() => {
    const r = document.querySelector('.panel.active').getBoundingClientRect();
    return r.left >= 0 && r.right <= innerWidth;
  });
  expect(fits).toBe(true);
  expect(errors).toEqual([]);
});

// Task 008 (#23): stroke cadence — a pinned edge absorbs EDGE_TAPS swipes
// before the next releases, a gap costs exactly TRAVEL_STEPS swipes, and an
// arrival absorbs SETTLE_TAPS swipes before the fresh panel scrolls.
test('touch: edge gate, stroke-counted gap, arrival settle', async ({ page }) => {
  const errors = collectErrors(page);
  await skipIntro(page);
  await page.goto(PAGE);
  await expect(page.locator('#bg')).toHaveClass(/ready/, { timeout: 15000 });
  const hud = page.locator('#hudMode');
  const transform = () => page.evaluate(() => document.querySelector('.panel.active .panel-scroll').style.transform || 'none');
  // reading scroll GLIDES toward its target now — wait for the ease-out to
  // settle before treating the transform as a stable baseline
  const settled = async () => {
    let prev = await transform();
    for (let i = 0; i < 40; i++) {
      await page.waitForTimeout(80);
      const cur = await transform();
      if (cur === prev) return cur;
      prev = cur;
    }
    throw new Error('panel transform never settled');
  };
  const { TRAVEL_STEPS, EDGE_TAPS, SETTLE_TAPS } = await cadence(page);

  // pin to the bottom deterministically: ONE oversized swipe clamps readScroll
  // to exactly contentMax (a moving stroke — the gate stays fully armed)
  await page.evaluate(() => {
    const mk = (type, y) => new TouchEvent(type, {
      touches: type === 'touchend' ? [] : [new Touch({ identifier: 1, target: document.body, clientX: 195, clientY: y })],
      bubbles: true, cancelable: true,
    });
    window.dispatchEvent(mk('touchstart', 800));
    for (let i = 1; i <= 10; i++) window.dispatchEvent(mk('touchmove', 800 - i * 500));
    window.dispatchEvent(mk('touchend', -4200));
  });
  const atPin = await settled();
  expect(atPin).not.toBe('none');                                // hero content really scrolled

  for (let i = 1; i <= EDGE_TAPS; i++) {                         // absorbed taps
    await swipeUp(page); await page.waitForTimeout(90);
    await expect(hud).toHaveText('TARGET ACQUIRED');
    expect(await transform()).toBe(atPin);                       // absorbed taps do not move content
    if (i === 1) await expect(page.locator('.panel.active .scroll-hint').first()).toHaveClass(/nudge/); // acknowledged (D5)
  }
  await expect(page.locator('.panel.active .cp')).toHaveText('00 · OVERWATCH');

  for (let i = 1; i <= TRAVEL_STEPS; i++) {                      // swipe 1 releases; swipe TRAVEL_STEPS docks
    await swipeUp(page); await page.waitForTimeout(i === TRAVEL_STEPS ? 250 : 90);
    await expect(hud).toHaveText(i === TRAVEL_STEPS ? 'TARGET ACQUIRED' : 'TRAVERSING');
  }
  await expect(page.locator('.panel.active .cp')).toHaveText('01 · EXPERIENCE');

  // arrival settle: the next SETTLE_TAPS swipes must NOT scroll the fresh panel
  const docked = await transform();
  for (let i = 0; i < SETTLE_TAPS; i++) {
    await swipeUp(page); await page.waitForTimeout(90);
    expect(await transform()).toBe(docked);
  }
  await swipeUp(page); await page.waitForTimeout(90);            // settle over: reading resumes
  expect(await transform()).not.toBe(docked);
  expect(errors).toEqual([]);
});

test('touch: fire-control button jumps checkpoints; 0 errors', async ({ page }) => {
  const errors = collectErrors(page);
  await skipIntro(page);
  await page.goto(PAGE);
  await expect(page.locator('#bg')).toHaveClass(/ready/, { timeout: 15000 });
  await page.tap('#fcOpen');
  await expect(page.locator('#fc')).toHaveClass(/open/);
  await page.locator('#fcInput').fill('comms');
  await page.tap('.fc-item.sel');
  await expect(page.locator('#hudMode')).toHaveText('TARGET ACQUIRED', { timeout: 12000 });
  await expect(page.locator('.panel.active .cp')).toHaveText('04 · ESTABLISH COMMS');
  expect(errors).toEqual([]);
});
