# Slice 5 — fast-travel: nav + fire control (⌘K) + keyboard · INDEX (resume protocol)

Task: fast-travel + command palette + keyboard nav · **Closes [#7]** · parent epic [#2]
Plan: [`plan.md`](plan.md) · Design: [`design.md`](design.md)
Branch: `task/7-fast-travel` · Preview: server on :8099 → `/v2.html`
Blocked-by: #3 (DONE); #4/#5/#6 also shipped ([PR-12], [PR-14], [PR-16])

## Status

| # | Step | State | Commit | Notes |
|---|------|-------|--------|-------|
| 1 | Pure auto-travel + unit tests (DT1) | pending | — | `startFastTravel` / `tickAutoTravel` |
| 2 | Fire-control palette UI (DT2) | pending | — | `#fc` overlay in `v2.html` |
| 3 | Nav strip (DT3) | pending | — | topbar indices + ⌘K button |
| 4 | Keyboard + a11y wiring (DT4) | pending | — | intro acts as skip first |
| 5 | Utility actions (DT5) | pending | — | résumé/GitHub/lomasa-ai/copy email + toast |
| 6 | Local verification | pending | — | fwd+bwd jumps, keyboard, clipboard, intro interplay, mobile, RM |
| 7 | PR + owner gate | pending | — | merge authorized for this session |

## Acceptance criteria → step

- ⌘K + nav control open fire control; selection flies + docks → 2, 3, 4
- Nav links jump to correct checkpoints → 3, 6
- Full keyboard operation; arrow/scroll travel intact → 4, 6
- Résumé/GitHub/lomasa-ai/copy-email actions work → 5, 6
- 0 console errors; owner previews → 6, 7

## Resume sequence for next session

1. `cd ~/projects/personal_website && git checkout task/7-fast-travel`
2. Pre-flight: `node --test` (34 must pass); server on :8099 (`lsof -iTCP:8099`
   — a leftover server likely already serves this repo from disk).
3. Start at the first non-DONE step. Integration points in `scene/main.js`:
   `scroll()` (~495, has the intro-skip guard), keydown handler (~515),
   topbar markup in `v2.html` (~176), `loop()` state advance (~615),
   `endIntro()` (~510 region).
4. **Gotchas:** editing `scene/state.js` → verify with CDP cache disabled
   (`Network.enable` BEFORE `Network.setCacheDisabled` — slice-4 defect);
   bust the page URL (`v2.html?b=N`); live rAF traces for transitional UI;
   `sessionStorage` persists across Playwright reloads (clear it to re-test
   first-load); fast-travel during the intro must skip first.

## Plan defects observed

*(log as they happen, not at session wrap)*

## Carry-forward invariants (Slices 1–4 — do NOT regress)

- Direction-aware *scroll* arrival (fast-travel deliberately lands at top —
  DT1); reduced-motion keeps the travel loop; panels measurable on arrival;
  static DOM content floor; reveal-card clamp; GLTF graceful fallback;
  fly-in once-per-session + skip semantics (34 tests must keep passing).

## Locked decisions reference

DT1 pure auto-travel, scroll ignored while `auto`, lands at top ·
DT2 fresh recon palette (`#fc`), facts verbatim · DT3 topbar indices + ⌘K ·
DT4 ⌘K/Ctrl+K, Esc, arrows+Enter, focus in/restore, intro-skip-first ·
DT5 clipboard + HUD toast.

## Cross-references

- Issue: [#7] (slice) · Epic/PRD: [#2]
- Previous slice: [`../004_fly-in-loader/summary.md`](../004_fly-in-loader/summary.md)
- Next slices: [#8] fallback, [#9] cutover
- Files to touch: `v2.html`, `scene/main.js`, `scene/state.js`, `tests/fasttravel.test.js`

[#2]: https://github.com/shivamsbajpai/personal_website/issues/2
[#7]: https://github.com/shivamsbajpai/personal_website/issues/7
[#8]: https://github.com/shivamsbajpai/personal_website/issues/8
[#9]: https://github.com/shivamsbajpai/personal_website/issues/9
[PR-12]: https://github.com/shivamsbajpai/personal_website/pull/12
[PR-14]: https://github.com/shivamsbajpai/personal_website/pull/14
[PR-16]: https://github.com/shivamsbajpai/personal_website/pull/16
