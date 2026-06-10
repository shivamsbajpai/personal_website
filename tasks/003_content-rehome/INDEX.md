# Slice 3 — verbatim content rehome into 5 checkpoints · INDEX (resume protocol)

Task: rehome all real content into the five checkpoints · **Closes [#5]** · parent epic [#2] · **DONE — merged via [PR-14]**, retrospective in [`summary.md`](summary.md)
Plan: [`plan.md`](plan.md) · Design: [`design.md`](design.md)
Branch: `task/5-content-rehome` · Preview: `python3 -m http.server 8099` → `/v2.html`
Blocked-by: #3, #4 (both DONE — merged via [PR-10], [PR-12])

## Status

| # | Step | State | Commit | Notes |
|---|------|-------|--------|-------|
| 1 | Static panels in v2.html + main.js hydrates (DC1) | DONE ✅ | 669b78d | 5 `<section class="panel">` static in `#infoLayer`; `CHECKPOINTS` = world data only; `cardTitle` reads panel DOM (DC4) |
| 2 | Five-checkpoint world (DC2) | DONE ✅ | 669b78d | anchors `(90,-600)`, `(-40,-840)`; everything derives from `CHECKPOINTS` |
| 3 | Panel-scoped CSS for imported structures (DC3) | DONE ✅ | 669b78d | featured/exp/project/stack/tvash/comms recon-themed under `.panel-body` |
| 4 | Comms checkpoint (DC5) | DONE ✅ | 669b78d | CH-01..04: email/GitHub/lomasa-ai/résumé, facts verbatim |
| 5 | Seam-2 content-floor test (DC6) | DONE ✅ | f894abd | 15 cases on raw file bytes; suite now 28 tests |
| 6 | Verbatim audit (in test) | DONE ✅ | f894abd | copy extracted from `index.html`, asserted unchanged in `v2.html` |
| 7 | Local verification | DONE ✅ | — | see evidence block; screenshots in [`evidence/`](evidence/) |
| 8 | PR + owner gate | DONE ✅ | 901854b | [PR-14] merged (owner-authorized), #5 auto-closed |

## Acceptance criteria → step

- Five checkpoints show correct, verbatim content → 1, 2, 4, 6
- Every role + all 7 projects readable; résumé + external links work → 1, 4, 7
- Long sections scroll inside the pinned panel and auto-release → 7
- Seam-2 DOM content floor (JS disabled) → 1, 5
- No copy altered or embellished → 3, 6
- 0 console errors; owner previews locally → 7, 8

## Resume sequence for next session

**TASK COMPLETE — nothing to resume.** [PR-14] merged to `master` (`901854b`),
#5 auto-closed, retrospective in [`summary.md`](summary.md). A fresh session
should move to **Slice 4 ([#6], cinematic fly-in loader)** — start at
`tasks/004_<slug>/`. Carry the gotchas from `summary.md` (zero-budget
checkpoints; page-URL cache-bust; live rAF traces for transitional UI).

## Plan defects observed

**The "main.js doesn't generate panels" guard regex was too greedy.** First
version asserted `!/innerHTML\s*=\s*`[\s\S]*panel-body/` over `main.js` — but
`[\s\S]*` spans the whole file, so the holo-card's legitimate `innerHTML` plus
a later `.panel-body` *selector* matched and failed the test. Replaced with two
precise assertions: no `panel-head` string and no `panel\.innerHTML` in
`main.js`. Lesson: file-level negative guards need anchored, specific patterns.

**Step-7 evidence (this session):** `node --test` → **28 pass / 0 fail** (13
state + 15 content); `node --check scene/main.js` OK; debug-hook grep clean.
Playwright desktop 1280×800 (`?b=` page-URL cache-bust per slice-2 lesson):
**full forward journey 00→01→02→03→04 by real wheel scroll**, clamped at the
last checkpoint; in-panel reading scroll moves `.panel-scroll` while pinned on
every long section (EXPERIENCE −500px, WORK −500px, ABOUT −283px); **full
reverse journey 04→00** with backward arrivals landing at the content **end**
(WORK −1006, EXPERIENCE −956 — direction-aware invariant holds). COMMS content
fits unscrolled (contentMax 0), so an up-scroll at its top immediately reverse-
travels — by design. **Mobile 390×844:** active panel 342px, fits; live rAF
card trace across two arrivals: **16/16 strong (op>0.5) frames fit**, 27/28
total (the single miss is the first visible frame — the clamp uses the
previous frame's rect, one-frame lag, sub-perceptual). **Reduced-motion:**
travel preserved (TRAVERSING), docks at 01 · EXPERIENCE with panel 1.
**0 console errors/warnings across the whole session.** Résumé PDF 200 local;
all 8 external links → 200.
`index.html` untouched (`git diff master -- index.html` empty).

## Carry-forward invariants (Slices 1–2 — do NOT regress)

- **Direction-aware travel arrival** (`scene/state.js`): forward→top,
  backward→end; checkpoints readable in full both directions.
- **Reduced-motion keeps the travel loop** (dampen, never teleport/disable).
- **Panels measurable on arrival** — never `display:none` during the info fade.
- **DOM content always present** (a11y/SEO) — this slice strengthens it to
  static HTML.
- Sunny lighting (D9) + PCFSoft shadows (D10) + GLTF outposts/holo/reveal-card
  pipeline (DS1–DS7) untouched.
- Reveal-card screen-edge clamp (slice-2 `e6896e5`) keeps working with 5 cards.

## Locked decisions reference

DC1 static panels, JS hydrates · DC2 two new anchors continue the rail ·
DC3 verbatim copy / themed chrome / aria-hidden widgets excluded, stats
included · DC4 card title from panel DOM · DC5 comms = existing contact
surface · DC6 Seam-2 test reads raw file bytes.
(Slices 1–2: D1–D11, DS1–DS7 — see [`../002_gltf-outpost-surface/design.md`](../002_gltf-outpost-surface/design.md).)

## Cross-references

- Issue: [#5] (slice) · Epic/PRD: [#2] · Blocked-by: #3, #4 (done)
- Previous slice: [`../002_gltf-outpost-surface/summary.md`](../002_gltf-outpost-surface/summary.md)
- Next slices: [#6] fly-in, [#7] fast-travel, [#8] fallback, [#9] cutover
- Files to touch: `v2.html`, `scene/main.js`, `tests/content.test.js`

[#2]: https://github.com/shivamsbajpai/personal_website/issues/2
[#5]: https://github.com/shivamsbajpai/personal_website/issues/5
[#6]: https://github.com/shivamsbajpai/personal_website/issues/6
[#7]: https://github.com/shivamsbajpai/personal_website/issues/7
[#8]: https://github.com/shivamsbajpai/personal_website/issues/8
[#9]: https://github.com/shivamsbajpai/personal_website/issues/9
[PR-10]: https://github.com/shivamsbajpai/personal_website/pull/10
[PR-12]: https://github.com/shivamsbajpai/personal_website/pull/12
[PR-14]: https://github.com/shivamsbajpai/personal_website/pull/14
