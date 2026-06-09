// Unit tests for the RECON optic state machine (Seam 1).
// Run: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initState, applyScroll, advanceTravel, cameraFloat, modeOf, easeInOut, PHASE, MODE } from '../scene/state.js';

const COUNT = 3;          // 3 checkpoints
const CMAX = 600;         // current content scroll height

test('initial state: reading checkpoint 0 at top', () => {
  const s = initState();
  assert.equal(s.phase, PHASE.READING);
  assert.equal(s.cp, 0);
  assert.equal(s.readScroll, 0);
  assert.equal(modeOf(s), MODE.INFO);
  assert.equal(cameraFloat(s), 0);
});

test('scrolling within content moves readScroll, stays parked (no travel)', () => {
  let s = initState();
  s = applyScroll(s, 200, CMAX, COUNT);
  assert.equal(s.phase, PHASE.READING);
  assert.equal(s.cp, 0);
  assert.equal(s.readScroll, 200);
  s = applyScroll(s, 200, CMAX, COUNT);
  assert.equal(s.readScroll, 400);
  assert.equal(cameraFloat(s), 0); // camera hasn't moved
});

test('reaching the end pins at the bound and does NOT travel on the same delta', () => {
  let s = initState();
  s = applyScroll(s, 5000, CMAX, COUNT); // big flick overshoots
  assert.equal(s.phase, PHASE.READING);  // pinned, not travelling
  assert.equal(s.readScroll, CMAX);
});

test('one more scroll past the pinned end starts a single travel forward', () => {
  let s = initState();
  s = applyScroll(s, 5000, CMAX, COUNT); // pin at end
  s = applyScroll(s, 120, CMAX, COUNT);  // next scroll -> travel
  assert.equal(s.phase, PHASE.TRAVELLING);
  assert.equal(s.from, 0);
  assert.equal(s.to, 1);
  assert.equal(s.travelT, 0);
});

test('scroll input is locked while travelling', () => {
  let s = initState();
  s = applyScroll(s, 5000, CMAX, COUNT);
  s = applyScroll(s, 120, CMAX, COUNT);   // now travelling
  const before = { ...s };
  s = applyScroll(s, 999, CMAX, COUNT);   // ignored
  assert.deepEqual(s, before);
});

test('travel advances over time and docks at the target on completion', () => {
  let s = initState();
  s = applyScroll(s, 5000, CMAX, COUNT);
  s = applyScroll(s, 120, CMAX, COUNT);   // travelling 0->1
  s = advanceTravel(s, 1300, 2600);       // halfway
  assert.equal(s.phase, PHASE.TRAVELLING);
  assert.ok(Math.abs(s.travelT - 0.5) < 1e-9);
  assert.ok(cameraFloat(s) > 0 && cameraFloat(s) < 1);
  s = advanceTravel(s, 1400, 2600);       // past the end
  assert.equal(s.phase, PHASE.READING);
  assert.equal(s.cp, 1);
  assert.equal(s.readScroll, 0);
  assert.equal(cameraFloat(s), 1);
});

test('scrolling up at the top of content travels back to the previous checkpoint', () => {
  // start parked at cp1
  let s = { phase: PHASE.READING, cp: 1, readScroll: 0, travelT: 0, from: 1, to: 1 };
  s = applyScroll(s, -50, CMAX, COUNT);   // at top, scroll up -> travel back
  assert.equal(s.phase, PHASE.TRAVELLING);
  assert.equal(s.from, 1);
  assert.equal(s.to, 0);
  s = advanceTravel(s, 3000, 2600);
  assert.equal(s.cp, 0);
});

test('cannot travel before the first or past the last checkpoint', () => {
  let first = initState();                 // cp0 at top
  first = applyScroll(first, -200, CMAX, COUNT);
  assert.equal(first.phase, PHASE.READING);
  assert.equal(first.cp, 0);

  let last = { phase: PHASE.READING, cp: COUNT - 1, readScroll: 0, travelT: 0, from: COUNT - 1, to: COUNT - 1 };
  last = applyScroll(last, 0, 0, COUNT);   // content fits (max 0), scroll down at last
  last = applyScroll(last, 200, 0, COUNT);
  assert.equal(last.phase, PHASE.READING);
  assert.equal(last.cp, COUNT - 1);
});

test('short content (max 0): one scroll down travels immediately', () => {
  let s = initState();
  s = applyScroll(s, 100, 0, COUNT); // nothing to scroll -> travel
  assert.equal(s.phase, PHASE.TRAVELLING);
  assert.equal(s.to, 1);
});

test('easeInOut is smooth: 0->0, 1->1, 0.5->0.5, monotonic', () => {
  assert.equal(easeInOut(0), 0);
  assert.equal(easeInOut(1), 1);
  assert.ok(Math.abs(easeInOut(0.5) - 0.5) < 1e-9);
  assert.ok(easeInOut(0.25) < easeInOut(0.75));
});
