# Task 008 — Scroll cadence: 3-stroke travel + friction · Closes [#23]

Plan: [`plan.md`](plan.md) · Design: [`design.md`](design.md) ·
Branch `task/23-scroll-cadence` (stacked on `task/9-e2e-cutover`, [PR-22])

## Status

| # | Step | State | Commit | Notes |
|---|------|-------|--------|-------|
| 1 | state.js: settle/arm + commitStroke | DONE spec ✅ code ✅ | (feat) | + `PIN_SLOP` jitter tolerance (defect 2) |
| 2 | unit tests rewrite | DONE spec ✅ code ✅ | (feat) | 46 pass, incl. jitter regression |
| 3 | main.js stroke wiring | DONE spec ✅ code ✅ | (feat) | + `window.__optic` read-only debug handle |
| 4 | hint copy + absorbed-stroke pulse | DONE spec ✅ code ✅ | (feat) | nudge bobs UP only (defect 1) |
| 5 | e2e updates + full suites | DONE spec ✅ code ✅ | (feat) | 9 e2e pass; cadence spec added |
| 6 | PR (base task/9-e2e-cutover) | DONE — [PR-24] open, awaiting owner | 0070574 | retargets to `master` when [PR-22] merges |

## AC → step mapping

AC-1 → 1,2,5 · AC-2 → 1,2,5 · AC-3 → 1,2 · AC-4 → 1,2 · AC-5 → 1,2 ·
AC-6 → 3,5 (full AC text in [#23])

## Resume sequence for next session

1. All steps DONE; [PR-24] is open awaiting the **owner's** review+merge
   (PR creation needs the keychain `gh` auth — `shivamsbajpai`; the `.env`
   token `claudeforssb` can file issues but is not a collaborator).
2. [PR-22] (cutover) merges first; GitHub auto-retargets [PR-24] to `master`.
   If [PR-24]'s diff looks polluted with slice-7 commits, rebase onto `master`
   after the cutover merge.
3. Post-merge: write `summary.md`, verify [#23] auto-closed, done. Owner
   feel-check on a real phone is the one open test-plan box.
4. Suites if touching code again: `node --test`, `npx playwright test`
   (a leftover `python3 -m http.server 8099` may already serve the repo —
   [`probe.mjs`](probe.mjs) uses it for live state traces via `window.__optic`).

## Plan defects observed

1. **Nudge animation corrupted the measurement it acknowledged.** The D5
   pulse originally translated the hint *down* 3px. The hint is the last
   child of `.panel-scroll`, and a downward transform on the last child
   extends the scrollable overflow — so `contentMax` breathed ±3px for the
   animation's 380ms, which the gate logic read as real content movement and
   re-armed (`arm` reset on every second tap; the edge never released — found
   live via [`probe.mjs`](probe.mjs), `rs: 185→187→186`). Fix: bob **up**
   (`translateY(-3px)`), which stays inside existing bounds.
2. **The plan assumed `contentMax` is stable; it's a live DOM measurement.**
   Even without the nudge bug, animations/font loads/mobile URL-bar resizes
   jitter it by a few px, letting an edge push "move" 1–2px and re-arm
   forever. Fix in the machine, not the caller: `PIN_SLOP` (4px) on the
   pinned-edge test in `commitStroke`, `MOVE_SLOP` (3px) on the
   cumulative-movement test in main.js, plus a jitter regression unit test.

## Locked decisions (see [`design.md`](design.md))

- D1 stroke quantum: ⅓ gap per stroke; `TRAVEL_LEN` removed
- D2 `settle=2` arrival freeze + `arm=2` edge release; settle decrements arm
- D3 stroke detection in main.js (touch end / wheel 250 ms quiet or 800 px
  re-arm / keypress, 48 px commit threshold); state.js stays pure
- D4 boot & fast-travel skip settle; both keep `arm=2`
- D5 absorbed strokes pulse existing hint/lock chrome; copy updated

## Cross-references

- Issue [#23] · Epic [#2] · Stacked on [#9] / [PR-22]
- Machine: [`scene/state.js`](../../scene/state.js) · wiring:
  [`scene/main.js`](../../scene/main.js) · panels/hints:
  [`index.html`](../../index.html)
- Suites: [`tests/state.test.js`](../../tests/state.test.js),
  [`tests/e2e/mobile.spec.mjs`](../../tests/e2e/mobile.spec.mjs),
  [`tests/e2e/journey.spec.mjs`](../../tests/e2e/journey.spec.mjs)

[#2]: https://github.com/shivamsbajpai/personal_website/issues/2
[#9]: https://github.com/shivamsbajpai/personal_website/issues/9
[#23]: https://github.com/shivamsbajpai/personal_website/issues/23
[PR-22]: https://github.com/shivamsbajpai/personal_website/pull/22

[PR-24]: https://github.com/shivamsbajpai/personal_website/pull/24
