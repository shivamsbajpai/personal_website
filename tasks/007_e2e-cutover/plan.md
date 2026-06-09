# Slice 7 — E2E smoke hardening + cutover v2.html → index.html · plan

Closes [#9] · parent epic [#2] · branch `task/9-e2e-cutover`
Design: [`design.md`](design.md) · Resume: [`INDEX.md`](INDEX.md)

> **Deploy gate:** this slice ships to the live site (GitHub Pages serves
> `master` at shivambajpai.com). Per the PRD and the issue itself, the PR is
> **opened for the owner to review and merge — no self-merge**, regardless of
> session-level merge authorization.

## Steps

1. **Freeze the verbatim-audit source** (DH1) — copy the pre-cutover
   `index.html` to `tests/fixtures/legacy-index.html`; `tests/content.test.js`
   reads the fixture (the audit survives the cutover).
2. **Journey e2e spec** (DH2) — `tests/e2e/journey.spec.mjs`: load with 0
   console errors + WebGL ready; fly-in completes and settles at Overwatch;
   scroll advances + flips INFO with readable panel text; reverse-scroll
   returns; ⌘K fast-travel jumps and docks.
3. **Mobile touch e2e spec** (DH2) — touch context (`hasTouch`), swipe-driven
   travel through a checkpoint hop + palette jump; usable = panels readable,
   journey advances, 0 errors.
4. **Cutover** (DH3) — `index.html` becomes the RECON build: v2 markup with
   the old head's canonical/OG/Twitter meta ported in; recon favicon stays;
   `CNAME` and `latest_resume.pdf` untouched; `v2.html` becomes a tiny
   redirect to `/` (links shared during the build keep working). E2e specs
   re-pointed at `/index.html`.
5. **Full verification** — all three seams green (unit state machine,
   content floor on the NEW index.html + frozen-fixture audit, e2e smoke
   incl. fallback); mobile touch pass; evidence.
6. **PR for owner review** — full test plan with inline evidence, partial-PR
   semantics not needed (single PR, `Closes #9`) but **left open**: the
   owner previews locally (`python3 -m http.server 8099` → `/index.html`),
   then merges to deploy.

## Acceptance criteria → step

- E2e smoke passes for full loop + fallback via Playwright → 2, 3, 5
- All three seams green → 1, 5
- Mobile (touch) full-3D usable → 3, 5
- CNAME / favicon / OG-Twitter meta / résumé preserved → 4, 5
- Owner approves locally before merge; no self-merge → 6

## Out of scope

- Any visual changes to the experience itself (this slice is tests + swap).
- Deleting the old design's assets beyond `index.html`'s replacement (the
  old page lives on in git history and the frozen fixture).

[#2]: https://github.com/shivamsbajpai/personal_website/issues/2
[#9]: https://github.com/shivamsbajpai/personal_website/issues/9
