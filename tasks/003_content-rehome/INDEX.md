# Slice 3 — verbatim content rehome into 5 checkpoints · INDEX (resume protocol)

Task: rehome all real content into the five checkpoints · **Closes [#5]** · parent epic [#2]
Plan: [`plan.md`](plan.md) · Design: [`design.md`](design.md)
Branch: `task/5-content-rehome` · Preview: `python3 -m http.server 8099` → `/v2.html`
Blocked-by: #3, #4 (both DONE — merged via [PR-10], [PR-12])

## Status

| # | Step | State | Commit | Notes |
|---|------|-------|--------|-------|
| 1 | Static panels in v2.html + main.js hydrates (DC1) | pending | — | |
| 2 | Five-checkpoint world (DC2) | pending | — | anchors `(90,-600)`, `(-40,-840)` |
| 3 | Panel-scoped CSS for imported structures (DC3) | pending | — | |
| 4 | Comms checkpoint (DC5) | pending | — | |
| 5 | Seam-2 content-floor test (DC6) | pending | — | `tests/content.test.js` |
| 6 | Verbatim audit (in test) | pending | — | |
| 7 | Local verification | pending | — | 5-cp journey, desktop+mobile+RM, evidence |
| 8 | PR + owner gate | pending | — | merge authorized for this session |

## Acceptance criteria → step

- Five checkpoints show correct, verbatim content → 1, 2, 4, 6
- Every role + all 7 projects readable; résumé + external links work → 1, 4, 7
- Long sections scroll inside the pinned panel and auto-release → 7
- Seam-2 DOM content floor (JS disabled) → 1, 5
- No copy altered or embellished → 3, 6
- 0 console errors; owner previews locally → 7, 8

## Resume sequence for next session

1. `cd ~/projects/personal_website && git checkout task/5-content-rehome`
2. Pre-flight: `node --test` (13 state tests must pass; content tests once step
   5 lands); `python3 -m http.server 8099` → `/v2.html` (port may already be
   served by a leftover server — check `lsof -iTCP:8099` and reuse it).
3. Start at the first non-DONE step above. Copy sources in `index.html`:
   hero `634–686` · experience `688–782` · work `784–916` · about `918–965` ·
   footer/contact `968–977`.
4. Browser verification gotcha: bust the **page URL** (`v2.html?b=N`) — the
   cached HTML pins the old module URL (see slice-2 INDEX defects).
5. Verify transitional UI with a **live per-frame rAF trace**, never a frozen
   snapshot (slice-2 lesson — frozen choreography hides camera-motion bugs).

## Plan defects observed

*(log as they happen, not at session wrap)*

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
