# Slice 1 — Core loop tracer · summary (retrospective)

Closes #3 · parent epic #2 · shipped via [PR #10] (merged to `master`)

## Outcome

The full RECON optic interaction is proven end-to-end on a new `v2.html`, with
the live `index.html` left completely untouched. Travel a sunny 3D Mars desert
through the scope, lock a checkpoint (optic flips to info mode: dim + depth-blur +
crisp panel), scroll the pinned content, release past the end to travel on, and
reverse-scroll back — all driven by one pure, unit-tested state machine.

## Acceptance criteria — outcome

| AC | Status | Where |
|----|--------|-------|
| v2 loads / `index.html` untouched | ✅ | `v2.html`; `index.html` not in diff, serves 200, no v2 markers |
| sunny desert + mouse-look in travel | ✅ | `scene/main.js` (sun/shadows/fbm dunes/bloom; mouse-look gated to TRAVEL) |
| scroll advances + locks each checkpoint | ✅ | `scene/state.js` + `main.js`; verified cp0→1→2, clamped at last |
| info mode dim + blur + crisp panel | ✅ | `body.info` drives dim/blur; `.panel.active` crisp face-on surface |
| auto-release + reverse-scroll | ✅ | state machine; unit + Playwright e2e |
| state machine unit tests (Seam 1) | ✅ | `tests/state.test.js` — 13/13 |
| local preview + owner approves | ✅ | owner verified after two fixes ("travel feels good") |

## Artifacts

- `v2.html` — scope/HUD/info-panel shell + pinned-CDN Three import map
- `scene/state.js` — pure scroll-driven interaction state machine (no DOM/WebGL)
- `scene/main.js` — sunny WebGL desert, deserted-outpost stand-ins, optic wiring
- `tests/state.test.js` — 13 unit tests
- Plan: [`plan.md`](plan.md) · Design: [`design.md`](design.md) · Resume: [`INDEX.md`](INDEX.md)

## Gotchas to carry forward (into Slice 2 / #4)

1. **Travel arrival must be direction-aware.** Backward arrival originally landed
   at `readScroll:0` (panel top) — which is also the reverse-travel pin bound — so
   the next up-scroll left instantly and the middle checkpoint was flown through
   with no content shown. Arrival now lands at the edge being moved *into*
   (forward→top, backward→end via a caller-clamped sentinel). When Slice 2 adds
   the holo→crisp surface, preserve this: a checkpoint must be readable in full in
   both directions before its pin releases.

2. **Reduced-motion must keep the core loop, not delete it.** The original
   `prefers-reduced-motion` branch set `TRAVEL_LEN` and all camera lerps to `1`,
   teleporting between checkpoints ("travel mode totally gone"). Honor the
   preference by damping *inertial* motion (tighter tracking, no parallax sway),
   never by removing travel. Any new Slice 2 motion (fly-in, holo flicker, prop
   parallax) needs a reduced-motion path that dampens rather than disables.

3. **Panels must be measurable on arrival.** A `display:none` panel reads
   `contentMax = 0` during the info fade-in, which made the next scroll skip the
   checkpoint. Active panels are kept `display:flex` (visibility via opacity) and
   activated synchronously in the scroll handler before measuring. The CSS3D-
   mounted panel arriving in Slice 2 must stay measurable the same way.

4. **`emulateMedia` persists across Playwright calls.** During verification a
   `browser_run_code_unsafe` call that set `reducedMotion:'reduce'` leaked into
   later navigations and produced a false "travel is gone" reading. Reset
   `emulateMedia({reducedMotion:'no-preference'})` between mode checks.

## Deferred to later slices (unchanged from plan)

- GLTF outpost props + holo→crisp content surface → **#4 (Slice 2, next)**
- Real content rehomed verbatim → #5
- Cinematic fly-in loader → #6 (Slice 1 used a minimal init flash)
- Fast-travel / ⌘K → #7 · static fallback → #8 · e2e hardening + cutover → #9
- CSS3DRenderer-mounted panels → Slice 2 (Slice 1 used a screen-space panel +
  CSS blur/dim DoF approximation, locked decisions D3/D4)

## Follow-ups / tech debt

- Placeholder checkpoint content is lorem-grade; real verbatim content lands in #5.
- DoF is a CSS blur/dim approximation (D3), not a true depth-of-field pass — revisit
  if Slice 2's CSS3D surface makes a real DoF pass cheap.

[PR #10]: https://github.com/shivamsbajpai/personal_website/pull/10
