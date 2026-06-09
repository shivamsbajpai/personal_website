# Slice 5 — Fast-travel: nav + fire control (⌘K) + keyboard · plan

Closes [#7] · parent epic [#2] · branch `task/7-fast-travel`
Design: [`design.md`](design.md) · Resume: [`INDEX.md`](INDEX.md)

## Goal

Visitors can jump straight to any checkpoint: nav links in the topbar and a
recon-themed command palette ("FIRE CONTROL", ⌘K) fly the camera to the chosen
target and dock into INFO mode. Fully keyboard-operable; the palette keeps the
utility actions (résumé, GitHub, lomasa-ai, copy email).

## Steps

1. **Pure auto-travel in the state machine + unit tests** (DT1) —
   `startFastTravel(state, target, count)` and `tickAutoTravel(state, dt)` in
   `scene/state.js`; `tests/fasttravel.test.js` covers start/arrival/clamping/
   no-op/duration scaling/scroll-ignored-during-auto.
2. **Fire-control palette UI** (DT2) — overlay + input + listbox in `v2.html`,
   recon-themed; items = 5 checkpoints + 4 utility actions; type-to-filter.
3. **Nav strip** (DT3) — checkpoint numbers + a `⌘K FIRE CONTROL` button in
   the topbar; clicking a number fast-travels.
4. **Keyboard + a11y wiring** (DT4) — ⌘K/Ctrl+K toggle, Esc close, ArrowUp/
   Down selection, Enter activate, focus into input on open / restored on
   close; `role=dialog aria-modal`, listbox/option semantics; travel keys
   suppressed while the palette is open; palette/nav during the intro acts as
   a skip first (slice-4 note).
5. **Utility actions** (DT5) — open résumé / GitHub / lomasa-ai (same hrefs as
   the comms panel, verbatim facts); copy email via clipboard with a small
   HUD toast confirmation.
6. **Local verification** — `node --test`; Playwright: palette open/filter/
   keyboard-activate flies + docks (forward and backward jumps), nav-link
   jump, utility actions (clipboard read-back), Esc/focus behavior, intro
   interplay (⌘K during fly-in skips then opens), arrow/scroll travel
   regression, mobile + reduced-motion passes, 0 console errors; evidence.
7. **PR + owner gate** — full test plan with inline evidence; merge authorized
   for this session; post-merge close-out.

## Acceptance criteria → step

- ⌘K + nav control open fire control; selection flies + docks → 2, 3, 4
- Nav links jump to the correct checkpoints → 3, 6
- Full keyboard operation; arrow/scroll travel intact → 4, 6
- Résumé/GitHub/lomasa-ai/copy-email work from the palette → 5, 6
- 0 console errors; owner previews locally → 6, 7

## Out of scope

- Static fallback ([#8]) and cutover ([#9]).
- Re-theming the *old* site's palette (`index.html` untouched).
- URL hash routing / deep links (not in the AC; candidate for #9 polish).

[#2]: https://github.com/shivamsbajpai/personal_website/issues/2
[#7]: https://github.com/shivamsbajpai/personal_website/issues/7
[#8]: https://github.com/shivamsbajpai/personal_website/issues/8
[#9]: https://github.com/shivamsbajpai/personal_website/issues/9
