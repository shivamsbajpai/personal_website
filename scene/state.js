// RECON optic — pure interaction state machine (scroll-driven).
//
// No DOM / WebGL deps: unit-tested in isolation (tests/state.test.js).
//
// Model
// -----
// Two phases, BOTH driven by scroll input (nothing moves on its own):
//   READING    — docked at a checkpoint; scroll moves the content panel
//                (readScroll px). INFO mode.
//   TRAVELLING — scroll scrubs the camera along the path to the adjacent
//                checkpoint (travelT 0..1 over `travelLen` px of scroll). Stop
//                scrolling and the camera holds mid-desert. TRAVEL mode.
//
// Reaching the end of the content pins there; the next scroll past it begins a
// travel. Scrolling forward scrubs toward the next checkpoint; scrolling back
// reverses — past 1 you arrive, back past 0 you cancel to where you came from.
//
// Arrival lands at the content edge you are moving INTO (forward -> top, read
// down; backward -> end, read up), so a checkpoint is always read in full
// before its pin releases regardless of travel direction.

export const PHASE = { READING: 'READING', TRAVELLING: 'TRAVELLING' };
export const MODE = { TRAVEL: 'TRAVEL', INFO: 'INFO' };

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function initState() {
  return { phase: PHASE.READING, cp: 0, readScroll: 0, travelT: 0, from: 0, to: 0 };
}

/**
 * Apply a scroll/wheel/touch delta.
 * @param {object} state
 * @param {number} delta      px (positive = down/forward)
 * @param {number} contentMax max scroll of the current content (px)
 * @param {number} count      number of checkpoints
 * @param {number} travelLen  px of scroll to traverse one checkpoint gap
 */
export function applyScroll(state, delta, contentMax, count, travelLen) {
  if (state.phase === PHASE.READING) {
    const ns = clamp(state.readScroll + delta, 0, Math.max(0, contentMax));
    if (ns !== state.readScroll) return { ...state, readScroll: ns };
    // pinned at a bound -> begin a travel past it
    if (delta > 0 && state.cp < count - 1) return { ...state, phase: PHASE.TRAVELLING, from: state.cp, to: state.cp + 1, travelT: 0 };
    if (delta < 0 && state.cp > 0) return { ...state, phase: PHASE.TRAVELLING, from: state.cp, to: state.cp - 1, travelT: 0 };
    return state;
  }
  // TRAVELLING — scrub camera along the path (scroll-driven, not timed)
  const forward = state.to > state.from;
  const t = state.travelT + (forward ? delta : -delta) / Math.max(1, travelLen);
  if (t >= 1) {
    // Arrive. Land at the edge the reader is moving INTO so the panel is read
    // in full before the pin releases: forward -> top (read down); backward ->
    // end (read up). The backward sentinel is clamped to the destination's
    // contentMax by the caller (same pattern as the forward-cancel below).
    // Without this, backward arrival at readScroll:0 IS the reverse-travel
    // bound, so one more up-scroll immediately leaves and the checkpoint is
    // flown through with no reading dwell (content never shows).
    const land = forward ? 0 : Number.MAX_SAFE_INTEGER;
    return { phase: PHASE.READING, cp: state.to, readScroll: land, travelT: 0, from: state.to, to: state.to };
  }
  if (t <= 0) {
    // cancelled back to origin: forward-cancel returns to the end of that content
    const back = forward ? Number.MAX_SAFE_INTEGER : 0;
    return { phase: PHASE.READING, cp: state.from, readScroll: back, travelT: 0, from: state.from, to: state.from };
  }
  return { ...state, travelT: t };
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
