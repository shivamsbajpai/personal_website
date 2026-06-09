# Slice 5 — fast-travel: nav + fire control (⌘K) + keyboard · summary (retrospective)

Closes [#7] · parent epic [#2] · shipped via [PR #18] (merged to `master`)

## Outcome

Visitors are no longer forced through the journey linearly: topbar checkpoint
indices and the **FIRE CONTROL** palette (⌘K / Ctrl+K) fly the camera to any
checkpoint and dock into INFO mode, fully keyboard-operable, with the utility
actions (résumé / GitHub / lomasa-ai / copy email + toast) on board. The core
is a pure state-machine extension — auto TRAVELLING legs time-ticked by the
loop — so the flight, HUD, holo fades, and dock transition all reuse the
owner-approved pipeline.

## Acceptance criteria — outcome

| AC | Status | Where |
|----|--------|-------|
| ⌘K + nav open fire control; selection flies + docks | ✅ | verified fwd (palette → 03) and bwd (nav → 01, lands at top) |
| Nav links jump to correct checkpoints | ✅ | indices + `.cur` highlight tracking `app.cp` |
| Full keyboard operation; arrow/scroll travel intact | ✅ | toggle/Esc/wrap-arrows/Enter/focus-restore; regressions checked |
| Résumé/GitHub/lomasa-ai/copy-email work | ✅ | clipboard read-back exact; PDF popup captured |
| 0 console errors; owner previews | ✅ | 0 across all passes; owner-authorized merge |

## Artifacts

- `scene/state.js` — `startFastTravel` / `tickAutoTravel` (DT1)
- `scene/main.js` — palette/nav/keyboard/toast wiring + loop auto-tick
- `v2.html` — `#fc` palette, topbar nav, `#toast`
- `tests/fasttravel.test.js` — 9 tests (suite 43)
- [`evidence/`](evidence/) — palette desktop/mobile + docked-via-jump shots
- Plan: [`plan.md`](plan.md) · Design: [`design.md`](design.md) · Resume: [`INDEX.md`](INDEX.md)

## Gotchas to carry forward (into Slice 6 / [#8])

1. **Palette filters over prose need field ranking.** Flat substring search
   selected Overwatch for "work" (its title contains the word) — key-field
   matches must outrank title-text matches. Caught by the reduced-motion
   pass, which navigates by typed name; worth keeping that pattern (verify
   by *name*, not by index) in future palette tests.
2. **Deliberate jumps land at the top in both directions** (DT1) — the
   read-up-on-reverse invariant protects scroll-through only. The static
   fallback (#8) should mirror this semantics for its anchor nav.
3. **Input layering order matters:** the travel keydown handler guards on
   `fcIsOpen()` and the intro guard; the palette registers its own listener.
   New overlays (#8's fallback banner?) should follow the same pattern
   rather than adding cross-handler flags.

## Deferred / follow-ups

- URL hash deep-links to checkpoints — candidate polish for #9 (cutover).
- Repo `.gitignore` still missing — carried since slice 2.

[#7]: https://github.com/shivamsbajpai/personal_website/issues/7
[#2]: https://github.com/shivamsbajpai/personal_website/issues/2
[#8]: https://github.com/shivamsbajpai/personal_website/issues/8
[PR #18]: https://github.com/shivamsbajpai/personal_website/pull/18
