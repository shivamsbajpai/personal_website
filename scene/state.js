// RECON optic — pure interaction state machine.
//
// Maps a single scroll position onto the scene state. No DOM / WebGL / Three
// dependencies on purpose: this is the brain of travel<->info, pinning and
// auto-release, and it is unit-tested in isolation (tests/state.test.js).
//
// Scroll budget model
// -------------------
// The journey is a flat sequence of segments driven by window scroll:
//   checkpoint 0:                 [read]            (arrived via the fly-in)
//   checkpoint i (i > 0):  [travel][read]           (fly to it, then read it)
//
//   read   = camera parked at the checkpoint; window scroll drives the
//            content panel's internal scroll (readProgress 0..1).
//   travel = camera flies from the previous checkpoint's vantage to this one
//            (cameraFloat goes (i-1) -> i); mouse look-around is allowed.
//
// Scrolling past the end of a read segment crosses into the next travel
// segment, which is exactly the "scroll past the end auto-releases" behaviour.
// The function is a pure mapping of scrollY, so reverse-scroll is automatically
// reversible.

export const MODE = { TRAVEL: 'TRAVEL', INFO: 'INFO' };

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * Flatten checkpoints into ordered scroll segments.
 * @param {Array<{id?:string, travelLen:number, readLen:number}>} checkpoints
 * @returns {{segs: Array, total: number}}
 */
export function buildSegments(checkpoints) {
  const segs = [];
  let offset = 0;
  checkpoints.forEach((cp, i) => {
    if (i > 0) {
      const len = Math.max(0, cp.travelLen || 0);
      segs.push({ type: 'travel', cp: i, start: offset, len });
      offset += len;
    }
    const rlen = Math.max(0, cp.readLen || 0);
    segs.push({ type: 'read', cp: i, start: offset, len: rlen });
    offset += rlen;
  });
  return { segs, total: offset };
}

/**
 * Compute scene state for a given scroll position.
 * @param {number} scrollY  current window scroll in px
 * @param {Array<{id?:string, travelLen:number, readLen:number}>} checkpoints
 * @returns {{mode:string, activeCheckpoint:number, cameraFloat:number,
 *            readProgress:number, released:boolean, total:number}}
 */
export function computeState(scrollY, checkpoints) {
  if (!checkpoints || checkpoints.length === 0) {
    return { mode: MODE.INFO, activeCheckpoint: 0, cameraFloat: 0, readProgress: 0, released: false, total: 0 };
  }
  const { segs, total } = buildSegments(checkpoints);
  const y = clamp(scrollY, 0, total);

  // First segment whose end is beyond y; else the last one (covers y === total).
  let seg = segs[segs.length - 1];
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    if (y < s.start + s.len) { seg = s; break; }
  }

  const local = seg.len > 0 ? clamp((y - seg.start) / seg.len, 0, 1) : 1;

  if (seg.type === 'read') {
    return {
      mode: MODE.INFO,
      activeCheckpoint: seg.cp,
      cameraFloat: seg.cp,
      readProgress: local,
      released: false,
      total,
    };
  }
  // travel: approaching seg.cp from the previous checkpoint
  return {
    mode: MODE.TRAVEL,
    activeCheckpoint: seg.cp,
    cameraFloat: (seg.cp - 1) + local,
    readProgress: 0,
    released: true,
    total,
  };
}
