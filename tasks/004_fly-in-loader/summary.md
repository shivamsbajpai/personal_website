# Slice 4 — cinematic fly-in loader · summary (retrospective)

Closes [#6] · parent epic [#2] · shipped via [PR #16] (merged to `master`)

## Outcome

First visits now open with a **cinematic sweep across the desert** while a
light HUD strip streams the GLTF kit with real per-asset progress. The sweep
lands byte-exactly on the Overwatch dock vantage — the final approach is gated
on asset completion (`flyProgress`, pure + unit-tested) — and the existing
dock-into-INFO transition plays as the arrival. Once per session, skippable by
button / Enter / any scroll gesture; reduced motion never flies.

## Acceptance criteria — outcome

| AC | Status | Where |
|----|--------|-------|
| Fly-in from frame one with light HUD loader | ✅ | INBOUND from first sampled rAF frame; `#intro` strip |
| Loader % = actual asset loading | ✅ | per-GLB ticks 0→13→…→100% under a 200 KB/s throttle |
| Lands at Overwatch, clean handoff | ✅ | gated landing at 7.35s vs 5.2s flight; handoff deltas 0–1px |
| Once per session + skip control | ✅ | sessionStorage; wheel/button/Enter skip verified |
| Reduced motion: no fly-in; 0 console errors | ✅ | instant dock under RM; 0 errors on every pass |

## Artifacts

- `scene/state.js` — `flyProgress(timeFrac, assetFrac)` (DF2)
- `scene/main.js` — bezier fly path, eager per-GLB progress, session/skip/RM
  paths, `infoAmt` boots 0 during the intro
- `v2.html` — `#intro` loader strip + skip button
- `tests/intro.test.js` — 6 gate tests (suite 34)
- [`evidence/`](evidence/) — desktop + mobile mid-flight shots
- Plan: [`plan.md`](plan.md) · Design: [`design.md`](design.md) · Resume: [`INDEX.md`](INDEX.md)

## Gotchas to carry forward (into Slice 5 / [#7])

1. **The heuristic HTTP cache bites *imported* modules even with a page-URL
   bust.** A cached `state.js` (fetched when its mtime was days old → hours of
   heuristic freshness) was served without revalidation while `main.js` came
   fresh — "no export named X" with disk and server both correct. Verify with
   the cache disabled via CDP, and note `Network.setCacheDisabled` does
   nothing until after `Network.enable`. Production is fine (Pages serves
   `max-age=600`), but **any slice that edits `state.js` should re-check with
   cache off**.
2. **`LoadingManager.onProgress` is non-monotonic while items queue**
   (`itemsTotal` grows). A `done/total` counter over a known asset list is
   monotonic by construction — DF3 was amended accordingly.
3. **The intro is a pre-state-machine phase**: fast-travel (#7) must either
   wait for `intro.active === false` or treat a fast-travel invocation as a
   skip (recommended: skip — same as the scroll gesture).

## Deferred / follow-ups

- **Owner tuning call (flagged in PR #16):** the drifting-dust field reads as
  scattered specks against the sky from the aerial vantage; lever = fade dust
  in with the landing. Accepted as-shipped at merge; revisit on demand.
- Audio/SFX for the entrance — epic future-release TODO.
- Repo still has no `.gitignore` — carried from slices 2–3.

[#2]: https://github.com/shivamsbajpai/personal_website/issues/2
[#6]: https://github.com/shivamsbajpai/personal_website/issues/6
[#7]: https://github.com/shivamsbajpai/personal_website/issues/7
[PR #16]: https://github.com/shivamsbajpai/personal_website/pull/16
