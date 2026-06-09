// RECON optic — pure interaction state machine (event-driven).
//
// No DOM / WebGL deps: this is the brain of reading vs travelling, and it is
// unit-tested in isolation (tests/state.test.js).
//
// Model
// -----
// Two phases:
//   READING    — docked at a checkpoint; scroll input drives the content panel's
//                internal scroll (readScroll px), camera is parked. INFO mode.
//   TRAVELLING — a single time-based eased glide from one checkpoint to the next;
//                scroll input is LOCKED until arrival. TRAVEL mode.
//
// A scroll delta while READING scrolls the content. Reaching either end *pins*
// at that bound (consuming the gesture); the NEXT scroll past that bound starts
// one travel to the adjacent checkpoint. So a fast flick can't accidentally fly
// through — you land at the end first, then one more scroll travels. Travel is a
// single eased animation, not scrubbed, so its speed is controlled by duration.

export const PHASE = { READING: 'READING', TRAVELLING: 'TRAVELLING' };
export const MODE = { TRAVEL: 'TRAVEL', INFO: 'INFO' };

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function initState() {
  return { phase: PHASE.READING, cp: 0, readScroll: 0, travelT: 0, from: 0, to: 0 };
}

/**
 * Apply a scroll/wheel/touch delta. While READING, scrolls content; pins at the
 * ends; a scroll past an end begins a travel. Ignored while TRAVELLING (locked).
 * @param {object} state
 * @param {number} delta   px (positive = down/forward)
 * @param {number} contentMax  max scroll of the current content (px); 0 if it fits
 * @param {number} count   number of checkpoints
 */
export function applyScroll(state, delta, contentMax, count) {
  if (state.phase === PHASE.TRAVELLING) return state;
  const ns = clamp(state.readScroll + delta, 0, Math.max(0, contentMax));
  if (ns !== state.readScroll) return { ...state, readScroll: ns };
  // already pinned at a bound -> maybe begin one travel
  if (delta > 0 && state.cp < count - 1) {
    return { ...state, phase: PHASE.TRAVELLING, travelT: 0, from: state.cp, to: state.cp + 1 };
  }
  if (delta < 0 && state.cp > 0) {
    return { ...state, phase: PHASE.TRAVELLING, travelT: 0, from: state.cp, to: state.cp - 1 };
  }
  return state; // first/last bound: nowhere to go
}

/**
 * Advance an in-progress travel by dt ms over durationMs. On completion, dock at
 * the target checkpoint at the top of its content.
 */
export function advanceTravel(state, dt, durationMs) {
  if (state.phase !== PHASE.TRAVELLING) return state;
  const t = state.travelT + dt / Math.max(1, durationMs);
  if (t >= 1) {
    return { phase: PHASE.READING, cp: state.to, readScroll: 0, travelT: 0, from: state.to, to: state.to };
  }
  return { ...state, travelT: t };
}

/** Continuous camera position along the checkpoint rail (eased during travel). */
export function cameraFloat(state) {
  if (state.phase === PHASE.READING) return state.cp;
  return state.from + (state.to - state.from) * easeInOut(state.travelT);
}

export function modeOf(state) {
  return state.phase === PHASE.TRAVELLING ? MODE.TRAVEL : MODE.INFO;
}
