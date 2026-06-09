// RECON // SECTOR ARES — Slice 1 core-loop tracer.
// Sunny 3D Mars desert + scope HUD + the travel<->info optic, driven entirely
// by the pure state machine in ./state.js. Placeholder checkpoints stand in for
// real content (Slice 3) and simple markers stand in for GLTF props (Slice 2).
import { computeState, buildSegments, MODE } from './state.js';
import * as THREE from 'three';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;

/* ---------------- Checkpoints (placeholder content + world anchors) -------- */
const CHECKPOINTS = [
  {
    id: 'overwatch', label: '00 · OVERWATCH', travelLen: 0, readLen: 900, anchor: [0, 60],
    html: `<p class="eyebrow">// target acquired — overwatch</p>
      <h1>I build things that work — at scale, and for the love of it.</h1>
      <p>This is the RECON core-loop tracer: travel the Martian desert through the scope,
      lock onto a checkpoint, the optic flips to info mode, you read its intel, then move on.</p>
      <p class="scroll-hint">scroll to traverse to the next checkpoint ▾</p>`
  },
  {
    id: 'alpha', label: '01 · PLACEHOLDER ALPHA', travelLen: 640, readLen: 1200, anchor: [80, -120],
    html: `<h2>Checkpoint Alpha</h2>
      <p>Placeholder intel block standing in for a real section (e.g. Experience). The camera
      flew here across the dunes, locked on, and the desert behind is dimmed and depth-blurred.</p>
      <p>Scrolling here drives this panel's content while the camera stays pinned. When the
      content runs out, the pin releases and the optic flies on to the next target.</p>
      <p>Lorem-grade filler to prove vertical scrolling inside a pinned info panel: the recon
      optic ranges, the heading updates, dust drifts across a sunlit sector of Ares-09.</p>
      <p class="scroll-hint">keep scrolling — auto-releases at the end ▾</p>`
  },
  {
    id: 'bravo', label: '02 · PLACEHOLDER BRAVO', travelLen: 640, readLen: 1100, anchor: [-80, -360],
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
  panel.innerHTML = `
    <div class="panel-head mono">
      <span class="cp">${cp.label}</span>
      <span class="lock">TARGET ACQUIRED</span>
    </div>
    <div class="panel-body"><div class="panel-scroll">${cp.html}</div></div>`;
  infoLayer.appendChild(panel);
});
const panels = [...infoLayer.querySelectorAll('.panel')];

/* ---------------- Scroll budget -> page height ----------------------------- */
const { total } = buildSegments(CHECKPOINTS);
const spacer = document.getElementById('spacer');
function sizeSpacer() { spacer.style.height = (total + window.innerHeight) + 'px'; }
sizeSpacer();
addEventListener('resize', sizeSpacer);

/* ---------------- WebGL scene ---------------------------------------------- */
const canvas = document.getElementById('bg');
let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) { console.warn('WebGL unavailable; CSS sky fallback in use', e); }

if (!renderer) {
  // No WebGL: reveal panels statically (full fallback is a later slice).
  document.body.classList.add('info');
  panels[0].classList.add('active');
  document.getElementById('init').classList.add('done');
} else {
  initScene(renderer);
}

function initScene(renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(new THREE.Color(0xe7b585), 240, 1300);
  const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.5, 4000);

  /* --- value-noise fbm terrain --- */
  const hash = (x, y) => { let h = (x | 0) * 374761393 + (y | 0) * 668265263; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967295; };
  function vnoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
  }
  function fbm(x, y) { let f = 0, a = 0.5, fr = 1; for (let i = 0; i < 5; i++) { f += a * vnoise(x * fr, y * fr); fr *= 2.03; a *= 0.5; } return f; }
  function terrainH(x, z) {
    return fbm(x * 0.0016 + 10, z * 0.0016 + 10) * 155
         + fbm(x * 0.0085 + 50, z * 0.0085 + 50) * 26
         + Math.sin(x * 0.06 + fbm(x * 0.01, z * 0.01) * 6) * 1.7 - 95;
  }

  const geo = new THREE.PlaneGeometry(1700, 1700, 220, 220);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, colors = [];
  const cLow = new THREE.Color(0x7a3a18), cMid = new THREE.Color(0xc9692a), cHigh = new THREE.Color(0xf3c98e);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), h = terrainH(x, z); pos.setY(i, h);
    const t = Math.min(Math.max((h + 95) / 230, 0), 1);
    const c = cLow.clone().lerp(cMid, Math.min(t * 1.6, 1)).lerp(cHigh, Math.max(t - 0.5, 0) * 2);
    const g = 0.9 + hash(Math.floor(x), Math.floor(z)) * 0.2;
    colors.push(c.r * g, c.g * g, c.b * g);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  scene.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.97, metalness: 0.02 })));

  /* --- sunny sky dome --- */
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(1800, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { top: { value: new THREE.Color(0xb5895c) }, mid: { value: new THREE.Color(0xe3aa6c) }, bot: { value: new THREE.Color(0xf7dcab) } },
    vertexShader: 'varying vec3 vp; void main(){ vp = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'varying vec3 vp; uniform vec3 top; uniform vec3 mid; uniform vec3 bot; void main(){ float h = normalize(vp).y; vec3 c = mix(bot,mid,smoothstep(-0.05,0.32,h)); c = mix(c,top,smoothstep(0.2,0.85,h)); gl_FragColor = vec4(c,1.0); }'
  })));

  /* --- sunny lighting --- */
  const sunDir = new THREE.Vector3(-0.42, 0.42, -1).normalize();
  const sun = new THREE.DirectionalLight(0xfff1d4, 3.1); sun.position.copy(sunDir.clone().multiplyScalar(700));
  scene.add(sun, new THREE.HemisphereLight(0xffe2b4, 0x7a4326, 1.0), new THREE.AmbientLight(0x9c6638, 0.6));

  /* --- sun glow sprite --- */
  const gc = document.createElement('canvas'); gc.width = gc.height = 128;
  const gx = gc.getContext('2d'); const rg = gx.createRadialGradient(64, 64, 0, 64, 64, 64);
  rg.addColorStop(0, 'rgba(255,236,200,1)'); rg.addColorStop(.25, 'rgba(255,180,100,.9)'); rg.addColorStop(1, 'rgba(255,130,60,0)');
  gx.fillStyle = rg; gx.fillRect(0, 0, 128, 128);
  const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(gc), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  sunSprite.scale.set(320, 320, 1); sunSprite.position.copy(sunDir.clone().multiplyScalar(1500)); scene.add(sunSprite);

  /* --- drifting dust --- */
  const dN = innerWidth < 680 ? 450 : 1100, dp = new Float32Array(dN * 3);
  for (let i = 0; i < dN; i++) { dp[i * 3] = (Math.random() - .5) * 900; dp[i * 3 + 1] = Math.random() * 130; dp[i * 3 + 2] = (Math.random() - .5) * 900; }
  const dgeo = new THREE.BufferGeometry(); dgeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dgeo, new THREE.PointsMaterial({ color: 0xfff0d0, size: 1.5, transparent: true, opacity: .3, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(dust);

  /* --- placeholder checkpoint markers (real props come in Slice 2) --- */
  const markerColors = [0xff5b41, 0xffb24a, 0xff7a3c];
  const anchors = CHECKPOINTS.map((cp) => { const [x, z] = cp.anchor; return new THREE.Vector3(x, terrainH(x, z), z); });
  const markers = [];
  anchors.forEach((a, i) => {
    const col = markerColors[i % markerColors.length];
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 130, 8, 1, true),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .3, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.set(a.x, a.y + 65, a.z); scene.add(beam);
    const ring = new THREE.Mesh(new THREE.RingGeometry(5, 6.4, 36),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .55, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(a.x, a.y + .8, a.z); scene.add(ring);
    markers.push({ beam, ring });
  });

  /* --- camera vantages: behind + above each anchor, looking at it --- */
  const vantages = anchors.map((a) => {
    const pos = new THREE.Vector3(a.x, a.y + 18, a.z + 70);
    return { pos, look: new THREE.Vector3(a.x, a.y + 8, a.z) };
  });
  function vantage(f, outPos, outLook) {
    const i0 = Math.max(0, Math.min(vantages.length - 1, Math.floor(f)));
    const i1 = Math.min(vantages.length - 1, i0 + 1), t = f - i0;
    outPos.lerpVectors(vantages[i0].pos, vantages[i1].pos, t);
    outLook.lerpVectors(vantages[i0].look, vantages[i1].look, t);
  }

  /* --- input --- */
  let mx = 0, my = 0, tmx = 0, tmy = 0, paused = false;
  if (fine) addEventListener('mousemove', (e) => {
    tmx = (e.clientX / innerWidth - .5) * 2; tmy = (e.clientY / innerHeight - .5) * 2;
    document.documentElement.style.setProperty('--sx', (e.clientX / innerWidth * 100).toFixed(1) + '%');
    document.documentElement.style.setProperty('--sy', (e.clientY / innerHeight * 100).toFixed(1) + '%');
    const r = document.getElementById('reticle'); if (r) { r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px'; }
    const ch = document.getElementById('crossH'), cv = document.getElementById('crossV');
    if (ch) ch.style.top = e.clientY + 'px'; if (cv) cv.style.left = e.clientX + 'px';
  }, { passive: true });

  addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight, false); });
  document.addEventListener('visibilitychange', () => { paused = document.hidden; if (!paused) requestAnimationFrame(loop); });

  /* --- HUD + panel refs --- */
  const hudGrid = document.getElementById('hudGrid'), hudRange = document.getElementById('hudRange'),
        hudHdg = document.getElementById('hudHdg'), hudMode = document.getElementById('hudMode');
  const pad = (n, w) => { n = String(Math.round(n)); while (n.length < w) n = '0' + n; return n; };

  /* --- smoothed values --- */
  const camPos = vantages[0].pos.clone(), camLook = vantages[0].look.clone();
  const tPos = new THREE.Vector3(), tLook = new THREE.Vector3();
  let curFloat = 0, infoAmt = 1;
  let activePanel = -1;

  function setActivePanel(i, readProgress) {
    if (i !== activePanel) {
      panels.forEach((p, k) => p.classList.toggle('active', k === i));
      activePanel = i;
    }
    const panel = panels[i]; if (!panel) return;
    const body = panel.querySelector('.panel-body');
    const inner = panel.querySelector('.panel-scroll');
    const max = Math.max(0, inner.scrollHeight - body.clientHeight);
    inner.style.transform = 'translateY(' + (-readProgress * max).toFixed(1) + 'px)';
  }

  let booted = false;
  function loop(t) {
    if (paused) return;
    const s = computeState(window.scrollY || document.documentElement.scrollTop || 0, CHECKPOINTS);

    // camera follows cameraFloat; mouse look-around only while traveling
    curFloat += (s.cameraFloat - curFloat) * 0.08;
    vantage(curFloat, tPos, tLook);
    mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
    const look = s.mode === MODE.TRAVEL ? 1 : 0;
    tLook.x += mx * 26 * look; tLook.y += -my * 16 * look;
    tPos.x += mx * 10 * look;
    camPos.lerp(tPos, 0.15); camLook.lerp(tLook, 0.15);
    camera.position.copy(camPos); camera.lookAt(camLook);

    // info-mode ramp -> body.info class (drives dim/blur + panel + scope fade via CSS)
    const targetInfo = s.mode === MODE.INFO ? 1 : 0;
    infoAmt += (targetInfo - infoAmt) * 0.12;
    document.body.classList.toggle('info', infoAmt > 0.5);
    if (s.mode === MODE.INFO) setActivePanel(s.activeCheckpoint, s.readProgress);

    // HUD
    const prog = s.total > 0 ? (window.scrollY || 0) / s.total : 0;
    hudGrid.textContent = pad(prog * 9999, 4);
    hudRange.textContent = pad(180 + s.cameraFloat * 220, 4) + 'm';
    hudHdg.textContent = pad(60 + s.cameraFloat * 40, 3) + '°';
    hudMode.textContent = s.mode === MODE.INFO ? 'TARGET ACQUIRED' : 'TRAVERSING';

    // dust + marker pulse
    const arr = dgeo.attributes.position.array;
    for (let i = 0; i < dN; i++) { arr[i * 3] += 0.2; if (arr[i * 3] > 450) arr[i * 3] = -450; }
    dgeo.attributes.position.needsUpdate = true;
    dust.position.set(camera.position.x, 0, camera.position.z);
    const pulse = 0.36 + Math.sin((t || 0) * 0.003) * 0.18;
    markers.forEach((m) => { m.beam.material.opacity = pulse; m.ring.scale.setScalar(1 + Math.sin((t || 0) * 0.003) * 0.12); });

    renderer.render(scene, camera);
    if (!booted) { booted = true; canvas.classList.add('ready'); document.getElementById('init').classList.add('done'); }
    if (!reduce) requestAnimationFrame(loop);
  }

  // center the scope for coarse pointers
  if (!fine) {
    document.documentElement.style.setProperty('--sx', '50%');
    document.documentElement.style.setProperty('--sy', '50%');
    const r = document.getElementById('reticle'); if (r) { r.style.left = '50%'; r.style.top = '50%'; }
  }

  if (reduce) { loop(0); }       // render a single static frame
  else requestAnimationFrame(loop);
}
