// RECON // SECTOR ARES — Slice 1 core-loop tracer.
// Sunny, more-photoreal 3D Mars desert (shadows + ridged dunes + sand relief +
// bloom/atmosphere) + scope HUD + the travel<->info optic, driven entirely by
// the pure state machine in ./state.js. Placeholder checkpoints stand in for
// real content (Slice 3); simple markers stand in for GLTF props (Slice 2).
import { initState, applyScroll, cameraFloat, modeOf, PHASE, MODE } from './state.js';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const mobile = innerWidth < 768;

/* ---------------- Checkpoints (placeholder content + world anchors) -------- */
const CHECKPOINTS = [
  {
    id: 'overwatch', label: '00 · OVERWATCH', anchor: [0, 60], fill: 4,
    html: `<p class="eyebrow">// target acquired — overwatch</p>
      <h1>I build things that work — at scale, and for the love of it.</h1>
      <p>This is the RECON core-loop tracer: travel the Martian desert through the scope,
      lock onto a checkpoint, the optic flips to info mode, you read its intel, then move on.</p>
      <p class="scroll-hint">scroll to traverse to the next checkpoint ▾</p>`
  },
  {
    id: 'alpha', label: '01 · PLACEHOLDER ALPHA', anchor: [80, -120], fill: 10,
    html: `<h2>Checkpoint Alpha</h2>
      <p>Placeholder intel block standing in for a real section (e.g. Experience). The camera
      flew here across the dunes, locked on, and the desert behind is dimmed and depth-blurred.</p>
      <p>Scrolling here drives this panel's content while the camera stays pinned. Multiple
      scrolls just move the text — the camera does <em>not</em> step toward the next checkpoint.</p>
      <p>Only when the content runs out does one more scroll release the pin and begin a single,
      slow travel to the next target. A fast flick lands you at the end first, then a separate
      scroll travels — so you never fly through by accident.</p>
      <p>Lorem-grade filler to give this panel real scrollable height: the recon optic ranges,
      the heading updates, dust drifts across a sunlit sector of Ares-09, and the outpost sits
      dimmed behind this readout.</p>
      <p>More filler: a deserted tank, crates, sandbags and a comms mast mark the position. The
      graded pad keeps everything on flat ground so the scene composes cleanly.</p>
      <p>Still more body text to ensure several wheel notches are absorbed by reading before the
      end is reached — proving the decoupling of content-scroll from checkpoint travel.</p>
      <p>Final paragraph of the placeholder. Real content (verbatim Experience / Work / About)
      is rehomed in a later slice; this is only here to validate the interaction.</p>
      <p class="scroll-hint">end of intel — one more scroll travels to the next checkpoint ▾</p>`
  },
  {
    id: 'bravo', label: '02 · PLACEHOLDER BRAVO', anchor: [-80, -360], fill: 7,
    html: `<h2>Checkpoint Bravo</h2>
      <p>Second placeholder target. Reverse-scrolling from here flies the camera back to Alpha,
      proving the journey is fully reversible.</p>
      <p>Real props (rover / crates / antennas) and the holographic→crisp content surface arrive
      in the next slice; real content is rehomed in the slice after that.</p>
      <p class="scroll-hint">end of tracer — scroll up to traverse back ▴</p>`
  },
];

/* ---------------- Build DOM panels (content lives in the DOM) -------------- */
const infoLayer = document.getElementById('infoLayer');
CHECKPOINTS.forEach((cp, i) => {
  const panel = document.createElement('section');
  panel.className = 'panel';
  panel.dataset.cp = String(i);
  let body = cp.html;
  for (let k = 0; k < (cp.fill || 0); k++) {
    body += `<p>Recon log ${String(k + 1).padStart(2, '0')}: sector telemetry nominal — wind ${4 + k} kph L→R, optic 12×, dust low. Placeholder filler giving this panel real scrollable height so multiple scrolls are absorbed by reading before the pin releases.</p>`;
  }
  panel.innerHTML = `
    <div class="panel-head mono">
      <span class="cp">${cp.label}</span>
      <span class="lock">TARGET ACQUIRED</span>
    </div>
    <div class="panel-body"><div class="panel-scroll">${body}</div></div>`;
  infoLayer.appendChild(panel);
});
const panels = [...infoLayer.querySelectorAll('.panel')];

/* ---------------- value-noise fbm (module scope: terrain + bump) ----------- */
const hash = (x, y) => { let h = (x | 0) * 374761393 + (y | 0) * 668265263; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967295; };
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
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) { console.warn('WebGL unavailable; CSS sky fallback in use', e); }

if (!renderer) {
  document.body.classList.add('info');
  panels[0].classList.add('active');
  document.getElementById('init').classList.add('done');
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
  anchors.forEach((a, i) => {
    const camp = buildOutpost(i * 37 + 3);
    camp.position.set(a.x, a.y, a.z); camp.scale.setScalar(1.5);
    scene.add(camp);
  });

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

  /* --- post-processing: bloom (also the pipeline DoF will reuse) --- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), mobile ? 0.22 : 0.34, 0.4, 0.9);
  composer.addPass(bloom);
  composer.setSize(innerWidth, innerHeight);

  /* --- input: wheel / keyboard / touch drive the optic state machine --- */
  let mx = 0, my = 0, tmx = 0, tmy = 0, paused = false;
  let app = initState();
  const TRAVEL_LEN = reduce ? 1 : 2400;   // px of scroll to traverse one gap (scroll-driven) — higher = slower/more gradual
  const LERP = reduce ? 1 : 0.22;

  function curContentMax() {
    const panel = panels[app.cp]; if (!panel) return 0;
    const body = panel.querySelector('.panel-body'), inner = panel.querySelector('.panel-scroll');
    return Math.max(0, inner.scrollHeight - body.clientHeight);
  }
  const scroll = (d) => {
    app = applyScroll(app, d, curContentMax(), CHECKPOINTS.length, TRAVEL_LEN);
    // On arrival, activate the panel synchronously so its contentMax is measurable
    // (not 0 during the info fade-in) — otherwise the next scroll would skip the
    // checkpoint. Then clamp readScroll (handles the cancel sentinel) and re-apply.
    if (app.phase === PHASE.READING) {
      setActivePanel(app.cp);
      const m = curContentMax(); if (app.readScroll > m) app.readScroll = m;
      setActivePanel(app.cp);
    }
  };

  addEventListener('wheel', (e) => { e.preventDefault(); scroll(e.deltaY); }, { passive: false });

  addEventListener('keydown', (e) => {
    const body = panels[app.cp]?.querySelector('.panel-body');
    const page = (body ? body.clientHeight : 600) * 0.8, step = 90;
    if (e.key === 'Home') { e.preventDefault(); app = { ...app, readScroll: 0 }; return; }
    if (e.key === 'End') { e.preventDefault(); app = { ...app, readScroll: curContentMax() }; return; }
    let d = 0;
    if (e.key === 'ArrowDown') d = step; else if (e.key === 'ArrowUp') d = -step;
    else if (e.key === ' ' || e.key === 'PageDown') d = page; else if (e.key === 'PageUp') d = -page;
    else return;
    e.preventDefault(); scroll(d);
  });

  let touchY = null;
  addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
  addEventListener('touchmove', (e) => {
    if (touchY == null) return;
    const y = e.touches[0].clientY; scroll((touchY - y) * 1.5); touchY = y; e.preventDefault();
  }, { passive: false });
  addEventListener('touchend', () => { touchY = null; });

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
  });
  document.addEventListener('visibilitychange', () => { paused = document.hidden; if (!paused) requestAnimationFrame(loop); });

  /* --- HUD + panel refs --- */
  const hudGrid = document.getElementById('hudGrid'), hudRange = document.getElementById('hudRange'),
        hudHdg = document.getElementById('hudHdg'), hudMode = document.getElementById('hudMode');
  const pad = (n, w) => { n = String(Math.round(n)); while (n.length < w) n = '0' + n; return n; };

  const camPos = vantages[0].pos.clone(), camLook = vantages[0].look.clone();
  const tPos = new THREE.Vector3(), tLook = new THREE.Vector3();
  let infoAmt = 1, activePanel = -1, booted = false, renderFloat = 0;

  function setActivePanel(i) {
    if (i !== activePanel) { panels.forEach((p, k) => p.classList.toggle('active', k === i)); activePanel = i; }
    const panel = panels[i]; if (!panel) return;
    panel.querySelector('.panel-scroll').style.transform = 'translateY(' + (-app.readScroll).toFixed(1) + 'px)';
  }

  const sunOffset = sunDir.clone().multiplyScalar(380);
  function loop(t) {
    if (paused) return;
    if (app.phase === PHASE.READING) { const m = curContentMax(); if (app.readScroll > m) app.readScroll = m; }

    const md = modeOf(app);
    // Smooth the scroll-driven progress: discrete wheel/touch steps (~10% of a gap
    // each) become one continuous glide. This is what removes the bumpiness while
    // keeping travel scroll-driven (it only advances toward where you scrolled).
    renderFloat += (cameraFloat(app) - renderFloat) * (reduce ? 1 : 0.1);
    vantage(renderFloat, tPos, tLook);
    // Ride up and over the dunes (smooth ripple-free ground) rather than cutting through.
    if (md === MODE.TRAVEL) {
      const gy = camGround(tPos.x, tPos.z) + 16; if (tPos.y < gy) tPos.y = gy;
      const ly = camGround(tLook.x, tLook.z) + 4; if (tLook.y < ly) tLook.y = ly;
    }
    mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
    const look = md === MODE.TRAVEL ? 1 : 0;
    tLook.x += mx * 26 * look; tLook.y += -my * 16 * look; tPos.x += mx * 10 * look;
    // second smoothing stage (double low-pass => continuous velocity => no per-notch bump)
    camPos.x += (tPos.x - camPos.x) * (reduce ? 1 : 0.18);
    camPos.z += (tPos.z - camPos.z) * (reduce ? 1 : 0.18);
    camPos.y += (tPos.y - camPos.y) * (reduce ? 1 : 0.16);
    camLook.lerp(tLook, reduce ? 1 : 0.18);
    if (md === MODE.TRAVEL) { const f = camGround(camPos.x, camPos.z) + 8; if (camPos.y < f) camPos.y += (f - camPos.y) * 0.4; }
    camera.position.copy(camPos); camera.lookAt(camLook);

    sun.position.copy(camera.position).add(sunOffset);
    sun.target.position.set(camera.position.x, camera.position.y - 30, camera.position.z - 60);
    sun.target.updateMatrixWorld();

    const targetInfo = md === MODE.INFO ? 1 : 0;
    infoAmt += (targetInfo - infoAmt) * 0.12;
    document.body.classList.toggle('info', infoAmt > 0.5);
    if (md === MODE.INFO) setActivePanel(app.cp);

    hudGrid.textContent = pad(3000 + renderFloat * 620, 4);
    hudRange.textContent = pad(180 + renderFloat * 220, 4) + 'm';
    hudHdg.textContent = pad(60 + renderFloat * 40, 3) + '°';
    hudMode.textContent = md === MODE.INFO ? 'TARGET ACQUIRED' : 'TRAVERSING';

    const arr = dgeo.attributes.position.array;
    for (let i = 0; i < dN; i++) { arr[i * 3] += 0.2; if (arr[i * 3] > 400) arr[i * 3] = -400; }
    dgeo.attributes.position.needsUpdate = true;
    dust.position.set(camera.position.x, 0, camera.position.z);
    const beamOp = 0.09 + Math.sin((t || 0) * 0.003) * 0.04;
    markers.forEach((m) => { m.beam.material.opacity = beamOp; });

    composer.render();
    if (!booted) { booted = true; canvas.classList.add('ready'); document.getElementById('init').classList.add('done'); }
    requestAnimationFrame(loop);
  }

  if (!fine) {
    document.documentElement.style.setProperty('--sx', '50%');
    document.documentElement.style.setProperty('--sy', '50%');
    const r = document.getElementById('reticle'); if (r) { r.style.left = '50%'; r.style.top = '50%'; }
  }

  requestAnimationFrame(loop);
}
