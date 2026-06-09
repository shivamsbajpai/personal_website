# Slice 6 — No-WebGL / reduce-motion static fallback · plan

Closes [#8] · parent epic [#2] · branch `task/8-static-fallback`
Design: [`design.md`](design.md) · Resume: [`INDEX.md`](INDEX.md)

## Goal

A readable floor: when WebGL is unavailable **or** `prefers-reduced-motion`
is on, `v2.html` renders as a normal scrolling document — all five
checkpoints stacked, recon-HUD styling, still desert backdrop, zero camera
motion — reusing the static DOM content from Slice 3 (no second copy).

## Steps

1. **Static mode** (DG1/DG2) — a `body.static-mode` path decided **before**
   `initScene`: hide the 3D chrome (canvas/scope/HUD/intro), un-fix the
   layout, stack all five panels as a document, nav indices become anchor
   jumps. No scene, no loop, no input hijack.
2. **Reduced-motion default + ENTER 3D opt-in** (DG3) — RM lands in static
   mode with an unobtrusive `ENTER 3D MODE` control that boots the (dampened,
   slice-1-style) 3D experience on demand; no-WebGL gets no such control.
3. **Seam-3 fallback spec** (DG4) — `tests/e2e/fallback.spec.mjs` +
   minimal config: (a) WebGL blocked via an init script → complete static
   document, all 5 checkpoints, key content strings, 0 console errors;
   (b) `reducedMotion: 'reduce'` → same assertions + no fly-in.
4. **Local verification** — `node --test` (43); run the new e2e spec; manual
   Playwright passes (no-WebGL, RM, ENTER 3D transition, mobile static,
   normal 3D regression); evidence screenshots.
5. **PR + owner gate** — full test plan; merge authorized this session;
   post-merge close-out.

## Acceptance criteria → step

- WebGL disabled → complete readable static version → 1, 3, 4
- RM → no camera motion/fly-in; readable static document → 2, 3, 4
- All five checkpoints present and reachable in the fallback → 1, 4
- Playwright assertion covers the fallback (Seam 3) → 3
- 0 console errors in both modes; owner previews → 4, 5

## Out of scope

- The full Seam-3 e2e suite (journey/palette specs) — that's #9; this slice
  contributes only the fallback spec.
- Visual parity with the 3D scene (the AC grants polish discretion within
  the recon-HUD language).

[#2]: https://github.com/shivamsbajpai/personal_website/issues/2
[#8]: https://github.com/shivamsbajpai/personal_website/issues/8
