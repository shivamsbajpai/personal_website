# Slice 5 — fast-travel: nav + fire control (⌘K) + keyboard · INDEX (resume protocol)

Task: fast-travel + command palette + keyboard nav · **Closes [#7]** · parent epic [#2] · **DONE — merged via [PR-18]**, retrospective in [`summary.md`](summary.md)
Plan: [`plan.md`](plan.md) · Design: [`design.md`](design.md)
Branch: `task/7-fast-travel` · Preview: server on :8099 → `/v2.html`
Blocked-by: #3 (DONE); #4/#5/#6 also shipped ([PR-12], [PR-14], [PR-16])

## Status

| # | Step | State | Commit | Notes |
|---|------|-------|--------|-------|
| 1 | Pure auto-travel + unit tests (DT1) | DONE ✅ | 6dff145 | 9 tests; suite now 43 |
| 2 | Fire-control palette UI (DT2) | DONE ✅ | 942d7a8 | `#fc` overlay; key-field-ranked filter (see defect) |
| 3 | Nav strip (DT3) | DONE ✅ | 942d7a8 | indices + ⌘K; `.cur` highlight; indices hidden <560px |
| 4 | Keyboard + a11y wiring (DT4) | DONE ✅ | 942d7a8 | ⌘K/Ctrl+K, Esc, wrap arrows, Enter, focus in/restore; intro skips first |
| 5 | Utility actions (DT5) | DONE ✅ | 942d7a8 | clipboard verified by read-back; HUD toast |
| 6 | Local verification | DONE ✅ | — | see evidence block; screenshots in [`evidence/`](evidence/) |
| 7 | PR + owner gate | DONE ✅ | e298a84 | [PR-18] merged (owner-authorized), #7 auto-closed |

## Plan defects observed

**Naive substring filter selected the wrong checkpoint.** Typing "work"
matched Overwatch first — its panel title is "I build things that **work**…"
— so Enter no-op'd at checkpoint 0 instead of jumping to `02 · WORK` (caught
by the reduced-motion verification pass, which jumps by typed name). Fix:
rank key-field matches (`02 · WORK`) above title-text matches in `fcRender`
(stable sort by a 0/1 score). Lesson: palette filters over prose need field
ranking, not flat substring search.

**Step-6 evidence (this session):** `node --test` → **43 pass / 0 fail**;
debug-hook grep clean; `index.html` untouched. Browser (CDP cache off —
`state.js` changed): **⌘K** opens with focus in input, 9 items; filter
"about" → Enter flies (TRAVERSING) and **docks at 03 · ABOUT** (panel 1, nav
highlight `3`). **Backward nav-button jump** 3→1 docks at 01 · EXPERIENCE,
lands at top (`translateY(0)`). **Ctrl+K** + ArrowUp wrap + Enter on "Copy
email" → clipboard read-back `ssbajpai9@gmail.com` exact + toast shown.
**Esc** closes, focus restored. **Résumé** action opens
`/latest_resume.pdf` in a new tab. **Arrow-key reading** works after close;
**wheel travel** regression ✓. **Intro interplay:** ⌘K mid-INBOUND skips the
fly-in and opens the palette; palette jump to COMMS works post-skip.
**Mobile 390×844:** indices hidden, ⌘K button visible, palette 358px wide
and usable. **Reduced motion:** palette jump "work" → docks at 02 · WORK
(post-fix). **0 console errors/warnings across the session.**

## Acceptance criteria → step

- ⌘K + nav control open fire control; selection flies + docks → 2, 3, 4
- Nav links jump to correct checkpoints → 3, 6
- Full keyboard operation; arrow/scroll travel intact → 4, 6
- Résumé/GitHub/lomasa-ai/copy-email actions work → 5, 6
- 0 console errors; owner previews → 6, 7

## Resume sequence for next session

**TASK COMPLETE — nothing to resume.** [PR-18] merged to `master` (`e298a84`),
#7 auto-closed, retrospective in [`summary.md`](summary.md). A fresh session
should move to **Slice 6 ([#8], no-WebGL / reduce-motion static fallback)** —
start at `tasks/006_<slug>/`. Carry the gotchas from `summary.md` (verify
palette jumps by typed *name*; fallback nav mirrors land-at-top semantics).


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
[PR-18]: https://github.com/shivamsbajpai/personal_website/pull/18
