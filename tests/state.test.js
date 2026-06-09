// Unit tests for the RECON optic state machine (Seam 1) — stroke-driven.
// Run: node --test
//
// Cadence under test (task 008 / #23): reading is live px (applyScroll);
// friction and travel are per-stroke (commitStroke). A gap = TRAVEL_STEPS
// strokes; a pinned edge releases after EDGE_TAPS absorbed pushes; an
// arrival absorbs SETTLE_TAPS strokes whole.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  initState, applyScroll, commitStroke, cameraFloat, modeOf, easeInOut,
  PHASE, MODE, TRAVEL_STEPS, EDGE_TAPS, SETTLE_TAPS,
} from '../scene/state.js';

const COUNT = 3;
const CMAX = 600;     // current content scroll height
const scroll = (s, d) => applyScroll(s, d, CMAX);
// one whole stroke: live delta then commit. "Moved" mirrors main.js: cumulative
// panel movement beyond a few px of slop (DOM measurement jitter must not count).
const MOVE_SLOP = 3;
const stroke = (s, d, cmax = CMAX) => {
  const after = applyScroll(s, d, cmax);
  return commitStroke(after, Math.sign(d), Math.abs(after.readScroll - s.readScroll) > MOVE_SLOP, cmax, COUNT);
};
// drive a docked state to the pinned edge + through the EDGE_TAPS gate +
// across the gap; returns the freshly arrived state
const clampSentinel = (s, cmax = CMAX) => (s.readScroll > cmax ? { ...s, readScroll: cmax } : s);

test('initial state: reading checkpoint 0 at top, no settle, edge armed', () => {
  const s = initState();
  assert.equal(s.phase, PHASE.READING);
  assert.equal(s.cp, 0);
  assert.equal(s.settle, 0, 'boot is not an arrival — content scrollable immediately');
  assert.equal(s.arm, EDGE_TAPS);
  assert.equal(modeOf(s), MODE.INFO);
  assert.equal(cameraFloat(s), 0);
});

test('reading is frictionless: live deltas move readScroll, camera parked', () => {
  let s = initState();
  s = scroll(s, 200); assert.equal(s.readScroll, 200); assert.equal(s.phase, PHASE.READING);
  s = scroll(s, 200); assert.equal(s.readScroll, 400);
  assert.equal(cameraFloat(s), 0);
});

test('reaching the end pins; the pin does NOT release on the same stroke', () => {
  let s = initState();
  s = stroke(s, 5000);   // moved content to the pin — counts as a moving stroke
  assert.equal(s.phase, PHASE.READING);
  assert.equal(s.readScroll, CMAX);
  assert.equal(s.arm, EDGE_TAPS, 'a moving stroke never decrements the gate');
});

test('pinned edge releases only after EDGE_TAPS absorbed pushes', () => {
  let s = stroke(initState(), 5000);             // pinned at the end
  for (let i = 1; i <= EDGE_TAPS; i++) {
    s = stroke(s, 100);
    assert.equal(s.phase, PHASE.READING, `push ${i} absorbed`);
    assert.equal(s.readScroll, CMAX, 'absorbed pushes do not move content');
    assert.equal(s.arm, EDGE_TAPS - i);
  }
  s = stroke(s, 100);                            // the releasing push
  assert.equal(s.phase, PHASE.TRAVELLING);
  assert.equal(s.from, 0); assert.equal(s.to, 1);
  assert.ok(Math.abs(s.travelT - 1 / TRAVEL_STEPS) < 1e-9, 'release IS travel stroke 1');
});

test('moving back into content re-arms the edge gate', () => {
  let s = stroke(initState(), 5000);   // pinned
  s = stroke(s, 100);                  // absorb one push (arm: EDGE_TAPS-1)
  s = stroke(s, -50);                  // read back up — moving stroke
  assert.equal(s.arm, EDGE_TAPS, 're-armed by movement');
  s = stroke(s, 50);                   // back to the pin (moving stroke)
  for (let i = 0; i < EDGE_TAPS; i++) s = stroke(s, 100);
  assert.equal(s.phase, PHASE.READING, 'full gate again after re-arm');
  s = stroke(s, 100);
  assert.equal(s.phase, PHASE.TRAVELLING);
});

test('a gap takes exactly TRAVEL_STEPS strokes; arrival settles at the top', () => {
  let s = stroke(initState(), 5000);
  for (let i = 0; i < EDGE_TAPS; i++) s = stroke(s, 100);
  s = stroke(s, 100);                  // travel stroke 1
  for (let i = 2; i <= TRAVEL_STEPS; i++) {
    assert.equal(s.phase, PHASE.TRAVELLING, `still travelling before stroke ${i}`);
    s = stroke(s, 100);
  }
  assert.equal(s.phase, PHASE.READING);
  assert.equal(s.cp, 1);
  assert.equal(s.readScroll, 0, 'forward arrival lands at the TOP (read down)');
  assert.equal(s.settle, SETTLE_TAPS);
  assert.equal(cameraFloat(s), 1);
});

test('travel is stroke-driven: live deltas do not scrub the camera', () => {
  const s = { ...initState(), phase: PHASE.TRAVELLING, cp: 0, travelT: 1 / 3, from: 0, to: 1 };
  assert.equal(applyScroll(s, 800, CMAX), s, 'px deltas are inert mid-travel');
  const back = commitStroke(s, -1, false, CMAX, COUNT);
  assert.equal(back.phase, PHASE.READING, 'a reverse stroke from step 1 cancels');
});

test('after arrival, SETTLE_TAPS strokes are absorbed whole (spam guard)', () => {
  let s = { phase: PHASE.TRAVELLING, cp: 0, readScroll: 0, travelT: 2 / 3, from: 0, to: 1, settle: 0, arm: 0 };
  s = commitStroke(s, 1, false, CMAX, COUNT);    // arrive
  assert.equal(s.cp, 1); assert.equal(s.settle, SETTLE_TAPS);
  for (let i = 1; i <= SETTLE_TAPS; i++) {
    assert.equal(applyScroll(s, 300, CMAX), s, 'frozen while settling');
    s = commitStroke(s, 1, false, CMAX, COUNT);
    assert.equal(s.readScroll, 0, `settle stroke ${i} did not scroll the panel`);
  }
  s = scroll(s, 300);
  assert.equal(s.readScroll, 300, 'reading resumes after the settle');
});

test('settle strokes count toward arm: backing out after arrival costs SETTLE_TAPS, not SETTLE_TAPS + EDGE_TAPS', () => {
  let s = { phase: PHASE.TRAVELLING, cp: 0, readScroll: 0, travelT: 2 / 3, from: 0, to: 1, settle: 0, arm: 0 };
  s = commitStroke(s, 1, false, CMAX, COUNT);    // arrive cp1, settle/arm fully charged
  const absorbed = Math.max(SETTLE_TAPS, EDGE_TAPS);   // settle AND arm drain together
  for (let i = 0; i < absorbed; i++) {
    s = stroke(s, -100);
    assert.equal(s.phase, PHASE.READING, `back-out stroke ${i + 1} absorbed`);
  }
  s = stroke(s, -100);                           // released back toward cp0
  assert.equal(s.phase, PHASE.TRAVELLING);
  assert.equal(s.to, 0);
});

test('backward arrival lands at the END of the content (read up), not the top', () => {
  let s = { phase: PHASE.TRAVELLING, cp: 2, readScroll: 0, travelT: 2 / 3, from: 2, to: 1, settle: 0, arm: 0 };
  s = commitStroke(s, -1, false, CMAX, COUNT);
  assert.equal(s.phase, PHASE.READING);
  assert.equal(s.cp, 1);
  assert.ok(s.readScroll > CMAX, 'end-of-content sentinel, NOT 0 (caller clamps)');
  assert.equal(s.settle, SETTLE_TAPS);
});

test('reversing through a middle checkpoint does NOT fly through it', () => {
  // Regression: arriving backward must require reading up through the full
  // content + the edge gate before the pin releases toward cp0.
  let s = { phase: PHASE.TRAVELLING, cp: 2, readScroll: 0, travelT: 2 / 3, from: 2, to: 1, settle: 0, arm: 0 };
  s = clampSentinel(commitStroke(s, -1, false, CMAX, COUNT));   // arrive cp1 at the END
  for (let i = 0; i < SETTLE_TAPS; i++) s = stroke(s, -100);    // settle absorbed
  assert.equal(s.readScroll, CMAX, 'parked at the END of cp1');
  s = stroke(s, -200);
  assert.deepEqual([s.phase, s.cp, s.readScroll], [PHASE.READING, 1, CMAX - 200], 'reads, does not leave');
  s = stroke(s, -CMAX);                                         // to the top (moving)
  for (let i = 0; i < EDGE_TAPS; i++) s = stroke(s, -100);      // top gate
  assert.equal(s.phase, PHASE.READING, 'top edge also gated');
  s = stroke(s, -100);
  assert.equal(s.phase, PHASE.TRAVELLING);
  assert.equal(s.from, 1); assert.equal(s.to, 0);
});

test('mid-travel reverse strokes scrub back; past the start cancels to origin', () => {
  let s = { phase: PHASE.TRAVELLING, cp: 0, readScroll: CMAX, travelT: 2 / 3, from: 0, to: 1, settle: 0, arm: 0 };
  s = commitStroke(s, -1, false, CMAX, COUNT);
  assert.ok(Math.abs(s.travelT - 1 / 3) < 1e-9);
  s = commitStroke(s, -1, false, CMAX, COUNT);   // back past 0 -> cancel
  assert.equal(s.phase, PHASE.READING);
  assert.equal(s.cp, 0);
  assert.ok(s.readScroll > CMAX, 'forward-cancel returns to the END sentinel');
  assert.equal(s.settle, 0, 'cancel is deliberate — no settle freeze');
  assert.equal(s.arm, EDGE_TAPS, 're-leaving requires re-arming');
});

test('cannot travel before the first or past the last checkpoint', () => {
  let first = initState();
  for (let i = 0; i < EDGE_TAPS + 2; i++) first = stroke(first, -300);
  assert.equal(first.phase, PHASE.READING); assert.equal(first.cp, 0);
  let last = { phase: PHASE.READING, cp: COUNT - 1, readScroll: 0, travelT: 0, from: COUNT - 1, to: COUNT - 1, settle: 0, arm: 0 };
  last = commitStroke(last, 1, false, 0, COUNT);
  assert.equal(last.phase, PHASE.READING); assert.equal(last.cp, COUNT - 1);
});

test('short content (max 0): both edges pinned, gate still applies, dir picks the way', () => {
  let s = initState();   // arm = EDGE_TAPS
  for (let i = 0; i < EDGE_TAPS; i++) {
    s = stroke(s, 100, 0);
    assert.equal(s.phase, PHASE.READING, `push ${i + 1} absorbed`);
  }
  s = stroke(s, 100, 0);
  assert.equal(s.phase, PHASE.TRAVELLING); assert.equal(s.to, 1);
});

test('contentMax jitter (±2px) neither re-arms nor unpins the edge gate', () => {
  // Regression: contentMax is a live DOM measurement (animations, font loads,
  // mobile URL-bar resize). A grown max lets a push "move" 1-2px — that must
  // still count as a pinned push, or spam at the edge re-arms forever.
  let s = stroke(initState(), 5000);            // pinned at CMAX, fully armed
  const jitter = (i) => CMAX + [2, -2, 1][i % 3];   // max grows/shrinks a couple px per push
  for (let i = 0; i < EDGE_TAPS; i++) {
    // when max shrinks, the render loop clamps readScroll every frame (caller contract)
    s = { ...s, readScroll: Math.min(s.readScroll, jitter(i)) };
    s = stroke(s, 100, jitter(i));
    assert.equal(s.arm, EDGE_TAPS - 1 - i, 'jitter movement did not re-arm');
    assert.equal(s.phase, PHASE.READING);
  }
  s = { ...s, readScroll: Math.min(s.readScroll, jitter(EDGE_TAPS)) };
  s = stroke(s, 100, jitter(EDGE_TAPS));
  assert.equal(s.phase, PHASE.TRAVELLING, 'gate released despite jitter');
});

test('easeInOut: 0->0, 1->1, 0.5->0.5, monotonic', () => {
  assert.equal(easeInOut(0), 0); assert.equal(easeInOut(1), 1);
  assert.ok(Math.abs(easeInOut(0.5) - 0.5) < 1e-9);
  assert.ok(easeInOut(0.25) < easeInOut(0.75));
});
