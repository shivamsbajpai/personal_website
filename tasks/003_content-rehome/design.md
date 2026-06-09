# Slice 3 — content rehome · design decisions

Cross-ref: [`plan.md`](plan.md) · epic design in the PRD ([#2]). Slice-1/2
decisions (D1–D11, DS1–DS7) are locked; nothing here re-opens them.

## DC1 — Content lives statically in `v2.html`; `main.js` hydrates, not generates

**Choice:** the five panels are authored as static `<section class="panel">`
HTML inside `#infoLayer`; `scene/main.js` queries them and keeps only world
data (`id`/`label`/`anchor`) in `CHECKPOINTS`.

**Why:** the slice's Seam-2 AC is "content exists in the served DOM and is
reachable with JS disabled." JS-generated panels (Slice 1's approach, fine for
placeholders) fail that by construction. Static HTML also gives SEO/readers the
real content with zero scripting.

**Alternatives:** keep JS generation + duplicate the copy in `<noscript>`
(two copies to keep in sync — rejected); server-side templating (no build step
allowed — rejected).

## DC2 — Two new anchors continue the existing rail

**Choice:** keep the three existing anchors `(0,60) → (80,-120) → (-80,-360)`
and continue the alternating south-bound pattern with `(90,-600)` and
`(-40,-840)` (~250–280 world units per hop, matching the existing gaps).

**Why:** travel duration/feel per hop is tuned and owner-approved in Slices
1–2; keeping hop length uniform preserves it. All world systems (pads,
outposts, holo terminals, reveal cards, vantages, beams) derive from
`CHECKPOINTS`, so this is data, not code.

## DC3 — Verbatim copy, themed chrome; decorative `aria-hidden` widgets stay behind

**Choice:** copy strings (headings, paragraphs, list items, link labels, tag
names, periods, stats) are byte-identical to `index.html`. Source class names
are kept where structural (`.featured`, `.exp`, `.project`, `.stack-grid`,
`.tvash-block`, `.tag`) and restyled inside `.panel-body` to the recon theme.
The `whoami.sh` terminal, marquee, and typing role-line are **not** rehomed:
they are `aria-hidden` decoration of the old theme — chrome, not content — and
the epic explicitly re-themes chrome. The stats row (visible, content-bearing)
**is** rehomed as static text.

**Why:** the AC is "no copy altered"; class re-use keeps the verbatim audit
mechanical (innerText comparison) and the restyle reviewable as pure CSS.

## DC4 — Reveal-card title comes from the panel DOM

**Choice:** `cardTitle(i)` reads `panels[i].querySelector('.panel-body h1, .panel-body h2')`
text instead of regexing `cp.html` (which no longer exists).

**Why:** single source of truth — the card always mirrors whatever the panel
actually says.

## DC5 — Comms checkpoint content = existing contact surface, verbatim facts

**Choice:** `04 · ESTABLISH COMMS` carries email `ssbajpai9@gmail.com`, GitHub,
lomasa-ai, and `./latest_resume.pdf` — the union of the live site's hero links
and footer links. Surrounding labels are themed HUD chrome (allowed); link
labels/hrefs/the email address are verbatim.

**Why:** the live site has no dedicated contact section to copy; the epic
defines this checkpoint as the closing CTA assembled from the existing
contact surface. Tone stays understated — no new sales copy.

## DC6 — Seam-2 test reads the raw file, not a DOM

**Choice:** `tests/content.test.js` reads `v2.html` with `node:fs` and asserts
required strings (roles, 7 project names, links, email, résumé href, key copy
sentences extracted from `index.html`) appear in the raw text. No parser, no
browser.

**Why:** "reachable with JS disabled" is exactly "present in the bytes the
server sends." A raw-text assertion is the strongest cheap proxy and keeps the
suite zero-dependency (`node --test`, per the epic's testing decisions).

[#2]: https://github.com/shivamsbajpai/personal_website/issues/2
