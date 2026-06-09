// Unit tests for the RECON optic state machine (Seam 1).
// Run: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeState, buildSegments, MODE } from '../scene/state.js';

// 3 placeholder checkpoints: cp0 read-only (fly-in arrival), then travel+read.
const CFG = [
  { id: 'overwatch', travelLen: 0,   readLen: 1000 },
  { id: 'alpha',     travelLen: 600, readLen: 1000 },
  { id: 'bravo',     travelLen: 600, readLen: 1000 },
];
// segments: read0[0,1000) travel1[1000,1600) read1[1600,2600) travel2[2600,3200) read2[3200,4200)

test('buildSegments computes total budget and ordered segments', () => {
  const { segs, total } = buildSegments(CFG);
  assert.equal(total, 1000 + 600 + 1000 + 600 + 1000);
  assert.deepEqual(segs.map(s => s.type), ['read', 'travel', 'read', 'travel', 'read']);
  assert.deepEqual(segs.map(s => s.cp), [0, 1, 2]
    .flatMap((c, i) => i === 0 ? [0] : [c, c])); // [0,1,1,2,2]
});

test('top of page: docked at checkpoint 0 in INFO mode', () => {
  const s = computeState(0, CFG);
  assert.equal(s.mode, MODE.INFO);
  assert.equal(s.activeCheckpoint, 0);
  assert.equal(s.cameraFloat, 0);
  assert.equal(s.readProgress, 0);
  assert.equal(s.released, false);
});

test('mid read0: readProgress advances, still parked at cp0', () => {
  const s = computeState(500, CFG);
  assert.equal(s.mode, MODE.INFO);
  assert.equal(s.activeCheckpoint, 0);
  assert.equal(s.cameraFloat, 0);
  assert.ok(Math.abs(s.readProgress - 0.5) < 1e-9);
});

test('just before end of read0: still INFO at cp0, readProgress ~1', () => {
  const s = computeState(999, CFG);
  assert.equal(s.mode, MODE.INFO);
  assert.equal(s.activeCheckpoint, 0);
  assert.ok(s.readProgress > 0.99);
});

test('entering travel1: flips to TRAVEL, camera interpolates 0->1', () => {
  const s = computeState(1300, CFG); // 300/600 into travel1
  assert.equal(s.mode, MODE.TRAVEL);
  assert.equal(s.activeCheckpoint, 1);
  assert.equal(s.released, true);
  assert.ok(Math.abs(s.cameraFloat - 0.5) < 1e-9);
  assert.equal(s.readProgress, 0);
});

test('end of travel1 == start of read1: docked at cp1', () => {
  const s = computeState(1600, CFG);
  assert.equal(s.mode, MODE.INFO);
  assert.equal(s.activeCheckpoint, 1);
  assert.equal(s.cameraFloat, 1);
  assert.equal(s.readProgress, 0);
});

test('cameraFloat is continuous across the read0->travel1 boundary', () => {
  const before = computeState(1000 - 1, CFG); // end of read0
  const after = computeState(1000 + 1, CFG);  // start of travel1
  assert.ok(before.cameraFloat <= 0.001);
  assert.ok(after.cameraFloat <= 0.01);
});

test('reverse-scroll is reversible: same y yields same state', () => {
  const a = computeState(1300, CFG);
  const b = computeState(1300, CFG);
  assert.deepEqual(a, b);
  // and moving back to read0 returns to INFO cp0
  const back = computeState(400, CFG);
  assert.equal(back.mode, MODE.INFO);
  assert.equal(back.activeCheckpoint, 0);
});

test('past the end clamps to last checkpoint, INFO, readProgress 1', () => {
  const s = computeState(99999, CFG);
  assert.equal(s.mode, MODE.INFO);
  assert.equal(s.activeCheckpoint, 2);
  assert.equal(s.readProgress, 1);
});

test('negative scroll clamps to top', () => {
  const s = computeState(-500, CFG);
  assert.equal(s.mode, MODE.INFO);
  assert.equal(s.activeCheckpoint, 0);
  assert.equal(s.readProgress, 0);
});

test('empty config is handled safely', () => {
  const s = computeState(100, []);
  assert.equal(s.activeCheckpoint, 0);
  assert.equal(s.total, 0);
});
