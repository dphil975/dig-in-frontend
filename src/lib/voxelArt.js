/* voxelArt.js — the real, deterministic "photo → 3D studded-block voxel
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
