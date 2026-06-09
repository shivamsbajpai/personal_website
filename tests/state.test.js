// Unit tests for the RECON optic state machine (Seam 1) — scroll-driven.
// Run: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initState, applyScroll, cameraFloat, modeOf, easeInOut, PHASE, MODE } from '../scene/state.js';

const COUNT = 3;
const CMAX = 600;     // current content scroll height
const TLEN = 1000;    // px of scroll to cross one gap
const scroll = (s, d) => applyScroll(s, d, CMAX, COUNT, TLEN);

test('initial state: reading checkpoint 0 at top', () => {
  const s = initState();
  assert.equal(s.phase, PHASE.READING);
  assert.equal(s.cp, 0);
  assert.equal(modeOf(s), MODE.INFO);
  assert.equal(cameraFloat(s), 0);
});

test('scrolling within content moves readScroll, camera parked', () => {
  let s = initState();
  s = scroll(s, 200); assert.equal(s.readScroll, 200); assert.equal(s.phase, PHASE.READING);
  s = scroll(s, 200); assert.equal(s.readScroll, 400);
  assert.equal(cameraFloat(s), 0);
});

test('reaching the end pins; does not travel on the same delta', () => {
  let s = initState();
  s = scroll(s, 5000);
  assert.equal(s.phase, PHASE.READING);
  assert.equal(s.readScroll, CMAX);
});

test('one more scroll past the end begins a travel forward', () => {
  let s = initState();
  s = scroll(s, 5000);     // pin
  s = scroll(s, 100);      // begin travel
  assert.equal(s.phase, PHASE.TRAVELLING);
  assert.equal(s.from, 0); assert.equal(s.to, 1); assert.equal(s.travelT, 0);
});

test('travel is SCROLL-DRIVEN: progress only changes with scroll, not on its own', () => {
  let s = { phase: PHASE.TRAVELLING, cp: 0, readScroll: CMAX, travelT: 0.3, from: 0, to: 1 };
  const same = scroll(s, 0);            // no scroll -> no movement
  assert.equal(same.travelT, 0.3);
  const fwd = scroll(s, 250);           // 250/1000 -> +0.25
  assert.ok(Math.abs(fwd.travelT - 0.55) < 1e-9);
  const back = scroll(s, -100);         // reverse
  assert.ok(Math.abs(back.travelT - 0.2) < 1e-9);
});

test('scrubbing past the end of the path arrives at the next checkpoint', () => {
  let s = { phase: PHASE.TRAVELLING, cp: 0, readScroll: CMAX, travelT: 0.9, from: 0, to: 1 };
  s = scroll(s, 200);  // 0.9 + 0.2 -> >=1
  assert.equal(s.phase, PHASE.READING);
  assert.equal(s.cp, 1);
  assert.equal(s.readScroll, 0);
  assert.equal(cameraFloat(s), 1);
});

test('scrubbing back past the start cancels the travel to where you came from', () => {
  let s = { phase: PHASE.TRAVELLING, cp: 0, readScroll: CMAX, travelT: 0.1, from: 0, to: 1 };
  s = scroll(s, -200); // back below 0 -> cancel to cp0 at end of its content
  assert.equal(s.phase, PHASE.READING);
  assert.equal(s.cp, 0);
  assert.ok(s.readScroll > CMAX); // sentinel; clamped to contentMax by the caller
});

test('reverse travel: scrolling up at the top goes back a checkpoint', () => {
  let s = { phase: PHASE.READING, cp: 1, readScroll: 0, travelT: 0, from: 1, to: 1 };
  s = scroll(s, -50);                 // at top, scroll up -> travel to cp0
  assert.equal(s.phase, PHASE.TRAVELLING);
  assert.equal(s.from, 1); assert.equal(s.to, 0);
  s = scroll(s, -600); s = scroll(s, -600); // scrub the reverse path
  assert.equal(s.phase, PHASE.READING);
  assert.equal(s.cp, 0);
});

test('cannot travel before the first or past the last checkpoint', () => {
  let first = initState();
  first = scroll(first, -300);
  assert.equal(first.phase, PHASE.READING); assert.equal(first.cp, 0);
  let last = applyScroll({ phase: PHASE.READING, cp: COUNT - 1, readScroll: 0, travelT: 0, from: COUNT - 1, to: COUNT - 1 }, 300, 0, COUNT, TLEN);
  assert.equal(last.phase, PHASE.READING); assert.equal(last.cp, COUNT - 1);
});

test('short content (max 0): one scroll down begins travel immediately', () => {
  let s = applyScroll(initState(), 100, 0, COUNT, TLEN);
  assert.equal(s.phase, PHASE.TRAVELLING); assert.equal(s.to, 1);
});

test('easeInOut: 0->0, 1->1, 0.5->0.5, monotonic', () => {
  assert.equal(easeInOut(0), 0); assert.equal(easeInOut(1), 1);
  assert.ok(Math.abs(easeInOut(0.5) - 0.5) < 1e-9);
  assert.ok(easeInOut(0.25) < easeInOut(0.75));
});
