# Slice 7 — e2e smoke hardening + cutover · INDEX (resume protocol)

Task: Seam-3 hardening + cutover v2→index · **Closes [#9]** · parent epic [#2]
Plan: [`plan.md`](plan.md) · Design: [`design.md`](design.md)
Branch: `task/9-e2e-cutover` · Preview: server on :8099 → `/index.html` (post-cutover)
Blocked-by: #4–#8 (ALL DONE — [PR-12], [PR-14], [PR-16], [PR-18], [PR-20])

> **DEPLOY GATE (DH4):** the cutover PR is opened for the **owner to merge**.
> No self-merge — session-level merge authorization does not cover this one
> (PRD deploy gate + issue #9's explicit instruction).

## Status

| # | Step | State | Commit | Notes |
|---|------|-------|--------|-------|
| 1 | Freeze verbatim-audit fixture (DH1) | pending | — | `tests/fixtures/legacy-index.html` |
| 2 | Journey e2e spec (DH2) | pending | — | full desktop loop |
| 3 | Mobile touch e2e spec (DH2) | pending | — | swipe travel + palette |
| 4 | Cutover (DH3) | pending | — | index←v2 + meta port; v2 redirects; CNAME/résumé untouched |
| 5 | Full verification (3 seams + mobile) | pending | — | |
| 6 | PR for owner review — **left open** | pending | — | owner previews `/index.html` locally, then merges |

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

*(log as they happen, not at session wrap)*

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
[PR-12]: https://github.com/shivamsbajpai/personal_website/pull/12
[PR-14]: https://github.com/shivamsbajpai/personal_website/pull/14
[PR-16]: https://github.com/shivamsbajpai/personal_website/pull/16
[PR-18]: https://github.com/shivamsbajpai/personal_website/pull/18
[PR-20]: https://github.com/shivamsbajpai/personal_website/pull/20
