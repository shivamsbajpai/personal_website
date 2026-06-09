# Slice 3 — Rehome all real content into the 5 checkpoints (verbatim) · plan

Closes [#5] · parent epic [#2] · branch `task/5-content-rehome`
Design: [`design.md`](design.md) · Resume: [`INDEX.md`](INDEX.md)

## Goal

Replace the placeholder/lorem panels on `v2.html` with the **complete, verbatim
content** of the live site, rehomed into five checkpoints — with the content
living **statically in the served HTML** so it exists in the DOM with JS
disabled (Seam 2), and the world extended from 3 to 5 checkpoints.

Source of truth for copy: [`index.html`](../../index.html) (hero `634–686`,
experience `688–782`, work `784–916`, about `918–965`, footer `968–977`).

## Steps

1. **Static panels in `v2.html`** (DC1) — move the five checkpoints' content
   into five `<section class="panel">` blocks inside `#infoLayer`, verbatim
   from `index.html`. `scene/main.js` stops generating panels (drop `html`/
   `fill` from `CHECKPOINTS`, drop the build loop) and hydrates the existing
   DOM; `cardTitle` reads the panel's `h1/h2` from the DOM (DC4).
2. **Five-checkpoint world** (DC2) — labels `00 · OVERWATCH`, `01 · EXPERIENCE`,
   `02 · WORK`, `03 · ABOUT`, `04 · ESTABLISH COMMS`; two new anchors continue
   the existing path spacing so travel feel is unchanged. Everything downstream
   (pads, outposts, holo terminals, reveal cards, vantages, state count)
   derives from `CHECKPOINTS` already.
3. **Panel-scoped CSS for the imported structures** (DC3) — `.featured`/`.exp`/
   `.project`/`.stack-grid`/`.tvash-block`/tags/links restyled to the recon
   theme inside `.panel-body`. Chrome only; copy strings untouched.
4. **Comms checkpoint** (DC5) — closing CTA assembled from existing contact
   surface: email (`ssbajpai9@gmail.com`), GitHub, lomasa-ai, résumé PDF
   (`./latest_resume.pdf`). Labels themed; facts verbatim.
5. **Seam-2 content-floor test** — `tests/content.test.js` (`node --test`, zero
   deps): reads the raw `v2.html` **file text** (no JS execution = the
   JS-disabled floor) and asserts every role, all 7 project names, key copy
   strings, email, résumé href, and external links are present statically.
6. **Verbatim audit** — script-extract the copy strings from `index.html` and
   assert each appears in `v2.html` unchanged (runs as part of step 5's test).
7. **Local verification** — `node --test` (state + content); Playwright: full
   journey across **all 5** checkpoints (desktop + 390×844 + reduced-motion),
   long-section in-panel scroll + auto-release (Experience, Work), external
   link hrefs + résumé PDF reachable, 0 console errors; evidence screenshots.
8. **PR + owner gate** — full test plan with inline evidence; merge authorized
   for this session; post-merge close-out (summary, issue, INDEX).

## Acceptance criteria → step

- All five checkpoints show correct, verbatim content → 1, 2, 4, 6
- Every role + all 7 projects readable; résumé + external links work → 1, 4, 7
- Long sections scroll inside the pinned panel and auto-release → 7
- Seam-2 DOM content floor (JS disabled) → 1, 5
- No copy altered or embellished → 3, 6
- 0 console errors; owner previews locally → 7, 8

## Out of scope

- "View work" internal nav button (`href="#work"`) — that's fast-travel,
  lands in Slice 5 ([#7]); not rehomed as a dead link.
- Decorative `aria-hidden` widgets from `index.html` (the `whoami.sh` terminal,
  the marquee, the animated typing role-line) — design chrome of the *old*
  theme, not content (DC3). The stats row **is** content and is rehomed.
- Copy edits of any kind; cinematic fly-in ([#6]); static fallback ([#8]).

[#2]: https://github.com/shivamsbajpai/personal_website/issues/2
[#5]: https://github.com/shivamsbajpai/personal_website/issues/5
[#6]: https://github.com/shivamsbajpai/personal_website/issues/6
[#7]: https://github.com/shivamsbajpai/personal_website/issues/7
[#8]: https://github.com/shivamsbajpai/personal_website/issues/8
