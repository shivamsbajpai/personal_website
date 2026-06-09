// Seam 2 — DOM content floor for v2.html.
// The contract: every checkpoint's content exists statically in the served
// HTML (readable with JS disabled, indexable, screen-reader reachable), and
// the copy is verbatim — byte-for-byte the same sentences as the live site
// (index.html), only rehomed.
// Run: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const v2 = readFileSync(join(root, 'v2.html'), 'utf8');
// Verbatim-audit source of truth: the ORIGINAL site, frozen as a fixture
// (DH1). Post-cutover index.html IS the RECON build, so reading it live
// would make the audit vacuous; the fixture keeps the guarantee meaningful.
const live = readFileSync(join(root, 'tests', 'fixtures', 'legacy-index.html'), 'utf8');

// Strip tags, decode nothing (entities must match verbatim too), collapse
// whitespace — so copy reflowed across source lines still compares equal.
const textOf = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const v2Text = textOf(v2);
const has = (s) => v2Text.includes(textOf(s));

/* ---------- structural floor: the panels exist statically ---------- */

test('all five checkpoint panels are static HTML inside #infoLayer', () => {
  for (const label of ['00 · OVERWATCH', '01 · EXPERIENCE', '02 · WORK', '03 · ABOUT', '04 · ESTABLISH COMMS']) {
    assert.ok(v2.includes(label), `missing panel label: ${label}`);
  }
  // 5 real <section class="panel"> blocks in the raw file — not JS-generated
  assert.equal((v2.match(/<section class="panel"/g) || []).length, 5);
});

test('content is in the raw HTML, not injected by main.js', () => {
  const mainjs = readFileSync(join(root, 'scene', 'main.js'), 'utf8');
  // the panel skeleton (head + body wrapper) must come from the HTML, not a JS template
  assert.ok(!mainjs.includes('panel-head'), 'main.js still builds the panel skeleton');
  assert.ok(!/panel\.innerHTML/.test(mainjs), 'main.js still injects panel markup');
});

/* ---------- every role, verbatim ---------- */

test('experience: every role present with company and period', () => {
  for (const s of [
    'Software Engineer', 'SquareX', 'Dec 2023 — Jul 2025',
    'Associate Product Manager', 'FinBox', 'Jan 2022 — Sep 2023',
    'Product Management Intern', 'Aug 2021 — Dec 2021',
    'Software Development Intern', 'Afour Technologies', 'Jan 2021 — Jun 2021',
    'Zaggle Prepaid Ocean Services', 'Aug 2020 — Dec 2020',
  ]) assert.ok(v2.includes(s), `missing: ${s}`);
});

test('experience: the four SquareX systems', () => {
  for (const s of ['Multi-cloud orchestrator', 'Identity-sync engine', 'Identity provider', 'Domain-intelligence services'])
    assert.ok(v2.includes(s), `missing system: ${s}`);
});

/* ---------- all 7 projects ---------- */

test('work: all seven projects present', () => {
  for (const p of ['second-brain', 'sales-saathi', 'lomasa-cli', 'photo-gallery', 'farm-pro', 'yt-skin', 'ToLetLife'])
    assert.ok(v2.includes(`<span class="project-name">${p}</span>`), `missing project: ${p}`);
});

/* ---------- links: resume + external ---------- */

test('contact surface: email, GitHub, lomasa-ai, resume', () => {
  for (const href of [
    'mailto:ssbajpai9@gmail.com',
    'https://github.com/shivamsbajpai',
    'https://github.com/lomasa-ai',
    './latest_resume.pdf',
  ]) assert.ok(v2.includes(`href="${href}"`), `missing link: ${href}`);
});

test('project + experience links preserved', () => {
  for (const href of [
    'https://github.com/lomasa-ai/lomasa-cli',
    'https://github.com/shivamsbajpai/yt-skin',
    'https://github.com/shivamsbajpai/ToLetLife',
    'https://github.com/shivamsbajpai/tolet_life_api',
    'https://www.zscaler.com/press/zscaler-acquires-squarex',
    'https://github.com/claudeforssb',
  ]) assert.ok(v2.includes(`href="${href}"`), `missing link: ${href}`);
});

test('external links open safely (target=_blank pairs with rel=noopener)', () => {
  const anchors = v2.match(/<a [^>]*target="_blank"[^>]*>/g) || [];
  assert.ok(anchors.length >= 10);
  for (const a of anchors) assert.ok(a.includes('rel="noopener"'), `missing rel=noopener: ${a}`);
});

/* ---------- verbatim audit: copy strings byte-identical to the live site ----
   Extract the real copy from index.html (the source of truth) and assert each
   appears in v2.html unchanged (whitespace-normalized, entities intact). ---- */

const grab = (re) => {
  const out = [];
  for (const m of live.matchAll(re)) out.push(m[1]);
  return out;
};

test('verbatim: hero bio', () => {
  const [bio] = grab(/<p class="hero-bio">([\s\S]*?)<\/p>/g);
  assert.ok(bio && has(bio), 'hero bio altered or missing');
});

test('verbatim: every system description', () => {
  const descs = grab(/<p class="sys-desc">([\s\S]*?)<\/p>/g);
  assert.equal(descs.length, 4);
  for (const d of descs) assert.ok(has(d), `sys-desc altered: ${textOf(d).slice(0, 60)}…`);
});

test('verbatim: featured lead + foot', () => {
  for (const d of [...grab(/<p class="featured-lead">([\s\S]*?)<\/p>/g), ...grab(/<p class="featured-foot">([\s\S]*?)<\/p>/g)])
    assert.ok(has(d), `featured copy altered: ${textOf(d).slice(0, 60)}…`);
});

test('verbatim: every experience bullet', () => {
  const lis = grab(/<ul class="exp-list">([\s\S]*?)<\/ul>/g)
    .flatMap((ul) => [...ul.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1]));
  assert.equal(lis.length, 7);
  for (const li of lis) assert.ok(has(li), `bullet altered: ${textOf(li).slice(0, 60)}…`);
});

test('verbatim: every project description', () => {
  const descs = grab(/<p class="project-desc">([\s\S]*?)<\/p>/g);
  assert.equal(descs.length, 7);
  for (const d of descs) assert.ok(has(d), `project-desc altered: ${textOf(d).slice(0, 60)}…`);
});

test('verbatim: about paragraphs, stack grid, Tvash', () => {
  const about = grab(/<div class="about-text reveal">([\s\S]*?)<\/div>/g)
    .flatMap((blk) => [...blk.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1]));
  assert.equal(about.length, 3);
  for (const p of about) assert.ok(has(p), `about altered: ${textOf(p).slice(0, 60)}…`);
  for (const s of grab(/<div class="stack-item">[\s\S]*?<p>([\s\S]*?)<\/p>/g))
    assert.ok(has(s), `stack item altered: ${textOf(s).slice(0, 60)}…`);
  const [tvash] = grab(/<div class="tvash-block reveal">[\s\S]*?<p>([\s\S]*?)<\/p>/g);
  assert.ok(tvash && has(tvash), 'Tvash copy altered or missing');
  assert.ok(v2.includes('Meet Tvash'));
});

test('verbatim: section heads and stats', () => {
  for (const s of [
    "Where I've shipped",
    'Five years across enterprise security, fintech, and platform infrastructure — owning services end to end.',
    'Things I build on my own',
    'Real, shipped side projects — from AI-agent infrastructure to mobile apps, CLIs, and ML pipelines.',
    "A builder who doesn't pick sides",
    'AI &amp; agent infrastructure', 'Apps, tools &amp; ML',
    '5+ yrs', 'shipping software', '3 clouds', 'AWS · GCP · Azure',
    '10+ regions', 'in production', '5 IdPs', 'identity federation',
  ]) assert.ok(v2.includes(s), `missing: ${s}`);
});
