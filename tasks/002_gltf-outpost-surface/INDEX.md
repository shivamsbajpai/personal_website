# Slice 2 — GLTF outpost + holo→crisp surface · INDEX (resume protocol)

Task: GLTF outpost props + hybrid content surface · **Closes #4** · parent epic **#2** · **PR [#12] open — awaiting owner review/merge**
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
| 5 | CSS3D crisp panel + cross-fade (DS5) | DONE ✅ | cf5a1b0 | **hybrid** (owner-chosen): holo→CSS3D reveal card at the outpost→existing flat crisp panel; reading system untouched. See DS5 amendment in defects |
| 6 | Reduced-motion path (DS6) | DONE ✅ | 4b11f4b, cf5a1b0 | holo uTime freeze + opacity-only card/panel cross-fade; whole-path verified under emulated `prefers-reduced-motion` at step 7 (travel loop preserved, holo static, card+panel still cross-fade) |
| 7 | Local verification | DONE ✅ | 30d70aa, e6896e5 | `node --test` 13 pass; Playwright smoke 0 console errors, 8 GLBs 200, full path info→travel→dock verified live on desktop + mobile + reduced-motion. Mobile card clip fixed twice: responsive `cardScale()`/`cardXOff()` (`30d70aa`) **plus a per-frame projected-x clamp** (`e6896e5`) after a live rAF trace showed the frozen-state verify had masked mid-glide clipping (see defects). Evidence screenshots in [`evidence/`](evidence/) |
| 8 | Owner approval gate | **in_progress — PR [#12] open** | — | owner reviews/merges [#12] (tuning calls bundled in the PR body: prop lighting, holo prominence, mobile card aesthetics). After merge: `summary.md`, confirm #4 auto-closed, tick box in epic #2 |

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
5. **Step 5 DONE (`cf5a1b0`).** Owner chose the **hybrid** DS5 (see amendment in
   defects). In `scene/main.js`: `CSS3DRenderer` + a `cssScene`, a phosphor
   `.holo-card` per checkpoint (`cards[]`) mounted at the terminal world position
   and billboarded each frame (`obj.quaternion.copy(camera.quaternion)`) for
   crisp text. The `loop()` choreographs a `smoothstep`-banded baton-pass by
   `infoAmt` (`holoFade` / `cardOp` / `panelOp`); `#infoLayer` opacity is now
   driven per-frame (its CSS transition disabled) instead of the `body.info`
   class. `css3d.render(cssScene, camera)` runs after `composer.render()`. CSS
   for `.holo-card`/`#css3d` is in `v2.html`. The flat panel's layout/scroll/
   measure path is untouched.
6. **Steps 1–7 DONE; PR open.** The mobile-card fix landed in two commits:
   `30d70aa` (responsive scale/seat) + `e6896e5` (per-frame projected-x clamp —
   a live rAF trace falsified the earlier frozen-state `fitsWidth:true`, see
   defects). Full re-verification on the final build passed (evidence below +
   [`evidence/`](evidence/) screenshots). **Next = Step 8 (owner approval gate):**
   the owner reviews/merges the PR for #4 — bundle the deferred tuning calls
   (prop lighting, holo prominence, final mobile reveal-card aesthetics). Do
   NOT merge the PR or close #4 yourself; after the owner merges, write
   `summary.md`, confirm #4 closed, tick the box in epic #2.

**Final-build re-verification evidence (PR session, post-clamp `e6896e5`):**
`node --test` → **13 pass**; `node --check scene/main.js` → OK; debug-hook grep →
clean. Live rAF trace (one sample per frame, both arrivals) at **390×844**:
**28/28 visible frames fit** the viewport (pre-clamp: 12/28; at op>0.5 pre-clamp
only 8/18 fit, worst right edge 493px in a 390 frame and one arrival exited fully
left at peak opacity). **Desktop 1280×800:** 14/14 trace frames fit; settled card
geometry **byte-identical pre/post clamp** (active card 370px at x 618–988).
**Reduced-motion:** travel loop preserved (TRAVERSING), card band fires (0.92),
settles to panel 1. **0 console errors/warnings on every pass.** Screenshots
(committed under [`evidence/`](evidence/)): desktop dock/travel/card-midband/
dock-cp1, mobile card-midband + dock-panel.

**Step 6+7 verification evidence (prior session, pre-clamp):** `node --test` → **13 pass**;
`node --check scene/main.js` → OK; debug-hook grep on `scene/main.js`+`v2.html` →
**clean**. Playwright smoke on `/v2.html` (desktop 1200/1280): **0 console
errors/warnings**, all **8 GLBs 200**, full live path verified by driving real wheel
scroll — checkpoint 00 INFO (flat crisp panel) → **TRAVERSING** (sniper reticle +
GLTF outpost: antenna/tank/sandbags/barriers with contact shadows + **holo terminal
cyan scanlines on dark glass backing**) → dock at next checkpoint (flat crisp panel,
DoF blur on outpost). **CSS3D reveal card** captured mid-band (temp `window.__infoHold`
hook, since removed — grep clean): at infoAmt 0.5 → card 0.98 / flat panel 0 (crisp
phosphor card billboarded at the outpost). **Reduced-motion** (`emulateMedia
reducedMotion:'reduce'`): 0 console errors, travel loop **preserved** (MODE
TRAVERSING after scroll, no teleport), card+panel cross-fade still fires (card 0.98 /
panel 0 mid-band), holo `uTime` frozen by code path (`holoT = reduce ? 0`).
**Mobile pass (390×844):** flat reading panel fully responsive/crisp/scrollable
(Slice-1 invariant holds); the reveal card was found **clipping off the right edge**
→ fixed (see defect below) → re-verified `fitsWidth:true` (card 234px, x 138→372 in a
390 viewport), full title readable, well-framed over the outpost. **Desktop
regression check** (1280): card 370px, fits, 0 errors — `cardK()=1` keeps the
original 0.04/+6 exactly.

**Step 4 verification evidence (prior session):** `node --test` → 13 pass; shader
**compiled with 0 console errors/warnings** (a compile failure logs a
WebGLProgram error — none seen). Scene-graph probe confirmed **3 holo screens +
3 dark backings**, `uTime` animating, `uOpacity`=1 in TRAVEL and **0 on dock**
(INFO). A forced-position screenshot (screen pinned in front of the lens)
showed the cyan scanlines, frame glow, and bloom halo reading cleanly **on the
dark glass backing** against both sky and dune — see "Plan defects" for why the
backing was needed. Instrumentation (`window.__holo` probe hook) was removed
before commit (grep clean).

**Step 5 verification evidence (this session):** `node --test` → 13 pass;
`node --check scene/main.js` → syntax OK; **0 console errors/warnings** (CSS3DRenderer
import resolved). DOM probe: `#css3d` container + **3 `.holo-card`s** built. Froze
`infoAmt` via a temp hook (`window.__infoHold`, removed before commit) to capture
the transition: at 0.5 → holo gone, **CSS3D card crisp at the terminal** (header +
2-line title + "DECRYPTING INTEL" foot, billboarded), flat panel hidden; at 1.0 →
card gone, flat amber reading panel + DoF blur on the outpost; at the 0.70 crossover
→ card 0.13 / panel 0.05 (soft dissolve, **no double-image** after retightening the
bands from an earlier 0.8 overlap that doubled the title). **Reading invariant held:**
in-panel scroll moved `.panel-scroll` `translateY(0→−197px)` then released to travel
once content ran out — content stays measurable. Grep clean of debug hooks.

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

**DS5 amended to a hybrid (owner-approved) — CSS3D *reveal card*, not a CSS3D
*reading panel*.** The locked DS5 said "CSS3D-mounted real-DOM panel." On reaching
implementation, mounting the *reading* panel in CSS3D was assessed as high-risk for
the core reading UX: CSS3D text blurs unless the billboard+distance-scale factor is
tuned exactly per resolution/fov, and it would force re-plumbing the working
scroll/measure system (the Slice-1 "measurable on arrival" invariant). The "crisp"
payoff is also partly redundant since the flat panel is already crisp DOM. Offered
the owner three options (full CSS3D / hybrid / anchored screen-space); owner chose
**hybrid**: a CSS3D *reveal card* (compact phosphor terminal card — label + title +
"DECRYPTING" — mounted at the outpost, billboarded) materializes during the docking
transition as the holo fades, then hands off to the **existing flat crisp reading
panel** for the actual read. Satisfies the AC ("dock cross-fades the holo into a
crisp panel framed by the outpost") with the reading system untouched. The card is
*transitional only* (visible solely in the `infoAmt` 0.28–0.74 band), so it never
competes with reading. `CARD_SCALE=0.04` is fov-58-tuned for ~1:1 desktop crispness
— **re-check at mobile width (step 7).**

**CSS3D reveal card clipped off-screen on narrow (mobile) viewports — the
`CARD_SCALE` re-check the plan flagged.** As anticipated in the DS5 amendment,
`CARD_SCALE=0.04` (fov-58/desktop-tuned) failed at <768px. Two compounding causes:
(a) the CSS3D projection grows with viewport *height*, so the same world-anchored
card renders larger on a tall portrait phone; (b) the card is world-anchored at the
outpost (`a.x + 6`), 6 units right of the dock centreline, which projects past the
right edge once the frame is narrow. First attempt (shrink by aspect ratio alone)
over-corrected — card became tiny *and* still clipped right. Fix that worked: a
single width-driven factor `cardK() = min(1, innerWidth/1200)` driving **both** a
floored scale (`0.04 * max(0.6, k)`) **and** a reseat toward centre
(`xOff = 6 * max(0.35, k)`), applied at build and re-applied on `resize`. `k===1`
on desktop reproduces the original `0.04` + `(a.x+6)` exactly, so the verified
desktop path can't regress. Verified `fitsWidth:true` + readable at 390×844; desktop
unchanged at 1280. **Final mobile aesthetics (exact size/seat) remain an owner-gate
(step 8) visual call** — this fix makes it correct-and-readable, not necessarily
final.

**Frozen-state verification masked live-arrival clipping — the card band runs
while the camera is still gliding.** The `fitsWidth:true` above was measured with
`infoAmt` frozen at a *settled* camera; live, `infoAmt` (which drives the card's
0.28–0.74 visibility band) and the camera glide ease concurrently, so the
world-anchored card crosses the frustum edge exactly at peak opacity. A per-frame
rAF trace at 390×844 showed only 8/18 op>0.5 frames on-screen (worst right edge
493px in a 390 frame; the next arrival exited fully *left* at op 1). Fix
(`e6896e5`): each visible frame re-seats the card from its anchor, projects it,
and clamps NDC x to (1 − (cardWidth+16px)/viewport) — the card rides the screen
edge and settles onto the terminal as the camera does. The clamp is a strict
no-op on frames where the card already fits, so settled geometry (desktop and
mobile) is unchanged — re-verified byte-identical at 1280. Post-fix trace:
28/28 visible frames fit. **Lesson: verify transitional UI with a live per-frame
trace, not a frozen snapshot — freezing the choreography also freezes the camera,
which can hide exactly the interaction under test.**

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

- Issue: #4 (slice) · Epic/PRD: #2 · Blocked-by: #3 (done) · PR: [#12]

[#12]: https://github.com/shivamsbajpai/personal_website/pull/12
- Previous slice: [`../001_recon-core-loop/summary.md`](../001_recon-core-loop/summary.md)
- Next slices: #5 content, #6 fly-in, #7 fast-travel, #8 fallback, #9 cutover
- Files (to touch): `v2.html`, `scene/main.js`, new `/assets/`, `/assets/CREDITS.md`
