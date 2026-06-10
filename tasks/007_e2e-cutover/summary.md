# Slice 7 — e2e smoke hardening + cutover · summary (post-merge)

Merged 2026-06-10 via [PR-22] (owner merge — deploy gate DH4 honored).
Closed [#9]. The RECON build is the live site at shivambajpai.com;
`/v2.html` is a redirect stub.

## Outcomes vs AC

- **E2e smoke full loop + fallback** ✅ — `tests/e2e/journey.spec.mjs` +
  `tests/e2e/mobile.spec.mjs` joined the fallback specs; every spec asserts
  0 console errors.
- **Three seams green** ✅ — unit suite (Seam 1+2, content floor reads the
  deployed `index.html`, verbatim audit reads the frozen
  [`tests/fixtures/legacy-index.html`](../../tests/fixtures/legacy-index.html))
  + Playwright (Seam 3).
- **Mobile touch full-3D usable** ✅ — real TouchEvent swipes through
  reading→travel→dock; panel fits 390 px; fc tap-jump.
- **CNAME / favicon / OG-Twitter / résumé preserved** ✅ — byte-identical
  `CNAME` + `latest_resume.pdf`; 7 OG/Twitter tags + canonical ported.
- **Owner approves; agent does not self-merge** ✅ — PR stayed open until
  the owner's explicit merge; the harness additionally enforces the
  no-self-merge boundary at the tool level (discovered during task 008's
  preview deploys).

## What shipped between PR-open and merge

The PR sat open while task 008 ([#23]) iterated the scroll cadence on /v2
preview PRs ([PR-25]–[PR-27]) that landed on `master` first. Pre-merge, the
branch took a `master` merge resolving the planned `v2.html` conflict
(previews edited the full staging page; this branch's redirect wins —
`index.html` is the canonical home post-cutover). Suites on the merged
branch: 48 unit + 8 e2e green; the 9th (cadence) spec landed with [PR-24].

## Gotchas to carry forward

- A long-lived deploy-gated PR accumulates `master` drift when staging pages
  keep shipping; budget a conflict-resolution merge right before the owner
  merge, and keep the resolution rule written down in advance (here:
  "redirect wins" was pre-declared in task 008's INDEX).
- The GitHub merge UI auto-closed refs-only linked issues on EVERY preview
  merge this cycle (3/3, banner notwithstanding) — the post-merge
  issue-state check is not optional.

## Follow-ups

- Future-release TODO (PRD): vendor Three.js locally; ambient audio toggle.
- `package-lock.json` is gitignored by design (exact-pinned
  `@playwright/test`); fresh clones run `npm install`, not `npm ci`.

[#2]: https://github.com/shivamsbajpai/personal_website/issues/2
[#9]: https://github.com/shivamsbajpai/personal_website/issues/9
[#23]: https://github.com/shivamsbajpai/personal_website/issues/23
[PR-22]: https://github.com/shivamsbajpai/personal_website/pull/22
[PR-24]: https://github.com/shivamsbajpai/personal_website/pull/24
[PR-25]: https://github.com/shivamsbajpai/personal_website/pull/25
[PR-27]: https://github.com/shivamsbajpai/personal_website/pull/27
