# Slice 2 — implementation decisions

Continues the global decision log; cross-references Slice 1 D-numbers rather than
re-justifying them. See [`../001_recon-core-loop/design.md`](../001_recon-core-loop/design.md).

- **DS1 — CC0 kit choice & licensing (OPEN — owner picks visual style).** Must be
  a single, stylistically consistent CC0 (public-domain-equivalent) low-poly
  military/desert kit covering tank/APC + crates + sandbags + antenna/comms mast +
  barriers. License vetted and recorded in `/assets/CREDITS.md` with source URL +
  license text/snapshot. Candidates researched in step 1 and surfaced to the owner
  before any binary is committed (style is taste; license is non-negotiable CC0).
  *Rejected by default: anything not CC0 (CC-BY needs attribution handling; no
  NC/ND), and mixed-style kits that won't read as one coherent outpost.*

- **DS2 — Lazy-load after first paint.** The desert + beacons render immediately
  (Slice 1 loop unchanged). `GLTFLoader` is kicked after the first rendered frame
  (e.g. `requestIdleCallback`/post-boot), parsing off the critical path; on
  `load`, procedural stand-ins (D11) are swapped for cloned GLTF props. The render
  loop must never await a model. Failure to load falls back to the procedural
  outpost (graceful degrade), never a blank pad.

- **DS3 — Per-checkpoint composition by cloning.** One loaded kit, cloned per
  checkpoint and arranged on the existing graded pad (D11) in a shallow
  camera-facing arc, with small deterministic per-checkpoint variation (rotation/
  offset, seeded by cp index — no `Math.random`, keep it reproducible). Shadows
  (D10 PCFSoft) preserved on the new meshes (`castShadow`/`receiveShadow`).

- **DS4 — Holo-screen via ShaderMaterial.** A screen quad on a designated prop
  (field terminal / comms unit) uses an emissive shader: horizontal scanlines
  (`fract(uv.y*N)`), subtle flicker + sweep driven by a `uTime` uniform, recon-cyan
  tint. Visible in TRAVEL; its opacity is driven by `1 - infoAmt` so it fades out
  as INFO ramps. Reuses the existing bloom pass (D10) for glow.

- **DS5 — CSS3D-mounted crisp panel + cross-fade (upgrades D4).** Add a
  `CSS3DRenderer` DOM layer composited over the WebGL canvas (transparent, pointer
  events only in INFO). The existing real-DOM `.panel` (Slice 1) is mounted on a
  `CSS3DObject` positioned/oriented at the prop's screen plane. On dock, holo fades
  out while the CSS3D panel fades in (`infoAmt`). **Invariants carried from Slice
  1:** content is real DOM (a11y/SEO); the panel stays measurable on arrival (no
  `display:none` during fade — Slice 1 gotcha #3); arrival is direction-aware
  (gotcha #1, lives in `scene/state.js`, untouched). `readScroll` still translates
  the inner scroll; on CSS3D this maps to the mounted element's inner transform.

- **DS6 — Reduced-motion path (Slice 1 gotcha #2).** Under
  `prefers-reduced-motion`: holo renders as a static glow (no flicker/sweep,
  `uTime` frozen), prop/camera motion stays dampened (Slice 1 reduced-motion
  tuning), and the travel loop is preserved — never disabled. The CSS3D cross-fade
  may snap rather than ramp.

- **DS7 — Assets directory layout.** `/assets/<kit>/*.glb` + textures, plus
  `/assets/CREDITS.md` (source, author, license, URL, retrieval date). Keeps the
  repo self-contained for the model layer even while Three stays on CDN (D8).

## Open questions for step 1

- **Which kit** (DS1) — owner picks from researched CC0 candidates on visual style.
- Single combined `.glb` vs per-prop files — decided once the kit is chosen
  (affects clone strategy in DS3).
