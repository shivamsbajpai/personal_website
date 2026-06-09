# Slice 6 — static fallback · design decisions

Cross-ref: [`plan.md`](plan.md). Earlier decisions (D1–D11, DS, DC, DF, DT)
are locked except where DG3 explicitly amends one (noted below).

## DG1 — Fallback decision happens before the scene exists

**Choice:** the static path is chosen at boot — `!renderer || reduce` — and
when taken, `initScene()` never runs: no scene graph, no rAF loop, no
wheel/key hijack, no intro. Static mode is CSS + a handful of DOM tweaks.

**Why:** the floor must be cheap and unbreakable; the strongest guarantee is
that none of the 3D machinery executes. Native document scrolling needs the
wheel listener to never be registered (it `preventDefault`s).

## DG2 — Static mode is the Slice-3 DOM, restyled

**Choice:** `body.static-mode` un-fixes the page (`position: static;
overflow: auto`), hides canvas/scope/HUD/intro/⌘K, marks every panel
`.active`, stacks them as a centered column over the existing
`.sky-fallback` gradient (the still desert backdrop), and turns the topbar
indices into `scrollIntoView` anchors. No content is duplicated (Seam-2
floor already guarantees the copy is in the DOM).

**Why:** AC requires reuse of the Slice-3 content; the panels are already
recon-styled, so the fallback inherits the visual language for free.

## DG3 — Reduced motion defaults to static, with an explicit ENTER 3D opt-in
*(amends the slice-1 "RM keeps the travel loop" invariant)*

**Choice:** RM lands in the static document (per the PRD floor and this
slice's AC: "no camera motion … readable as a static document"). The
dampened-3D path built in slices 1–4 is **kept**, behind a fixed `ENTER 3D
MODE` button shown only when WebGL is available; clicking it boots
`initScene` (which, under RM, still damps inertial motion, never flies the
intro). No-WebGL shows no such button.

**Why the amendment is safe:** the slice-1 invariant ("never delete travel
under RM") was written when the only alternative was a *broken* 3D
experience; its intent — RM users get a first-class experience — is now
better served by a motion-free document plus an explicit opt-in. The 3D-RM
code path remains exercised (and is regression-checked via the opt-in).

## DG4 — Fallback e2e spec is the first Seam-3 artifact

**Choice:** `tests/e2e/fallback.spec.mjs` on `@playwright/test` (run via
`npx`, no committed `node_modules`), with WebGL blocked by an init script
that nulls `HTMLCanvasElement.getContext` for webgl context types — the
same v2.html, a genuinely failed context. Asserts: static mode on, 5 panels
visible, key content strings present, no fly-in (RM case), and **zero
console errors**. #9 extends this file's pattern to the full journey.
