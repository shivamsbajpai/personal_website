// RECON // SECTOR ARES — Slice 1 core-loop tracer.
// Sunny, more-photoreal 3D Mars desert (shadows + ridged dunes + sand relief +
// bloom/atmosphere) + scope HUD + the travel<->info optic, driven entirely by
// the pure state machine in ./state.js. Placeholder checkpoints stand in for
// real content (Slice 3). Outpost props render procedurally on first paint,
// then lazy-swap to a cloned CC0 GLTF kit once loaded (Slice 2, DS2/DS3).
import { initState, applyScroll, commitStroke, scrubTravel, cameraFloat, modeOf, flyProgress, startFastTravel, tickAutoTravel, PHASE, MODE } from './state.js';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const mobile = innerWidth < 768;

/* ---------------- Checkpoints (world anchors; content lives in v2.html) ----
   Panel content is authored statically inside #infoLayer (Seam 2: the full
   content exists in the served DOM with JS disabled). This module holds only
   world data and hydrates the existing panels. ------------------------------ */
const CHECKPOINTS = [
  { id: 'overwatch',  label: '00 · OVERWATCH',       anchor: [0, 60] },
  { id: 'experience', label: '01 · EXPERIENCE',      anchor: [80, -120] },
  { id: 'work',       label: '02 · WORK',            anchor: [-80, -360] },
  { id: 'about',      label: '03 · ABOUT',           anchor: [90, -600] },
  { id: 'comms',      label: '04 · ESTABLISH COMMS', anchor: [-40, -840] },
];

const infoLayer = document.getElementById('infoLayer');
const panels = [...infoLayer.querySelectorAll('.panel')];

/* ---------------- value-noise fbm (module scope: terrain + bump) ----------- */
const hash = (x, y) => { let h = (x | 0) * 374761393 + (y | 0) * 668265263; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967295; };
// Hermite smoothstep; used to choreograph the holo→card→panel cross-fade bands by infoAmt.
const smoothstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}
function fbm(x, y) { let f = 0, a = 0.5, fr = 1; for (let i = 0; i < 5; i++) { f += a * vnoise(x * fr, y * fr); fr *= 2.03; a *= 0.5; } return f; }
function ridged(x, y) { const n = fbm(x, y); return 1 - Math.abs(n * 2 - 1); }
// Smooth, low-frequency component: rolling base + crested (ridged) dunes. The
// camera follows THIS (no ripple) so its path over a dune is smooth, not bumpy.
function duneH(x, z) {
  const base = fbm(x * 0.0016 + 10, z * 0.0016 + 10) * 118;
  const dune = Math.pow(ridged(x * 0.0042 + 5, z * 0.0042 + 5), 1.5) * 64;
  return base + dune - 92;
}
// Full terrain adds fine wind ripples on top (for the surface look only).
function rawH(x, z) {
  return duneH(x, z) + Math.sin((x * 0.8 + z * 0.35) * 0.05 + fbm(x * 0.02, z * 0.02) * 6) * 1.4;
}
// Graded flat pads around each checkpoint so the outpost props sit on visible
// flat ground (an army base would be graded). Pad heights precomputed from the
// raw field; heights blend toward them within a radius.
const PADS = CHECKPOINTS.map((cp) => ({ x: cp.anchor[0], z: cp.anchor[1], h: 0 }));
PADS.forEach((p) => { p.h = rawH(p.x, p.z); });
function flattenToPads(h, x, z) {
  for (const p of PADS) {
    const d = Math.hypot(x - p.x, z - p.z), R = 64;
    if (d < R) { const e = d / R, s = e * e * (3 - 2 * e); const t = (1 - s) * 0.95; h = h * (1 - t) + p.h * t; }
  }
  return h;
}
function terrainH(x, z) { return flattenToPads(rawH(x, z), x, z); }
// ripple-free ground for the camera to ride along (smooth)
function camGround(x, z) { return flattenToPads(duneH(x, z), x, z); }

/* ---------------- WebGL scene ---------------------------------------------- */
const canvas = document.getElementById('bg');
let renderer = null;
// Probe a scratch canvas first: constructing WebGLRenderer on a machine
// without WebGL makes THREE log a console error before throwing — probing
// keeps the static-fallback path completely silent (0 console errors).
const scratchGL = document.createElement('canvas');
if (scratchGL.getContext('webgl2') || scratchGL.getContext('webgl')) {
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) { console.warn('WebGL unavailable; static fallback in use', e); }
}

/* --- Slice 6: static fallback (DG1–DG3) ------------------------------------
   No WebGL, or prefers-reduced-motion: render the Slice-3 DOM as a normal
   scrolling document. Decided BEFORE initScene so none of the 3D machinery
   (scene graph, rAF loop, wheel/key hijack, intro) ever runs. Under reduced
   motion with WebGL available, an explicit ENTER 3D button boots the
   dampened 3D experience on demand (DG3). */
function enterStaticMode(canEnter3D) {
  document.body.classList.add('static-mode');
  document.getElementById('init').classList.add('done');
  panels.forEach((p) => p.classList.add('active'));
  document.querySelectorAll('.topbar .cp-jump').forEach((b) =>
    b.addEventListener('click', () => {
      if (!document.body.classList.contains('static-mode')) return;   // after ENTER 3D, fast-travel owns these
      panels[+b.dataset.cp]?.scrollIntoView({ behavior: 'auto', block: 'start' });
    }));
  if (!canEnter3D) return;
  const btn = document.getElementById('enter3d');
  btn.hidden = false;
  btn.addEventListener('click', () => {
    btn.hidden = true;
    document.body.classList.remove('static-mode');
    panels.forEach((p, i) => p.classList.toggle('active', i === 0));
    scrollTo(0, 0);
    initScene(renderer);   // RM still damps inertial motion and never flies the intro
  }, { once: true });
}

if (!renderer || reduce) {
  enterStaticMode(!!renderer);
} else {
  initScene(renderer);
}

function initScene(renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.6 : 2));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(new THREE.Color(0xe9bd8b), 260, 1500);
  const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.5, 5000);

  /* --- sand micro-relief bump map (procedural, tileable-ish) --- */
  function makeSandBump() {
    const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(S, S);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      // soft value-noise + directional wind ripples
      const n = fbm(x * 0.06, y * 0.06);
      const rip = 0.5 + 0.5 * Math.sin((x * 0.9 + y * 0.25) + n * 8);
      const v = Math.floor((n * 0.6 + rip * 0.4) * 255);
      const i = (y * S + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(60, 60);
    return tex;
  }

  /* --- terrain --- */
  const geo = new THREE.PlaneGeometry(2000, 2000, mobile ? 200 : 300, mobile ? 200 : 300);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, colors = [];
  const cLow = new THREE.Color(0x6b3318), cMid = new THREE.Color(0xb6602a), cHigh = new THREE.Color(0xeab981);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), h = terrainH(x, z); pos.setY(i, h);
    const t = Math.min(Math.max((h + 92) / 210, 0), 1);
    const c = cLow.clone().lerp(cMid, Math.min(t * 1.7, 1)).lerp(cHigh, Math.max(t - 0.5, 0) * 2);
    const g = 0.92 + hash(Math.floor(x * 0.7), Math.floor(z * 0.7)) * 0.16; // colour grain
    colors.push(c.r * g, c.g * g, c.b * g);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const terrain = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.94, metalness: 0.0,
    bumpMap: makeSandBump(), bumpScale: 0.6,
  }));
  terrain.receiveShadow = true; terrain.castShadow = true;
  scene.add(terrain);

  /* --- sky dome with sun scatter glow --- */
  const sunDir = new THREE.Vector3(-0.72, 0.55, -0.42).normalize();
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(2200, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: {
      top: { value: new THREE.Color(0xc2965f) }, mid: { value: new THREE.Color(0xe6ad6c) },
      bot: { value: new THREE.Color(0xf7e0b4) }, sun: { value: sunDir.clone() },
      sunCol: { value: new THREE.Color(0xfff0d0) }
    },
    vertexShader: 'varying vec3 vp; void main(){ vp = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec3 vp; uniform vec3 top; uniform vec3 mid; uniform vec3 bot; uniform vec3 sun; uniform vec3 sunCol;
      void main(){ vec3 d = normalize(vp); float h = d.y;
        vec3 c = mix(bot, mid, smoothstep(-0.05,0.34,h)); c = mix(c, top, smoothstep(0.22,0.9,h));
        float s = max(dot(d, normalize(sun)), 0.0);
        c += sunCol * (pow(s, 9.0) * 0.22 + pow(s, 320.0) * 0.6);   // halo + soft disc
        gl_FragColor = vec4(c, 1.0); }`
  })));

  /* --- sunny lighting + shadows --- */
  const sun = new THREE.DirectionalLight(0xfff1d6, 3.0);
  sun.castShadow = true;
  const sm = mobile ? 1024 : 2048;
  sun.shadow.mapSize.set(sm, sm);
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 900;
  sun.shadow.camera.left = -220; sun.shadow.camera.right = 220;
  sun.shadow.camera.top = 220; sun.shadow.camera.bottom = -220;
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.6;
  scene.add(sun); scene.add(sun.target);
  scene.add(new THREE.HemisphereLight(0xffe4b8, 0x6b3a22, 0.8), new THREE.AmbientLight(0x8a5a34, 0.45));

  /* --- sun glow sprite --- */
  const gc = document.createElement('canvas'); gc.width = gc.height = 128;
  const gx = gc.getContext('2d'); const rg = gx.createRadialGradient(64, 64, 0, 64, 64, 64);
  rg.addColorStop(0, 'rgba(255,240,210,1)'); rg.addColorStop(.25, 'rgba(255,185,105,.9)'); rg.addColorStop(1, 'rgba(255,140,70,0)');
  gx.fillStyle = rg; gx.fillRect(0, 0, 128, 128);
  const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(gc), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  sunSprite.scale.set(210, 210, 1); sunSprite.position.copy(sunDir.clone().multiplyScalar(1800)); scene.add(sunSprite);

  /* --- drifting dust --- */
  const dN = mobile ? 400 : 900, dp = new Float32Array(dN * 3);
  for (let i = 0; i < dN; i++) { dp[i * 3] = (Math.random() - .5) * 800; dp[i * 3 + 1] = Math.random() * 120; dp[i * 3 + 2] = (Math.random() - .5) * 800; }
  const dgeo = new THREE.BufferGeometry(); dgeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dgeo, new THREE.PointsMaterial({ color: 0xfff0d0, size: 1.3, transparent: true, opacity: .22, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(dust);

  /* --- checkpoint waypoint beacons (thin locators visible from afar) --- */
  const markerColors = [0xff5b41, 0xffb24a, 0xff7a3c];
  const anchors = CHECKPOINTS.map((cp) => { const [x, z] = cp.anchor; return new THREE.Vector3(x, terrainH(x, z), z); });
  const markers = [];
  anchors.forEach((a, i) => {
    const col = markerColors[i % markerColors.length];
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 150, 8, 1, true),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .14, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.set(a.x, a.y + 75, a.z); scene.add(beam);
    markers.push({ beam, ring: { scale: { setScalar() {} }, material: {} } });
  });

  /* --- deserted army outpost props at each checkpoint (procedural; GLTF kit in Slice 2) --- */
  const matTank = new THREE.MeshStandardMaterial({ color: 0x6f6b46, roughness: 0.92, metalness: 0.06 });
  const matMetal = new THREE.MeshStandardMaterial({ color: 0x34332a, roughness: 0.8, metalness: 0.25 });
  const matCrate = new THREE.MeshStandardMaterial({ color: 0x6e4f2a, roughness: 1 });
  const matBag = new THREE.MeshStandardMaterial({ color: 0x9a8456, roughness: 1 });
  const matPole = new THREE.MeshStandardMaterial({ color: 0x4f4c44, roughness: 0.7, metalness: 0.3 });
  const pmesh = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; return m; };

  function buildTank() {
    const t = new THREE.Group();
    const hull = pmesh(new THREE.BoxGeometry(6.6, 1.6, 3.2), matTank); hull.position.y = 1.5; t.add(hull);
    const turret = pmesh(new THREE.BoxGeometry(3, 1.1, 2.4), matTank); turret.position.set(-0.4, 2.55, 0); t.add(turret);
    const barrel = pmesh(new THREE.CylinderGeometry(0.2, 0.2, 4.4, 10), matMetal); barrel.rotation.z = Math.PI / 2; barrel.position.set(2.3, 2.7, 0); t.add(barrel);
    [1.55, -1.55].forEach((z) => { const tr = pmesh(new THREE.BoxGeometry(7, 1.1, 0.8), matMetal); tr.position.set(0, 0.55, z); t.add(tr); });
    return t;
  }
  function buildCrates() {
    const g = new THREE.Group();
    [[1.5, 0, 0.75, 0], [1.3, 1.4, 0.65, 0.3], [1.3, 0.3, 2.05, 0.4]].forEach(([s, x, y, z]) => {
      const c = pmesh(new THREE.BoxGeometry(s, s, s), matCrate); c.position.set(x, y, z); c.rotation.y = hash(x * 9, z * 9); g.add(c);
    });
    return g;
  }
  function buildSandbags() {
    const g = new THREE.Group(), n = 16, R = 2.6;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      for (let row = 0; row < 2; row++) {
        const b = pmesh(new THREE.BoxGeometry(1.0, 0.45, 0.7), matBag);
        b.position.set(Math.cos(a) * R, 0.28 + row * 0.46, Math.sin(a) * R); b.rotation.y = a + row * 0.2; g.add(b);
      }
    }
    return g;
  }
  function buildAntenna() {
    const g = new THREE.Group();
    const base = pmesh(new THREE.BoxGeometry(1.6, 0.8, 1.6), matCrate); base.position.y = 0.4; g.add(base);
    const mast = pmesh(new THREE.CylinderGeometry(0.1, 0.18, 9.5, 8), matPole); mast.position.y = 5.0; g.add(mast);
    const dish = pmesh(new THREE.CylinderGeometry(1.1, 1.1, 0.18, 16), matMetal); dish.rotation.x = Math.PI / 2.4; dish.position.set(0, 6.8, 0.4); g.add(dish);
    return g;
  }
  function buildHedgehog() {
    const g = new THREE.Group();
    for (let k = 0; k < 3; k++) { const bar = pmesh(new THREE.CylinderGeometry(0.1, 0.1, 3, 6), matMetal); bar.rotation.set(k * 1.0, k * 0.7, Math.PI / 2 * (k % 2)); g.add(bar); }
    return g;
  }
  // Build one outpost as a group (local coords, y=0 = flat pad ground) then
  // place + scale it at each checkpoint anchor.
  // Props laid in a shallow arc facing the camera (+z = toward camera).
  function buildOutpost(seed) {
    const g = new THREE.Group();
    const tank = buildTank(); tank.position.set(-7, 0, -2); tank.rotation.y = 0.5 + hash(seed, 1); g.add(tank);
    const crates = buildCrates(); crates.position.set(9, 0, -3); crates.rotation.y = hash(seed, 3) * 6.28; g.add(crates);
    const bags = buildSandbags(); bags.position.set(2, 0, 6); g.add(bags);
    const ant = buildAntenna(); ant.position.set(-11, 0, -11); ant.rotation.y = hash(seed, 4) * 6.28; g.add(ant);
    const hh = buildHedgehog(); hh.position.set(12, 0.4, 5); hh.rotation.y = hash(seed, 5) * 6.28; g.add(hh);
    return g;
  }
  // Procedural camps are the first-paint stand-in AND the graceful fallback
  // (DS2): if the GLTF kit fails to load we keep these, never a blank pad.
  const proceduralCamps = [];
  anchors.forEach((a, i) => {
    const camp = buildOutpost(i * 37 + 3);
    camp.position.set(a.x, a.y, a.z); camp.scale.setScalar(1.5);
    scene.add(camp);
    proceduralCamps.push(camp);
  });

  /* --- holographic field terminal per checkpoint (DS4): an emissive
     ShaderMaterial screen on a small recon prop. It glows in TRAVEL and
     fades out as INFO ramps (uOpacity = 1 − infoAmt), so it reads as the
     "holographic" pre-state of the content surface; Step 5 (DS5) cross-fades
     it into a crisp CSS3D panel on dock. The shader's scanline/flicker/sweep
     are all driven by uTime, which the loop freezes under reduced-motion
     (DS6) → a static phosphor glow, no motion, travel loop untouched. The
     prop is independent of the procedural↔GLTF camp swap. --- */
  const holoScreens = [];
  function makeHoloMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },               // driven by 1 − infoAmt each frame
        uColor: { value: new THREE.Color(0x7cfca6) },   // --phosphor recon-cyan
      },
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: `
        precision mediump float;
        uniform float uTime; uniform float uOpacity; uniform vec3 uColor;
        varying vec2 vUv;
        float h21(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
        void main() {
          vec2 uv = vUv;
          float scan  = pow(0.5 + 0.5 * sin(uv.y * 150.0 - uTime * 4.0), 1.5);
          float sweep = smoothstep(0.05, 0.0, abs(uv.y - fract(uTime * 0.12)));
          float flick = 0.86 + 0.14 * sin(uTime * 26.0) * h21(vec2(floor(uTime * 11.0), 3.0));
          float bars  = step(0.6, fract(uv.y * 11.0 + 0.2)) * 0.1;
          float frameDist = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
          float frame = smoothstep(0.028, 0.012, frameDist);
          float body = (0.22 + scan * 0.4 + sweep * 0.7 + bars) * flick + frame * 0.7;
          float mask = smoothstep(0.0, 0.02, uv.x) * smoothstep(1.0, 0.98, uv.x)
                     * smoothstep(0.0, 0.02, uv.y) * smoothstep(1.0, 0.98, uv.y);
          float intensity = body * mask;
          gl_FragColor = vec4(uColor * intensity, intensity * uOpacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,   // holographic projection glow; picks up bloom (D10)
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }
  function buildHoloTerminal() {
    const g = new THREE.Group();
    const footing = pmesh(new THREE.BoxGeometry(1.7, 0.4, 1.3), matMetal); footing.position.y = 0.2; g.add(footing);
    const post = pmesh(new THREE.CylinderGeometry(0.16, 0.26, 4.2, 8), matPole); post.position.y = 2.2; g.add(post);
    // Dark "glass" backing so the additive phosphor reads as cyan-on-screen even
    // when the quad projects against the bright sky (additive alone washes white
    // there). It fades with the holo (both are TRAVEL-mode elements).
    const back = new THREE.MeshBasicMaterial({ color: 0x05140d, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
    const backing = new THREE.Mesh(new THREE.PlaneGeometry(9.5, 5.9), back);
    backing.position.set(0, 6.7, -0.04); backing.renderOrder = 1; g.add(backing);
    const mat = makeHoloMaterial();
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(9, 5.4), mat);
    screen.position.set(0, 6.7, 0); screen.renderOrder = 2;   // floats above the stand, facing +z (toward the vantage)
    g.add(screen);
    return { group: g, holo: mat, back };
  }
  anchors.forEach((a) => {
    const t = buildHoloTerminal();
    t.group.position.set(a.x + 6, a.y, a.z + 8);   // front-right of the camp, clear of the tank
    t.group.rotation.y = -0.2;                       // toe in toward the traverse centreline / camera
    scene.add(t.group);
    holoScreens.push({ holo: t.holo, back: t.back });
  });

  /* --- CSS3D "holo→crisp" reveal cards (DS5): a phosphor terminal card mounted
     at each outpost terminal, billboarded to the camera. CSS3DRenderer composites
     a real-DOM card over the WebGL canvas; the card materializes only during the
     docking transition (holo fades → card resolves at the outpost → the flat
     reading panel fades in above it). The flat panel's layout/scroll/measure
     system is untouched, so the Slice-1 "measurable on arrival" invariant holds. --- */
  const css3d = new CSS3DRenderer();
  css3d.setSize(innerWidth, innerHeight);
  css3d.domElement.id = 'css3d';
  document.body.appendChild(css3d.domElement);
  infoLayer.style.transition = 'none';   // opacity is now driven per-frame from infoAmt (see loop)
  const cssScene = new THREE.Scene();
  // ~1:1 css-px → screen-px at the dock distance (fov 58); billboarded so text stays crisp.
  // 0.04 is desktop-tuned; on a narrow (portrait/mobile) viewport the same world-anchored
  // card (a) projects past the right edge because it sits +6 off the centreline and (b)
  // would clip the screen width. So below the desktop reference we both shrink the card
  // (width-driven, floored so text stays readable) and reseat it toward the camera
  // centreline. `k===1` on desktop keeps the original 0.04 + (a.x+6) exactly — no
  // regression to the already-verified desktop path.
  const CARD_REF_W = 1200;                                   // width at which 0.04 reads 1:1
  const cardK = () => Math.min(1, innerWidth / CARD_REF_W);  // 1 on desktop, <1 on mobile
  const cardScale = () => 0.04 * Math.max(0.6, cardK());     // floor 0.6 → never smaller than 0.024
  const cardXOff = () => 6 * Math.max(0.35, cardK());        // pull toward centreline on narrow screens
  // Card title mirrors the static panel's own heading (single source of truth).
  const cardTitle = (i) => (panels[i]?.querySelector('.panel-body h1, .panel-body h2')?.textContent
    ?? CHECKPOINTS[i].label).replace(/\s+/g, ' ').trim();
  const cards = anchors.map((a, i) => {
    const cp = CHECKPOINTS[i];
    const el = document.createElement('div');
    el.className = 'holo-card';
    el.style.opacity = '0';
    el.innerHTML = `<div class="hc-head"><span class="hc-cp">${cp.label}</span><span class="hc-lock">● TARGET ACQUIRED</span></div>`
      + `<div class="hc-title">${cardTitle(i)}</div>`
      + `<div class="hc-foot">DECRYPTING INTEL ▸ STAND BY</div>`;
    const obj = new CSS3DObject(el);
    obj.scale.setScalar(cardScale());
    obj.position.set(a.x + cardXOff(), a.y + 6.7, a.z + 8);   // co-located with the holo screen (reseated toward centre on mobile)
    cssScene.add(obj);
    return { el, obj, a };
  });
  const cardClampV = new THREE.Vector3();   // scratch for the per-frame screen-edge clamp (see loop)

  /* --- GLTF outpost kit: lazy-load after first paint, then swap the
     procedural camps for a cloned CC0 kit (DS2 lazy/graceful, DS3 clone +
     arc-compose per checkpoint with seeded variation + shadows). The render
     loop never awaits a model; a failed load leaves the procedural props. --- */
  const KIT_BASE = 'assets/outpost/';
  // name → normalize target (local units, pre 1.5× placement scale).
  // axis 'y' fits height (the comms mast); otherwise fit the max(x,z) footprint.
  const KIT = {
    tank:              { target: 7.6, axis: 'max' },
    crate:             { target: 1.4, axis: 'max' },
    'crate-pickup':    { target: 1.7, axis: 'max' },
    'sandbags-trench': { target: 6.0, axis: 'max' },
    'sandbags-small':  { target: 2.8, axis: 'max' },
    antenna:           { target: 5.0, axis: 'y' },
    'barrier-large':   { target: 3.6, axis: 'max' },
    'barrier-fixed':   { target: 3.0, axis: 'max' },
  };

  // Normalize a loaded model to a target size, recenter on x/z, and drop it so
  // its base sits on the pad (min.y → 0); enable shadows (D10) on every mesh.
  function prepModel(obj, spec) {
    obj.updateMatrixWorld(true);
    let box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const denom = spec.axis === 'y' ? size.y : Math.max(size.x, size.z);
    if (denom > 1e-4) obj.scale.multiplyScalar(spec.target / denom);
    obj.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(obj);
    const c = box.getCenter(new THREE.Vector3());
    obj.position.x -= c.x; obj.position.z -= c.z; obj.position.y -= box.min.y;
    obj.traverse((n) => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } });
    return obj;
  }

  // One camp from the loaded kit, mirroring buildOutpost()'s camera-facing arc
  // (+z = toward camera). Per-checkpoint variation is seeded via hash (no
  // Math.random — reproducible, DS3).
  // +z is toward the camera/vantage: tall backdrop props sit at the back (−z),
  // low props (sandbags/barriers) flank the front (+z) so the cluster composes
  // within the docked lens cone instead of one prop blocking centre.
  function buildGltfOutpost(kit, seed) {
    const g = new THREE.Group();
    const place = (name, x, z, yaw) => {
      const m = kit[name].clone();
      m.position.x += x; m.position.z += z; m.rotation.y += yaw;
      g.add(m);
    };
    place('tank', -2, 3, 0.5 + hash(seed, 1));             // hero, near centre on the open pad
    place('antenna', -14, -11, hash(seed, 4) * 6.28);      // shorter comms mast, back-left backdrop
    place('crate', 7, 2, hash(seed, 3) * 6.28);            // right, mid
    place('crate-pickup', 9.5, 4.5, hash(seed, 6) * 6.28);
    place('barrier-large', 11, 7, hash(seed, 5) * 6.28);   // right flank, front
    place('barrier-fixed', 8, 9.5, hash(seed, 8) * 6.28);
    place('sandbags-trench', -3, 9, (hash(seed, 2) - 0.5) * 0.6); // low front
    place('sandbags-small', 3, 10.5, hash(seed, 7) * 6.28);
    return g;
  }

  let outpostLoadStarted = false;
  function scheduleOutpostLoad() {
    if (outpostLoadStarted) return; outpostLoadStarted = true;
    const ric = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
    ric(() => loadOutposts(), { timeout: 2000 });
  }

  async function loadOutposts() {
    const names = Object.keys(KIT);
    try {
      // Real per-item progress for the fly-in loader (DF3). done/names.length is
      // robust against LoadingManager's growing itemsTotal; the catch below also
      // completes the fraction so the landing never hangs on a failed asset.
      let done = 0;
      const loader = new GLTFLoader();
      const loaded = await Promise.all(names.map((n) =>
        loader.loadAsync(KIT_BASE + n + '.glb').then((gltf) => {
          intro.assetFrac = Math.max(intro.assetFrac, ++done / names.length);
          return [n, prepModel(gltf.scene, KIT[n])];
        })));
      const kit = Object.fromEntries(loaded);
      anchors.forEach((a, i) => {
        const camp = buildGltfOutpost(kit, i * 37 + 3);
        camp.position.set(a.x, a.y, a.z); camp.scale.setScalar(1.5);
        scene.add(camp);
        const old = proceduralCamps[i];
        if (old) { scene.remove(old); old.traverse((n) => { if (n.isMesh) n.geometry.dispose(); }); }
      });
    } catch (e) {
      console.warn('GLTF outpost kit failed to load; keeping procedural props', e);
    } finally {
      intro.assetFrac = 1;   // success or graceful fallback — the fly-in may land either way
    }
  }

  /* --- camera vantages --- */
  const vantages = anchors.map((a) => ({
    pos: new THREE.Vector3(a.x, a.y + 12, a.z + 34),
    look: new THREE.Vector3(a.x, a.y + 4, a.z - 4),
  }));
  function vantage(f, outPos, outLook) {
    const i0 = Math.max(0, Math.min(vantages.length - 1, Math.floor(f)));
    const i1 = Math.min(vantages.length - 1, i0 + 1), t = f - i0;
    outPos.lerpVectors(vantages[i0].pos, vantages[i1].pos, t);
    outLook.lerpVectors(vantages[i0].look, vantages[i1].look, t);
  }

  /* --- Slice 4: cinematic fly-in (DF1–DF4) ---------------------------------
     A camera-only phase before the normal loop: a quadratic-bezier sweep that
     ends byte-exactly at vantages[0], so the handoff has zero camera error and
     the standard dock-into-INFO transition plays as the landing beat. Time
     carries the sweep; the final approach is gated on real asset progress
     (flyProgress, unit-tested in scene/state.js). Once per session; any
     scroll gesture, Enter, or the skip button bails out. Reduced motion never
     flies (the current instant boot is the reduced path). */
  let introSeen = false;
  try { introSeen = sessionStorage.getItem('reconIntroSeen') === '1'; }
  catch { /* storage unavailable (private mode): fall back to once-per-load */ }
  const intro = { active: !reduce && !introSeen, t0: 0, assetFrac: 0 };
  const FLY_MS = 5200;
  const flyStart = vantages[0].pos.clone().add(new THREE.Vector3(360, 240, 540));
  const flyCtrl  = vantages[0].pos.clone().add(new THREE.Vector3(-200, 110, 280));
  const flyLook0 = new THREE.Vector3(CHECKPOINTS[1].anchor[0], 0, CHECKPOINTS[1].anchor[1]); // gaze opens deep into the sector
  function flyPose(p, outPos, outLook) {
    const q = 1 - p, a = q * q, b = 2 * q * p, c = p * p;
    outPos.set(
      a * flyStart.x + b * flyCtrl.x + c * vantages[0].pos.x,
      a * flyStart.y + b * flyCtrl.y + c * vantages[0].pos.y,
      a * flyStart.z + b * flyCtrl.z + c * vantages[0].pos.z);
    outLook.lerpVectors(flyLook0, vantages[0].look, p);
  }
  const introEl = document.getElementById('intro'),
        introBar = document.getElementById('introBar'),
        introPct = document.getElementById('introPct');
  if (intro.active) {
    introEl.classList.add('on');
    outpostLoadStarted = true; loadOutposts();   // eager: the loader must show real streaming (DF3)
  }
  function endIntro() {
    if (!intro.active) return;
    intro.active = false;
    try { sessionStorage.setItem('reconIntroSeen', '1'); } catch { /* fail open */ }
    introEl.classList.add('done');
    setTimeout(() => introEl.classList.remove('on'), 600);
    // Snap to the dock vantage — a no-op on a natural landing (the path already
    // ends there); on skip it jumps the rest of the sweep.
    camPos.copy(vantages[0].pos); camLook.copy(vantages[0].look);
  }
  document.getElementById('introSkip').addEventListener('click', endIntro);

  /* --- post-processing: bloom (also the pipeline DoF will reuse) --- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), mobile ? 0.22 : 0.34, 0.4, 0.9);
  composer.addPass(bloom);
  composer.setSize(innerWidth, innerHeight);

  /* --- input: wheel / keyboard / touch drive the optic state machine ---
     Two channels (task 008 / #23): live px deltas read the content
     (applyScroll); whole STROKES drive friction and travel (commitStroke).
     A stroke = one touch swipe, one wheel burst, or one keypress — grouped
     here so the state machine stays pure. A gap = 3 strokes; pinned edges
     and fresh arrivals absorb 2 (see scene/state.js header). --- */
  let mx = 0, my = 0, tmx = 0, tmy = 0, paused = false;
  let app = initState();

  function curContentMax() {
    const panel = panels[app.cp]; if (!panel) return 0;
    const body = panel.querySelector('.panel-body'), inner = panel.querySelector('.panel-scroll');
    return Math.max(0, inner.scrollHeight - body.clientHeight);
  }
  const fcIsOpen = () => document.getElementById('fc').classList.contains('open');

  const COMMIT_PX = 48;        // accumulated |Δ| that commits a stroke (mid-swipe, for immediate feedback)
  const WHEEL_QUIET_MS = 250;  // wheel burst ends after this much silence
  const WHEEL_REARM_PX = 800;  // …or re-arms every chunk of continuous spinning,
                               // so an unbroken trackpad glide still crosses a gap
                               // (~2400 px, the old TRAVEL_LEN feel) instead of
                               // committing once and going dead
  const KEY_COMMIT_MS = 160;   // held-key repeat must not machine-gun strokes
  const TRAVEL_SCRUB_LEN = 2400; // px of wheel to cross one gap (the pre-stroke
                                 // TRAVEL_LEN feel) — wheel/trackpad scrub travel
                                 // px-true; only touch/keys use the stroke quantum

  const MOVE_SLOP = 3;         // cumulative px of panel movement below which a stroke is
                               // "unmoved" — contentMax jitters a few px (see PIN_SLOP in
                               // state.js), and that jitter must not re-arm the edge gate
  let strokeSum = 0, strokeStartRs = null, strokeCommitted = false, strokeCommitSum = 0;
  const strokeMoved = () => strokeStartRs != null && Math.abs(app.readScroll - strokeStartRs) > MOVE_SLOP;

  // On arrival, activate the panel synchronously so its contentMax is measurable
  // (not 0 during the info fade-in) — otherwise the next stroke would skip the
  // checkpoint. Then clamp readScroll (handles the cancel/land sentinels) and re-apply.
  const syncPanel = () => {
    if (app.phase !== PHASE.READING) return;
    setActivePanel(app.cp);
    const m = curContentMax(); if (app.readScroll > m) app.readScroll = m;
    setActivePanel(app.cp);
  };
  // A deliberately absorbed stroke with zero feedback reads as "broken" (D5):
  // acknowledge it on the chrome the reader is looking at — the end-of-intel
  // hint for forward pushes, the TARGET ACQUIRED chip for upward ones.
  const nudge = (dir) => {
    const panel = panels[app.cp]; if (!panel) return;
    const el = panel.querySelector(dir > 0 ? '.scroll-hint' : '.lock');
    if (!el) return;
    el.classList.remove('nudge'); void el.offsetWidth; el.classList.add('nudge');
  };

  const commitNow = () => {
    if (!strokeSum) return;
    strokeCommitted = true; strokeCommitSum = strokeSum;
    const prev = app;
    app = commitStroke(app, Math.sign(strokeSum), strokeMoved(), curContentMax(), CHECKPOINTS.length);
    if (app.phase === PHASE.READING && prev.phase === PHASE.READING && !strokeMoved()) {
      if (app.settle < prev.settle) nudge(-1);                  // settling: the header chip is what's on screen
      else if (app.arm < prev.arm) nudge(Math.sign(strokeSum)); // edge gate: hint (▾) or chip (▴)
    }
    syncPanel();
  };
  const feed = (d, autoCommit = true, scrub = false) => {
    if (fcIsOpen()) return;                     // palette captures input while open (DT4)
    if (intro.active) { endIntro(); return; }   // an impatient scroll = skip (DF4)
    if (scrub && app.phase === PHASE.TRAVELLING && !app.auto) {
      // wheel/trackpad mid-travel: px-true scrub (every pixel glides the
      // camera; a burst that only steps once per commit reads as "stuck").
      // Mark the burst committed so it doesn't ALSO step the path 1/3.
      strokeSum += d; strokeCommitted = true; strokeCommitSum = strokeSum;
      app = scrubTravel(app, d, TRAVEL_SCRUB_LEN);
      if (app.phase === PHASE.READING) syncPanel();   // arrived / cancelled mid-burst
      return;
    }
    if (strokeStartRs == null) strokeStartRs = app.readScroll;
    strokeSum += d;
    // an already-absorbed stroke stays absorbed: its remaining deltas must not
    // leak into the panel once the commit drained the settle/arm counter
    if (strokeCommitted && !strokeMoved()) return;
    app = applyScroll(app, d, curContentMax());
    if (autoCommit && !strokeCommitted && Math.abs(strokeSum) >= COMMIT_PX) commitNow();
    syncPanel();
  };
  const strokeEnd = () => {
    if (!strokeCommitted && (strokeMoved() || Math.abs(strokeSum) >= COMMIT_PX)) commitNow();
    strokeSum = 0; strokeStartRs = null; strokeCommitted = false; strokeCommitSum = 0;
  };

  // read-only state snapshot for e2e specs / live diagnosis (never mutated through)
  window.__optic = () => ({ ...app });

  let wheelTimer = 0;
  addEventListener('wheel', (e) => {
    e.preventDefault();
    feed(e.deltaY, true, true);
    if (strokeCommitted && Math.abs(strokeSum - strokeCommitSum) >= WHEEL_REARM_PX) strokeEnd();
    clearTimeout(wheelTimer); wheelTimer = setTimeout(strokeEnd, WHEEL_QUIET_MS);
  }, { passive: false });

  let lastKeyStroke = 0;
  addEventListener('keydown', (e) => {
    if (fcIsOpen()) return;   // fire control owns the keyboard while open (its own handler below)
    if (intro.active) { if (e.key === 'Enter') { e.preventDefault(); endIntro(); } return; }
    const body = panels[app.cp]?.querySelector('.panel-body');
    const page = (body ? body.clientHeight : 600) * 0.8, step = 90;
    if (e.key === 'Home') { e.preventDefault(); app = { ...app, readScroll: 0 }; syncPanel(); return; }
    if (e.key === 'End') { e.preventDefault(); app = { ...app, readScroll: curContentMax() }; syncPanel(); return; }
    let d = 0;
    if (e.key === 'ArrowDown') d = step; else if (e.key === 'ArrowUp') d = -step;
    else if (e.key === ' ' || e.key === 'PageDown') d = page; else if (e.key === 'PageUp') d = -page;
    else return;
    e.preventDefault();
    // each press is one stroke; live reading still tracks held-key repeat, but
    // commits (friction taps / travel steps) are rate-capped
    feed(d, false);
    const now = performance.now();
    if (now - lastKeyStroke >= KEY_COMMIT_MS) { lastKeyStroke = now; strokeEnd(); }
    else { strokeSum = 0; strokeStartRs = null; strokeCommitted = false; strokeCommitSum = 0; }   // repeat too fast: live delta only, no stroke
  });

  let touchY = null, touchT = 0, flickV = 0;
  addEventListener('touchstart', (e) => {
    clearTimeout(wheelTimer); strokeEnd();      // flush any pending wheel burst
    touchY = e.touches[0].clientY; touchT = performance.now(); flickV = 0;
    coastV = 0;                                 // a finger down catches a running coast, like native scrolling
  }, { passive: true });
  addEventListener('touchmove', (e) => {
    if (touchY == null) return;
    const y = e.touches[0].clientY, now = performance.now();
    const d = (touchY - y) * 1.5;
    flickV = 0.75 * flickV + 0.25 * (d / Math.max(1, now - touchT));   // smoothed px/ms for the release flick
    feed(d); touchY = y; touchT = now; e.preventDefault();
  }, { passive: false });
  addEventListener('touchend', () => {
    // release a moving reading stroke into an inertial coast (the glide block
    // in loop() feeds it through applyScroll, so pins/settle still clamp it).
    // Slow deliberate drags (low velocity) stop where the finger stopped.
    const flick = app.phase === PHASE.READING && strokeMoved() && !reduce && Math.abs(flickV) > 0.25;
    touchY = null; strokeEnd();
    coastV = flick ? Math.max(-4, Math.min(4, flickV)) : 0;
    flickV = 0;
  });

  /* --- Slice 5: fast-travel — nav strip + FIRE CONTROL palette (DT1–DT5) --- */
  const fcEl = document.getElementById('fc'), fcInput = document.getElementById('fcInput'),
        fcList = document.getElementById('fcList'), toastEl = document.getElementById('toast');
  let toastT = 0;
  const toast = (msg) => {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2200);
  };
  const EMAIL = 'ssbajpai9@gmail.com';
  async function copyEmail() {
    try { await navigator.clipboard.writeText(EMAIL); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = EMAIL; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove();
    }
    toast('EMAIL COPIED — ' + EMAIL);
  }
  function fastTravelTo(i) {
    if (intro.active) endIntro();   // navigation during the fly-in acts as a skip first (slice-4 rule)
    app = startFastTravel(app, i, CHECKPOINTS.length);
  }
  const panelTitle = (i) => (panels[i]?.querySelector('.panel-body h1, .panel-body h2')?.textContent
    ?? '').replace(/\s+/g, ' ').trim();
  const FC_ITEMS = [
    ...CHECKPOINTS.map((cp, i) => ({ k: cp.label, label: panelTitle(i), hint: 'fast travel', run: () => fastTravelTo(i) })),
    { k: 'OPEN', label: 'Résumé (PDF)', hint: '↗', run: () => open('./latest_resume.pdf', '_blank', 'noopener') },
    { k: 'OPEN', label: 'GitHub', hint: '↗', run: () => open('https://github.com/shivamsbajpai', '_blank', 'noopener') },
    { k: 'OPEN', label: 'lomasa-ai', hint: '↗', run: () => open('https://github.com/lomasa-ai', '_blank', 'noopener') },
    { k: 'COPY', label: 'Copy email', hint: EMAIL, run: copyEmail },
  ];
  let fcSel = 0, fcShown = [], fcPrevFocus = null;
  function fcRender(q) {
    const needle = q.trim().toLowerCase();
    // Rank key-field hits ("02 · WORK") above title-text hits — otherwise
    // typing "work" selects Overwatch ("I build things that WORK…") first.
    const score = (it) => (it.k.toLowerCase().includes(needle) ? 0 : 1);
    fcShown = FC_ITEMS.filter((it) => !needle || (it.k + ' ' + it.label).toLowerCase().includes(needle))
      .sort((x, y) => score(x) - score(y));
    fcSel = Math.max(0, Math.min(fcSel, fcShown.length - 1));
    fcList.innerHTML = fcShown.length
      ? fcShown.map((it, i) => `<div class="fc-item${i === fcSel ? ' sel' : ''}" role="option" aria-selected="${i === fcSel}" data-i="${i}">`
          + `<span class="k">${it.k}</span><span>${it.label}</span><span class="hint">${it.hint}</span></div>`).join('')
      : '<div class="fc-empty">no matching targets</div>';
  }
  function fcOpenPal() {
    if (intro.active) endIntro();
    fcPrevFocus = document.activeElement;
    fcSel = 0; fcInput.value = ''; fcRender('');
    fcEl.classList.add('open'); fcInput.focus();
  }
  function fcClose() {
    fcEl.classList.remove('open');
    if (fcPrevFocus?.focus) fcPrevFocus.focus();
  }
  function fcActivate() {
    const it = fcShown[fcSel]; if (!it) return;
    fcClose(); it.run();
  }
  document.getElementById('fcOpen').addEventListener('click', () => fcIsOpen() ? fcClose() : fcOpenPal());
  fcEl.addEventListener('mousedown', (e) => { if (e.target === fcEl) fcClose(); });   // backdrop click
  fcList.addEventListener('click', (e) => {
    const row = e.target.closest('.fc-item'); if (!row) return;
    fcSel = +row.dataset.i; fcActivate();
  });
  fcInput.addEventListener('input', () => { fcSel = 0; fcRender(fcInput.value); });
  addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault(); fcIsOpen() ? fcClose() : fcOpenPal(); return;
    }
    if (!fcIsOpen()) return;
    if (e.key === 'Escape') { e.preventDefault(); fcClose(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); fcSel = (fcSel + 1) % fcShown.length; fcRender(fcInput.value); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); fcSel = (fcSel - 1 + fcShown.length) % fcShown.length; fcRender(fcInput.value); }
    else if (e.key === 'Enter') { e.preventDefault(); fcActivate(); }
  });
  const navBtns = [...document.querySelectorAll('.topbar .cp-jump')];
  navBtns.forEach((b) => b.addEventListener('click', () => fastTravelTo(+b.dataset.cp)));
  let navCur = -1;
  function navHighlight() {
    if (app.cp === navCur) return;
    navCur = app.cp;
    navBtns.forEach((b, i) => b.classList.toggle('cur', i === navCur));
  }

  if (fine) addEventListener('mousemove', (e) => {
    tmx = (e.clientX / innerWidth - .5) * 2; tmy = (e.clientY / innerHeight - .5) * 2;
    document.documentElement.style.setProperty('--sx', (e.clientX / innerWidth * 100).toFixed(1) + '%');
    document.documentElement.style.setProperty('--sy', (e.clientY / innerHeight * 100).toFixed(1) + '%');
    const r = document.getElementById('reticle'); if (r) { r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px'; }
    const ch = document.getElementById('crossH'), cv = document.getElementById('crossV');
    if (ch) ch.style.top = e.clientY + 'px'; if (cv) cv.style.left = e.clientX + 'px';
  }, { passive: true });

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false); composer.setSize(innerWidth, innerHeight);
    css3d.setSize(innerWidth, innerHeight);
    const cs = cardScale(), xo = cardXOff();   // keep the reveal card on-screen + readable across aspect changes
    cards.forEach(c => { c.obj.scale.setScalar(cs); c.obj.position.x = c.a.x + xo; });
  });
  document.addEventListener('visibilitychange', () => { paused = document.hidden; if (!paused) requestAnimationFrame(loop); });

  /* --- HUD + panel refs --- */
  const hudGrid = document.getElementById('hudGrid'), hudRange = document.getElementById('hudRange'),
        hudHdg = document.getElementById('hudHdg'), hudMode = document.getElementById('hudMode');
  const pad = (n, w) => { n = String(Math.round(n)); while (n.length < w) n = '0' + n; return n; };

  const camPos = vantages[0].pos.clone(), camLook = vantages[0].look.clone();
  const tPos = new THREE.Vector3(), tLook = new THREE.Vector3();
  // infoAmt boots at 0 when the fly-in will play (the panel/dim must not flash
  // before the sweep); otherwise 1, docked on Overwatch as before.
  let infoAmt = intro.active ? 0 : 1, activePanel = -1, booted = false, renderFloat = 0;
  // Reading glide: app.readScroll is the TARGET the strokes/coast set; the
  // panel renders renderScroll, low-passed toward it each frame. glideCp
  // detects dock changes (snap, never glide across panels); coastV is the
  // touch-flick inertia in px/ms, decayed exponentially like native scrolling.
  let renderScroll = 0, glideCp = 0, coastV = 0;

  function setActivePanel(i) {
    if (i !== activePanel) { panels.forEach((p, k) => p.classList.toggle('active', k === i)); activePanel = i; }
    const panel = panels[i]; if (!panel) return;
    // renderScroll, not app.readScroll: the panel glides toward the target the
    // strokes set (see the reading-glide block in loop()), instead of jumping
    // a wheel-notch/swipe chunk per event and stopping dead.
    panel.querySelector('.panel-scroll').style.transform = 'translateY(' + (-renderScroll).toFixed(1) + 'px)';
  }

  const sunOffset = sunDir.clone().multiplyScalar(380);
  let lastT = 0;
  function loop(t) {
    if (paused) return;
    const dtMs = lastT ? Math.min(120, (t || 0) - lastT) : 16; lastT = t || 0;
    if (app.phase === PHASE.READING) { const m = curContentMax(); if (app.readScroll > m) app.readScroll = m; }
    /* --- reading glide: coast the flick, ease the panel toward the target --- */
    if (app.phase === PHASE.READING && !app.auto) {
      if (coastV) {
        const before = app.readScroll;
        app = applyScroll(app, coastV * dtMs, curContentMax());
        if (app.readScroll === before) coastV = 0;            // hit a pin (or settling): stop dead, no overscroll
        else { coastV *= Math.exp(-dtMs / 325); if (Math.abs(coastV) < 0.02) coastV = 0; }   // iOS-like decel curve
      }
      if (app.cp !== glideCp) { glideCp = app.cp; renderScroll = app.readScroll; }   // fresh dock: snap
      renderScroll += (app.readScroll - renderScroll) * (reduce ? 0.5 : 0.3);
      if (Math.abs(renderScroll - app.readScroll) < 0.3) renderScroll = app.readScroll;
    } else coastV = 0;
    // Fast-travel: time-tick the auto leg; on arrival activate the panel
    // synchronously so its contentMax is measurable (same rule as scroll()).
    if (app.auto) {
      app = tickAutoTravel(app, dtMs);
      if (app.phase === PHASE.READING) setActivePanel(app.cp);
    }
    navHighlight();

    const md = modeOf(app);
    if (intro.active) {
      // Fly-in: scripted sweep, gated on real asset progress (DF1/DF2). The
      // normal camera rig is bypassed wholesale; everything else (sun, dust,
      // holo clocks, render) runs as usual underneath the cinematic.
      if (!intro.t0) intro.t0 = t || performance.now();
      const p = flyProgress(((t || performance.now()) - intro.t0) / FLY_MS, intro.assetFrac);
      flyPose(p, camPos, camLook);
      camera.position.copy(camPos); camera.lookAt(camLook);
      const cells = Math.round(intro.assetFrac * 10);
      introBar.textContent = '▰'.repeat(cells) + '░'.repeat(10 - cells);
      introPct.textContent = Math.round(intro.assetFrac * 100) + '%';
      if (p >= 1) endIntro();
    } else {
    // Smooth the scroll-driven progress: discrete wheel/touch steps (~10% of a gap
    // each) become one continuous glide. This is what removes the bumpiness while
    // keeping travel scroll-driven (it only advances toward where you scrolled).
    // reduced-motion tracks scroll tightly (little inertial coast) but still
    // interpolates between notches, so travel is smooth-but-snappy, not teleporty.
    renderFloat += (cameraFloat(app) - renderFloat) * (reduce ? 0.3 : 0.1);
    vantage(renderFloat, tPos, tLook);
    // Ride up and over the dunes (smooth ripple-free ground) rather than cutting through.
    if (md === MODE.TRAVEL) {
      const gy = camGround(tPos.x, tPos.z) + 16; if (tPos.y < gy) tPos.y = gy;
      const ly = camGround(tLook.x, tLook.z) + 4; if (tLook.y < ly) tLook.y = ly;
    }
    mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
    const look = (md === MODE.TRAVEL && !reduce) ? 1 : 0;   // no parallax sway under reduced-motion
    tLook.x += mx * 26 * look; tLook.y += -my * 16 * look; tPos.x += mx * 10 * look;
    // second smoothing stage (double low-pass => continuous velocity => no per-notch bump).
    // reduced-motion uses a tighter factor: responsive, minimal drift — but NOT 1
    // (which would hard-snap each notch and reintroduce choppiness).
    camPos.x += (tPos.x - camPos.x) * (reduce ? 0.35 : 0.18);
    camPos.z += (tPos.z - camPos.z) * (reduce ? 0.35 : 0.18);
    camPos.y += (tPos.y - camPos.y) * (reduce ? 0.32 : 0.16);
    camLook.lerp(tLook, reduce ? 0.35 : 0.18);
    if (md === MODE.TRAVEL) { const f = camGround(camPos.x, camPos.z) + 8; if (camPos.y < f) camPos.y += (f - camPos.y) * 0.4; }
    camera.position.copy(camPos); camera.lookAt(camLook);
    }

    sun.position.copy(camera.position).add(sunOffset);
    sun.target.position.set(camera.position.x, camera.position.y - 30, camera.position.z - 60);
    sun.target.updateMatrixWorld();

    const targetInfo = (md === MODE.INFO && !intro.active) ? 1 : 0;   // the dock fade waits for the landing
    infoAmt += (targetInfo - infoAmt) * 0.12;
    document.body.classList.toggle('info', infoAmt > 0.5);
    if (md === MODE.INFO) setActivePanel(app.cp);

    hudGrid.textContent = pad(3000 + renderFloat * 620, 4);
    hudRange.textContent = pad(180 + renderFloat * 220, 4) + 'm';
    hudHdg.textContent = pad(60 + renderFloat * 40, 3) + '°';
    hudMode.textContent = intro.active ? 'INBOUND' : (md === MODE.INFO ? 'TARGET ACQUIRED' : 'TRAVERSING');

    const arr = dgeo.attributes.position.array;
    for (let i = 0; i < dN; i++) { arr[i * 3] += 0.2; if (arr[i * 3] > 400) arr[i * 3] = -400; }
    dgeo.attributes.position.needsUpdate = true;
    dust.position.set(camera.position.x, 0, camera.position.z);
    const beamOp = 0.09 + Math.sin((t || 0) * 0.003) * 0.04;
    markers.forEach((m) => { m.beam.material.opacity = beamOp; });

    // Holo→card→panel cross-fade (DS4 holo + DS5 reveal), choreographed by infoAmt
    // as you dock so one element hands the baton to the next:
    //   holo  full → gone   across infoAmt 0.05–0.42  (WebGL terminal screen)
    //   card  in 0.28–0.52, out 0.56–0.74            (CSS3D reveal at the outpost)
    //   panel in 0.66–0.95                            (flat crisp reading surface)
    // The card resolves and clears before the panel grows in (a sequential
    // baton-pass, not a muddy double-exposure), with a sliver of overlap so the
    // frame never goes empty mid-handoff.
    const holoFade = 1 - smoothstep(0.05, 0.42, infoAmt);
    const cardOp = smoothstep(0.28, 0.52, infoAmt) * (1 - smoothstep(0.56, 0.74, infoAmt));
    const panelOp = smoothstep(0.66, 0.95, infoAmt);

    // DS4 holo: advance the shader clock (frozen at 0 under reduced-motion, DS6 →
    // static glow) and fade the screen + its dark backing out as INFO ramps.
    const holoT = reduce ? 0 : (t || 0) * 0.001;
    holoScreens.forEach((s) => {
      s.holo.uniforms.uTime.value = holoT;
      s.holo.uniforms.uOpacity.value = holoFade;
      s.back.opacity = holoFade * 0.6;
    });

    // DS5 reveal card: only the docking checkpoint's card is shown; it's pinned at
    // the terminal and billboarded to the camera so its text stays crisp.
    camera.updateMatrixWorld();   // fresh matrixWorldInverse for the projection below (render hasn't run yet this frame)
    cards.forEach((c, i) => {
      if (i === app.cp && cardOp > 0.001) {
        c.el.style.opacity = cardOp.toFixed(3);
        c.obj.quaternion.copy(camera.quaternion);   // face the camera (crisp, no skew)
        // The card's fade band runs while the camera is still gliding in, so the
        // world-anchored card can cross the frustum edge exactly when it's most
        // visible (on a 390px viewport it measured fully off-screen at peak
        // opacity). Re-seat from the anchor, then clamp the projected x so the
        // card rides the screen edge and settles onto the terminal as the camera
        // does — a no-op on any frame where the card already fits.
        c.obj.position.set(c.a.x + cardXOff(), c.a.y + 6.7, c.a.z + 8);
        const r = c.el.getBoundingClientRect();
        if (r.width > 0) {
          cardClampV.copy(c.obj.position).project(camera);
          const lim = Math.max(0, 1 - (r.width + 16) / innerWidth);   // half-width + 8px margin, in NDC
          if (Math.abs(cardClampV.x) > lim) {
            cardClampV.x = Math.sign(cardClampV.x) * lim;
            c.obj.position.copy(cardClampV.unproject(camera));
          }
        }
      } else if (c.el.style.opacity !== '0') {
        c.el.style.opacity = '0';
      }
    });
    infoLayer.style.opacity = panelOp.toFixed(3);   // flat reading panel (layout untouched)

    composer.render();
    css3d.render(cssScene, camera);
    if (!booted) { booted = true; canvas.classList.add('ready'); document.getElementById('init').classList.add('done'); scheduleOutpostLoad(); }   // no-op when the intro already kicked the eager load
    requestAnimationFrame(loop);
  }

  if (!fine) {
    document.documentElement.style.setProperty('--sx', '50%');
    document.documentElement.style.setProperty('--sy', '50%');
    const r = document.getElementById('reticle'); if (r) { r.style.left = '50%'; r.style.top = '50%'; }
  }

  requestAnimationFrame(loop);
}
