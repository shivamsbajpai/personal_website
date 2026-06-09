# Slice 4 — fly-in loader · design decisions

Cross-ref: [`plan.md`](plan.md). Slices 1–3 decisions (D1–D11, DS1–DS7,
DC1–DC6) are locked; nothing here re-opens them.

## DF1 — Intro is a camera-only phase; the existing dock transition is the landing beat

**Choice:** while the intro runs, `loop()` drives the camera from the fly path
and holds `infoAmt` at 0 (HUD mode `INBOUND`, travel vision). The path ends
**byte-exactly** at `vantages[0]` (pos and look), so when the intro flag drops
the normal loop continues with zero camera error and the standard
travel→INFO dock transition (dim, DoF, panel fade, reveal card untouched)
plays as the arrival.

**Why:** no second state machine, no new transition code — the landing reuses
the owner-approved dock choreography. `infoAmt` is initialized to 0 when the
intro will play (it normally boots at 1) so the panel/dim never flash before
the sweep.

**Alternatives:** scripting the whole entrance incl. a custom dock fade
(duplicates the existing transition; rejected); driving the intro through the
scroll state machine (the intro isn't scroll-driven; rejected).

## DF2 — Landing is gated on real progress: `flyProgress = min(easeInOut(timeFrac), 0.85 + 0.15·assetFrac)`

**Choice:** a pure helper in `scene/state.js`. Time alone can carry the sweep
to 85%; the final approach needs `assetFrac` (loaded GLBs / total) to reach 1,
so the camera settles onto Overwatch exactly when loading completes. On a fast
connection the flight is purely time-shaped (~5s); on a slow one the camera
hangs on the approach instead of landing early.

**Why:** "lands as loading completes" without faking progress in either
direction; pure and unit-testable (Seam-1 style).

## DF3 — Intro loads the kit eagerly through a `LoadingManager`; every other path keeps the lazy load

**Choice:** when the intro plays, `loadOutposts()` starts immediately with a
`THREE.LoadingManager` whose `onProgress` drives `assetFrac` (8 GLBs known
up-front); on load failure the catch sets `assetFrac = 1` so the landing never
hangs (graceful procedural fallback per DS2). Replay-session / reduced-motion
/ post-skip paths keep the existing `requestIdleCallback` lazy load.

**Why:** the AC requires *real* progress, and during a cinematic there is no
"first interactive paint" to protect — eager is strictly better there. DS2's
"desert usable before models finish" stays true everywhere (the render loop
never awaits).

## DF4 — Session + skip + reduced-motion semantics

**Choice:** `sessionStorage['reconIntroSeen'] = '1'` set when the intro ends
(complete **or** skipped); read in a try/catch (storage can throw in private
modes — fail open to "show once per page load"). Skip = the `skip ⏎` button,
Enter, or any wheel/touch gesture; it snaps the camera to `vantages[0]` and
hides the loader (assets keep streaming in the background). Reduced motion
never flies — straight to the current instant boot, and the loader UI never
shows (no progress theatre without a cinematic).

**Why:** matches user stories 31 ("not tedious on return") and 24 (no forced
camera motion); a scroll gesture as skip means an impatient visitor's natural
action does the right thing instead of being swallowed.
