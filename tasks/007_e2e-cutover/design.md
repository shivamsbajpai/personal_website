# Slice 7 — e2e hardening + cutover · design decisions

Cross-ref: [`plan.md`](plan.md). All prior decisions locked.

## DH1 — The verbatim audit's source of truth becomes a frozen fixture

**Choice:** commit the pre-cutover `index.html` as
`tests/fixtures/legacy-index.html`; `tests/content.test.js` extracts copy
from the fixture and asserts it appears in the deployed page unchanged.

**Why:** the audit's job is "the RECON build carries the original copy
verbatim". After the cutover, `index.html` *is* the RECON build — reading it
as its own source would make the test vacuous. A frozen fixture keeps the
guarantee meaningful forever (flagged in the slice-3 retrospective).

## DH2 — One spec file per concern; per-test contexts; name-based assertions

**Choice:** `journey.spec.mjs` (desktop full loop), `mobile.spec.mjs`
(touch), `fallback.spec.mjs` (already shipped). Conventions inherited from
slices 4–6 lessons: fresh context per test (never a shared, init-script-
poisoned one), palette jumps asserted by typed *name*, fly-in completion
awaited by HUD state (not timeouts alone), strict empty-console-errors
assertions (the scratch-canvas probe keeps no-WebGL silent).

## DH3 — Cutover keeps both URLs working

**Choice:** `index.html` becomes the RECON build byte-for-byte from
`v2.html`, with the old head's `canonical` / OG / Twitter meta ported in
(the recon favicon and description are the new brand, kept). `v2.html`
becomes a meta-refresh + JS redirect to `/`, so links shared during the
build don't 404. `CNAME` and `latest_resume.pdf` are not touched.

**Why:** GitHub Pages serves `master`; the swap *is* the deploy. A redirect
is one tiny file and avoids breaking history/preview links. OG/Twitter meta
preserved per AC (social cards keep working); canonical guards SEO.

## DH4 — The deploy gate is the owner's merge

**Choice:** the PR carries the full evidence and stays **open**. The owner
previews `index.html` locally and merges to deploy. This overrides the
session's blanket merge authorization — both the PRD ("nothing ships to the
live site without explicit sign-off") and issue #9 ("owner merges; agent
does not self-merge") pin this slice's gate to the owner.
