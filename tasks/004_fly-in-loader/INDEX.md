# Slice 4 — cinematic fly-in loader · INDEX (resume protocol)

Task: fly-in loader streaming assets into Overwatch · **Closes [#6]** · parent epic [#2]
Plan: [`plan.md`](plan.md) · Design: [`design.md`](design.md)
Branch: `task/6-fly-in-loader` · Preview: `python3 -m http.server 8099` → `/v2.html`
Blocked-by: #3, #4 (DONE — [PR-10], [PR-12]); #5 also shipped ([PR-14])

## Status

| # | Step | State | Commit | Notes |
|---|------|-------|--------|-------|
| 1 | `flyProgress` helper + unit tests (DF2) | pending | — | |
| 2 | Intro overlay UI (loader + skip) | pending | — | |
| 3 | Fly-in path + loop integration (DF1) | pending | — | ends byte-exactly at `vantages[0]` |
| 4 | Real asset progress via LoadingManager (DF3) | pending | — | eager only when intro plays |
| 5 | Session / skip / reduced-motion paths (DF4) | pending | — | |
| 6 | Local verification | pending | — | handoff rAF trace; session replay; skip; RM; mobile |
| 7 | PR + owner gate | pending | — | merge authorized for this session |

## Acceptance criteria → step

- Fly-in from frame one with light HUD loader → 2, 3
- Loader % = actual asset loading → 1, 4
- Lands at Overwatch, clean handoff → 3, 6
- Once per session + skip control → 5
- Reduced motion: no fly-in; 0 console errors; owner preview → 5, 6, 7

## Resume sequence for next session

1. `cd ~/projects/personal_website && git checkout task/6-fly-in-loader`
2. Pre-flight: `node --test` (28 must pass); server on :8099 (check
   `lsof -iTCP:8099` — likely already running; it serves from disk).
3. Start at the first non-DONE step. Key integration points in
   `scene/main.js`: `scheduleOutpostLoad()`/`loadOutposts()` (~line 435),
   `vantages` (~460), `loop()` camera block + `targetInfo` (~600), `booted`
   flip (~666). `infoAmt` must init to 0 when the intro will play.
4. Gotchas: bust the **page URL** (`v2.html?b=N`) for module edits; verify
   the handoff with a **live rAF trace** (camera position per frame across
   the intro→loop boundary — no jump); `sessionStorage` persists across
   reloads in one Playwright page — use a fresh context or clear it to
   re-test first-load.

## Plan defects observed

*(log as they happen, not at session wrap)*

## Carry-forward invariants (Slices 1–3 — do NOT regress)

- Direction-aware travel arrival; reduced-motion keeps the travel loop;
  panels measurable on arrival; static DOM content floor (28 tests must pass).
- Reveal-card screen-edge clamp; sunny lighting + shadows; GLTF graceful
  procedural fallback (the intro's eager load must keep the catch path).
- Zero-budget checkpoints exist (COMMS `contentMax = 0`) — slice-3 lesson.

## Locked decisions reference

DF1 camera-only intro phase, dock transition = landing beat, `infoAmt` boots 0 ·
DF2 `flyProgress = min(easeInOut(t), 0.85 + 0.15·asset)` pure in `state.js` ·
DF3 eager LoadingManager only when intro plays; catch → `assetFrac = 1` ·
DF4 sessionStorage once-per-session (try/catch), skip = button/Enter/scroll,
reduced motion never flies and never shows the loader.

## Cross-references

- Issue: [#6] (slice) · Epic/PRD: [#2]
- Previous slice: [`../003_content-rehome/summary.md`](../003_content-rehome/summary.md)
- Next slices: [#7] fast-travel, [#8] fallback, [#9] cutover
- Files to touch: `v2.html`, `scene/main.js`, `scene/state.js`, `tests/intro.test.js`

[#2]: https://github.com/shivamsbajpai/personal_website/issues/2
[#6]: https://github.com/shivamsbajpai/personal_website/issues/6
[#7]: https://github.com/shivamsbajpai/personal_website/issues/7
[#8]: https://github.com/shivamsbajpai/personal_website/issues/8
[#9]: https://github.com/shivamsbajpai/personal_website/issues/9
[PR-10]: https://github.com/shivamsbajpai/personal_website/pull/10
[PR-12]: https://github.com/shivamsbajpai/personal_website/pull/12
[PR-14]: https://github.com/shivamsbajpai/personal_website/pull/14
