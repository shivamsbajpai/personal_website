# Slice 1 — implementation decisions

- **D1 — Scroll-driven pure state machine (current).** Native page scroll is
  disabled (`body` fixed/overflow hidden); the app intercepts wheel/touch/keys.
  `scene/state.js` is a pure reducer `applyScroll(state, delta, contentMax,
  count, travelLen)`: in READING it scrolls content and pins at the ends; a
  scroll past an end begins a travel; in TRAVELLING the **scroll itself scrubs**
  the camera along the path (nothing moves on its own — stop scrolling and it
  holds). Two phases: `READING` (INFO) / `TRAVELLING` (TRAVEL). Pure → unit
  tested. *(History: started scroll-position-scrubbed → briefly a time-based
  auto-glide → returned to scroll-driven per "make it scrollable, don't move on
  its own", now with content-aware reading + a generous `TRAVEL_LEN`.)*

- **D2 — `cameraFloat` scrubbed along the rail.** `cameraFloat(state)` = `cp`
  while reading, `from + (to-from)*easeInOut(travelT)` while travelling, where
  `travelT` is advanced **by scroll delta / `TRAVEL_LEN`** (≈1100 px to cross a
  gap). Scrolling forward advances, back reverses (past 1 you arrive, below 0 you
  cancel to where you came from). `main.js` interpolates camera vantages by it.

- **D3 — Info mode via a `body.info` class.** Crossing the 0.5 ramp toggles
  `body.info`, which CSS uses to: fade the scope out, dim+blur the canvas
  (`filter: blur brightness`) as a **depth-of-field approximation**, and show the
  active content panel. Real post-process DoF is deferred; the CSS approximation
  is cheap and reads correctly for the tracer.

- **D4 — Face-on screen-space panel (not CSS3D yet).** Slice 1 renders the info
  panel as a centered screen-space HTML element. This matches the agreed info-mode
  behaviour (face-on, stable) and keeps Slice 1 focused; the CSS3D panel mounted
  on a prop's bezel is Slice 2 work. Content is real DOM (a11y/SEO-ready).

- **D5 — Pinned content scroll, decoupled from travel (revised).** `readScroll`
  (px) translates an inner `.panel-scroll`; the panel never scrolls natively.
  Multiple scrolls just move the text. Reaching an end pins there (consuming the
  gesture); only the NEXT scroll past it starts ONE travel — a fast flick lands at
  the end first, so you never fly through by accident. The reading viewport is
  capped (`.panel max-height ≈ 62vh`) so content scrolls meaningfully; short
  sections (Overwatch) travel after little scroll, long ones absorb many.

- **D6 — Mouse look in travel only.** `main.js` applies a bounded mouse offset to
  the camera look target only when `mode === TRAVEL`; info mode locks face-on.

- **D7 — Placeholder markers for props.** Glowing pylon + ground ring at each
  checkpoint anchor stand in for the GLTF observation-post props (Slice 2).

- **D8 — Three.js via pinned CDN import map** (`three@0.161.0`), addons mapped for
  later slices. Vendoring locally is a future-release TODO (per PRD).

- **D9 — Sunny lighting.** ACES tone-map, warm directional sun high and to the
  **side** (raking, not dead-ahead — avoids staring into the sun), lifted
  hemisphere/ambient, graded warm sky dome with a soft sun-scatter halo, bright
  fog — the agreed "sunny daytime, part-of-the-world" bar.

- **D11 — Checkpoints are deserted army outposts (response to feedback).**
  Removed the background buttes/mountains. Each checkpoint is now a graded flat
  **pad** (terrainH blends 95% toward the pad height within a radius so props sit
  on visible flat ground) holding a procedural **army outpost**: tank (hull +
  turret + barrel + tracks), crate stack, sandbag ring, antenna mast + dish, and
  tank-trap hedgehogs — olive-drab/dark-metal materials, laid in a shallow arc
  facing the camera and scaled ~1.5×. The camera vantage is lower/closer and
  centered so the outpost composes in frame; it resolves on approach and sits as
  the dimmed backdrop when docked. The waypoint beacon is now a subtle thin
  locator. **These are procedural stand-ins; Slice 2 swaps in the CC0 GLTF
  military kit.**

- **D10 — Photoreal pass (response to "make the space more real").** Added: real
  directional-light **shadow mapping** (PCFSoft; the shadow frustum follows the
  camera so dune self-shadows stay crisp), **ridged/crested dune** height (base
  fbm + ridged dunes + wind ripples), a procedural **sand bump map** for
  micro-relief, **EffectComposer + UnrealBloom** post pass (tuned low,
  threshold 0.9 — also the pipeline the Slice-1→later DoF reuses), and **distant
  noise-displaced buttes** for scale/depth fading into fog. Mobile scales down
  (lower DPR, 1024 shadow map, lighter bloom).
