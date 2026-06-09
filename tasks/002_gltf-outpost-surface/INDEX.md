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
| 3 | Per-checkpoint outpost composition (DS3) | DONE ✅ | 83928e7, 2f64c26 | `buildGltfOutpost()` clones kit into camera-facing arc, `hash`-seeded per-cp yaw, shadows on every mesh; procedural camps removed + geo disposed on swap. Scale/arc tuned (`2f64c26`); prop visibility under low sun deferred to owner gate (step 8) |
| 4 | WebGL holo-screen on a prop (DS4) | DONE ✅ | 4b11f4b | emissive scanline/flicker/sweep ShaderMaterial + dark glass backing on a field-terminal prop per checkpoint; fades by 1−infoAmt; uTime freezes under reduced-motion |
| 5 | CSS3D crisp panel + cross-fade (DS5) | pending | — | upgrades D4; preserve Slice 1 invariants |
| 6 | Reduced-motion path (DS6) | holo done; finalize at 7 | 4b11f4b | holo uTime freeze landed alongside step 4; whole-path render verify deferred to step 7 |
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
4. **Step 4 DONE (`4b11f4b`).** Per-checkpoint holo field terminal lives in
   `scene/main.js`: `makeHoloMaterial()` (scanline/flicker/sweep/frame-glow
   ShaderMaterial, recon-cyan #7cfca6, additive, picks up D10 bloom) +
   `buildHoloTerminal()` (footing + post + **dark glass backing** + screen) +
   per-anchor placement loop pushing `{holo, back}` into `holoScreens`. The
   `loop()` advances `uTime` (frozen to 0 under `reduce`) and fades both the
   shader (`uOpacity`) and the backing (`opacity`) by `1 − infoAmt`.
5. **Next = Step 5 (CSS3DRenderer crisp panel + cross-fade, DS5 — upgrades D4).**
   The holo already fades to 0 on dock (verified: settled at a checkpoint →
   holo `uOpacity`/backing `opacity` both 0, screen centred at NDC≈(0.26, 0.01)).
   Mount the real-DOM panel via CSS3DRenderer at that same transform and
   cross-fade holo→crisp as `infoAmt` ramps. Preserve Slice-1 invariants
   (panels measurable on arrival, DOM always present).
6. Then Step 6 (reduced-motion path finalize — holo freeze already in), Step 7
   (verify: `node --test` + Playwright smoke incl. an emulated
   `prefers-reduced-motion` render check), Step 8 (owner approval gate). Keep
   Slice 1 invariants intact (see "Carry-forward invariants").

**Step 4 verification evidence (this session):** `node --test` → 13 pass; shader
**compiled with 0 console errors/warnings** (a compile failure logs a
WebGLProgram error — none seen). Scene-graph probe confirmed **3 holo screens +
3 dark backings**, `uTime` animating, `uOpacity`=1 in TRAVEL and **0 on dock**
(INFO). A forced-position screenshot (screen pinned in front of the lens)
showed the cyan scanlines, frame glow, and bloom halo reading cleanly **on the
dark glass backing** against both sky and dune — see "Plan defects" for why the
backing was needed. Instrumentation (`window.__holo` probe hook) was removed
before commit (grep clean).

**Step 2/3 verification evidence (prior session):** `node --test` → 13 pass;
Playwright smoke on `/v2.html` → 0 console errors/warnings, all 8 GLBs `200`,
scene-graph probe confirmed exactly **3 camp groups** with GLTF geometry
(procedural removed), antenna dish + tank render with contact shadows in
TRAVEL mode.

## Plan defects observed

**ES-module HTTP caching masks edits during browser verification.** When
iterating on `scene/main.js` with `python3 -m http.server` + Playwright, the
browser served a *cached* `main.js` across reloads — several tuning passes
rendered the stale layout while the disk file was correct (a `fetch(...,
{cache:'no-store'})` confirmed disk was fresh; the running module was not).
Root cause: the cached **HTML** kept the old `<script>` tag, so a query bump
on the module src alone never took effect. Fix that worked: bust the **page
URL** too (`v2.html?b=N`) so the HTML re-parses and re-requests the module.
For verification only — no cache-bust query ships in `v2.html` (reverted).
A `window.__build` marker + the live scene/camera probe (read `matrixWorld`
+ project to NDC) were the tools that finally distinguished "stale render"
from "real layout"; both reverted before commit.

**Docked prop visibility is lighting-bound, not placement-bound.** With the
arc spread + scaled (commit `2f64c26`), the live NDC probe confirms all 8
props spread across the frame — but in the docked low-sun view only the
antenna breaks the dune silhouette; the short props (tank/crates/sandbags)
sit dark-on-dark in the shadowed foreground. Improving their read is a
lighting/material call (fill light, or lighter prop materials), not arc
geometry — defer to the **owner approval gate (step 8)** with a fill-light
tweak as the likely lever.

**Additive holo washes white against the bright sky — needs a dark backing.**
DS4 specified an additive-blended ShaderMaterial (so it glows + blooms). But the
terminal sits at outpost height and, from the high travel vantage, often projects
against the bright cream sky — where additive cyan blows out to near-white and
loses its phosphor identity (confirmed in a forced-position screenshot: the
quad's upper half against sky read white, lower half against dune read green).
Fix: a `MeshBasicMaterial` dark "glass" backing plane (`0x05140d`, normal-blended,
~0.6 alpha, `renderOrder` behind the additive screen) gives the holo a screen
*body* so the cyan reads on it regardless of background — and reads more like an
actual terminal. The backing fades with the holo (`opacity = (1−infoAmt)*0.6`).

**Holo approach-framing prominence is a step-8 owner-gate tuning call, not a
step-4 blocker.** The state machine pins hard at each checkpoint (direction-aware
arrival), so a settled camera is always *at* a checkpoint in INFO — where the
holo is correctly faded to 0. The holo is therefore only on-screen *during* the
transient TRAVEL glide between checkpoints, and whether a given terminal is
well-framed at that moment depends on the exact glide position (terminals sit at
outpost level while the camera rides high over the dunes). Functionally DS4 is
complete and proven (forced shot + scene-graph probe); how prominent the holo
should be on approach (size / placement height / a lower seat against the dunes)
is a visual call — defer to the **owner approval gate (step 8)**, same as the
docked-prop-visibility lighting defect above. Likely levers: enlarge the screen,
seat it lower so it backs onto a dune, or nudge it toward the traverse centreline.

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
