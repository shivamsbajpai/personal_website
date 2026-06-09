# Slice 1 — implementation decisions

- **D1 — Single scroll driver + pure state machine.** Window scroll is the only
  input. `scene/state.js#computeState(scrollY, checkpoints)` returns
  `{ mode, activeCheckpoint, cameraFloat, readProgress, released, total }`.
  Choice: keep it pure (no DOM/Three) so it is unit-testable in isolation.
  Segments are `read0, travel1, read1, travel2, read2, …`; each checkpoint owns a
  `travelLen`/`readLen` px budget. Page height = `total + innerHeight` via a
  spacer div.

- **D2 — `cameraFloat` instead of explicit dock state.** The machine emits a
  continuous `cameraFloat` (read i → i; travel i → (i-1)+t). `main.js`
  interpolates camera vantages by it, so travel/dock motion is one smooth lerp.
  Continuity across the read→travel boundary is asserted in tests.

- **D3 — Info mode via a `body.info` class.** Crossing the 0.5 ramp toggles
  `body.info`, which CSS uses to: fade the scope out, dim+blur the canvas
  (`filter: blur brightness`) as a **depth-of-field approximation**, and show the
  active content panel. Real post-process DoF is deferred; the CSS approximation
  is cheap and reads correctly for the tracer.

- **D4 — Face-on screen-space panel (not CSS3D yet).** Slice 1 renders the info
  panel as a centered screen-space HTML element. This matches the agreed info-mode
  behaviour (face-on, stable) and keeps Slice 1 focused; the CSS3D panel mounted
  on a prop's bezel is Slice 2 work. Content is real DOM (a11y/SEO-ready).

- **D5 — Pinned content scroll via transform.** `readProgress` translates an
  inner `.panel-scroll` by `-readProgress * (contentH - bodyH)`; window scroll is
  the driver, the panel never scrolls independently. Running out of content =
  readProgress 1 = next scroll crosses into travel (auto-release).

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

- **D10 — Photoreal pass (response to "make the space more real").** Added: real
  directional-light **shadow mapping** (PCFSoft; the shadow frustum follows the
  camera so dune self-shadows stay crisp), **ridged/crested dune** height (base
  fbm + ridged dunes + wind ripples), a procedural **sand bump map** for
  micro-relief, **EffectComposer + UnrealBloom** post pass (tuned low,
  threshold 0.9 — also the pipeline the Slice-1→later DoF reuses), and **distant
  noise-displaced buttes** for scale/depth fading into fog. Mobile scales down
  (lower DPR, 1024 shadow map, lighter bloom).
