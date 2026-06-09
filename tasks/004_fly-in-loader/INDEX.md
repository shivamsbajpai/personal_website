# Slice 4 — cinematic fly-in loader · INDEX (resume protocol)

Task: fly-in loader streaming assets into Overwatch · **Closes [#6]** · parent epic [#2] · **DONE — merged via [PR-16]**, retrospective in [`summary.md`](summary.md)
Plan: [`plan.md`](plan.md) · Design: [`design.md`](design.md)
Branch: `task/6-fly-in-loader` · Preview: `python3 -m http.server 8099` → `/v2.html`
Blocked-by: #3, #4 (DONE — [PR-10], [PR-12]); #5 also shipped ([PR-14])

## Status

| # | Step | State | Commit | Notes |
|---|------|-------|--------|-------|
| 1 | `flyProgress` helper + unit tests (DF2) | DONE ✅ | 1e3fed4 | 6 tests; suite now 34 |
| 2 | Intro overlay UI (loader + skip) | DONE ✅ | d76f9cd | `#intro` strip + bar + % + `skip ⏎` |
| 3 | Fly-in path + loop integration (DF1) | DONE ✅ | d76f9cd | bezier ends byte-exactly at `vantages[0]`; handoff deltas 0–1px |
| 4 | Real asset progress (DF3) | DONE ✅ | d76f9cd | per-GLB `done/total` (simpler + more robust than LoadingManager's growing itemsTotal); `finally` → 1 |
| 5 | Session / skip / reduced-motion paths (DF4) | DONE ✅ | d76f9cd | wheel/Enter/button skip; sessionStorage; RM never flies |
| 6 | Local verification | DONE ✅ | — | see evidence block; screenshots in [`evidence/`](evidence/) |
| 7 | PR + owner gate | DONE ✅ | cbf4663 | [PR-16] merged (owner-authorized), #6 auto-closed; dust-field tuning call logged in summary |

## Acceptance criteria → step

- Fly-in from frame one with light HUD loader → 2, 3
- Loader % = actual asset loading → 1, 4
- Lands at Overwatch, clean handoff → 3, 6
- Once per session + skip control → 5
- Reduced motion: no fly-in; 0 console errors; owner preview → 5, 6, 7

## Resume sequence for next session

**TASK COMPLETE — nothing to resume.** [PR-16] merged to `master` (`cbf4663`),
#6 auto-closed, retrospective in [`summary.md`](summary.md). A fresh session
should move to **Slice 5 ([#7], fast-travel / command palette)** — start at
`tasks/005_<slug>/`. Carry the gotchas from `summary.md` (CDP cache-off when
editing `state.js`; fast-travel during the intro should act as a skip).

## Plan defects observed

**The heuristic HTTP cache bites *imported* modules even with a page-URL bust.**
`v2.html?b=N` re-fetches `main.js` (recent mtime → tiny heuristic TTL), but
`./state.js`'s cached copy — fetched hours earlier when its mtime was days old —
had a multi-hour heuristic freshness and was served **without revalidation**,
so the browser threw "no export named flyProgress" while disk and server were
both correct. Diagnosis: `fetch(url)` vs `fetch(url, {cache:'no-store'})`
returned different byte lengths. Fix for verification: disable the cache via
CDP — and note `Network.setCacheDisabled` only works **after**
`Network.enable` (the first attempt silently did nothing). Production is
unaffected (GitHub Pages serves `Cache-Control: max-age=600`).

**DF3 amended: per-GLB counter instead of `LoadingManager.onProgress`.** The
manager's `itemsTotal` grows as items queue, producing non-monotonic fractions.
A `done/names.length` counter over the 8 known GLBs is monotonic by
construction and needs no manager plumbing; `finally { assetFrac = 1 }` keeps
the graceful-fallback landing.

**Step-6 evidence (this session):** `node --test` → **34 pass / 0 fail**;
debug-hook grep clean. All browser checks with CDP cache disabled, fresh
`sessionStorage` per case. **First load (desktop 1280×800):** INBOUND from the
first sampled frame, loader on; rAF continuity trace across the handoff →
**per-frame deltas 0–1px** (no camera jump), ends TARGET ACQUIRED / panel 1.
**Throttled (200 KB/s ≈ 7s kit):** loader steps 0→13→25→38→50→63→75→88→100%
(real per-GLB progress) and the landing **waits** — handoff at 7.35s vs the
5.2s flight. **Replay (same session):** no intro, instant dock. **Skip:**
wheel mid-flight → instant dock at 00 · OVERWATCH, session marked; button
skip ✓; post-skip travel to 01 · EXPERIENCE works. **Reduced motion:** no
fly-in, instant dock. **Mobile 390×844:** intro plays with visible loader,
lands clean. **0 console errors/warnings on every pass.**

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
[PR-16]: https://github.com/shivamsbajpai/personal_website/pull/16
