// Unit tests for fast-travel (Slice 5, DT1) — pure auto-travel legs.
// Run: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initState, applyScroll, commitStroke, startFastTravel, tickAutoTravel, cameraFloat, modeOf, PHASE, MODE } from '../scene/state.js';

const COUNT = 5;
const tick = (s, ms) => tickAutoTravel(s, ms);

test('startFastTravel begins an auto TRAVELLING leg toward the target', () => {
  const s = startFastTravel(initState(), 3, COUNT);
  assert.equal(s.phase, PHASE.TRAVELLING);
  assert.equal(s.auto, true);
  assert.equal(s.from, 0);
  assert.equal(s.to, 3);
  assert.equal(modeOf(s), MODE.TRAVEL);
});

test('target is clamped and rounded to a valid checkpoint', () => {
  assert.equal(startFastTravel(initState(), 99, COUNT).to, COUNT - 1);
  assert.equal(startFastTravel({ ...initState(), cp: 2, from: 2, to: 2 }, -5, COUNT).to, 0);
  assert.equal(startFastTravel(initState(), 2.4, COUNT).to, 2);
});

test('no-op when already docked at the target', () => {
  const s = initState();
  assert.equal(startFastTravel(s, 0, COUNT), s);
});

test('ticking advances the camera and arrives READING at the top', () => {
  let s = startFastTravel(initState(), 2, COUNT);
  s = tick(s, 300);
  assert.equal(s.phase, PHASE.TRAVELLING);
  assert.ok(cameraFloat(s) > 0 && cameraFloat(s) < 2);
  s = tick(s, 60000);   // plenty
  assert.equal(s.phase, PHASE.READING);
  assert.equal(s.cp, 2);
  assert.equal(s.readScroll, 0, 'deliberate jumps land at the TOP in either direction');
  assert.equal(s.auto, undefined);
});

test('backward jumps also land at the top (navigation, not scroll-through)', () => {
  let s = { phase: PHASE.READING, cp: 4, readScroll: 750, travelT: 0, from: 4, to: 4 };
  s = startFastTravel(s, 1, COUNT);
  assert.equal(s.from, 4); assert.equal(s.to, 1);
  s = tick(s, 60000);
  assert.deepEqual([s.phase, s.cp, s.readScroll], [PHASE.READING, 1, 0]);
});

test('duration scales with distance: same dt moves a short hop further along', () => {
  const near = tick(startFastTravel(initState(), 1, COUNT), 400);
  const far = tick(startFastTravel(initState(), 4, COUNT), 400);
  assert.ok(near.travelT > far.travelT);
});

test('scroll input is ignored while an auto leg is in flight', () => {
  const s = tick(startFastTravel(initState(), 3, COUNT), 200);
  assert.equal(applyScroll(s, 500, 600), s);
  assert.equal(commitStroke(s, 1, false, 600, COUNT), s);
});

test('a fast-travel started mid-scroll-travel departs from the current float', () => {
  // mid-gap state as the stroke cadence produces it (one stroke past the gate)
  const s = { phase: PHASE.TRAVELLING, cp: 0, readScroll: 0, travelT: 1 / 3, from: 0, to: 1, settle: 0, arm: 2 };
  const float = cameraFloat(s);
  const ft = startFastTravel(s, 4, COUNT);
  assert.equal(ft.from, float);
  assert.equal(ft.to, 4);
});

test('tickAutoTravel is a no-op for non-auto states', () => {
  const s = initState();
  assert.equal(tickAutoTravel(s, 500), s);
  const scrub = { ...s, phase: PHASE.TRAVELLING, travelT: 1 / 3, from: 0, to: 1 };
  assert.equal(tickAutoTravel(scrub, 500), scrub);
});
