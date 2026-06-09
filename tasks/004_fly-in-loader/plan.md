# Slice 4 — Cinematic fly-in loader streaming assets into Overwatch · plan

Closes [#6] · parent epic [#2] · branch `task/6-fly-in-loader`
Design: [`design.md`](design.md) · Resume: [`INDEX.md`](INDEX.md)

## Goal

From the first frame, a scripted camera sweep crosses the desert while a light
HUD loader streams the GLTF kit with **real progress**; the sweep lands exactly
on the `00 OVERWATCH` dock vantage as loading completes and hands off to the
normal optic loop (the dock transition into INFO plays as the landing beat).
Once per session, skippable, no fly-in under reduced motion.

## Steps

1. **Pure gating helper + unit tests** (DF2) — `flyProgress(timeFrac, assetFrac)`
   in `scene/state.js`: time eases the sweep, the final approach (last 15%) is
   gated on real asset progress; `tests/intro.test.js` covers clamping,
   monotonicity, the gate, and the landing condition.
2. **Intro overlay UI** in `v2.html` — bottom-center mono loader (label +
   10-cell bar + %) and a `skip ⏎` button; hidden/done states.
3. **Fly-in path + loop integration** (DF1) — quadratic-bezier sweep ending
   byte-exactly at `vantages[0]`; during the intro the loop holds `infoAmt` at
   0 (optic stays in travel vision, HUD mode `INBOUND`), then the normal loop
   resumes and the standard dock-into-INFO transition is the landing beat.
4. **Real asset progress** (DF3) — when the intro plays, the GLTF kit loads
   **eagerly** through a `LoadingManager` that drives the loader (8 GLBs);
   non-intro paths (replay session, reduced motion, skip) keep the existing
   `requestIdleCallback` lazy load (DS2 stays honored).
5. **Session/skip/reduced-motion paths** (DF4) — `sessionStorage` once-per-
   session; skip via button, Enter, or any scroll gesture (snaps to the dock
   vantage; assets continue loading lazily); reduced motion never flies.
6. **Local verification** — `node --test`; Playwright: first-load fly-in with
   live progress, landing handoff continuity (rAF trace: no camera jump at
   handoff), same-session reload skips intro, skip control works, reduced
   motion has no fly-in, mobile pass, 0 console errors; evidence screenshots.
7. **PR + owner gate** — full test plan with inline evidence; merge authorized
   for this session; post-merge close-out.

## Acceptance criteria → step

- First load: fly-in from frame one with a light HUD loader → 2, 3
- Loader percentage reflects actual asset loading → 1, 4
- Fly-in ends at Overwatch, clean handoff to the optic loop → 3, 6
- No replay within a session; skip control available → 5
- Reduced motion: no fly-in; 0 console errors; owner previews → 5, 6, 7

## Out of scope

- Audio/SFX for the entrance (epic future-release TODO).
- Replacing the `#init` first-paint cover (it stays as the sub-second cover
  until the first rendered frame).
- Fast-travel ([#7]), static fallback ([#8]).

[#2]: https://github.com/shivamsbajpai/personal_website/issues/2
[#6]: https://github.com/shivamsbajpai/personal_website/issues/6
[#7]: https://github.com/shivamsbajpai/personal_website/issues/7
[#8]: https://github.com/shivamsbajpai/personal_website/issues/8
