# Plan — Scroll cadence: 3-stroke travel + 2-stroke friction (Closes [#23])

## Goal

On a phone, crossing a checkpoint gap takes ~4+ full swipes (travel is
scrubbed at 2400 raw px/gap), while leaving a checkpoint is frictionless —
one pixel past the content end releases into travel, so visitors skim across
the map without reading. Replace pixel-scrubbed travel with a
**stroke-counted cadence**, and add **boundary friction** so content holds
focus:

- travel = exactly **3 strokes** per gap (lands directly on content);
- arrival absorbs **2 strokes** (swipe-spam must not scroll the fresh panel);
- exit from a content edge (top or bottom) absorbs **2 strokes** before the
  3rd releases into travel;
- reading inside content stays frictionless; moving content re-arms the gate.

A *stroke* = one touch swipe (touchstart→touchend), one wheel burst
(quiet-gap / px-chunk bounded), or one keypress.

## Baseline

Stacked on the slice-7 cutover branch (`task/9-e2e-cutover`, [PR-22]) — the
e2e specs this task must update ([`tests/e2e/mobile.spec.mjs`](../../tests/e2e/mobile.spec.mjs),
[`tests/e2e/journey.spec.mjs`](../../tests/e2e/journey.spec.mjs)) exist only
there. PR base = `task/9-e2e-cutover`; retarget to `master` when [#9] merges.

## Steps

1. **Pure state machine** ([`scene/state.js`](../../scene/state.js)):
   add `settle`/`arm` counters + `commitStroke()`; `applyScroll()` becomes
   live reading-only (frozen while `settle > 0`, no-op while TRAVELLING).
   Travel advances ⅓/stroke; releasing stroke counts as travel stroke 1.
2. **Unit tests** ([`tests/state.test.js`](../../tests/state.test.js)):
   rewrite for the new API; cover AC-1…AC-5 sequences (forward, backward,
   cancel, settle, re-arm, fast-travel bypass, contentMax=0).
3. **Input wiring** ([`scene/main.js`](../../scene/main.js)): stroke
   tracker (touch end / wheel burst / keypress), commit threshold, wheel
   re-arm chunk, keyboard rate guard; absorbed-stroke visual nudge; drop
   `TRAVEL_LEN`.
4. **Copy + hint feedback** ([`index.html`](../../index.html)): update
   "one more scroll travels…" hints to the new cadence; pulse the hint /
   lock chip on absorbed strokes.
5. **E2E** : update mobile + journey specs for the cadence; full suites
   (`node --test`, `npx playwright test`) green.
6. **PR** with exhaustive test plan; leave open for owner merge.

## AC mapping

| AC | Step(s) |
|---|---|
| AC-1 3-stroke travel, 2-stroke exit (both directions) | 1, 2, 5 |
| AC-2 arrival absorbs 2 strokes | 1, 2, 5 |
| AC-3 reading frictionless, moving re-arms | 1, 2 |
| AC-4 friction at both edges | 1, 2 |
| AC-5 fast-travel unaffected, no settle | 1, 2 |
| AC-6 touch + wheel + keyboard; suites green | 3, 5 |

## Out of scope

- The reduced-motion / no-WebGL static document (normal browser scroll,
  untouched).
- Desktop-specific tuning beyond the unified stroke model (wheel bursts
  approximate today's feel via the re-arm chunk).
- Audio/haptic feedback on absorbed strokes.

[#9]: https://github.com/shivamsbajpai/personal_website/issues/9
[#23]: https://github.com/shivamsbajpai/personal_website/issues/23
[PR-22]: https://github.com/shivamsbajpai/personal_website/pull/22
