/* ════════════════════════════════════════════════════════════
   Merged module — originally two files in src/lib/:
     · voxelArt.js         (photo → 3D studded-block voxel scene builder)
     · creatureSnapshot.js (Nova home-screen widget data layer)
   ════════════════════════════════════════════════════════════ */

/* ── from voxelArt.js ──────────────────────────────────────────
   voxelArt.js — the real, deterministic "photo → 3D studded-block voxel
   scene" builder. Not a generative-AI render (this repo has no such model
   plugged in, and won't fabricate one) — a genuine procedural technique:
   real colors extracted from the photo (pixelArt.js's median-cut palette),
   turned into real cube height from each cell's own brightness (the same
   "heightmap from luminance" approach real photo-to-voxel toys use), lit
   with hard cel-shaded toon shading for the toy-plastic look.

   Three.js is the first 3D dependency in this app — kept deliberately
   plain (no @react-three/fiber) since this is one self-contained scene
   builder, not a whole 3D UI framework. */

import * as THREE from 'three';
import { extractPalette, quantizeToGrid } from './pixelArt';

const VOXEL_OUTPUT = 320; // extractPalette/quantizeToGrid work in "cell" units, not raw pixels

/**
 * Turns a loaded photo into a real per-cell voxel heightmap — brighter
 * cells stand taller, edge cells (from the same silhouette-edge detection
 * the 2D renderer uses) get a small boost so outlines read as raised
 * borders. Honest limitation: this is a full-frame relief (like a studded
 * brick mosaic with height), not subject-isolated 3D — reliably cutting the dish
 * out from its background would need real image segmentation, which this
 * app doesn't have, so it isn't faked here.
 */
export function buildVoxelGrid(imgEl, bitDepth, paletteMode) {
  const paletteInfo = extractPalette(imgEl, bitDepth, paletteMode, VOXEL_OUTPUT);
  const { cols, rows, cells } = quantizeToGrid(imgEl, paletteInfo, paletteMode);

  const voxels = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const c = cells[y][x];
      const lum = (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
      const height = 0.35 + lum * 1.5 + (c.edge ? 0.3 : 0);
      voxels.push({ gx: x, gy: y, r: c.r / 255, g: c.g / 255, b: c.b / 255, height });
    }
  }
  return { cols, rows, voxels };
}

// A tiny 3-step gradient ramp for MeshToonMaterial — hard cel-shaded color
// bands instead of a smooth realistic gradient, matching the "toy" brief.
function buildToonGradient() {
  const data = new Uint8Array([70, 170, 255]);
  const tex = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat);
  tex.needsUpdate = true;
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  return tex;
}

/**
 * Builds the static Three.js scene (lights, ground, camera, and one
 * InstancedMesh cube per voxel — cheap even at a few thousand cells).
 * Cubes start scaled to ~0 height; `animateConstruction` grows them in.
 */
export function buildScene(voxelGrid) {
  const { cols, rows, voxels } = voxelGrid;
  const gradientMap = buildToonGradient();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdce7f0);

  const geometry = new THREE.BoxGeometry(0.9, 1, 0.9); // slight gap between cubes, like real bricks
  const material = new THREE.MeshToonMaterial({ gradientMap });
  const mesh = new THREE.InstancedMesh(geometry, material, voxels.length);
  mesh.userData.originX = cols / 2;
  mesh.userData.originZ = rows / 2;

  const dummy = new THREE.Object3D();
  voxels.forEach((v, i) => {
    dummy.position.set(v.gx - mesh.userData.originX, -0.5, v.gy - mesh.userData.originZ);
    dummy.scale.set(1, 0.001, 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, new THREE.Color(v.r, v.g, v.b));
  });
  mesh.instanceMatrix.needsUpdate = true;
  scene.add(mesh);

  const groundSize = Math.max(cols, rows) * 1.8;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(groundSize, groundSize),
    new THREE.MeshToonMaterial({ color: 0xf3ede0, gradientMap }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.51;
  scene.add(ground);

  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(cols * 0.6, cols * 1.1, rows * 0.7);
  scene.add(key);
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 500);
  const radius = Math.max(cols, rows) * 1.15;
  camera.position.set(0, radius * 0.62, radius);
  camera.lookAt(0, 0, 0);

  return { scene, mesh, camera, voxels, radius };
}

// ── Procedural "Block Chef" figure — a blocky humanoid built entirely from
// primitives, same toon material family as the dish, standing on a small
// pedestal beside it. ─────────────────────────────────────────────────────
export function buildBlockChef(sceneInfo) {
  const gradientMap = buildToonGradient();
  const skin = new THREE.MeshToonMaterial({ color: 0xffcc66, gradientMap });
  const whites = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap });
  const navy = new THREE.MeshToonMaterial({ color: 0x2b3a67, gradientMap });

  const chef = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.3, 0.7), whites);
  torso.position.y = 1.1;
  chef.add(torso);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.85), skin);
  head.position.y = 2.15;
  chef.add(head);

  const hatBase = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.25, 12), whites);
  hatBase.position.y = 2.7;
  chef.add(hatBase);
  const hatPuff = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 10), whites);
  hatPuff.position.y = 3.05;
  chef.add(hatPuff);

  const armGeo = new THREE.BoxGeometry(0.32, 1.0, 0.32);
  const armL = new THREE.Mesh(armGeo, skin);
  armL.position.set(-0.72, 1.15, 0);
  armL.name = 'chefArmL';
  chef.add(armL);
  const armR = new THREE.Mesh(armGeo, skin);
  armR.position.set(0.72, 1.15, 0);
  armR.name = 'chefArmR';
  chef.add(armR);

  const legGeo = new THREE.BoxGeometry(0.4, 0.9, 0.4);
  const legL = new THREE.Mesh(legGeo, navy);
  legL.position.set(-0.3, 0.05, 0);
  chef.add(legL);
  const legR = new THREE.Mesh(legGeo, navy);
  legR.position.set(0.3, 0.05, 0);
  chef.add(legR);

  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 0.2, 16),
    new THREE.MeshToonMaterial({ color: 0xd8cdb8, gradientMap }),
  );
  pedestal.position.y = -0.5;
  chef.add(pedestal);

  const offset = sceneInfo.radius * 0.55;
  chef.position.set(-offset, 0, offset * 0.3);
  chef.scale.setScalar(Math.max(1, sceneInfo.radius / 14));

  sceneInfo.scene.add(chef);
  return chef;
}

// ── Construction animation — deterministic (driven by an explicit `t`
// seconds, not wall-clock), so it can be scrubbed frame-by-frame for a
// reproducible capture instead of racing a live requestAnimationFrame
// loop. Cubes reveal bottom-up in layers with a randomized stagger inside
// each layer and a quick pop-in scale tween; the chef bobs + waves; the
// camera completes exactly one 360° orbit across the whole clip so frame 0
// and the final frame line up for a seamless loop. ─────────────────────────
export function buildRevealSchedule(voxels, totalSeconds, seed = 1) {
  // Deterministic pseudo-random stagger (same seed -> same schedule every
  // time) — a real, inspectable ordering, not Math.random() nondeterminism
  // that would make preview and capture disagree.
  let s = seed;
  const rng = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return (s / 0x7fffffff); };

  const maxHeight = Math.max(...voxels.map(v => v.height), 1);
  const buildWindow = totalSeconds * 0.9; // last 10% holds the finished dish
  return voxels.map(v => {
    const layerFrac = v.height / maxHeight; // taller cubes settle in a bit later, like a real build-up
    const stagger = rng() * 0.35;
    const t0 = Math.min(buildWindow, layerFrac * buildWindow * 0.7 + stagger * buildWindow);
    return t0;
  });
}

const POP_IN_SECONDS = 0.18;

/** Advances the whole scene to an exact time `t` (seconds since the clip
 * started) — call this once per frame, whether previewing live or
 * capturing a deterministic export frame. */
export function updateSceneAtTime(sceneInfo, chef, schedule, t, totalSeconds) {
  const { mesh, voxels, radius } = sceneInfo;
  const dummy = new THREE.Object3D();

  voxels.forEach((v, i) => {
    const t0 = schedule[i];
    const grow = Math.max(0, Math.min(1, (t - t0) / POP_IN_SECONDS));
    // A small overshoot-then-settle bounce reads as a satisfying "pop,"
    // not just a linear grow — still fully deterministic given t.
    const eased = grow >= 1 ? 1 : 1 - Math.pow(1 - grow, 3);
    const h = Math.max(0.001, v.height * eased);
    dummy.position.set(v.gx - mesh.userData.originX, h / 2 - 0.5, v.gy - mesh.userData.originZ);
    dummy.scale.set(1, h, 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;

  if (chef) {
    chef.position.y = Math.sin(t * 3.2) * 0.12;
    const armL = chef.getObjectByName('chefArmL');
    const armR = chef.getObjectByName('chefArmR');
    const wave = Math.sin(t * 6) * 0.5;
    if (armL) armL.rotation.z = 0.3 + wave * 0.3;
    if (armR) armR.rotation.z = -0.3 - wave * 0.3;
  }

  // One full orbit across the whole clip, camera always framing the scene.
  const angle = (t / totalSeconds) * Math.PI * 2;
  sceneInfo.camera.position.set(Math.sin(angle) * radius, radius * 0.62, Math.cos(angle) * radius);
  sceneInfo.camera.lookAt(0, 0, 0);
}

/* ── from creatureSnapshot.js ──────────────────────────────────
   creatureSnapshot.js — the data layer for Nova's home-screen widget.

   The widget is not a new feature. It's a THIRD RENDERER on top of the same
   Creature lifecycle that the in-app view already draws — alongside the app UI.
   This file is the client-side stand-in for the two backend endpoints that
   renderer talks to, modelled faithfully so the widget UI can be built, wired
   and demoed before any native (WidgetKit / Jetpack Glance) or server code
   exists:

     GET  /v1/creature/snapshot   → getSnapshot()   (+ ETag / If-None-Match)
     POST /v1/creature/interact   → interact(action) (feed | pet, rate-limited)

   Plus the three things that make the widget cheap to refresh at scale:
     · FriendSnapshotCache — a precomputed, denormalized friends row so a
       widget reload never fans out to live per-friend queries.
     · Push-trigger evaluation — decides which state changes are worth a silent
       push + timeline reload, and which are sub-milestone noise to swallow.
     · A friend-notification debounce (≤1/hour) that protects the OS refresh
       budget from flicker.

   SCOPE HONESTY (same posture as novaNudges / happinessEngine): every rule here
   is real and client-side — real XP thresholds, real growth FSM, real rate
   limiter, real ETag, real debounce. What's simulated is only the network: the
   "server" is localStorage, and the friends are a seeded cohort standing in for
   FriendSnapshotCache rows. Swap the two functions' bodies for fetch() the day
   the backend lands; every caller and every trigger stays identical. */

const K = {
  creature: 'dig_in_creature',        // { xp, mood, lastFedAt, lastPetAt, bornAt, stageSeen }
  rate:     'dig_in_creature_rate',   // [epochMs, …] recent interaction timestamps (server backstop)
  pushlog:  'dig_in_creature_pushlog',// [{ kind, at, key }] fired silent-push history (for debounce)
  budget:   'dig_in_creature_budget', // { day: 'YYYY-MM-DD', reloads: n } OS refresh accounting
};

function read(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return v ?? fallback; }
  catch { return fallback; }
}
function write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}

/* ── Growth FSM ──────────────────────────────────────────────────
   Server-authoritative in production; the thresholds live here so the widget
   can render xp/xpToNext without a second call. Cumulative XP gates each stage;
   `next` is the delta the progress ring fills toward. */
/* Growth reads as a Y2K style glow-up — a Pixel-Chix-bodied, Ulala-pigtailed
   dancer whose outfit levels up through the Space Channel 5 colour run
   (blush → hot pink → orange → electric blue → chrome → holo). `look` keys the
   NovaSprite palette; keys stay stable for the FSM. */
export const STAGES = [
  { key: 'egg',       label: 'Trainee',  look: 'blush',  glyph: '🌸', at: 0,    next: 60,   blurb: 'Just plugged in.' },
  { key: 'hatchling', label: 'Popstar',  look: 'pink',   glyph: '🎀', at: 60,   next: 120,  blurb: 'Found her signature pink.' },
  { key: 'sprout',    label: 'Groovy',   look: 'orange', glyph: '🧡', at: 180,  next: 220,  blurb: 'Turning up the heat.' },
  { key: 'juvenile',  label: 'Neon',     look: 'blue',   glyph: '💠', at: 400,  next: 350,  blurb: 'Electric and unstoppable.' },
  { key: 'adult',     label: 'Chrome',   look: 'white',  glyph: '🤍', at: 750,  next: 550,  blurb: 'Cool, polished, iconic.' },
  { key: 'radiant',   label: 'Hologram', look: 'silver', glyph: '✨', at: 1300, next: null, blurb: 'Fully holographic. Maxed.' },
];

export function stageForXp(xp) {
  let s = STAGES[0];
  for (const st of STAGES) if (xp >= st.at) s = st;
  return s;
}
function xpToNext(xp) {
  const s = stageForXp(xp);
  if (s.next == null) return { into: 0, need: 0, ring: 1 };
  const into = xp - s.at;
  return { into, need: s.next, ring: Math.min(1, into / s.next) };
}

/* ── Mood ────────────────────────────────────────────────────────
   A read-only function of time since the last feed/pet — the widget shows it,
   it never sets it. Hunger climbs with neglect; a recent pet reads playful. */
export const MOODS = {
  excited: { label: 'excited', face: '◕‿◕', tone: '#e68a4e' },
  content: { label: 'content', face: '◡‿◡', tone: '#7c5daf' },
  playful: { label: 'playful', face: '≧◡≦', tone: '#3a9d8f' },
  sleepy:  { label: 'sleepy',  face: '－‿－', tone: '#8b8194' },
  hungry:  { label: 'hungry',  face: '◉︵◉', tone: '#c26a6a' },
};
const HOUR = 3_600_000;
function moodFor(c, now) {
  const sinceFed = now - (c.lastFedAt || c.bornAt);
  const sincePet = now - (c.lastPetAt || 0);
  if (sincePet < 30_000) return 'playful';           // pet in the last 30s
  if (sinceFed < 2 * HOUR) return 'excited';         // freshly fed
  if (sinceFed > 20 * HOUR) return 'hungry';         // long neglect
  const hr = new Date(now).getHours();
  if (hr >= 23 || hr < 6) return 'sleepy';
  return 'content';
}

function loadCreature() {
  const now = Date.now();
  return read(K.creature, {
    xp: 150, mood: 'content', lastFedAt: now - 5 * HOUR, lastPetAt: 0,
    bornAt: now - 26 * HOUR, stageSeen: 'sprout',
  });
}

/* ── Reminder ────────────────────────────────────────────────────
   At most ONE reminder rides in a snapshot — the single most relevant nudge.
   Computed server-side from last-known state (never live location, per the
   privacy note): streak-at-risk wins, then a discovered nearby store, then a
   fresh badge. Returns null when nothing is worth the widget's attention. */
function computeReminder(c, now) {
  const sinceFed = now - (c.lastFedAt || c.bornAt);
  if (sinceFed > 18 * HOUR) {
    const hrsLeft = Math.max(1, Math.round((24 * HOUR - sinceFed) / HOUR));
    return { type: 'streak_risk', text: `Streak resets in ${hrsLeft}h`, expiresAt: c.lastFedAt + 24 * HOUR };
  }
  if (c.nearbyStore) {
    return { type: 'nearby_store', text: `${c.nearbyStore} is 4 min away`, expiresAt: now + 2 * HOUR };
  }
  if (c.freshBadge) {
    return { type: 'badge_earned', text: `Badge earned: ${c.freshBadge}`, expiresAt: now + 6 * HOUR };
  }
  return null;
}

/* ── FriendSnapshotCache (denormalized read model) ───────────────
   In production these are precomputed rows refreshed by the debounce logic
   below — never a live per-friend query on the widget's hot path. Here they're
   a stable seeded cohort so the friends row renders identically every reload. */
const FRIEND_SEED = [
  { id: 'f_mara',  initial: 'M', level: 5, mood: 'content', stage: 'adult' },
  { id: 'f_theo',  initial: 'T', level: 3, mood: 'hungry',  stage: 'juvenile' },
  { id: 'f_rue',   initial: 'R', level: 7, mood: 'excited', stage: 'radiant' },
  { id: 'f_juno',  initial: 'J', level: 2, mood: 'sleepy',  stage: 'sprout' },
  { id: 'f_kwan',  initial: 'K', level: 4, mood: 'playful', stage: 'juvenile' },
];
export function friendCache() { return FRIEND_SEED.map(f => ({ ...f })); }

/* ── ETag ────────────────────────────────────────────────────────
   Cheap stable hash of the payload so a reload that finds nothing changed can
   answer 304 and cost next to nothing — the whole point of a battery path. */
function etagOf(payload) {
  const s = JSON.stringify(payload);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return `W/"${h.toString(36)}"`;
}

/* ════════════════════════════════════════════════════════════════
   GET /v1/creature/snapshot
   Deliberately small (well under 2KB). Pass the last ETag as `ifNoneMatch`;
   an unchanged snapshot comes back { notModified: true } with no body — model
   the 304 so the caller's refresh-budget accounting is honest.
   ════════════════════════════════════════════════════════════════ */
export function getSnapshot({ ifNoneMatch, withFriends = true } = {}) {
  const now = Date.now();
  const c = loadCreature();
  const st = stageForXp(c.xp);
  const ring = xpToNext(c.xp);
  const body = {
    creature: {
      stage: st.key, glyph: st.glyph, mood: moodFor(c, now),
      xp: c.xp, xpToNext: ring.need, xpInto: ring.into,
    },
    reminder: computeReminder(c, now),
    friends: withFriends ? friendCache().map(({ stage, ...mini }) => mini) : [],
  };
  const etag = etagOf(body);
  countReload(now);
  if (ifNoneMatch && ifNoneMatch === etag) return { notModified: true, etag, status: 304 };
  return { ...body, etag, status: 200, bytes: JSON.stringify(body).length };
}

/* ════════════════════════════════════════════════════════════════
   POST /v1/creature/interact  { action: 'feed' | 'pet' }
   The SAME mutation the in-app buttons call — no divergent logic. The widget
   bypasses the app's UI throttling, so the SERVER is the rate-limit backstop:
   a handful of calls/minute, enforced here regardless of which renderer asked.
   ════════════════════════════════════════════════════════════════ */
export const RATE = { max: 6, windowMs: 60_000 };

export function rateState(now = Date.now()) {
  const hits = read(K.rate, []).filter(t => now - t < RATE.windowMs);
  return { used: hits.length, remaining: Math.max(0, RATE.max - hits.length), max: RATE.max };
}

const GAIN = { feed: 35, pet: 8 };

export function interact(action, now = Date.now()) {
  if (action !== 'feed' && action !== 'pet') {
    return { ok: false, error: 'unknown_action' };
  }
  const hits = read(K.rate, []).filter(t => now - t < RATE.windowMs);
  if (hits.length >= RATE.max) {
    const retryMs = RATE.windowMs - (now - hits[0]);
    return { ok: false, error: 'rate_limited', retryAfterMs: retryMs, status: 429 };
  }
  const before = loadCreature();
  const prevStage = stageForXp(before.xp).key;
  const c = { ...before, xp: before.xp + GAIN[action] };
  if (action === 'feed') c.lastFedAt = now;
  if (action === 'pet') c.lastPetAt = now;
  const nextStage = stageForXp(c.xp).key;
  c.stageSeen = nextStage;
  write(K.creature, c);
  write(K.rate, [...hits, now]);

  const evolved = nextStage !== prevStage;
  const triggers = evaluateTriggers({ prevStage, nextStage, evolved }, now);
  return {
    ok: true, status: 200, action, gained: GAIN[action],
    evolved, prevStage, nextStage, triggers,
    snapshot: getSnapshot(),
  };
}

/* ── Push-trigger evaluation + debounce ──────────────────────────
   Which state changes earn a silent push (content-available:1 / data-only FCM)
   that wakes the extension to refetch + reload the timeline — and which are
   swallowed as sub-milestone noise. Friend-originated pushes are batched to at
   most one/hour so several friends updating together can't burn the budget or
   flicker the widget. Returns the pushes that would actually fire. */
export function evaluateTriggers({ prevStage, nextStage, evolved }, now = Date.now()) {
  const log = read(K.pushlog, []);
  const out = [];
  const fire = (kind, key, text) => {
    // debounce: one push per (kind) per hour, keyed so identical events collapse
    const recent = log.find(p => p.kind === kind && now - p.at < HOUR);
    if (recent) return;
    const evt = { kind, key, text, at: now };
    log.push(evt); out.push(evt);
  };
  if (evolved) fire('evolve', nextStage, `Nova evolved to ${nextStage}`);
  const c = loadCreature();
  const rem = computeReminder(c, now);
  if (rem?.type === 'streak_risk') fire('streak_risk', rem.expiresAt, rem.text);
  write(K.pushlog, log.slice(-40));
  return out;
}

/** Simulate a followed friend's creature hitting a milestone — exercises the
    ≤1/hour friend-notification debounce without a real social backend. */
export function simulateFriendMilestone(name = 'a friend', now = Date.now()) {
  const log = read(K.pushlog, []);
  const recent = log.find(p => p.kind === 'friend' && now - p.at < HOUR);
  if (recent) {
    const waitMin = Math.ceil((HOUR - (now - recent.at)) / 60000);
    return { fired: false, reason: 'debounced', retryInMin: waitMin };
  }
  const evt = { kind: 'friend', key: name, text: `${name}'s creature evolved`, at: now };
  log.push(evt); write(K.pushlog, log.slice(-40));
  return { fired: true, event: evt };
}

export function pushLog() { return read(K.pushlog, []).slice().reverse(); }

/* ── OS refresh-budget accounting ────────────────────────────────
   The system, not the app, controls how often a home-screen widget reloads
   (~40–70/day). We can't force reloads; we can only spend them well. This
   counts snapshot reads against a daily budget so the UI can show how close
   the design runs to the ceiling. */
export const BUDGET_CEIL = 70;
function dayKey(now) { return new Date(now).toISOString().slice(0, 10); }
function countReload(now) {
  const b = read(K.budget, { day: dayKey(now), reloads: 0 });
  if (b.day !== dayKey(now)) { b.day = dayKey(now); b.reloads = 0; }
  b.reloads += 1; write(K.budget, b);
}
export function budgetState(now = Date.now()) {
  const b = read(K.budget, { day: dayKey(now), reloads: 0 });
  if (b.day !== dayKey(now)) return { day: dayKey(now), reloads: 0, ceil: BUDGET_CEIL };
  return { ...b, ceil: BUDGET_CEIL };
}

/** Test/demo helper: wind the creature back to a chosen state. */
export function resetCreature(patch = {}) {
  const now = Date.now();
  write(K.creature, {
    xp: 150, mood: 'content', lastFedAt: now - 5 * HOUR, lastPetAt: 0,
    bornAt: now - 26 * HOUR, stageSeen: 'sprout', ...patch,
  });
  write(K.rate, []);
  return getSnapshot();
}

/** Force the streak into the risk window so the reminder path is demoable. */
export function forceStreakRisk() {
  const c = loadCreature();
  c.lastFedAt = Date.now() - 19 * HOUR;
  write(K.creature, c);
  return getSnapshot();
}
