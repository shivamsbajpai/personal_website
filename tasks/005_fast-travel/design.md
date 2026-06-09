# Slice 5 — fast-travel · design decisions

Cross-ref: [`plan.md`](plan.md). Earlier decisions (D1–D11, DS1–DS7, DC1–DC6,
DF1–DF4) are locked.

## DT1 — Auto-travel is a pure state-machine extension, time-ticked by the loop

**Choice:** `startFastTravel(state, target, count)` returns a `TRAVELLING`
state from the current camera float toward the clamped target with
`auto: true`; `tickAutoTravel(state, dt)` advances `travelT` by
`dt / (500 + 450·|to − from|)` (duration scales with distance, sub-linear so
long jumps don't drag) and arrives as `READING` at the target's **top**.
`applyScroll` ignores input while `auto` is set (a deliberate jump completes;
it lasts ≲2.5s worst case).

**Why:** reuses the existing TRAVELLING → vantage-lerp → dock pipeline — the
camera flight, HUD, holo fades, and the dock-into-INFO transition all come for
free. Pure and unit-testable. Landing at the top is correct for a *deliberate*
jump in either direction (the read-up-on-reverse invariant protects
*scroll-through*, not navigation).

**Alternatives:** loop-side imperative tween of `renderFloat` (bypasses the
state machine — two sources of truth; rejected); making scroll cancel
auto-travel (more states for a sub-3s flight nobody needs to cancel; rejected).

## DT2 — Palette is recon chrome over the same actions

**Choice:** a fresh `#fc` ("FIRE CONTROL") overlay in `v2.html` — input +
listbox, type-to-filter on label text, 5 checkpoint targets + 4 utilities.
The old site's palette code is not imported.

**Why:** v2's chrome is themed per the epic; the old palette is entangled with
the old theme's DOM/CSS. Facts (hrefs, email) stay verbatim.

## DT3 — Nav strip = checkpoint indices in the topbar

**Choice:** the topbar gains `00 01 02 03 04` mono buttons (current one
highlighted) + a `⌘K` button; clicking fast-travels. The topbar loses
`pointer-events: none` only on those controls.

**Why:** the AC requires a non-palette nav control; indices match the HUD
language and stay out of the scenery's way.

## DT4 — Keyboard model

**Choice:** ⌘K / Ctrl+K toggles; Esc closes; ArrowUp/Down move the selection
(wrapping); Enter activates; printable keys filter. While open, travel keys
are suppressed (the palette handler runs first and stops propagation). Focus
moves into the input on open and returns to the previously-focused element on
close. During the fly-in, ⌘K or a nav click **skips the intro first**, then
opens/jumps (slice-4 carry-forward).

## DT5 — Copy-email feedback via a HUD toast

**Choice:** `navigator.clipboard.writeText` with a fallback `execCommand`
path; confirmation is a small self-hiding mono toast (`EMAIL COPIED — ssbajpai9@gmail.com`).

**Why:** clipboard needs visible confirmation; a toast is the lightest
recon-consistent affordance (the old site used one too).
