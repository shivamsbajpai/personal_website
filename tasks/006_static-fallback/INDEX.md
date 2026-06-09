# Slice 6 — no-WebGL / reduce-motion static fallback · INDEX (resume protocol)

Task: static readable floor for v2.html · **Closes [#8]** · parent epic [#2]
Plan: [`plan.md`](plan.md) · Design: [`design.md`](design.md)
Branch: `task/8-static-fallback` · Preview: server on :8099 → `/v2.html`
Blocked-by: #5 (DONE — [PR-14]); #4/#6/#7 also shipped ([PR-12], [PR-16], [PR-18])

## Status

| # | Step | State | Commit | Notes |
|---|------|-------|--------|-------|
| 1 | Static mode (DG1/DG2) | DONE ✅ | b4b322b | scratch-canvas WebGL probe keeps the path at 0 console errors (see defect) |
| 2 | RM default + ENTER 3D opt-in (DG3) | DONE ✅ | b4b322b | opt-in boots dampened 3D, docked at Overwatch |
| 3 | Seam-3 fallback spec (DG4) | DONE ✅ | 6a760d1, bbcb875 | 3 specs pass; pinned @playwright/test 1.60 via package.json (see defect) |
| 4 | Local verification | DONE ✅ | — | see evidence block; screenshots in [`evidence/`](evidence/) |
| 5 | PR + owner gate | in_progress | — | merge authorized for this session |

## Acceptance criteria → step

- WebGL disabled → complete readable static page → 1, 3, 4
- RM → no motion/fly-in, static document → 2, 3, 4
- All five checkpoints reachable in fallback → 1, 4
- Playwright fallback assertion (Seam 3) → 3
- 0 console errors both modes; owner previews → 4, 5

## Resume sequence for next session

1. `cd ~/projects/personal_website && git checkout task/8-static-fallback`
2. Pre-flight: `node --test` (43 must pass); server on :8099 (`lsof -iTCP:8099`).
3. Start at the first non-DONE step. Boot branch lives at `scene/main.js`
   ~74–86 (`renderer` try/catch → currently a crude panel-0-only fallback —
   replace it). `reduce` is module-scope. The intro must never arm in
   static mode (it checks `reduce` already).
4. Gotchas: editing `scene/state.js`/`main.js` → verify with CDP cache
   disabled (`Network.enable` first); page-URL bust; `sessionStorage`
   persists across reloads; block WebGL in tests via an init script nulling
   `HTMLCanvasElement.prototype.getContext` for webgl types.

## Plan defects observed

**npx-only Playwright couldn't resolve `@playwright/test` from an ESM
config.** The plan (and the epic's "via npx, no committed node_modules")
assumed `npx -p @playwright/test playwright test` would run a bare repo's
specs; node's ESM resolver can't find the package from the npx cache when
the config is `.mjs`. Resolution: a `package.json` devDependency pinned to
1.60.0 (matching the already-cached chromium-1223 — no browser download)
plus the long-overdue `.gitignore` so `node_modules/` stays uncommitted.
The epic's intent (no committed deps, no build step for the site) holds.

**THREE logs a console *error* before throwing when a WebGL context fails**,
which would have failed the "0 console errors" AC on the exact path the AC
protects. Fix: probe `webgl2`/`webgl` on a scratch canvas and skip
constructing `WebGLRenderer` entirely when absent — the fallback path now
emits nothing.

**Step-4 evidence (this session):** `node --test` → **43 pass**;
`npx playwright test` → **3 pass** (no-WebGL floor / RM floor / ENTER 3D
boot). Manual passes (fresh contexts; CDP cache off): **no-WebGL** →
static-mode, 5 panels visible, scrollable document, anchor nav to 02 · WORK,
no ENTER 3D button, **0 errors**; mobile 390×844 static readable. **RM** →
static document, no intro, ENTER 3D visible; **opt-in** → 3D boots docked at
00 · OVERWATCH (TARGET ACQUIRED), **0 errors**. **Normal-3D regression** →
intro plays (INBOUND) and lands (panel 1), **0 errors**.

## Carry-forward invariants (Slices 1–5 — adjusted by DG3)

- Static DOM content floor (Seam 2, 43 tests green) — this slice builds ON it.
- Direction-aware scroll arrival, panels measurable, reveal-card clamp,
  GLTF graceful fallback, fly-in session semantics, fast-travel — all only
  on the 3D path; static mode must not register their listeners at all.
- **Amended:** RM now defaults to the static document (DG3); the dampened
  3D-RM path survives behind ENTER 3D and must still work when opted into.

## Locked decisions reference

DG1 boot-time decision, no 3D machinery in static mode · DG2 restyle the
Slice-3 DOM, anchors for nav · DG3 RM → static by default + ENTER 3D opt-in
(amends slice-1 RM invariant) · DG4 npx Playwright fallback spec, WebGL
blocked via init script.

## Cross-references

- Issue: [#8] (slice) · Epic/PRD: [#2]
- Previous slice: [`../005_fast-travel/summary.md`](../005_fast-travel/summary.md)
- Next slice: [#9] e2e hardening + cutover (deploy gate — owner sign-off)
- Files to touch: `v2.html`, `scene/main.js`, `tests/e2e/fallback.spec.mjs`

[#2]: https://github.com/shivamsbajpai/personal_website/issues/2
[#8]: https://github.com/shivamsbajpai/personal_website/issues/8
[#9]: https://github.com/shivamsbajpai/personal_website/issues/9
[PR-12]: https://github.com/shivamsbajpai/personal_website/pull/12
[PR-14]: https://github.com/shivamsbajpai/personal_website/pull/14
[PR-16]: https://github.com/shivamsbajpai/personal_website/pull/16
[PR-18]: https://github.com/shivamsbajpai/personal_website/pull/18
