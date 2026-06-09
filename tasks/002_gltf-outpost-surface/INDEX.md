# Slice 2 — GLTF outpost + holo→crisp surface · INDEX (resume protocol)

Task: GLTF outpost props + hybrid content surface · **Closes #4** · parent epic **#2**
Plan: [`plan.md`](plan.md) · Design: [`design.md`](design.md)
Branch: `task/4-gltf-outpost-surface` · Preview: `python3 -m http.server 8099` → `/v2.html`
Blocked-by: #3 (DONE — merged via PR #10)

## Status

| # | Step | State | Commit | Notes |
|---|------|-------|--------|-------|
| 1 | Asset sourcing + license vetting (DS1) | DONE ✅ | 93930ff | owner chose Poly Pizza assembly; 8 Quaternius CC0 GLBs in `assets/outpost/`, all verified Public Domain (CC0), provenance in `assets/CREDITS.md` |
| 2 | GLTFLoader + lazy-load harness (DS2) | DONE ✅ | 83928e7 | `GLTFLoader` kicked on `booted` via `requestIdleCallback`; render loop never awaits; normalize→recenter→min.y=0→shadows per model; graceful catch keeps procedural |
| 3 | Per-checkpoint outpost composition (DS3) | DONE ✅ | 83928e7 | `buildGltfOutpost()` clones kit into camera-facing arc, `hash`-seeded per-cp yaw, shadows on every mesh; procedural camps removed + geo disposed on swap |
| 4 | WebGL holo-screen on a prop (DS4) | pending | — | scanline/flicker ShaderMaterial, visible in TRAVEL |
| 5 | CSS3D crisp panel + cross-fade (DS5) | pending | — | upgrades D4; preserve Slice 1 invariants |
| 6 | Reduced-motion path (DS6) | pending | — | static holo, dampened, travel preserved |
| 7 | Local verification | pending | — | node tests + Playwright smoke |
| 8 | Owner approval gate | pending | — | sign-off before Slice 3 (#5) |

## Acceptance criteria → step

- CC0 kit chosen + license recorded + assets under `/assets/` → 1
- Models lazy-load; desert usable before they finish → 2
- Coherent outpost per checkpoint (tank+crates+sandbags+antenna+barriers) → 3
- Approach holo-screen → dock cross-fade to crisp panel framed by outpost → 4,5
- 0 console errors; sunny + shadows preserved; owner previews locally → 7,8

## Resume sequence for next session

1. `cd ~/projects/personal_website && git checkout task/4-gltf-outpost-surface`
2. Pre-flight: `node --test` (expect 13 pass); `python3 -m http.server 8099` → `/v2.html`.
3. **Steps 1–3 DONE** — kit sourced (`assets/outpost/`), lazy-loaded + swapped,
   composed per-checkpoint. GLTF code lives in `scene/main.js`: `KIT` spec +
   `prepModel()` + `buildGltfOutpost()` + `scheduleOutpostLoad()`/`loadOutposts()`,
   kicked from the `booted` flip inside `loop()`.
4. **Next = Step 4 (WebGL holo-screen, DS4).** Distinct sub-system — start here:
   - Add an emissive `ShaderMaterial` screen quad on a designated prop (the
     `antenna` comms unit, or add a small field-terminal prop). Horizontal
     scanlines (`fract(uv.y*N)`), subtle flicker + sweep driven by a `uTime`
     uniform, recon-cyan tint (`--phosphor` #7cfca6). Reuse the existing bloom
     pass (D10) for glow.
   - Drive its opacity by `1 - infoAmt` so it fades out as INFO ramps (it's a
     TRAVEL-mode element). Advance `uTime` in `loop()`.
   - **Reduced-motion (DS6, do alongside):** freeze `uTime` → static glow, no
     flicker/sweep. `reduce` is already computed at module top.
5. Then Step 5 (CSS3DRenderer crisp panel + cross-fade, DS5 — upgrades D4), Step
   6 (reduced-motion path finalize), Step 7 (verify: `node --test` + Playwright
   smoke), Step 8 (owner approval gate). Keep Slice 1 invariants intact
   (see "Carry-forward invariants").

**Step 2/3 verification evidence (this session):** `node --test` → 13 pass;
Playwright smoke on `/v2.html` → 0 console errors/warnings, all 8 GLBs `200`,
scene-graph probe confirmed exactly **3 camp groups** with GLTF geometry
(procedural removed), antenna dish + tank render with contact shadows in
TRAVEL mode.

## Plan defects observed

_(none yet — log here as they happen, within the commit that introduces the divergence)_

## Carry-forward invariants (from Slice 1 summary — do NOT regress)

- **Direction-aware travel arrival** (`scene/state.js`): forward→top, backward→end;
  a checkpoint is read in full both directions before its pin releases.
- **Reduced-motion keeps the travel loop**, dampening inertial motion only (never
  teleport / never disable travel).
- **Panels measurable on arrival** — no `display:none` during the info fade
  (reads `contentMax=0` → skips the checkpoint).
- **DOM content always present** (a11y/SEO) regardless of the WebGL/holo layer.
- Sunny lighting (D9) + PCFSoft shadows (D10) preserved on new props.

## Locked decisions reference

DS1 CC0 kit choice (owner picks style; license must be CC0) · DS2 lazy-load after
first paint, graceful procedural fallback · DS3 clone kit per pad, seeded
variation, shadows · DS4 holo ShaderMaterial (scanlines/flicker), fades by
`1-infoAmt` · DS5 CSS3D-mounted real-DOM panel, cross-fade on dock (upgrades D4) ·
DS6 reduced-motion static holo + preserved loop · DS7 `/assets/<kit>/` + CREDITS.md.
Slice 1: D1 scroll-driven state machine · D3 body.info dim/blur · D4 (upgraded by
DS5) · D8 Three via pinned CDN · D9 sunny · D10 photoreal/shadows · D11 procedural
outpost (replaced by DS3).

## Cross-references

- Issue: #4 (slice) · Epic/PRD: #2 · Blocked-by: #3 (done)
- Previous slice: [`../001_recon-core-loop/summary.md`](../001_recon-core-loop/summary.md)
- Next slices: #5 content, #6 fly-in, #7 fast-travel, #8 fallback, #9 cutover
- Files (to touch): `v2.html`, `scene/main.js`, new `/assets/`, `/assets/CREDITS.md`
