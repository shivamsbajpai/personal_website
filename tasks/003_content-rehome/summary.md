# Slice 3 — verbatim content rehome · summary (retrospective)

Closes [#5] · parent epic [#2] · shipped via [PR #14] (merged to `master`)

## Outcome

The RECON experience now carries the **entire real site, verbatim**: five
checkpoints (OVERWATCH / EXPERIENCE / WORK / ABOUT / ESTABLISH COMMS) with the
live site's hero, all five roles, all seven projects, the about/stack/Tvash
material, and a closing contact CTA. The content is **static HTML in the
served file** — present in the DOM with JS disabled — and a 15-case Seam-2
test enforces both the floor and byte-level verbatim-ness against
`index.html` as the source of truth. The lorem placeholders are gone.

## Acceptance criteria — outcome

| AC | Status | Where |
|----|--------|-------|
| Five checkpoints show correct, verbatim content | ✅ | static panels in `v2.html`; verbatim audit in `tests/content.test.js` |
| Every role + all 7 projects readable; résumé + external links work | ✅ | asserted in tests; résumé + all 8 externals → HTTP 200 |
| Long sections scroll in the pinned panel and auto-release | ✅ | verified live both directions (EXPERIENCE −956px read-up on reverse) |
| Seam-2 DOM content floor (JS disabled) | ✅ | tests read raw file bytes — no JS executes |
| No copy altered or embellished | ✅ | copy extracted from `index.html`, asserted unchanged |
| 0 console errors; owner previews locally | ✅ | 0 across desktop/mobile/reduced-motion; owner-authorized merge |

## Artifacts

- `v2.html` — five static panels + recon-themed CSS for the rehomed structures
- `scene/main.js` — `CHECKPOINTS` as world data ×5; DOM-hydrated panels;
  card title from the panel's own heading
- `tests/content.test.js` — Seam-2 floor + verbatim audit (suite now 28)
- [`evidence/`](evidence/) — desktop panels ×5 + mobile ×2
- Plan: [`plan.md`](plan.md) · Design: [`design.md`](design.md) · Resume: [`INDEX.md`](INDEX.md)

## Gotchas to carry forward (into Slice 4 / [#6])

1. **A checkpoint whose content fits unscrolled (COMMS) has `contentMax = 0`**,
   so *any* up-scroll at it immediately reverse-travels. By design today, but
   the fly-in (#6) and fast-travel (#7) should expect zero-budget checkpoints.
2. **File-level negative guards need anchored patterns.** A greedy
   `[\s\S]*` regex in the "main.js doesn't generate panels" test matched
   legitimate code on the other side of the file. Assert specific strings
   (`panel-head`, `panel.innerHTML`), not loose spans.
3. **The verbatim audit is structural, not incidental:** it extracts copy from
   `index.html` at test time. When #9's cutover replaces `index.html`, the
   test's source-of-truth must be re-pointed (e.g. at a frozen copy fixture or
   dropped in favour of the floor assertions) — flagged for the cutover plan.
4. Slice-2 lessons confirmed again: bust the **page URL** when verifying
   module edits; verify transitional UI with a **live rAF trace**.

## Deferred / follow-ups

- "View work" internal nav → fast-travel ([#7]).
- Old-theme decorative widgets (whoami terminal, marquee, typed role-line)
  intentionally not rehomed (chrome, not content).
- Repo still has no `.gitignore` — carried from slice 2.

[#2]: https://github.com/shivamsbajpai/personal_website/issues/2
[#5]: https://github.com/shivamsbajpai/personal_website/issues/5
[#6]: https://github.com/shivamsbajpai/personal_website/issues/6
[#7]: https://github.com/shivamsbajpai/personal_website/issues/7
[PR #14]: https://github.com/shivamsbajpai/personal_website/pull/14
