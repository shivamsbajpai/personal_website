# Design — scroll cadence ([#23])

Decisions local to this task. The optic state machine itself is locked by
[`pm-docs`](../../pm-docs) / slice 1; this task changes only its input
quantum (px → strokes) and adds boundary friction.

## D1 — Strokes, not pixels, are the travel quantum

**Choice:** travel advances exactly ⅓ of a gap per *stroke*; `TRAVEL_LEN`
(2400 px/gap) is removed. A stroke = one touch swipe, one wheel burst, or
one keypress. Live px deltas no longer scrub `travelT`.

**Why:** the user-facing requirement is deterministic ("3 scrolls moves a
checkpoint"); px-scrubbing makes the swipe count depend on screen size and
swipe length (~4–6 on a phone). The render loop already low-passes
`cameraFloat` (double smoothing, [`scene/main.js`](../../scene/main.js)
`renderFloat`), so ⅓-gap steps glide — the same mechanism that smoothed
~10%-gap wheel notches before.

**Alternatives:** per-device `TRAVEL_LEN` tuning (still indeterminate);
gesture-counted on touch only (forks the state machine per input; desktop
keeps the unreadable frictionless exit).

## D2 — Two counters: `settle` (arrival) and `arm` (edge release)

> **2026-06-10 amendment:** after feel-testing the live /v2 preview on a real
> phone, the owner tuned both gates from 2 taps to **1** (`EDGE_TAPS =
> SETTLE_TAPS = 1`). The machine, unit suite, and e2e spec are
> constant-driven, so only the two constants changed; everything below reads
> "EDGE_TAPS/SETTLE_TAPS" where it says a count.

**Choice:** `settle = 2` set on scroll-travel arrival absorbs *all* strokes
while > 0 (panel frozen). `arm` counts absorbed *edge pushes*: a stroke that
could not move content and pushes past a pinned edge decrements it; at 0 the
next push releases into travel (and itself counts as travel stroke 1 of 3,
`travelT = ⅓`). Any stroke that moves content resets `arm = 2`. Settle
strokes also decrement `arm`, so backing out right after arrival is
2 absorbed strokes total, not 4.

**Why:** matches the spec exactly — "first 2 scrolls do not scroll the
content", "stays there for 2 more scrolls… on both the side". Two counters
because the two gates differ in scope: settle freezes everything
(direction-agnostic spam guard); arm gates only the leave direction so
reading back into content stays frictionless.

**Alternatives:** one shared counter (either freezes mid-content reading or
makes post-arrival back-out cost 4 strokes — both wrong); time-based cooldown
(indeterminate under slow deliberate scrolling, the exact case to protect).

## D3 — Stroke detection lives in `main.js`; the machine stays pure

**Choice:** [`scene/state.js`](../../scene/state.js) gains
`commitStroke(state, dir, moved, contentMax, count)` next to a
reading-only `applyScroll(state, delta, contentMax)`. `main.js` groups raw
events into strokes: touch = start→end; wheel = burst ending after 250 ms
quiet **or** re-armed every 800 px within a continuous burst; keyboard = one
stroke per keypress, rate-capped. A stroke commits once, when its
accumulated |Δ| crosses 48 px (immediate feedback mid-swipe), else at
stroke end if it moved content.

**Why:** keeps the machine unit-testable with no DOM/timing deps (slice-1
invariant); the messy timing heuristics stay at the event layer. The 800 px
re-arm keeps continuous wheel/trackpad spinning at ≈ today's feel
(≈ 2400 px/gap) while discrete flicks get 1 stroke each.

**Alternatives:** timers/gesture state inside `state.js` (kills pure unit
tests); wheel burst = quiet-gap only (continuous spinning would never commit
a 2nd stroke — "scrolling does nothing" deadlock).

## D4 — Boot is not an arrival; fast-travel skips friction entirely

**Choice:** `initState()` has `settle = 0, arm = 2` (hero is immediately
scrollable; leaving it still costs 2 pushes). Fast-travel ([DT1], slice 5)
keeps ignoring scroll mid-flight and lands `settle = 0, arm = 2` — a
deliberate jump, not swipe-spam; the reader should scroll the target
immediately.

**Why:** settle exists to soak up *leftover momentum from repeated travel
swipes*; neither boot nor a palette click has any.

## D5 — Absorbed strokes get a visual nudge, not new chrome

**Choice:** an absorbed stroke pulses the active panel's existing affordance
(`.scroll-hint` for bottom pushes, the `.lock` chip for top pushes) via a
re-triggered CSS animation; hint copy drops "one more scroll".

**Why:** with zero feedback, deliberately eaten input reads as "site is
broken". Reusing existing chrome keeps the HUD untouched and costs ~10
lines; a counter overlay ("2 more to release") is more honest but adds
chrome the art direction doesn't want.

[#23]: https://github.com/shivamsbajpai/personal_website/issues/23
[DT1]: ../005_fast-travel/design.md
