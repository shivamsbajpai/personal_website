# Slice 7 — e2e smoke hardening + cutover · INDEX (resume protocol)

Task: Seam-3 hardening + cutover v2→index · **Closes [#9]** · parent epic [#2]
Plan: [`plan.md`](plan.md) · Design: [`design.md`](design.md) ·
**CLOSED** — retrospective in [`summary.md`](summary.md)
Branch: `task/9-e2e-cutover` · Preview: server on :8099 → `/index.html` (post-cutover)
Blocked-by: #4–#8 (ALL DONE — [PR-12], [PR-14], [PR-16], [PR-18], [PR-20])

> **DEPLOY GATE (DH4):** the cutover PR is opened for the **owner to merge**.
> No self-merge — session-level merge authorization does not cover this one
> (PRD deploy gate + issue #9's explicit instruction).

## Status

| # | Step | State | Commit | Notes |
|---|------|-------|--------|-------|
| 1 | Freeze verbatim-audit fixture (DH1) | DONE ✅ | 0c4a82b | audit survives the cutover |
| 2 | Journey e2e spec (DH2) | DONE ✅ | 25e5b9f | fly-in / advance+INFO / reverse / ⌘K |
| 3 | Mobile touch e2e spec (DH2) | DONE ✅ | 25e5b9f | real TouchEvent swipes; fc tap-jump |
| 4 | Cutover (DH3) | DONE ✅ | 52f077d | meta ported (7 og/twitter tags + canonical); v2 redirect verified |
| 5 | Full verification (3 seams + mobile) | DONE ✅ | — | see evidence block |
| 6 | PR for owner review — **left open** | DONE ✅ merged 2026-06-10 | [PR-22] | owner merge; pre-merge master sync resolved the v2.html conflict (redirect wins); see [`summary.md`](summary.md) |

## Acceptance criteria → step

- E2e smoke full loop + fallback via Playwright → 2, 3, 5
- Three seams green → 1, 5
- Mobile touch full-3D usable → 3, 5
- CNAME / favicon / OG-Twitter / résumé preserved → 4, 5
- Owner approves locally; agent does not self-merge → 6

## Resume sequence for next session

1. `cd ~/projects/personal_website && git checkout task/9-e2e-cutover`
2. Pre-flight: `node --test` (43) + `npx playwright test` (3 fallback specs);
   server on :8099 (`lsof -iTCP:8099`).
3. Start at the first non-DONE step.
4. Gotchas (slices 4–6): CDP cache off when editing `scene/*` (`Network.enable`
   first); page-URL bust; fresh context per mode-altering check (init scripts
   are permanent); palette jumps asserted by typed name; `sessionStorage`
   persists across reloads (intro!); THREE errors on failed WebGL unless the
   scratch-probe path is intact.

## Plan defects observed

*(none — slices 4–6 lessons were pre-baked into the spec conventions and held)*

**Step-5 evidence (this session):** Seam 1+2: `node --test` → **43 pass**
(content floor now reads the deployed `index.html`; verbatim audit reads the
frozen fixture). Seam 3: `npx playwright test` → **8 pass / 21.9s**
(first-load fly-in lands at Overwatch · scroll advance + INFO + reverse ·
⌘K jump by typed name · mobile TouchEvent swipes through reading→travel→dock
+ panel fits 390px · mobile fc tap-jump to COMMS · no-WebGL floor · RM floor
· ENTER 3D boot) — every spec asserts **0 console errors**. Cutover sanity:
`/index.html` plays the intro (INBOUND) and lands docked (fresh context,
0 errors); `/v2.html` → redirects to `/`; `CNAME` + `latest_resume.pdf`
byte-untouched (`git diff` empty); 7 OG/Twitter tags + canonical + favicon
present in the deployed head.

## Carry-forward invariants (Slices 1–6)

- All 43 unit tests + 3 fallback specs stay green through the cutover.
- The cutover page must keep: static content floor (Seam 2 now reads
  `index.html`), fly-in session semantics, fast-travel, static fallback,
  direction-aware arrival, reveal-card clamp, GLTF graceful fallback.
- `CNAME`, `latest_resume.pdf` byte-untouched; canonical/OG/Twitter meta
  present in the deployed head.

## Locked decisions reference

DH1 frozen fixture for the verbatim audit · DH2 per-concern specs, fresh
contexts, name-based palette assertions · DH3 index←v2 with meta port, v2
redirects, both URLs work · DH4 owner-merge deploy gate (no self-merge).

## Cross-references

- Issue: [#9] (slice) · Epic/PRD: [#2]
- Previous slice: [`../006_static-fallback/summary.md`](../006_static-fallback/summary.md)
- Files to touch: `index.html`, `v2.html`, `tests/fixtures/legacy-index.html`,
  `tests/content.test.js`, `tests/e2e/{journey,mobile}.spec.mjs`

[#2]: https://github.com/shivamsbajpai/personal_website/issues/2
[#9]: https://github.com/shivamsbajpai/personal_website/issues/9
[PR-22]: https://github.com/shivamsbajpai/personal_website/pull/22
[PR-12]: https://github.com/shivamsbajpai/personal_website/pull/12
[PR-14]: https://github.com/shivamsbajpai/personal_website/pull/14
[PR-16]: https://github.com/shivamsbajpai/personal_website/pull/16
[PR-18]: https://github.com/shivamsbajpai/personal_website/pull/18
[PR-20]: https://github.com/shivamsbajpai/personal_website/pull/20
