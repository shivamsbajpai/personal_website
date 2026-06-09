# Task 008 — scroll cadence · summary (post-merge)

Merged 2026-06-10 via [PR-24] (owner merge), closing [#23]. Live at
shivambajpai.com. Built in one day across five owner feedback loops, with
three /v2 staging deploys ([PR-25], [PR-26], [PR-27]) between the PR opening
and its merge.

## What shipped

Stroke-counted cadence in the pure optic machine
([`scene/state.js`](../../scene/state.js)) + event→stroke grouping in
[`scene/main.js`](../../scene/main.js):

- **Travel = 3 strokes/gap** (touch swipe / wheel burst / keypress);
  wheel/trackpad additionally **scrub an in-flight travel px-true**
  (2400 px/gap) so desktop glides instead of stepping.
- **Gates**: a pinned content edge absorbs `EDGE_TAPS` strokes before
  releasing; arrival absorbs `SETTLE_TAPS` whole. Both **tuned 2 → 1** after
  the owner's phone feel-test. Moving content re-arms; reading is
  frictionless.
- **Reading glides**: low-passed `renderScroll` toward the stroke-set
  target + iOS-like touch-flick coast (325 ms decel) clamped by pins/settle.
- **Push-intent burst splitting**: a wheel delta spiking 3× the burst's
  running average starts a new stroke, so trackpad pushes whose inertia
  tails overlap each count as one gate tap.
- Absorbed strokes pulse existing hint/lock chrome; `window.__optic()`
  read-only debug handle; suites constant-driven end to end.

## Outcomes vs AC (as amended)

All six ACs verified — unit (48), e2e (9, incl. the constant-driven cadence
spec), and live per-swipe/per-notch traces in the PR bodies. AC counts were
amended in-flight (2 taps → 1) by owner direction; the constant-driven
suites made each retune a two-character diff.

## Gotchas to carry forward

1. **`contentMax` is a live DOM measurement** — it jitters px-scale
   (animations, font loads, URL-bar resize). Never compare it exactly:
   `PIN_SLOP`/`MOVE_SLOP` in the machine/wiring.
2. **A downward CSS transform on `.panel-scroll`'s last child extends
   `scrollHeight`** — the nudge animation was re-arming the very gate it
   acknowledged. Animations inside the scroll surface must bob *up*.
3. **Trackpad bursts never go quiet between pushes** — quiet-gap stroke
   detection alone under-counts user intent; spike detection (3× running
   average) is the discriminator. Mouse notches never spike 3× above
   themselves.
4. **Playwright's loader treats bare `.js` as CJS** (no `"type":"module"`)
   while `node --test` auto-detects ESM — e2e specs import shared constants
   *through the browser* (`page.evaluate(() => import(...))`).
5. **The merge UI auto-closes refs-only linked issues** — happened on all
   three preview merges; reopen-with-comment is routine, check every time.
6. **The harness blocks agent self-merge regardless of verbal
   authorization** — owner runs `! gh pr merge N` in-session; plan handoffs
   around it.
7. Live behavioral verification beat frozen-state checks again: the
   gate-never-releases bug and the stuck desktop travel were only visible in
   per-swipe/per-frame traces ([`probe.mjs`](probe.mjs) + `__optic`).

## Follow-ups

- None blocking. Possible polish: tune `TRAVEL_SCRUB_LEN` / coast decel by
  feel; consider a px-budget (not stroke) gate for wheel if 1-tap still
  reads inconsistent on exotic input devices.

[#23]: https://github.com/shivamsbajpai/personal_website/issues/23
[PR-24]: https://github.com/shivamsbajpai/personal_website/pull/24
[PR-25]: https://github.com/shivamsbajpai/personal_website/pull/25
[PR-26]: https://github.com/shivamsbajpai/personal_website/pull/26
[PR-27]: https://github.com/shivamsbajpai/personal_website/pull/27
