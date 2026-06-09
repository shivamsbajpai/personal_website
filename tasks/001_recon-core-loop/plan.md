# Slice 1 — Core loop tracer (plan)

Closes #3 · parent epic #2

## Goal

Prove the entire RECON optic interaction end-to-end on a new `v2.html`, leaving
the live `index.html` untouched: travel a sunny 3D Mars desert through the scope,
lock a checkpoint, flip to info mode (dim + depth-blur + crisp panel), scroll the
pinned content, auto-release to the next checkpoint, reverse-scroll back.

## Steps

1. Pure interaction **state machine** (`scene/state.js`) mapping scrollY → scene
   state, with `node --test` unit tests (`tests/state.test.js`). — Seam 1
2. **`v2.html`** shell: scope overlay, tactical HUD, info-panel layer, scroll
   spacer, import map (Three + addons via pinned CDN), CSS for travel/info states.
3. **`scene/main.js`**: sunny WebGL desert (fbm terrain, sun, sky dome, dust),
   placeholder checkpoint markers, camera vantages, and the loop wiring state →
   camera (mouse look in travel only) → HUD → info panel show/scroll.
4. Verify locally (state tests green, Playwright smoke: 0 errors, travel↔info,
   dock, reverse).
5. Owner **approval gate** — review the feel locally before Slice 2.

## Acceptance criteria mapping

- AC "v2 loads, index untouched" → step 2/4
- AC "sunny desert + mouse look in travel" → step 3
- AC "scroll advances + locks each checkpoint" → steps 1,3
- AC "info mode dim+blur+crisp panel" → steps 2,3
- AC "auto-release + reverse" → steps 1,3
- AC "state machine unit tests (Seam 1)" → step 1
- AC "local preview for review" / "owner approves" → steps 4,5

## Out of scope (later slices)

- GLTF observation-post props + holo→crisp surface (#4)
- Real content rehomed verbatim (#5)
- Cinematic fly-in loader (#6) — Slice 1 uses a minimal init flash
- Fast-travel / ⌘K (#7), static fallback (#8), e2e hardening + cutover (#9)
- CSS3DRenderer-mounted panels (Slice 2): Slice 1 uses a face-on screen-space
  panel, and approximates depth-of-field with a CSS blur/dim on the canvas.
