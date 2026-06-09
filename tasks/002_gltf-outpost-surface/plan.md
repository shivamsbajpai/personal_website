# Slice 2 — GLTF outpost props + holo→crisp content surface (plan)

Closes #4 · parent epic #2 · blocked-by #3 (done, merged via PR #10)

## Goal

Replace Slice 1's procedural army outpost (decision D11) with a real **CC0
low-poly military/desert GLTF kit**, lazy-loaded so first paint/fly-in isn't
blocked, and implement the **hybrid content surface**: a glowing WebGL holo-screen
on a prop while approaching that cross-fades to a crisp **CSS3D/HTML panel** mounted
on the prop's bezel when the checkpoint docks. Sunny look + shadows preserved;
0 console errors; owner previews locally.

## Steps (tracer-bullet, vertical)

1. **Asset sourcing + license vetting.** Choose ONE stylistically consistent CC0
   low-poly military/desert kit (tank/APC, crates, sandbags, antenna/comms mast,
   barriers/tank-traps). Vet the license (must be CC0 / public-domain-equivalent),
   commit `.glb` + textures under `/assets/`, record provenance + license in
   `/assets/CREDITS.md`. **Owner confirms the visual style before committing
   binaries** (see design DS1 — the one decision worth surfacing).
2. **GLTFLoader + lazy-load harness.** Add `GLTFLoader` to the import map; load
   the kit **after first paint** (desert + beacons usable before models finish);
   on load, swap the procedural stand-in → GLTF props. Loop never blocks.
3. **Per-checkpoint outpost composition.** Clone/arrange the kit on each existing
   graded pad in a camera-facing arc (tank + crates + sandbags + antenna +
   barriers), slight per-checkpoint variation; shadows intact; resolves on
   approach, sits dimmed when docked.
4. **WebGL holo-screen on a prop.** Emissive `ShaderMaterial` screen (scanlines +
   flicker) mounted on a field terminal / comms unit, visible in TRAVEL while
   approaching.
5. **CSS3D crisp panel + cross-fade.** Layer `CSS3DRenderer`; mount the existing
   real-DOM `.panel` onto a CSS3D object at the prop's screen; on dock cross-fade
   holo→crisp (upgrades Slice 1's screen-space panel D4). Preserve Slice 1
   invariants: DOM content always present (a11y/SEO), panel measurable on arrival,
   direction-aware arrival (read up/down before pin releases).
6. **Reduced-motion path.** Static (non-flickering) holo glow, dampened motion,
   travel loop preserved — per Slice 1 gotcha #2 (reduced-motion must not delete
   the loop).
7. **Local verification.** `node --test` still green; Playwright smoke: 0 console
   errors, models lazy-load (desert usable first), outpost composes, approach
   shows holo, dock shows crisp panel framed by the outpost, reverse works,
   sunny+shadows preserved.
8. **Owner approval gate** — local preview sign-off before Slice 3 (#5).

## Acceptance criteria → step

- CC0 kit chosen, license recorded, assets under `/assets/` → 1
- Models lazy-load; desert usable before they finish → 2
- Each checkpoint = coherent outpost (tank+crates+sandbags+antenna+barriers) → 3
- Approaching shows holo-screen; docking cross-fades to crisp panel framed by outpost → 4,5
- 0 console errors; sunny look + shadows preserved; owner previews locally → 7,8

## Out of scope (later slices)

- Real verbatim content rehomed into checkpoints (#5) — Slice 2 keeps Slice 1's
  placeholder content; only the *surface* (holo→CSS3D) changes.
- Cinematic fly-in loader (#6) — Slice 2 lazy-loads but does not build the
  HUD-streaming intro.
- Fast-travel / ⌘K (#7), static no-WebGL fallback (#8), e2e hardening + cutover (#9).
- Vendoring Three locally (future-release TODO) — Slice 2 stays on the pinned CDN.
- Ambient audio, photoreal/HDRI assets — out per epic.
