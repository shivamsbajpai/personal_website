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
| 3d | Event-driven travel: slow single eased glide (~2.6s); reading-scroll decoupled (multi-scroll reads, end+1 travels, locked during travel) | DONE ✅ | (mechanic commit) | per feedback "too fast" + "multiple scroll moves checkpoint"; state.js rewritten, 10/10 tests |
| 4 | Local verification | DONE ✅ | — | Playwright: 0 errors, dock + reverse OK |
| 5 | Owner approval gate | pending | — | awaiting local sign-off before Slice 2 |

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
2. Pre-flight: `node --test` (expect 11 pass); `python3 -m http.server 8099` then
   open `/v2.html`.
3. If approval gate (step 5) still pending → present local preview for sign-off;
   reiterate on feedback. Do **not** start Slice 2 (#4) until approved.
4. On approval: open/refresh the PR (Closes #3), complete its test plan, hand to
   owner to merge. Then branch Slice 2 from updated `master`.

## Plan defects observed

- None yet. (DoF is intentionally a CSS approximation in Slice 1 — see D3; not a
  defect, a scoped decision.)

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
