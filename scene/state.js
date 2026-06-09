// RECON optic — pure interaction state machine (scroll-driven).
//
// No DOM / WebGL deps: unit-tested in isolation (tests/state.test.js).
//
// Model
// -----
// Two phases, BOTH driven by scroll input (nothing moves on its own):
//   READING    — docked at a checkpoint; scroll moves the content panel
//                (readScroll px). INFO mode.
//   TRAVELLING — each *stroke* (one swipe / wheel burst / keypress, grouped
//                by the caller) advances the camera 1/TRAVEL_STEPS of the
//                gap. Stop stroking and the camera holds mid-desert. TRAVEL
//                mode.
//
// Input arrives on two channels (the caller groups raw events into strokes):
//   applyScroll()   — live px deltas; ONLY move the content while reading.
//   commitStroke()  — once per stroke; drives friction and travel.
//
// Boundary friction keeps content in focus (people were skimming straight
// across the map when one px past the end released the pin):
//   settle — set to SETTLE_TAPS on scroll-travel arrival; while > 0 every
//            stroke is absorbed whole (leftover swipe-spam from travelling
//            must not scroll the freshly docked panel). Settle strokes also
//            count toward `arm`, so backing straight out after arrival
//            costs the same 2 absorbed strokes, not 4.
//   arm    — strokes absorbed at a pinned content edge before the next push
//            releases into travel; any stroke that moves content re-arms.
//            Reading inside the content is always frictionless.
//
// Travel takes exactly TRAVEL_STEPS strokes per gap (the releasing push is
// step 1). A reverse stroke steps back; past 0 cancels to where you came
// from. Arrival lands at the content edge you are moving INTO (forward ->
// top, read down; backward -> end, read up), so a checkpoint is always read
// in full before its pin releases regardless of travel direction.

export const PHASE = { READING: 'READING', TRAVELLING: 'TRAVELLING' };
export const MODE = { TRAVEL: 'TRAVEL', INFO: 'INFO' };

export const TRAVEL_STEPS = 3;  // strokes to cross one checkpoint gap
export const EDGE_TAPS = 2;     // absorbed strokes before a pinned edge releases
export const SETTLE_TAPS = 2;   // strokes absorbed whole after a scroll-travel arrival
export const PIN_SLOP = 4;      // px within which an edge counts as pinned — contentMax
                                // is a live DOM measurement and jitters a few px
                                // (animations, font loads, mobile URL-bar resize)

const EPS = 1e-9;               // 1/3 accumulates to 0.999…; never compare to 1 exactly
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function initState() {
  // Boot is not an arrival (no swipe momentum to soak up): hero is
  // immediately scrollable, but leaving it still costs EDGE_TAPS pushes (D4).
  return { phase: PHASE.READING, cp: 0, readScroll: 0, travelT: 0, from: 0, to: 0, settle: 0, arm: EDGE_TAPS };
}

/**
 * Live scroll/wheel/touch delta — content reading only. Travel no longer
 * scrubs by px (strokes drive it, see commitStroke), and a settling panel
 * stays frozen under the spam that delivered the reader here.
 * @param {number} delta      px (positive = down/forward)
 * @param {number} contentMax max scroll of the current content (px)
 */
export function applyScroll(state, delta, contentMax) {
  if (state.auto || state.phase !== PHASE.READING || state.settle > 0) return state;
  const ns = clamp(state.readScroll + delta, 0, Math.max(0, contentMax));
  return ns === state.readScroll ? state : { ...state, readScroll: ns };
}

/**
 * Commit one stroke (the caller groups raw events: one touch swipe, one
 * wheel burst, one keypress).
 * @param {number}  dir        stroke direction: +1 down/forward, -1 up/back
 * @param {boolean} moved      did this stroke's live deltas move the content?
 * @param {number}  contentMax max scroll of the current content (px)
 * @param {number}  count      number of checkpoints
 */
export function commitStroke(state, dir, moved, contentMax, count) {
  if (state.auto || !dir) return state;   // fast-travel completes; scroll is ignored mid-flight (DT1)
  if (state.phase === PHASE.TRAVELLING) {
    const forward = state.to > state.from;
    const t = state.travelT + (forward ? dir : -dir) / TRAVEL_STEPS;
    if (t >= 1 - EPS) {
      // Arrive. Land at the edge the reader is moving INTO so the panel is
      // read in full before the pin releases: forward -> top (read down);
      // backward -> end (read up). The backward sentinel is clamped to the
      // destination's contentMax by the caller (same pattern as the
      // forward-cancel below). Without this, backward arrival at
      // readScroll:0 IS the reverse-travel bound, so one more up-scroll
      // immediately leaves and the checkpoint is flown through with no
      // reading dwell (content never shows).
      const land = forward ? 0 : Number.MAX_SAFE_INTEGER;
      return { phase: PHASE.READING, cp: state.to, readScroll: land, travelT: 0, from: state.to, to: state.to, settle: SETTLE_TAPS, arm: EDGE_TAPS };
    }
    if (t <= EPS) {
      // Cancelled back to origin: forward-cancel returns to the end of that
      // content. No settle (the reader chose to come back, not spam-arrived);
      // re-leaving re-arms like any other edge push.
      const back = forward ? Number.MAX_SAFE_INTEGER : 0;
      return { phase: PHASE.READING, cp: state.from, readScroll: back, travelT: 0, from: state.from, to: state.from, settle: 0, arm: EDGE_TAPS };
    }
    return { ...state, travelT: t };
  }
  // READING
  if (state.settle > 0) return { ...state, settle: state.settle - 1, arm: Math.max(0, state.arm - 1) };
  if (moved) return state.arm === EDGE_TAPS ? state : { ...state, arm: EDGE_TAPS };
  // Unmoved stroke pushing past a pinned edge: absorb EDGE_TAPS of them,
  // then release — the releasing push is travel stroke 1 of TRAVEL_STEPS.
  const max = Math.max(0, contentMax);
  const pushOut = (dir > 0 && state.readScroll >= max - PIN_SLOP && state.cp < count - 1)
    || (dir < 0 && state.readScroll <= PIN_SLOP && state.cp > 0);
  if (!pushOut) return state;
  if (state.arm > 0) return { ...state, arm: state.arm - 1 };
  return { ...state, phase: PHASE.TRAVELLING, from: state.cp, to: state.cp + dir, travelT: 1 / TRAVEL_STEPS, arm: EDGE_TAPS };
}

/** Continuous camera position along the checkpoint rail. Travel is LINEAR in
 *  scroll (speed proportional to scroll, no mid-gap surge); the renderer's
 *  low-pass smooths acceleration at scroll start/stop. */
export function cameraFloat(state) {
  if (state.phase === PHASE.READING) return state.cp;
  return state.from + (state.to - state.from) * state.travelT;
}

export function modeOf(state) {
  return state.phase === PHASE.TRAVELLING ? MODE.TRAVEL : MODE.INFO;
}

/**
 * Slice 4 — fly-in progress gating (pure).
 * Time eases the cinematic sweep, but the final approach (the last 15% of the
 * path) is gated on real asset progress, so the camera settles onto Overwatch
 * exactly when loading completes: fast connections get a purely time-shaped
 * flight; slow ones hang on the approach instead of landing early.
 * @param {number} timeFrac  elapsed / planned duration (unclamped ok)
 * @param {number} assetFrac loaded assets / total (unclamped ok)
 * @returns {number} path progress in [0, 1]; 1 only when both inputs are >= 1
 */
export function flyProgress(timeFrac, assetFrac) {
  const t = clamp(timeFrac, 0, 1), a = clamp(assetFrac, 0, 1);
  return Math.min(easeInOut(t), 0.85 + 0.15 * a);
}

/* ---------------------------------------------------------------------------
   Slice 5 — fast-travel (pure, DT1). A deliberate jump to any checkpoint:
   startFastTravel() begins an `auto` TRAVELLING leg from the current camera
   float toward the (clamped) target; the render loop time-ticks it with
   tickAutoTravel(). It reuses the whole TRAVELLING pipeline (vantage lerp,
   HUD, holo fades, dock-into-INFO), and lands at the TOP of the target's
   content — correct for navigation in either direction (the read-up-on-
   reverse rule protects scroll-through, not deliberate jumps). While `auto`
   is set, applyScroll ignores input (see guard above). */

/**
 * @param {object} state  current state
 * @param {number} target checkpoint index (clamped to [0, count-1])
 * @param {number} count  number of checkpoints
 * @returns a new auto-TRAVELLING state, or the input state if already docked there
 */
export function startFastTravel(state, target, count) {
  const to = clamp(Math.round(target), 0, count - 1);
  const from = cameraFloat(state);
  if (state.phase === PHASE.READING && state.cp === to) return state;   // already docked there
  return { phase: PHASE.TRAVELLING, cp: state.cp, readScroll: 0, from, to, travelT: 0, auto: true, settle: 0, arm: EDGE_TAPS };
}

/**
 * Advance an auto leg by dt ms. Duration scales sub-linearly with distance
 * (500ms + 450ms per gap), so cross-map jumps stay brisk.
 * No-op for non-auto states.
 */
export function tickAutoTravel(state, dt) {
  if (!state.auto || state.phase !== PHASE.TRAVELLING) return state;
  const durMs = 500 + 450 * Math.abs(state.to - state.from);
  const t = state.travelT + dt / Math.max(1, durMs);
  // A deliberate jump lands immediately readable: no settle (that gate soaks
  // up leftover travel-swipe momentum, which a palette click doesn't have).
  if (t >= 1) return { phase: PHASE.READING, cp: state.to, readScroll: 0, travelT: 0, from: state.to, to: state.to, settle: 0, arm: EDGE_TAPS };
  return { ...state, travelT: t };
}
