# Slice 6 — no-WebGL / reduce-motion static fallback · summary (retrospective)

Closes [#8] · parent epic [#2] · shipped via [PR #20] (merged to `master`)

## Outcome

`v2.html` now has an unbreakable floor: without WebGL, or under
`prefers-reduced-motion`, it renders as a normal scrolling recon-styled
document — all five checkpoints stacked, anchor nav, zero camera motion, and
**none of the 3D machinery executes**. RM users additionally get an
`ENTER 3D MODE` opt-in into the dampened 3D path (DG3 — an explicit,
documented amendment of the slice-1 RM invariant). The first Seam-3 e2e
artifact landed with it, plus the repo finally has a `.gitignore` and a
pinned dev-tooling `package.json`.

## Acceptance criteria — outcome

| AC | Status | Where |
|----|--------|-------|
| WebGL disabled → complete readable static version | ✅ | spec + manual; no ENTER 3D offered |
| RM → no motion/fly-in, readable static document | ✅ | spec + manual; intro never arms |
| All five checkpoints present and reachable | ✅ | per-panel label + content assertions; anchor nav |
| Playwright assertion covers the fallback (Seam 3) | ✅ | `tests/e2e/fallback.spec.mjs` (3 specs) |
| 0 console errors in both modes; owner previews | ✅ | asserted empty in spec; owner-authorized merge |

## Artifacts

- `scene/main.js` — boot-time decision, scratch-canvas WebGL probe, ENTER 3D
- `v2.html` — `body.static-mode` styles + `#enter3d`
- `tests/e2e/fallback.spec.mjs` + `playwright.config.mjs` — Seam-3 seed
- `package.json` (pinned `@playwright/test@1.60.0`) + `.gitignore`
- [`evidence/`](evidence/) — no-WebGL desktop/mobile, RM, post-opt-in shots
- Plan: [`plan.md`](plan.md) · Design: [`design.md`](design.md) · Resume: [`INDEX.md`](INDEX.md)

## Gotchas to carry forward (into Slice 7 / [#9])

1. **THREE logs a console *error* before throwing on a failed WebGL
   context.** Any "0 console errors" assertion on a no-WebGL path must
   either probe first (what we ship — scratch canvas) or allowlist that
   exact message. #9's smoke suite inherits the probe, so it can keep a
   strict empty-errors assertion.
2. **`npx`-only Playwright cannot resolve `@playwright/test` from a bare
   repo with an ESM config** — the pinned `package.json` is the supported
   path now; `npx playwright test` after `npm install` (no browser download
   needed while the pinned version matches the cached chromium build).
3. **Playwright `addInitScript` on a persistent context is forever** — it
   poisons subsequent navigations in that context (a no-WebGL blocker broke
   later 3D checks until a fresh context was used). #9's specs should use
   per-test contexts (the `@playwright/test` default) and never the shared
   MCP context for mode-altering scripts.
4. **The static fallback never registers 3D listeners** — #9's cutover
   smoke should assert native scroll works in fallback mode (no
   `preventDefault` wheel hijack), which the spec's "scrollable document"
   check covers.

## Deferred / follow-ups

- #9 (final slice): e2e smoke hardening + **cutover v2.html → index.html.
  The cutover ships to the live site and is gated on explicit owner
  sign-off (PRD deploy gate) — do not merge that one on session-level
  authorization.**
- Slice-3 note recap for #9: the verbatim-audit test reads `index.html` as
  its source of truth — the cutover must re-point or freeze it.

[#2]: https://github.com/shivamsbajpai/personal_website/issues/2
[#8]: https://github.com/shivamsbajpai/personal_website/issues/8
[#9]: https://github.com/shivamsbajpai/personal_website/issues/9
[PR #20]: https://github.com/shivamsbajpai/personal_website/pull/20
