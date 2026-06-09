import { chromium } from '@playwright/test';
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
await page.addInitScript(() => sessionStorage.setItem('reconIntroSeen', '1'));
await page.goto('http://localhost:8099/index.html');
await page.waitForSelector('#bg.ready', { timeout: 15000 });
const snap = () => page.evaluate(() => { const s = window.__optic(); return { ph: s.phase, cp: s.cp, rs: Math.round(s.readScroll), t: +s.travelT.toFixed(2), settle: s.settle, arm: s.arm }; });
const swipe = (start, step, n) => page.evaluate(([start, step, n]) => {
  const mk = (type, y) => new TouchEvent(type, { touches: type === 'touchend' ? [] : [new Touch({ identifier: 1, target: document.body, clientX: 195, clientY: y })], bubbles: true, cancelable: true });
  window.dispatchEvent(mk('touchstart', start));
  for (let i = 1; i <= n; i++) window.dispatchEvent(mk('touchmove', start - i * step));
  window.dispatchEvent(mk('touchend', start - n * step));
}, [start, step, n]);
console.log('boot     ', await snap());
await swipe(800, 500, 10); await page.waitForTimeout(90);
console.log('big pin  ', await snap());
for (let i = 1; i <= 6; i++) {
  await swipe(640, 50, 8); await page.waitForTimeout(90);
  console.log('swipe ' + i + '  ', await snap());
}
await b.close();
