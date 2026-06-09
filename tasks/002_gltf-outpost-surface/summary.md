# Slice 2 — GLTF outpost + holo→crisp surface · summary (retrospective)

Closes #4 · parent epic #2 · shipped via [PR #12] (merged to `master`)

## Outcome

Every checkpoint is now a real **deserted army outpost** assembled from a CC0
GLTF kit (tank, crates, sandbags, antenna, barriers) that lazy-loads after first
paint and swaps in for the procedural stand-ins, each with a **holographic field
terminal** (scanline/flicker shader on dark glass) that plays a three-stage
**holo → CSS3D reveal card → flat crisp panel** baton-pass as you dock. The
Slice-1 reading system is untouched; all carry-forward invariants held.

## Acceptance criteria — outcome

| AC | Status | Where |
|----|--------|-------|
| CC0 kit chosen + license recorded + assets under `/assets/` | ✅ | 8 Quaternius GLBs in `assets/outpost/`, provenance in `assets/CREDITS.md` |
| Models lazy-load; desert usable before they finish | ✅ | loader kicks on the `booted` flip via `requestIdleCallback`; render loop never awaits; graceful procedural fallback |
| Coherent outpost per checkpoint | ✅ | `buildGltfOutpost()` — camera-facing arc, seeded per-cp yaw, shadows on every mesh |
| Approach holo → dock cross-fade to crisp panel framed by outpost | ✅ | `makeHoloMaterial()` + reveal card + `infoAmt`-banded baton-pass in `loop()` |
| 0 console errors; sunny + shadows preserved; owner previews | ✅ | 0 errors on every pass (desktop/mobile/reduced-motion); owner-merged [PR #12] |

## Artifacts

- `assets/outpost/` + `assets/CREDITS.md` — 8 CC0 GLBs with provenance
- `scene/main.js` — GLTF harness, outpost composition, holo shader, CSS3D reveal
  card + screen-edge clamp, cross-fade choreography
- `v2.html` — `.holo-card` / `#css3d` CSS
- [`evidence/`](evidence/) — PR screenshots (desktop + mobile, pinned-SHA linked)
- Plan: [`plan.md`](plan.md) · Design: [`design.md`](design.md) · Resume: [`INDEX.md`](INDEX.md)

## Gotchas to carry forward (into Slice 3 / #5)

1. **Verify transitional UI with a live per-frame trace, not a frozen snapshot.**
   The reveal card was "verified" on mobile by freezing `infoAmt` mid-band — but
   freezing the choreography also froze the camera, hiding that the card's fade
   band runs *while the camera is still gliding*. Live, the world-anchored card
   crossed the frustum edge at peak opacity (8/18 strong frames on-screen at
   390×844). An rAF sampler recording `(opacity, boundingRect)` every frame is
   what exposed it; the projected-x clamp fixed it (28/28 frames fit).

2. **ES-module HTTP caching masks edits during browser verification.** The
   cached *HTML* keeps the old `<script>` tag, so bumping the module query alone
   serves stale code. Bust the **page URL** (`v2.html?b=N`) per check; never ship
   the bust param.

3. **Additive shaders need a body to read against bright sky.** The additive
   holo blew out to white against the cream sky; a normal-blended dark "glass"
   backing plane restored its phosphor identity from every angle.

4. **World-anchored CSS3D scales with viewport *height*** — a portrait phone
   renders the same card *larger*, not smaller. Width-driven scale + reseat
   (`cardK()`), with `k===1` reproducing desktop exactly, plus the per-frame
   clamp, is the working recipe.

## Deferred / follow-ups

- **Owner-gate visual tuning** (accepted as-shipped at merge; revisit on demand):
  docked short props read dark-on-dark under low sun (fill light is the likely
  lever); holo prominence on approach; exact mobile card size/seat.
- Placeholder lorem content → real verbatim content lands in **#5 (Slice 3, next)**.
- Repo has no `.gitignore` (`.scratch/` is untracked, not ignored) — worth adding.

[PR #12]: https://github.com/shivamsbajpai/personal_website/pull/12
