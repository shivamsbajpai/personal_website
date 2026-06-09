// Unit tests for the fly-in progress gate (Slice 4, DF2).
// Run: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { flyProgress, easeInOut } from '../scene/state.js';

test('clamps both inputs: never below 0 or above 1', () => {
  assert.equal(flyProgress(-5, -5), 0);
  assert.equal(flyProgress(99, 99), 1);
});

test('lands (=== 1) only when BOTH time and assets are complete', () => {
  assert.equal(flyProgress(1, 1), 1);
  assert.ok(flyProgress(1, 0.99) < 1, 'time done, assets not: no landing');
  assert.ok(flyProgress(0.99, 1) < 1, 'assets done, time not: no landing');
});

test('time alone carries the sweep to at most 85%', () => {
  assert.equal(flyProgress(1, 0), 0.85);
  for (const t of [0.2, 0.5, 0.8, 1]) assert.ok(flyProgress(t, 0) <= 0.85);
});

test('early in the flight, progress is purely time-shaped (assets irrelevant)', () => {
  for (const t of [0.1, 0.3, 0.5]) {
    assert.equal(flyProgress(t, 0), easeInOut(t));
    assert.equal(flyProgress(t, 1), easeInOut(t));
  }
});

test('asset progress releases the approach proportionally', () => {
  assert.equal(flyProgress(1, 0.5), 0.85 + 0.15 * 0.5);
  assert.equal(flyProgress(1, 0.2), 0.88);
});

test('monotonic: never decreases as time or assets advance', () => {
  let prev = -1;
  for (let t = 0; t <= 1.001; t += 0.05) {
    const p = flyProgress(t, 0.4);
    assert.ok(p >= prev, `time monotonicity broke at t=${t}`);
    prev = p;
  }
  prev = -1;
  for (let a = 0; a <= 1.001; a += 0.05) {
    const p = flyProgress(1, a);
    assert.ok(p >= prev, `asset monotonicity broke at a=${a}`);
    prev = p;
  }
});
