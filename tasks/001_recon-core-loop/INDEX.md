# Slice 1 — Core loop tracer · INDEX (resume protocol)

Task: RECON core-loop tracer · **Closes #3** · parent epic **#2**
Plan: [`plan.md`](plan.md) · Design: [`design.md`](design.md)
Branch: `task/3-recon-core-loop` · Preview: `python3 -m http.server 8099` → `/v2.html`

## Status

| # | Step | State | Commit | Notes |
|---|------|-------|--------|-------|
| 1 | State machine + unit tests | DONE spec ✅ code ✅ | (init commit) | `node --test` → 11 pass |
| 2 | v2.html shell (scope/HUD/panel/import map) | DONE spec ✅ code ✅ | (init commit) | leaves index.html untouched |
| 3 | scene/main.js (sunny desert + wiring) | DONE spec ✅ code ✅ | (init commit) | travel↔info verified |
| 3b | Photoreal pass (shadows/dunes/bump/bloom) | DONE ✅ | (realism commit) | per "make space more real" feedback |
| 3c | Deserted army outposts at checkpoints (graded pads + tank/crates/sandbags/antenna/hedgehogs); mountains removed | DONE ✅ | (army commit) | per feedback; procedural stand-ins, GLTF kit in Slice 2 (#4) |
| 3d | Travel mechanic: reading-scroll decoupled; travel is **scroll-driven** (scrub camera between checkpoints, holds when idle); over-dune clearance + smoothing | DONE ✅ | (mechanic/scrub/smooth commits) | per feedback "too fast", "multiple scroll moves", "moving on its own → scrollable", "bumpy"; state.js scroll-driven, 11/11 tests |
| 4 | Local verification | DONE ✅ | — | Playwright: 0 errors, dock + reverse OK |
| 5 | Owner approval gate | DONE ✅ | — | owner verified reverse-travel + reduced-motion fixes ("travel feels good"); PR #10 open (Closes #3), awaiting owner merge |

## Acceptance criteria → step

- v2 loads / index untouched → 2,4 ✅
- sunny desert + mouse look in travel → 3 ✅
- scroll advances + locks checkpoints → 1,3 ✅
- info mode dim+blur+crisp panel → 2,3 ✅
- auto-release + reverse-scroll → 1,3 ✅ (unit + e2e)
- state machine unit tests (Seam 1) → 1 ✅ (11/11)
- local preview + owner approves → 4 ✅ / 5 pending

## Resume sequence for next session

1. `cd ~/projects/personal_website && git checkout task/3-recon-core-loop`
2. Pre-flight: `node --test` (expect **13** pass); `python3 -m http.server 8099`
   then open `/v2.html`.
3. **PR #10 is open (Closes #3), test plan complete, owner-approved.** Do not
   merge it yourself — wait for the owner to merge.
4. **After the owner merges #10:** write `summary.md`; close #3 with a link to
   the summary; tick the Slice 1 box in epic #2. Then branch Slice 2 (#4) from
   updated `master`.

## Plan defects observed

- **Reverse travel flew through the middle checkpoint (content never shown).**
  Owner repro: travel to the last checkpoint, then reverse — the 2nd
  (middle) checkpoint showed no content. Cause: backward arrival landed at
  `readScroll:0` (the panel top), but `readScroll:0` is also the reverse-travel
  pin bound, so the very next up-scroll immediately began `TRAVELLING from N to
  N-1` with no reading dwell. Travel was direction-asymmetric: forward arrives
  at the top and reads *down* through the panel before the pin releases;
  backward arrived at the top and left instantly. Fix (`scene/state.js`): on
  arrival land at the edge being moved *into* — forward → top (`0`), backward →
  end (`Number.MAX_SAFE_INTEGER` sentinel, clamped to the destination's
  `contentMax` by the caller, mirroring the existing forward-cancel path). Now
  backward arrival parks at the content end and reads *up* before releasing.
  Tests: +2 regression cases (13/13 pass). Verified in-browser (Playwright):
  on reverse, panel 1 shows in INFO mode, content scrolls end→top, 0 console
  errors.


- **Checkpoint skipped because the panel wasn't measurable on arrival.** With
  scroll-driven travel, arriving at a checkpoint left the content panel
  `display:none` for the few frames the info-fade ramped up, so `curContentMax()`
  read 0 → the next scroll saw "already at end" and immediately travelled on,
  skipping the checkpoint (content "not visible at the second checkpoint"). Fix:
  make `.panel.active` always `display:flex` (visibility via `#infoLayer` opacity)
  so it is measurable immediately, and activate the panel synchronously in the
  scroll handler before measuring/clamping. The DoF CSS approximation (D3) remains
  a scoped decision, not a defect.

- **Reduced-motion eliminated the travel loop (teleported between checkpoints).**
  Owner repro (macOS Reduce Motion on): "travel mode is totally gone." Cause:
  the `prefers-reduced-motion` branch set `TRAVEL_LEN = 1` *and* every camera
  lerp to `1`, so a single 100px scroll notch advanced `travelT` by `100/1 =
  100 ≫ 1` → instant arrival at the next checkpoint; the camera never scrubbed
  the desert. Reduced-motion was honoring the preference by deleting the slice's
  core loop. Fix (`scene/main.js`): keep the same scrubbed `TRAVEL_LEN = 2400`
  traversal under reduced-motion and honor the preference by damping *inertial*
  motion instead — tighter camera tracking (`0.3–0.35` vs `1.0`, still
  interpolated so no per-notch hard-snap) and no mouse-look parallax sway.
  Removed the now-unused `LERP` constant. Verified in-browser under emulated
  reduced-motion: travel mode appears, range ramps over 48 distinct values /60
  notches, reverse-shows-middle intact, 0 errors; normal mode unchanged. D9
  (sunny lighting) and the scroll-driven model are untouched — this was a
  reduced-motion tuning defect, not a model change.

## Locked decisions reference

D1 single scroll driver + pure state machine · D2 cameraFloat interpolation ·
D3 body.info class drives dim/blur(DoF approx)/scope-fade · D4 face-on
screen-space panel (CSS3D deferred to Slice 2) · D5 pinned content scroll via
transform · D6 mouse-look travel-only · D7 placeholder markers for props ·
D8 Three via pinned CDN · D9 sunny lighting.

## Cross-references

- Issue: #3 (slice) · Epic/PRD: #2
- Next slices: #4 props, #5 content, #6 fly-in, #7 fast-travel, #8 fallback, #9 cutover
- Files: `v2.html`, `scene/state.js`, `scene/main.js`, `tests/state.test.js`
