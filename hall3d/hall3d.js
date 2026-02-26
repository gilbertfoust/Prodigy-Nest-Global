// Use browser-ready ES modules for GitHub Pages.
// esm.sh rewrites internal bare specifiers (e.g. "three"),
// preventing production-only import failures on static hosts.
import * as THREE from 'https://esm.sh/three@0.160.0';
import { GLTFLoader } from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

import { ThirdPersonController } from './controller/thirdPersonController.js';
import { hall3dLayout, getPersonById } from './content/hallContent.js';
import { tsiHallDialogues } from '../shared/rpg/tsi_hall_content.js';
import { museumHostDialogues } from '../shared/rpg/museum_hosts_content.js';
import { hallTopics } from '../shared/rpg/hall_conversations.js';

const canvas = document.getElementById('canvas');
const promptEl = document.getElementById('prompt');
const dlgEl = document.getElementById('dialogue');
const dlgSpeakerEl = document.getElementById('dlgSpeaker');
const dlgTextEl = document.getElementById('dlgText');
const dlgOptsEl = document.getElementById('dlgOpts');
const dlgCloseEl = document.getElementById('dlgClose');
const feedbackEl = document.getElementById('feedback');
const hudEl = document.getElementById('hud');
const characterCandidates = ['character.glb', 'player.glb', 'avatar.glb'];

function setModelStatus(message, tone = 'info') {
  if (!hudEl) return;
  let statusEl = document.getElementById('modelStatus');
  if (!statusEl) {
    statusEl = document.createElement('div');
    statusEl.id = 'modelStatus';
    statusEl.style.marginTop = '8px';
    statusEl.style.paddingTop = '8px';
    statusEl.style.borderTop = '1px solid rgba(100,70,20,.25)';
    statusEl.style.fontSize = '13px';
    statusEl.style.fontWeight = '600';
    hudEl.appendChild(statusEl);
  }
  const toneMap = {
    info: '#35507a',
    success: '#1f7a4f',
    warning: '#9a5a06',
  };
  statusEl.style.color = toneMap[tone] || toneMap.info;
  statusEl.textContent = message;
}

function describeLoadError(err) {
  if (!err) return 'unknown error';
  if (typeof err === 'string') return err;
  if (err.message) return err.message;
  const targetUrl = err?.target?.responseURL || err?.target?.url || err?.currentTarget?.responseURL;
  if (targetUrl) return `request failed: ${targetUrl}`;
  return 'request failed';
}
// Ensure shared state structures exist
if (typeof app !== 'undefined') {
  app.mainHall = app.mainHall || { npcsTalkedTo: [], gatesUnlocked: [], riddlesSolved: {}, conversationState: {} };
  app.mainHall.npcsTalkedTo = app.mainHall.npcsTalkedTo || [];
  app.mainHall.gatesUnlocked = app.mainHall.gatesUnlocked || [];
  app.mainHall.riddlesSolved = app.mainHall.riddlesSolved || {};
  app.mainHall.conversationState = app.mainHall.conversationState || {};
  if (typeof saveState === 'function') saveState();
}

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color('#f0ece3');
scene.fog = new THREE.Fog('#ebe3d4', 28, 160);

// Camera
const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);
camera.position.set(0, 6, 14);

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

function makeCanvasTexture(drawFn, size = 1024) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  drawFn(ctx, size);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const marbleTexture = makeCanvasTexture((ctx, size) => {
  ctx.fillStyle = '#f3f2f4';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 380; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const len = size * (0.04 + Math.random() * 0.18);
    const ang = (Math.random() * 0.8) - 0.4;
    ctx.strokeStyle = `rgba(145, 150, 160, ${0.05 + Math.random() * 0.07})`;
    ctx.lineWidth = 1 + Math.random() * 2.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + len * 0.5, y + Math.sin(ang) * len * 0.55, x + len, y + Math.cos(ang) * len * 0.2);
    ctx.stroke();
  }
  for (let i = 0; i < 1100; i++) {
    const g = 242 + Math.floor(Math.random() * 12);
    ctx.fillStyle = `rgba(${g}, ${g}, ${g + 3}, ${0.03 + Math.random() * 0.05})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 2 + Math.random() * 5, 2 + Math.random() * 5);
  }
}, 1024);
marbleTexture.repeat.set(7, 7);

const wallTexture = makeCanvasTexture((ctx, size) => {
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, '#e4e6ea');
  grad.addColorStop(1, '#d4d8de');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(173, 145, 93, .34)';
  ctx.lineWidth = 5;
  for (let y = size * 0.15; y < size; y += size * 0.2) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  for (let i = 0; i < 280; i++) {
    ctx.strokeStyle = `rgba(142, 148, 158, ${0.05 + Math.random() * 0.05})`;
    ctx.lineWidth = 1 + Math.random() * 1.8;
    const x = Math.random() * size;
    const y = Math.random() * size;
    const len = 28 + Math.random() * 180;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + len * 0.2, y + len * 0.05, x + len * 0.55, y - len * 0.04, x + len, y + len * 0.03);
    ctx.stroke();
  }
}, 1024);
wallTexture.repeat.set(5, 2);

const backdropMarbleTexture = makeCanvasTexture((ctx, size) => {
  ctx.fillStyle = '#e9e8e6';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 460; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const len = 50 + Math.random() * 210;
    const drift = (Math.random() - 0.5) * 80;
    ctx.strokeStyle = `rgba(136, 141, 150, ${0.06 + Math.random() * 0.08})`;
    ctx.lineWidth = 1 + Math.random() * 2.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + len * 0.28, y + drift * 0.2, x + len * 0.65, y - drift * 0.12, x + len, y + drift * 0.05);
    ctx.stroke();
  }

  for (let i = 0; i < 1200; i++) {
    const c = 232 + Math.floor(Math.random() * 20);
    ctx.fillStyle = `rgba(${c}, ${c}, ${c + 2}, ${0.03 + Math.random() * 0.04})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 2 + Math.random() * 6, 2 + Math.random() * 6);
  }
}, 1024);
backdropMarbleTexture.repeat.set(7, 1.3);

const flutedColumnTexture = makeCanvasTexture((ctx, size) => {
  const stripeW = size / 28;
  for (let i = 0; i < 28; i++) {
    const x = i * stripeW;
    const center = x + stripeW * 0.5;
    const grad = ctx.createLinearGradient(x, 0, x + stripeW, 0);
    grad.addColorStop(0, '#d8dbe0');
    grad.addColorStop(0.4, '#fdfdff');
    grad.addColorStop(0.55, '#eceff4');
    grad.addColorStop(1, '#cfd5df');
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, stripeW, size);

    ctx.strokeStyle = 'rgba(172, 177, 186, .28)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(center, 0);
    ctx.lineTo(center, size);
    ctx.stroke();
  }
}, 1024);
flutedColumnTexture.repeat.set(1, 1);

const ceilingTexture = makeCanvasTexture((ctx, size) => {
  const grad = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.15, size * 0.5, size * 0.5, size * 0.5);
  grad.addColorStop(0, '#fffdf8');
  grad.addColorStop(0.65, '#efe7d8');
  grad.addColorStop(1, '#dccdaf');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const r1 = size * 0.28;
    const r2 = size * 0.48;
    ctx.strokeStyle = 'rgba(162, 122, 50, .28)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(size * 0.5 + Math.cos(a) * r1, size * 0.5 + Math.sin(a) * r1);
    ctx.lineTo(size * 0.5 + Math.cos(a) * r2, size * 0.5 + Math.sin(a) * r2);
    ctx.stroke();
  }
}, 1024);
ceilingTexture.repeat.set(1, 1);

// Lighting (heaven-like: bright marble room + warm gold highlights)
const hemi = new THREE.HemisphereLight(0xf3f9ff, 0xbfd5ee, 1.05);
scene.add(hemi);

const key = new THREE.DirectionalLight(0xffffff, 1.45);
key.position.set(10, 16, 6);
key.castShadow = false;
scene.add(key);

const fill = new THREE.DirectionalLight(0xffefcf, 0.68);
fill.position.set(-8, 9, -10);
scene.add(fill);

const rim = new THREE.DirectionalLight(0x9b6bff, 0.24);
rim.position.set(0, 7, -18);
scene.add(rim);

// --- Rotunda floor + walls (circular / octagonal vibe) ---
const floorMat = new THREE.MeshPhysicalMaterial({
  color: 0xf7f7fb,
  map: marbleTexture,
  roughness: 0.18,
  metalness: 0.03,
  clearcoat: 0.78,
  clearcoatRoughness: 0.16,
  reflectivity: 0.75,
});
const floor = new THREE.Mesh(new THREE.CircleGeometry(28, 64), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
scene.add(floor);

// Inner “marble” disc
const inner = new THREE.Mesh(
  new THREE.CircleGeometry(10.5, 48),
  new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: marbleTexture, roughness: 0.16, metalness: 0.02, clearcoat: 0.64, clearcoatRoughness: 0.18 })
);
inner.rotation.x = -Math.PI / 2;
inner.position.y = 0.01;
scene.add(inner);

const centerGoldRing = new THREE.Mesh(
  new THREE.TorusGeometry(10.7, 0.16, 14, 120),
  new THREE.MeshStandardMaterial({ color: 0xe8c97a, roughness: 0.3, metalness: 0.88 })
);
centerGoldRing.rotation.x = Math.PI / 2;
centerGoldRing.position.y = 0.03;
scene.add(centerGoldRing);

const outerGoldRing = new THREE.Mesh(
  new THREE.TorusGeometry(22.15, 0.14, 14, 140),
  new THREE.MeshStandardMaterial({ color: 0xe4c27a, roughness: 0.32, metalness: 0.86 })
);
outerGoldRing.rotation.x = Math.PI / 2;
outerGoldRing.position.y = 0.025;
scene.add(outerGoldRing);

function buildHeavenColumns({ count = 14, radius = 20.7, height = 6.1 }) {
  const colMat = new THREE.MeshPhysicalMaterial({
    color: 0xfcfcff,
    map: flutedColumnTexture,
    roughness: 0.3,
    metalness: 0.02,
    clearcoat: 0.5,
    clearcoatRoughness: 0.25,
  });

  const colGeom = new THREE.CylinderGeometry(0.65, 0.72, height, 24);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const c = new THREE.Mesh(colGeom, colMat);
    c.position.set(Math.cos(a) * radius, height / 2, Math.sin(a) * radius);
    scene.add(c);

    const capTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 0.18, 24),
      new THREE.MeshStandardMaterial({ color: 0xe1bf71, roughness: 0.3, metalness: 0.85 })
    );
    capTop.position.set(c.position.x, height + 0.08, c.position.z);
    scene.add(capTop);

    const capBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.96, 1.02, 0.2, 24),
      new THREE.MeshStandardMaterial({ color: 0xd7b262, roughness: 0.34, metalness: 0.8 })
    );
    capBase.position.set(c.position.x, 0.1, c.position.z);
    scene.add(capBase);
  }
}

const wallMat = new THREE.MeshPhysicalMaterial({
  color: 0xf8f8fb,
  map: wallTexture,
  roughness: 0.35,
  metalness: 0.02,
  clearcoat: 0.46,
  clearcoatRoughness: 0.3,
  emissive: new THREE.Color(0xe9eef6),
  emissiveIntensity: 0.09,
});

function buildExteriorMarbleBackdrop({ radius = 27.0, height = 10.0 }) {
  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 96, 1, true),
    new THREE.MeshPhysicalMaterial({
      color: 0xf1efeb,
      map: backdropMarbleTexture,
      roughness: 0.44,
      metalness: 0.02,
      clearcoat: 0.28,
      clearcoatRoughness: 0.4,
      side: THREE.BackSide,
    })
  );
  shell.position.y = height / 2 - 0.2;
  scene.add(shell);
}

function buildRotundaWalls({ gateAngles, wallRadius = 22.0, height = 6.0 }) {
  const segments = 56;
  const openHalf = 0.22; // radians around each gate reserved as opening
  const segArc = (Math.PI * 2) / segments;
  const segLen = wallRadius * segArc * 0.92;

  const geom = new THREE.BoxGeometry(segLen, height, 0.9);

  for (let i = 0; i < segments; i++) {
    const a = i * segArc;
    const nearGate = gateAngles.some((ga) => {
      const d = Math.atan2(Math.sin(a - ga), Math.cos(a - ga));
      return Math.abs(d) < openHalf;
    });
    if (nearGate) continue;

    const x = Math.cos(a) * wallRadius;
    const z = Math.sin(a) * wallRadius;
    const m = new THREE.Mesh(geom, wallMat);
    m.position.set(x, height / 2, z);
    m.rotation.y = -a + Math.PI / 2;
    scene.add(m);
  }

  // Gold trim + luminous crown ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(wallRadius - 1.6, 0.24, 18, 110),
    new THREE.MeshStandardMaterial({ color: 0xe8c97a, roughness: 0.28, metalness: 0.9, emissive: new THREE.Color(0xffe7b3), emissiveIntensity: 0.14 })
  );
  ring.position.set(0, height + 0.22, 0);
  ring.rotation.x = Math.PI / 2;
  scene.add(ring);

  const upperBand = new THREE.Mesh(
    new THREE.TorusGeometry(wallRadius - 0.6, 0.08, 10, 120),
    new THREE.MeshStandardMaterial({ color: 0xd6b56d, roughness: 0.35, metalness: 0.85 })
  );
  upperBand.position.set(0, height - 0.5, 0);
  upperBand.rotation.x = Math.PI / 2;
  scene.add(upperBand);

  const lowerBand = new THREE.Mesh(
    new THREE.TorusGeometry(wallRadius - 0.45, 0.08, 10, 120),
    new THREE.MeshStandardMaterial({ color: 0xd6b56d, roughness: 0.35, metalness: 0.85 })
  );
  lowerBand.position.set(0, 0.6, 0);
  lowerBand.rotation.x = Math.PI / 2;
  scene.add(lowerBand);

  const ceilingBowl = new THREE.Mesh(
    new THREE.SphereGeometry(wallRadius - 1.4, 64, 32, 0, Math.PI * 2, 0, Math.PI * 0.46),
    new THREE.MeshPhysicalMaterial({
      color: 0xf6efdf,
      map: ceilingTexture,
      roughness: 0.34,
      metalness: 0.03,
      clearcoat: 0.4,
      clearcoatRoughness: 0.3,
      side: THREE.BackSide,
    })
  );
  ceilingBowl.position.y = height + 3.6;
  scene.add(ceilingBowl);

  const oculus = new THREE.Mesh(
    new THREE.CircleGeometry(4.5, 64),
    new THREE.MeshBasicMaterial({ color: 0xd9efff, transparent: true, opacity: 0.72 })
  );
  oculus.rotation.x = -Math.PI / 2;
  oculus.position.y = height + 7.45;
  scene.add(oculus);

  const oculusRing = new THREE.Mesh(
    new THREE.TorusGeometry(4.55, 0.2, 16, 64),
    new THREE.MeshStandardMaterial({ color: 0xe2bd71, roughness: 0.3, metalness: 0.88 })
  );
  oculusRing.rotation.x = Math.PI / 2;
  oculusRing.position.y = height + 7.42;
  scene.add(oculusRing);
}

// Player placeholder (capsule-like)
let player = new THREE.Group();
const body = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.4, 1.0, 6, 12),
  new THREE.MeshStandardMaterial({ color: 0x4c8dff, roughness: 0.35, metalness: 0.1 })
);
body.position.y = 1.1;
player.add(body);
player.position.set(0, 0, 0);
scene.add(player);

// Third-person controller + (optional) Mixamo GLB
const controller = new ThirdPersonController({
  camera,
  domElement: renderer.domElement,
  target: player,
  floorRaycastObjects: [floor],
});

async function tryLoadCharacterGLB() {
  const loader = new GLTFLoader();
  const errors = [];

  for (const fileName of characterCandidates) {
    const modelUrl = new URL(`./assets/${fileName}`, import.meta.url).href;
    // eslint-disable-next-line no-await-in-loop
    const attempt = await new Promise((resolve) => {
      loader.load(
        modelUrl,
        (gltf) => resolve({ ok: true, gltf, fileName }),
        undefined,
        (err) => resolve({ ok: false, err, fileName })
      );
    });
    if (attempt.ok) return attempt;
    errors.push({ fileName, reason: describeLoadError(attempt.err) });
  }

  return { ok: false, errors };
}

function pickClip(clips, keywords) {
  const lowered = clips.map((c) => ({ c, n: (c.name || '').toLowerCase() }));
  for (const kw of keywords) {
    const hit = lowered.find((x) => x.n.includes(kw));
    if (hit) return hit.c;
  }
  return null;
}

function fitCharacterToHall(model) {
  const box = new THREE.Box3().setFromObject(model);
  if (box.isEmpty()) return;

  const size = new THREE.Vector3();
  box.getSize(size);
  const height = Math.max(size.y, 0.0001);
  const targetHeight = 0.36;
  const uniformScale = targetHeight / height;
  model.scale.setScalar(uniformScale);

  const boxAfterScale = new THREE.Box3().setFromObject(model);
  model.position.y -= boxAfterScale.min.y;
}

// Load character if present; otherwise keep placeholder capsule
(async () => {
  setModelStatus(`Character model status: checking ${characterCandidates.join(', ')} in ./hall3d/assets ...`);
  const res = await tryLoadCharacterGLB();
  if (!res.ok) {
    const failedSummary = (res.errors || [])
      .map((item) => `${item.fileName}: ${item.reason}`)
      .join(' | ');
    console.info(`[hall3d] No character GLB found in /hall3d/assets (${characterCandidates.join(', ')}). Using capsule placeholder.`);
    if (failedSummary) {
      console.info(`[hall3d] Character load attempts: ${failedSummary}`);
    }
    setModelStatus(`Character model status: no GLB found (${characterCandidates.join(', ')}) — using capsule placeholder.`, 'warning');
    return;
  }

  // Swap player object
  scene.remove(player);
  player = res.gltf.scene;
  fitCharacterToHall(player);
  player.position.set(0, player.position.y, 4);
  scene.add(player);
  controller.target = player;

  // Animations
  const clips = res.gltf.animations || [];
  if (clips.length) {
    const mixer = new THREE.AnimationMixer(player);
    const idleClip = pickClip(clips, ['idle', 'stand', 'breath', 'rest']) || clips[0] || null;
    const walkClip = pickClip(clips, ['walk', 'run', 'jog']) || clips[0] || null;
    controller.setAnimationMixer(mixer);
    controller.setActions({
      idle: idleClip ? mixer.clipAction(idleClip) : null,
      walk: walkClip ? mixer.clipAction(walkClip) : null,
    });
  }

  setModelStatus(`Character model status: ${res.fileName} loaded successfully.`, 'success');
  console.info(`[hall3d] Loaded player model from ./hall3d/assets/${res.fileName}`);
})();

// --- Interactables (NPCs + Gates) ---
const interactables = [];
const gateMeshes = new Map();
const gateVisuals = new Map();
const npcMeshes = new Map();
const ambientCrowd = [];
let gateToHost = new Map(); // filled after layout is built


const gateDoorTexture = makeCanvasTexture((ctx, size) => {
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, '#f6d88e');
  grad.addColorStop(0.5, '#d6a54b');
  grad.addColorStop(1, '#b9862d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(124, 80, 20, .42)';
  ctx.lineWidth = 8;
  ctx.strokeRect(size * 0.08, size * 0.07, size * 0.84, size * 0.86);

  const panelW = size * 0.34;
  const panelH = size * 0.64;
  const top = size * 0.2;
  const gap = size * 0.05;
  const left = size * 0.14;
  for (let i = 0; i < 2; i++) {
    const x = left + i * (panelW + gap);
    const pg = ctx.createLinearGradient(x, 0, x + panelW, 0);
    pg.addColorStop(0, '#f2cf80');
    pg.addColorStop(0.5, '#c8943d');
    pg.addColorStop(1, '#f1cf81');
    ctx.fillStyle = pg;
    ctx.fillRect(x, top, panelW, panelH);
    ctx.strokeStyle = 'rgba(112, 72, 19, .55)';
    ctx.lineWidth = 5;
    ctx.strokeRect(x, top, panelW, panelH);
  }

  for (let i = 0; i < 220; i++) {
    const c = 205 + Math.floor(Math.random() * 35);
    ctx.fillStyle = `rgba(${c}, ${c - 20}, ${80 + Math.floor(Math.random() * 30)}, ${0.03 + Math.random() * 0.07})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 3 + Math.random() * 6, 2 + Math.random() * 5);
  }
}, 1024);
gateDoorTexture.repeat.set(1, 1);

const gateGlowTexture = makeCanvasTexture((ctx, size) => {
  const g = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.08, size * 0.5, size * 0.5, size * 0.5);
  g.addColorStop(0, "rgba(255,248,214,1)");
  g.addColorStop(0.45, "rgba(255,223,140,.8)");
  g.addColorStop(1, "rgba(255,223,140,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
}, 512);

function isGateUnlocked(gateId) {
  if (typeof app === 'undefined') return false;
  // Gates are considered unlocked only when their host’s riddle is solved.
  const hostId = gateToHost.get(gateId);
  if (!hostId) return false;
  return !!app.mainHall?.riddlesSolved?.[hostId];
}

function setGateVisual(gateId, unlocked) {
  const mesh = gateMeshes.get(gateId);
  if (!mesh) return;
  const mat = mesh.material;
  mat.opacity = unlocked ? 1.0 : 0.9;
  mat.transparent = !unlocked;
  mat.color = new THREE.Color(unlocked ? 0xf8d980 : 0xd8ac58);
  mat.emissive = new THREE.Color(unlocked ? 0x9b6a20 : 0x5f3d12);
  mat.emissiveIntensity = unlocked ? 0.62 : 0.32;
  mat.needsUpdate = true;

  const fx = gateVisuals.get(gateId);
  if (!fx) return;
  if (fx.haloMat) {
    fx.haloMat.emissiveIntensity = unlocked ? 0.9 : 0.62;
    fx.haloMat.color = new THREE.Color(unlocked ? 0xffedb8 : 0xf1ca83);
    fx.haloMat.needsUpdate = true;
  }
  if (fx.auraMat) {
    fx.auraMat.opacity = unlocked ? 0.52 : 0.34;
    fx.auraMat.color = new THREE.Color(unlocked ? 0xffe6a6 : 0xe4be78);
    fx.auraMat.needsUpdate = true;
  }
  if (fx.light) {
    fx.light.intensity = unlocked ? 2.2 : 1.35;
    fx.light.distance = unlocked ? 10.5 : 8.4;
  }
}

function unlockGate(gateId) {
  if (typeof app === 'undefined') return;
  app.mainHall.gatesUnlocked = app.mainHall.gatesUnlocked || [];
  if (!app.mainHall.gatesUnlocked.includes(gateId)) {
    app.mainHall.gatesUnlocked.push(gateId);
    if (typeof saveState === 'function') saveState();
  }
  setGateVisual(gateId, true);
  if (typeof toast === 'function') toast(`Gate unlocked: ${gateId}`, 'success');
}

function markNpcTalked(npcId) {
  if (typeof app === 'undefined') return;
  app.mainHall.npcsTalkedTo = app.mainHall.npcsTalkedTo || [];
  if (!app.mainHall.npcsTalkedTo.includes(npcId)) {
    app.mainHall.npcsTalkedTo.push(npcId);
    if (typeof saveState === 'function') saveState();
  }
  const mesh = npcMeshes.get(npcId);
  if (mesh) {
    mesh.material.emissiveIntensity = 0.25;
    mesh.material.opacity = 0.85;
    mesh.material.transparent = true;
  }
}

function createNpcMarker(npc) {
  const g = new THREE.SphereGeometry(0.45, 22, 18);
  const m = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.25,
    metalness: 0.1,
    emissive: new THREE.Color(0x9b6bff),
    emissiveIntensity: 0.75,
  });
  const s = new THREE.Mesh(g, m);
  s.position.set(npc.position.x, 1.2, npc.position.z);
  scene.add(s);
  npcMeshes.set(npc.id, s);
  interactables.push({ type: 'npc', id: npc.id, label: npc.label, object: s, radius: hall3dLayout.interactRadius.npc });
}

function createGateMarker(gate, position) {
  const gateGroup = new THREE.Group();

  const haloMat = new THREE.MeshStandardMaterial({ color: 0xffe4a3, roughness: 0.2, metalness: 0.9, emissive: new THREE.Color(0xffdd93), emissiveIntensity: 0.75 });
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(1.36, 0.12, 16, 72),
    haloMat
  );
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 3.2;
  gateGroup.add(halo);

  const frameMat = new THREE.MeshStandardMaterial({ color: 0xd3a24b, roughness: 0.2, metalness: 0.93 });

  const archFrame = new THREE.Mesh(
    new THREE.ShapeGeometry((() => {
      const sh = new THREE.Shape();
      sh.moveTo(-1.05, 0);
      sh.lineTo(-1.05, 2.7);
      sh.quadraticCurveTo(-1.05, 3.55, 0, 3.62);
      sh.quadraticCurveTo(1.05, 3.55, 1.05, 2.7);
      sh.lineTo(1.05, 0);
      sh.lineTo(0.82, 0);
      sh.lineTo(0.82, 2.66);
      sh.quadraticCurveTo(0.82, 3.2, 0, 3.28);
      sh.quadraticCurveTo(-0.82, 3.2, -0.82, 2.66);
      sh.lineTo(-0.82, 0);
      sh.closePath();
      return sh;
    })()),
    frameMat
  );
  archFrame.position.set(0, 0.2, 0.13);
  gateGroup.add(archFrame);

  const leftColumn = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 3.0, 18), frameMat);
  leftColumn.position.set(-1.0, 1.5, 0.08);
  gateGroup.add(leftColumn);
  const rightColumn = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 3.0, 18), frameMat);
  rightColumn.position.set(1.0, 1.5, 0.08);
  gateGroup.add(rightColumn);

  const pediment = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.05, 0.32, 32, 1, false, 0, Math.PI),
    frameMat
  );
  pediment.rotation.z = Math.PI / 2;
  pediment.rotation.y = Math.PI / 2;
  pediment.position.set(0, 3.72, 0.12);
  gateGroup.add(pediment);

  const portal = new THREE.Mesh(
    new THREE.BoxGeometry(1.55, 2.95, 0.17),
    new THREE.MeshPhysicalMaterial({
      color: 0xf2cb72,
      map: gateDoorTexture,
      roughness: 0.17,
      metalness: 0.85,
      clearcoat: 0.42,
      clearcoatRoughness: 0.2,
      emissive: new THREE.Color(0x543813),
      emissiveIntensity: 0.24,
    })
  );
  portal.position.set(0, 1.62, 0);
  gateGroup.add(portal);

  const seam = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 2.7, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x8f631f, roughness: 0.35, metalness: 0.75 })
  );
  seam.position.set(0, 1.62, 0.095);
  gateGroup.add(seam);



  const auraMat = new THREE.SpriteMaterial({
    map: gateGlowTexture,
    color: 0xffe9b3,
    transparent: true,
    depthWrite: false,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
  });
  const aura = new THREE.Sprite(auraMat);
  aura.position.set(0, 1.9, 0.28);
  aura.scale.set(3.2, 5.1, 1);
  gateGroup.add(aura);

  const gateLight = new THREE.PointLight(0xffd488, 1.8, 9.6, 2.0);
  gateLight.position.set(0, 2.0, 0.45);
  gateGroup.add(gateLight);

  const cloudBase = new THREE.Mesh(
    new THREE.CylinderGeometry(1.15, 1.35, 0.24, 26),
    new THREE.MeshStandardMaterial({ color: 0xf9fbff, roughness: 0.56, metalness: 0.02 })
  );
  cloudBase.position.y = 0.12;
  gateGroup.add(cloudBase);

  gateGroup.position.set(position.x, 0, position.z);
  gateGroup.lookAt(0, 1.6, 0);
  scene.add(gateGroup);

  gateMeshes.set(gate.id, portal);
  gateVisuals.set(gate.id, { haloMat, auraMat, light: gateLight });
  setGateVisual(gate.id, isGateUnlocked(gate.id));
  interactables.push({ type: 'gate', id: gate.id, label: gate.label, href: gate.href, object: gateGroup, radius: hall3dLayout.interactRadius.gate });
}

function createHostMarker({ hostId, gateId, label, position }) {
  // Host = tall "language angel" roughly matching gate height.
  const host = new THREE.Group();

  const robeMat = new THREE.MeshPhysicalMaterial({
    color: 0xf8fbff,
    roughness: 0.34,
    metalness: 0.02,
    clearcoat: 0.24,
    emissive: new THREE.Color(0xd7e9ff),
    emissiveIntensity: 0.16,
  });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xe3c074, roughness: 0.26, metalness: 0.9 });
  const wingMat = new THREE.MeshPhysicalMaterial({
    color: 0xf2f6ff,
    roughness: 0.22,
    metalness: 0.04,
    transparent: true,
    opacity: 0.92,
    emissive: new THREE.Color(0xb9d9ff),
    emissiveIntensity: 0.22,
  });

  // Main body (tall robe/statue)
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 1.82, 8, 14), robeMat);
  torso.position.y = 1.65;
  host.add(torso);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 20, 16),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.06, emissive: new THREE.Color(0xcde2ff), emissiveIntensity: 0.16 })
  );
  head.position.y = 2.86;
  host.add(head);

  // Halo
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.045, 12, 44),
    new THREE.MeshStandardMaterial({ color: 0xfbe6ad, roughness: 0.2, metalness: 0.92, emissive: new THREE.Color(0xffe6a8), emissiveIntensity: 0.24 })
  );
  halo.position.y = 3.2;
  halo.rotation.x = Math.PI / 2;
  host.add(halo);

  // Wings (stylized feather planes)
  const wingGeom = new THREE.BoxGeometry(0.22, 1.35, 0.78);
  const leftWing = new THREE.Mesh(wingGeom, wingMat);
  leftWing.position.set(-0.56, 2.0, -0.1);
  leftWing.rotation.z = 0.42;
  leftWing.rotation.y = 0.2;
  host.add(leftWing);

  const rightWing = new THREE.Mesh(wingGeom, wingMat);
  rightWing.position.set(0.56, 2.0, -0.1);
  rightWing.rotation.z = -0.42;
  rightWing.rotation.y = -0.2;
  host.add(rightWing);

  // Staff/scepter to emphasize gate guardian role
  const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.2, 12), goldMat);
  staff.position.set(0.32, 1.45, 0.24);
  staff.rotation.z = 0.12;
  host.add(staff);

  const staffOrb = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xe8f4ff, roughness: 0.28, metalness: 0.2, emissive: new THREE.Color(0xa6d1ff), emissiveIntensity: 0.5 })
  );
  staffOrb.position.set(0.43, 2.52, 0.3);
  host.add(staffOrb);

  // Plinth/base cloud
  const baseCloud = new THREE.Mesh(
    new THREE.CylinderGeometry(0.44, 0.5, 0.2, 16),
    new THREE.MeshStandardMaterial({ color: 0xf7fbff, roughness: 0.62, metalness: 0.02 })
  );
  baseCloud.position.y = 0.12;
  host.add(baseCloud);

  host.position.set(position.x, 0, position.z);
  host.lookAt(0, 1.9, 0);
  scene.add(host);

  // store torso as highlight target
  npcMeshes.set(hostId, torso);
  interactables.push({ type: 'host', id: hostId, label, gateId, object: host, radius: hall3dLayout.interactRadius.host });
}

const crowdIds = hall3dLayout.people.filter((p) => p.role === 'crowd').map((p) => p.id);
let crowdIdIndex = 0;

function crowdLabelFor(id) {
  const p = getPersonById(id);
  if (!p || p.languagePolicy !== 'fixed') return 'Visitor';
  const meta = (typeof LANGS !== 'undefined') ? LANGS.find((l) => l.key === p.langKey) : null;
  return meta ? `Visitor (${meta.label})` : `Visitor (${p.langKey})`;
}

function createAmbientCluster(cluster) {
  const base = new THREE.Vector3(cluster.center.x, 0, cluster.center.z);
  const count = cluster.count;
  for (let i = 0; i < count; i++) {
    const id = crowdIds[crowdIdIndex++];
    const a = (i / count) * Math.PI * 2;
    const r = 1.0 + (i % 2) * 0.35;
    const p = base.clone().add(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
    const m = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.28, 0.7, 6, 10),
      new THREE.MeshStandardMaterial({ color: 0xdbeafe, roughness: 0.6, metalness: 0.02, emissive: new THREE.Color(0x0b1b2a), emissiveIntensity: 0.1 })
    );
    m.position.copy(p);
    m.position.y = 0.9;
    m.lookAt(base.x, 0.9, base.z);
    scene.add(m);
    ambientCrowd.push({ mesh: m, baseY: m.position.y, phase: Math.random() * 10, bob: 0.06 + Math.random() * 0.04, turn: (Math.random() - 0.5) * 0.35 });

    if (id) {
      // Make this crowd member interactable and conversational
      npcMeshes.set(id, m);
      interactables.push({ type: 'npc', id, label: crowdLabelFor(id), object: m, radius: hall3dLayout.interactRadius.npc });
    }
  }
}

// Build circular gate layout
const N = hall3dLayout.gates.length;
const gateAngles = [];
for (let i = 0; i < N; i++) gateAngles.push((i / N) * Math.PI * 2);
buildExteriorMarbleBackdrop({ radius: 27.0, height: 10.0 });
buildRotundaWalls({ gateAngles, wallRadius: 22.0, height: 6.0 });
buildHeavenColumns({ count: 14, radius: 20.7, height: 6.1 });

// Restore unlock state from solved riddles (authoritative)
const hostToGate = new Map();
gateToHost = new Map();
for (const g of hall3dLayout.gates) {
  hostToGate.set(g.hostId, g.id);
  gateToHost.set(g.id, g.hostId);
}
if (typeof app !== 'undefined') {
  app.mainHall.riddlesSolved = app.mainHall.riddlesSolved || {};
  app.mainHall.gatesUnlocked = app.mainHall.gatesUnlocked || [];
  for (const [hostId, solved] of Object.entries(app.mainHall.riddlesSolved)) {
    if (!solved) continue;
    const gateId = hostToGate.get(hostId);
    if (gateId && !app.mainHall.gatesUnlocked.includes(gateId)) app.mainHall.gatesUnlocked.push(gateId);
  }
  if (typeof saveState === 'function') saveState();
}

for (let i = 0; i < N; i++) {
  const gate = hall3dLayout.gates[i];
  const ang = gateAngles[i];
  const R = hall3dLayout.rotunda.gateRadius;
  const gx = Math.cos(ang) * R;
  const gz = Math.sin(ang) * R;
  createGateMarker(gate, { x: gx, z: gz });

  const hx = Math.cos(ang) * (R - hall3dLayout.rotunda.hostOffset);
  const hz = Math.sin(ang) * (R - hall3dLayout.rotunda.hostOffset);
  createHostMarker({ hostId: gate.hostId, gateId: gate.id, label: 'Museum Host', position: { x: hx, z: hz } });
}

hall3dLayout.crowdClusters.forEach(createAmbientCluster);

// Restore talked NPC visuals
if (typeof app !== 'undefined' && Array.isArray(app.mainHall?.npcsTalkedTo)) {
  for (const npcId of app.mainHall.npcsTalkedTo) markNpcTalked(npcId);
}

// --- Dialogue UI ---
let dialogueOpen = false;
let activeNpcId = null;
let activeDialogue = null;
let activeMsgIndex = 0;
let riddleMode = false;
let activeRiddle = null; // { hostId, gateId, prompt, choices, correctIndex, acceptedAnswers }
let conversationMode = false;
let activeConversation = null; // { npcId, topicId, stepIndex }
let hostMenuMode = false;
let activeHostMenu = null; // { hostId, gateId }
let turnTimerId = null; // Timeout timer for current turn

function closeDialogue() {
  // If closing during an active conversation, count it as wrong
  if (conversationMode && activeConversation) {
    const state = (typeof app !== 'undefined') ? app.mainHall?.conversationState?.[activeConversation.npcId] : null;
    if (state && !state.completed && !state.failed) {
      registerWrong({ reason: 'close', turn: null });
      // Don't actually close - renderConversationFail will handle it
      return;
    }
  }
  
  // Clear timeout timer
  if (turnTimerId) {
    clearTimeout(turnTimerId);
    turnTimerId = null;
  }
  
  dialogueOpen = false;
  activeNpcId = null;
  activeDialogue = null;
  activeMsgIndex = 0;
  riddleMode = false;
  activeRiddle = null;
  conversationMode = false;
  activeConversation = null;
  hostMenuMode = false;
  activeHostMenu = null;
  dlgEl?.classList.remove('show');
}

function normalizeAnswer(s) {
  return (s || '')
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    // remove punctuation/symbols, keep letters/numbers across scripts
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isRiddleSolved(hostId) {
  if (typeof app === 'undefined') return false;
  return !!app.mainHall?.riddlesSolved?.[hostId];
}

function markRiddleSolved(hostId, gateId) {
  if (typeof app === 'undefined') return;
  app.mainHall.riddlesSolved = app.mainHall.riddlesSolved || {};
  app.mainHall.riddlesSolved[hostId] = true;
  if (typeof saveState === 'function') saveState();
  unlockGate(gateId);
  markNpcTalked(hostId);
}

function openRiddle(hostId, gateId) {
  const d = museumHostDialogues[hostId];
  if (!d || !d.riddle) {
    if (typeof toast === 'function') toast('Riddle missing for host: ' + hostId, 'error');
    return;
  }
  dialogueOpen = true;
  activeNpcId = hostId;
  riddleMode = true;
  activeRiddle = { hostId, gateId, ...d.riddle };
  dlgEl?.classList.add('show');
  renderRiddle();
}

function renderRiddle(feedback = '') {
  if (!activeRiddle) return;
  const d = museumHostDialogues[activeRiddle.hostId];
  dlgSpeakerEl.textContent = d?.name || 'Museum Host';
  const base = `Tip: ${d?.tip || ''}\n\nRiddle: ${activeRiddle.prompt}`;
  dlgTextEl.textContent = feedback ? `${base}\n\n${feedback}` : base;
  dlgOptsEl.innerHTML = '';

  // Multiple-choice
  if (Array.isArray(activeRiddle.choices) && activeRiddle.choices.length) {
    activeRiddle.choices.forEach((choice, idx) => {
      const b = document.createElement('button');
      b.className = 'opt';
      b.type = 'button';
      b.textContent = choice;
      b.addEventListener('click', () => {
        if (idx === activeRiddle.correctIndex) {
          markRiddleSolved(activeRiddle.hostId, activeRiddle.gateId);
          if (typeof toast === 'function') toast('Correct. Gate unlocked.', 'success');
          closeDialogue();
        } else {
          if (typeof toast === 'function') toast('Not quite. Try again.', 'info');
          renderRiddle('Try again.');
        }
      });
      dlgOptsEl.appendChild(b);
    });
  }

  // Typing
  const wrap = document.createElement('div');
  wrap.style.display = 'flex';
  wrap.style.gap = '8px';
  wrap.style.marginTop = '10px';
  wrap.style.flexWrap = 'wrap';

  const input = document.createElement('input');
  input.placeholder = 'Type your answer…';
  input.style.flex = '1';
  input.style.minWidth = '220px';
  input.style.padding = '10px 12px';
  input.style.borderRadius = '12px';
  input.style.border = '1px solid rgba(20,40,60,.18)';
  input.style.fontFamily = 'var(--sans)';
  input.style.fontSize = '14px';

  const submit = document.createElement('button');
  submit.className = 'opt';
  submit.type = 'button';
  submit.textContent = 'Submit';

  function checkTyped() {
    const norm = normalizeAnswer(input.value);
    const accepted = (activeRiddle.acceptedAnswers || []).map(normalizeAnswer);
    const ok = accepted.includes(norm);
    if (ok) {
      markRiddleSolved(activeRiddle.hostId, activeRiddle.gateId);
      if (typeof toast === 'function') toast('Correct. Gate unlocked.', 'success');
      closeDialogue();
    } else {
      if (typeof toast === 'function') toast('Not quite. Try again.', 'info');
      renderRiddle('Try again.');
    }
  }

  submit.addEventListener('click', checkTyped);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkTyped();
  });

  wrap.appendChild(input);
  wrap.appendChild(submit);
  dlgOptsEl.appendChild(wrap);

  // Back/Close
  const back = document.createElement('button');
  back.className = 'opt';
  back.type = 'button';
  back.textContent = 'Back';
  back.addEventListener('click', () => {
    riddleMode = false;
    activeRiddle = null;
    renderDialogue();
  });
  dlgOptsEl.appendChild(back);
}

function getHostLanguageKey() {
  // Host speaks either English or the user-selected target language.
  // If no language selected, default to English.
  const chosen = (typeof app !== 'undefined' && app.lang) ? app.lang : 'en';
  return chosen || 'en';
}

function getNpcLanguageKey(npcId) {
  const person = getPersonById(npcId);
  if (!person) return getHostLanguageKey();
  if (person.languagePolicy === 'fixed') return person.langKey;
  return getHostLanguageKey();
}

function persistConversationState(npcId, topicId, stepIndex, completed = false, wrongCount = 0, wrongBySkill = {}, failed = false, lastFailReason = null, recommendedStudy = [], recommendedLangs = []) {
  if (typeof app === 'undefined') return;
  app.mainHall.conversationState = app.mainHall.conversationState || {};
  const existing = app.mainHall.conversationState[npcId] || {};
  app.mainHall.conversationState[npcId] = {
    topicId,
    stepIndex,
    completed: completed || existing.completed || false,
    wrongCount: wrongCount !== undefined ? wrongCount : (existing.wrongCount || 0),
    wrongBySkill: wrongBySkill || existing.wrongBySkill || {},
    failed: failed || existing.failed || false,
    lastFailReason: lastFailReason || existing.lastFailReason || null,
    recommendedStudy: recommendedStudy.length ? recommendedStudy : (existing.recommendedStudy || []),
    recommendedLangs: recommendedLangs.length ? recommendedLangs : (existing.recommendedLangs || []),
  };
  if (typeof saveState === 'function') saveState();
}

function openConversation(npcId) {
  const person = getPersonById(npcId);
  const topicId = person?.topicId;
  const topic = topicId ? hallTopics[topicId] : null;
  if (!topic) {
    if (typeof toast === 'function') toast('Conversation missing for: ' + npcId, 'error');
    return;
  }

  const existing = (typeof app !== 'undefined') ? app.mainHall?.conversationState?.[npcId] : null;
  const stepIndex = (existing && existing.topicId === topicId) ? (existing.stepIndex || 0) : 0;
  
  // If already failed, show fail screen
  if (existing && existing.failed) {
    dialogueOpen = true;
    activeNpcId = npcId;
    conversationMode = true;
    hostMenuMode = false;
    riddleMode = false;
    activeConversation = { npcId, topicId, stepIndex };
    dlgEl?.classList.add('show');
    renderConversationFail();
    return;
  }

  dialogueOpen = true;
  activeNpcId = npcId;
  conversationMode = true;
  hostMenuMode = false;
  riddleMode = false;
  activeConversation = { npcId, topicId, stepIndex };
  dlgEl?.classList.add('show');
  renderConversation();
}

function openHostMenu(hostId, gateId) {
  dialogueOpen = true;
  activeNpcId = hostId;
  hostMenuMode = true;
  conversationMode = false;
  riddleMode = false;
  activeHostMenu = { hostId, gateId };
  dlgEl?.classList.add('show');
  renderHostMenu();
}

function renderHostMenu() {
  if (!activeHostMenu) return;
  const hostId = activeHostMenu.hostId;
  const d = museumHostDialogues[hostId];
  dlgSpeakerEl.textContent = d?.name || 'Museum Host';
  const solved = isRiddleSolved(hostId);
  dlgTextEl.textContent = `${d?.tip ? `Tip: ${d.tip}\n\n` : ''}This host guards the gate. Solve their riddle to unlock it.\n\n${solved ? 'Status: Gate unlocked.' : 'Status: Gate locked.'}`;
  dlgOptsEl.innerHTML = '';

  // Talk (conversation)
  {
    const b = document.createElement('button');
    b.className = 'opt';
    b.type = 'button';
    b.textContent = 'Talk (full conversation)';
    b.addEventListener('click', () => openConversation(hostId));
    dlgOptsEl.appendChild(b);
  }

  // Riddle unlock
  {
    const b = document.createElement('button');
    b.className = 'opt';
    b.type = 'button';
    if (solved) {
      b.textContent = 'Gate already unlocked';
      b.disabled = true;
      b.style.opacity = '0.6';
      b.style.cursor = 'not-allowed';
    } else {
      b.textContent = 'Solve riddle (unlock gate)';
      b.addEventListener('click', () => openRiddle(hostId, activeHostMenu.gateId));
    }
    dlgOptsEl.appendChild(b);
  }

  // Close
  {
    const b = document.createElement('button');
    b.className = 'opt';
    b.type = 'button';
    b.textContent = 'Close';
    b.addEventListener('click', closeDialogue);
    dlgOptsEl.appendChild(b);
  }
}

// Register a wrong attempt and check for hard fail
function registerWrong({ reason, turn }) {
  if (!activeConversation) return;
  const { npcId, topicId } = activeConversation;
  const topic = hallTopics[topicId];
  if (!topic) return;
  
  const state = (typeof app !== 'undefined') ? app.mainHall?.conversationState?.[npcId] : {};
  const wrongCount = (state.wrongCount || 0) + 1;
  const wrongBySkill = { ...(state.wrongBySkill || {}) };
  
  // Increment wrongBySkill for each skill in the turn
  if (turn && turn.skills && Array.isArray(turn.skills)) {
    turn.skills.forEach(skill => {
      wrongBySkill[skill] = (wrongBySkill[skill] || 0) + 1;
    });
  }
  
  const maxWrong = topic.assessment?.maxWrong || 5;
  
  if (wrongCount >= maxWrong) {
    // Hard fail: compute recommendations and show fail screen
    const langKey = getNpcLanguageKey(npcId);
    const recommendedStudy = getRecommendedStudy(wrongBySkill);
    const recommendedLangs = topic.derivativeBoost?.recommendLangs || getRecommendedLangs(langKey);
    
    persistConversationState(
      npcId,
      topicId,
      activeConversation.stepIndex,
      false,
      wrongCount,
      wrongBySkill,
      true,
      reason,
      recommendedStudy,
      recommendedLangs
    );
    
    renderConversationFail();
  } else {
    // Not failed yet: persist and continue
    persistConversationState(
      npcId,
      topicId,
      activeConversation.stepIndex,
      false,
      wrongCount,
      wrongBySkill,
      false,
      reason
    );
    
    const feedbackMsg = reason === 'empty' ? 'Please provide an answer.' :
                       reason === 'timeout' ? 'Time\'s up. Try again.' :
                       reason === 'close' ? 'Closing counts as wrong. Continue?' :
                       'Not quite. Try again.';
    renderConversation(feedbackMsg);
  }
}

// Render the hard fail screen
function renderConversationFail() {
  if (!activeConversation) return;
  const { npcId, topicId } = activeConversation;
  const state = (typeof app !== 'undefined') ? app.mainHall?.conversationState?.[npcId] : {};
  const topic = hallTopics[topicId];
  
  const speakerName = (() => {
    const person = getPersonById(npcId);
    if (person?.role === 'crowd') {
      const meta = (typeof LANGS !== 'undefined') ? LANGS.find((l) => l.key === person.langKey) : null;
      return meta ? `Visitor (${meta.label})` : 'Visitor';
    }
    return (museumHostDialogues[npcId]?.name) || 'Host';
  })();
  
  dlgSpeakerEl.textContent = speakerName;
  
  const recommendedStudy = state.recommendedStudy || [];
  const recommendedLangs = state.recommendedLangs || [];
  
  const lines = [];
  lines.push('You missed 5. Training required.');
  lines.push('');
  if (recommendedStudy.length > 0) {
    lines.push('Go to Training Grounds and study:');
    recommendedStudy.forEach(study => lines.push(`• ${study}`));
  } else {
    lines.push('Go to Training Grounds and review the basics.');
  }
  if (recommendedLangs.length > 0) {
    lines.push('');
    const langLabels = recommendedLangs.map(lk => {
      const meta = (typeof LANGS !== 'undefined') ? LANGS.find((l) => l.key === lk) : null;
      return meta ? meta.label : lk;
    }).join(', ');
    lines.push(`To boost derivative learning, add: ${langLabels}`);
  }
  
  dlgTextEl.textContent = lines.join('\n');
  dlgOptsEl.innerHTML = '';
  
  // Go to Training Grounds button
  {
    const b = document.createElement('button');
    b.className = 'opt';
    b.type = 'button';
    b.textContent = 'Go to Training Grounds';
    b.style.backgroundColor = 'var(--accent)';
    b.style.color = 'white';
    b.addEventListener('click', () => {
      window.location.href = 'training/index.html';
    });
    dlgOptsEl.appendChild(b);
  }
  
  // Reset conversation button
  {
    const b = document.createElement('button');
    b.className = 'opt';
    b.type = 'button';
    b.textContent = 'Reset this conversation';
    b.addEventListener('click', () => {
      if (typeof app !== 'undefined') {
        app.mainHall.conversationState = app.mainHall.conversationState || {};
        delete app.mainHall.conversationState[npcId];
        if (typeof saveState === 'function') saveState();
      }
      activeConversation.stepIndex = 0;
      persistConversationState(npcId, topicId, 0, false, 0, {}, false, null, [], []);
      renderConversation();
    });
    dlgOptsEl.appendChild(b);
  }
  
  // Close button (doesn't count as wrong when already failed)
  {
    const b = document.createElement('button');
    b.className = 'opt';
    b.type = 'button';
    b.textContent = 'Close';
    b.addEventListener('click', () => {
      if (turnTimerId) {
        clearTimeout(turnTimerId);
        turnTimerId = null;
      }
      dialogueOpen = false;
      conversationMode = false;
      activeConversation = null;
      dlgEl?.classList.remove('show');
    });
    dlgOptsEl.appendChild(b);
  }
}

// Show feedback in top-right corner
function showFeedback(message, type = 'info') {
  if (!feedbackEl) return;
  feedbackEl.textContent = message;
  feedbackEl.className = type;
  feedbackEl.classList.add('show');
  
  // Auto-hide after 2 seconds
  setTimeout(() => {
    hideFeedback();
  }, 2000);
}

function hideFeedback() {
  if (!feedbackEl) return;
  feedbackEl.classList.remove('show');
  setTimeout(() => {
    if (!feedbackEl.classList.contains('show')) {
      feedbackEl.textContent = '';
      feedbackEl.className = '';
    }
  }, 300);
}

function renderConversation(feedback = '') {
  if (!activeConversation) return;
  const { npcId, topicId } = activeConversation;
  const topic = hallTopics[topicId];
  if (!topic) return closeDialogue();
  
  // Check if already failed
  const state = (typeof app !== 'undefined') ? app.mainHall?.conversationState?.[npcId] : null;
  if (state && state.failed) {
    return renderConversationFail();
  }

  // Clear any existing timeout
  if (turnTimerId) {
    clearTimeout(turnTimerId);
    turnTimerId = null;
  }

  const langKey = getNpcLanguageKey(npcId);
  const turn = topic.turns[activeConversation.stepIndex];
  if (!turn) {
    // finished
    persistConversationState(npcId, topicId, activeConversation.stepIndex, true);
    if (typeof toast === 'function') toast('Conversation complete.', 'success');
    return closeDialogue();
  }

  const speakerName = (() => {
    const person = getPersonById(npcId);
    if (person?.role === 'crowd') {
      const meta = (typeof LANGS !== 'undefined') ? LANGS.find((l) => l.key === person.langKey) : null;
      return meta ? `Visitor (${meta.label})` : 'Visitor';
    }
    return (museumHostDialogues[npcId]?.name) || 'Host';
  })();

  dlgSpeakerEl.textContent = speakerName;

  const npcLine = turn.npc(langKey);

  // Display: target line only (no English translations)
  // Feedback is shown separately in top-right corner
  dlgTextEl.textContent = npcLine;
  
  // Show wrong count if any (in dialogue, but separate from feedback)
  const wrongCount = state?.wrongCount || 0;
  if (wrongCount > 0) {
    const countText = document.createElement('div');
    countText.style.marginTop = '8px';
    countText.style.fontSize = '13px';
    countText.style.opacity = '0.7';
    countText.style.color = 'rgba(239,68,68,0.9)';
    countText.textContent = `[Wrong attempts: ${wrongCount}/5]`;
    // Remove existing count if any
    const existingCount = dlgTextEl.parentElement.querySelector('.wrong-count');
    if (existingCount) existingCount.remove();
    countText.className = 'wrong-count';
    dlgTextEl.parentElement.appendChild(countText);
  } else {
    const existingCount = dlgTextEl.parentElement.querySelector('.wrong-count');
    if (existingCount) existingCount.remove();
  }
  
  // Show feedback in separate corner element
  if (feedback) {
    showFeedback(feedback, feedback.includes('Correct') ? 'correct' : 'wrong');
  } else {
    hideFeedback();
  }

  // Clear options area and add input field
  dlgOptsEl.innerHTML = '';

  // Check if answer is contextually appropriate using keyword matching
  function isContextuallyAppropriate(answer, turn) {
    const normalized = normalizeAnswer(answer);
    if (!normalized || normalized === '') {
      return false;
    }
    
    // Get expected and invalid keywords from turn (new structure)
    const expectedKeywords = turn.expectedKeywords || [];
    const invalidKeywords = turn.invalidKeywords || [];
    const expectedResponseTypes = turn.expectedResponseTypes || [];
    
    // Check for invalid keywords (shows misunderstanding or wrong context)
    if (invalidKeywords.length > 0) {
      const hasInvalidKeyword = invalidKeywords.some(kw => {
        const kwNorm = normalizeAnswer(kw);
        return normalized.includes(kwNorm);
      });
      if (hasInvalidKeyword) {
        return false;
      }
    }
    
    // If no expected keywords specified, accept any non-empty response
    if (expectedKeywords.length === 0) {
      return true;
    }
    
    // Check for expected keywords (shows understanding of context)
    const hasExpectedKeyword = expectedKeywords.some(kw => {
      const kwNorm = normalizeAnswer(kw);
      return normalized.includes(kwNorm);
    });
    
    // Basic response type validation (if specified)
    if (expectedResponseTypes.length > 0) {
      // Simple heuristics for response types (multilingual)
      const isQuestion = normalized.includes('?') || 
                        normalized.includes('qué') || normalized.includes('que') || normalized.includes('qu') ||
                        normalized.includes('quoi') || normalized.includes('comment') ||
                        normalized.includes('was') || normalized.includes('wie') ||
                        normalized.includes('cosa') || normalized.includes('come') ||
                        normalized.includes('o que') || normalized.includes('como') ||
                        normalized.includes('что') || normalized.includes('как') ||
                        normalized.includes('ماذا') || normalized.includes('كيف') ||
                        normalized.includes('מה') || normalized.includes('איך') ||
                        normalized.includes('何') || normalized.includes('どう') ||
                        normalized.includes('什么') || normalized.includes('怎么') ||
                        normalized.includes('τι') || normalized.includes('πώς') ||
                        normalized.includes('what') || normalized.includes('where') || normalized.includes('why') || normalized.includes('how');
      
      const isAgreement = normalized.includes('sí') || normalized.includes('si') || 
                         normalized.includes('oui') || normalized.includes('d\'accord') ||
                         normalized.includes('ja') || normalized.includes('genau') ||
                         normalized.includes('sì') || normalized.includes('esatto') ||
                         normalized.includes('sim') || normalized.includes('exato') ||
                         normalized.includes('да') || normalized.includes('точно') ||
                         normalized.includes('نعم') || normalized.includes('صحيح') ||
                         normalized.includes('כן') || normalized.includes('נכון') ||
                         normalized.includes('はい') || normalized.includes('そうです') ||
                         normalized.includes('是') || normalized.includes('对') ||
                         normalized.includes('ναι') || normalized.includes('σωστά') ||
                         normalized.includes('yes') || normalized.includes('okay') || normalized.includes('ok') || normalized.includes('agree') || normalized.includes('estoy de acuerdo');
      
      const isDisagreement = normalized.includes('no') || 
                             normalized.includes('non') ||
                             normalized.includes('nein') ||
                             normalized.includes('não') ||
                             normalized.includes('нет') ||
                             normalized.includes('לא') ||
                             normalized.includes('いいえ') ||
                             normalized.includes('不') ||
                             normalized.includes('όχι') ||
                             normalized.includes('disagree') || normalized.includes('no estoy de acuerdo');
      
      const isOpinion = normalized.includes('pienso') || normalized.includes('creo') || normalized.includes('opino') ||
                       normalized.includes('je pense') || normalized.includes('je crois') ||
                       normalized.includes('ich denke') || normalized.includes('ich glaube') ||
                       normalized.includes('penso') || normalized.includes('credo') ||
                       normalized.includes('eu penso') || normalized.includes('eu acho') ||
                       normalized.includes('я думаю') || normalized.includes('я считаю') ||
                       normalized.includes('أعتقد') || normalized.includes('أفكر') ||
                       normalized.includes('אני חושב') || normalized.includes('אני מאמין') ||
                       normalized.includes('思う') || normalized.includes('考える') ||
                       normalized.includes('认为') || normalized.includes('想') ||
                       normalized.includes('νομίζω') || normalized.includes('σκέφτομαι') ||
                       normalized.includes('think') || normalized.includes('believe');
      
      // Check if response type matches expected
      const matchesType = expectedResponseTypes.some(type => {
        if (type === 'question' && isQuestion) return true;
        if (type === 'agree' && isAgreement) return true;
        if (type === 'disagree' && isDisagreement) return true;
        if (type === 'opinion' && isOpinion) return true;
        return false;
      });
      
      // If response type is specified, it should match OR have expected keywords
      if (expectedResponseTypes.length > 0) {
        return matchesType || hasExpectedKeyword;
      }
    }
    
    return hasExpectedKeyword;
  }

  function acceptAnswer(ans) {
    // Check for empty answer
    const normalized = normalizeAnswer(ans);
    if (!normalized || normalized === '') {
      registerWrong({ reason: 'empty', turn });
      return;
    }
    
    // Use contextual appropriateness instead of exact matching
    const ok = isContextuallyAppropriate(ans, turn);
    
    if (ok) {
      // Clear timeout on correct answer
      if (turnTimerId) {
        clearTimeout(turnTimerId);
        turnTimerId = null;
      }
      
      activeConversation.stepIndex += 1;
      const currentState = (typeof app !== 'undefined') ? app.mainHall?.conversationState?.[npcId] : {};
      persistConversationState(
        npcId,
        topicId,
        activeConversation.stepIndex,
        false,
        currentState.wrongCount || 0,
        currentState.wrongBySkill || {},
        false
      );
      return renderConversation('Correct.');
    }
    
    // Wrong answer (not contextually appropriate)
    registerWrong({ reason: 'wrong', turn });
  }

  // Multiple choice removed - natural conversation uses only typing input

  // Typing input - ensure dlgOptsEl exists
  if (!dlgOptsEl) {
    console.error('dlgOptsEl not found!');
    return;
  }

  const wrap = document.createElement('div');
  wrap.style.display = 'flex';
  wrap.style.gap = '8px';
  wrap.style.marginTop = '10px';
  wrap.style.flexWrap = 'wrap';

  const input = document.createElement('input');
  input.placeholder = 'Type your reply…';
  input.style.flex = '1';
  input.style.minWidth = '220px';
  input.style.padding = '10px 12px';
  input.style.borderRadius = '12px';
  input.style.border = '1px solid rgba(20,40,60,.18)';
  input.style.fontFamily = 'var(--sans)';
  input.style.fontSize = '14px';
  input.style.display = 'block'; // Ensure visible

  const submit = document.createElement('button');
  submit.className = 'opt';
  submit.type = 'button';
  submit.textContent = 'Submit';

  function submitTyped() {
    acceptAnswer(input.value);
    input.value = ''; // Clear input after submit
  }
  submit.addEventListener('click', submitTyped);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitTyped();
  });

  wrap.appendChild(input);
  wrap.appendChild(submit);
  dlgOptsEl.appendChild(wrap);

  const close = document.createElement('button');
  close.className = 'opt';
  close.type = 'button';
  close.textContent = 'Close';
  close.addEventListener('click', closeDialogue);
  dlgOptsEl.appendChild(close);
  
  // Focus the input field for better UX
  setTimeout(() => input.focus(), 100);
  
  // Start timeout timer for this turn
  const timeoutMs = topic.assessment?.timeoutMs || 30000;
  turnTimerId = setTimeout(() => {
    turnTimerId = null;
    registerWrong({ reason: 'timeout', turn });
  }, timeoutMs);
}

function renderDialogue() {
  if (!activeDialogue) return;
  const msg = activeDialogue.messages[activeMsgIndex];
  if (!msg) return closeDialogue();
  dlgSpeakerEl.textContent = activeDialogue.name;
  dlgTextEl.textContent = msg.text;
  dlgOptsEl.innerHTML = '';
  msg.options.forEach((opt) => {
    const b = document.createElement('button');
    b.className = 'opt';
    b.type = 'button';
    // If this is a host riddle prompt and already solved, disable the solve button
    if (opt.action === 'startRiddle' && activeNpcId && isRiddleSolved(activeNpcId)) {
      b.textContent = 'Gate already unlocked';
      b.disabled = true;
      b.style.opacity = '0.6';
      b.style.cursor = 'not-allowed';
    } else {
      b.textContent = opt.text;
    }
    b.addEventListener('click', () => {
      if (opt.action === 'close') return closeDialogue();
      if (opt.action === 'startRiddle') {
        if (!activeNpcId) return;
        openRiddle(activeNpcId, opt.gate);
        return;
      }
      if (opt.action === 'unlockGate') {
        unlockGate(opt.gate);
        if (activeNpcId) markNpcTalked(activeNpcId);
        return closeDialogue();
      }
      if (typeof opt.next === 'number') {
        activeMsgIndex = opt.next;
        return renderDialogue();
      }
    });
    dlgOptsEl.appendChild(b);
  });
}

dlgCloseEl?.addEventListener('click', () => {
  // If closing during conversation, count as wrong
  if (conversationMode && activeConversation) {
    const state = (typeof app !== 'undefined') ? app.mainHall?.conversationState?.[activeConversation.npcId] : null;
    if (state && !state.completed && !state.failed) {
      registerWrong({ reason: 'close', turn: null });
      return;
    }
  }
  closeDialogue();
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && dialogueOpen) {
    // If closing during conversation, count as wrong
    if (conversationMode && activeConversation) {
      const state = (typeof app !== 'undefined') ? app.mainHall?.conversationState?.[activeConversation.npcId] : null;
      if (state && !state.completed && !state.failed) {
        registerWrong({ reason: 'close', turn: null });
        return;
      }
    }
    closeDialogue();
  }
});

function openNpcDialogue(npcId) {
  const d = museumHostDialogues[npcId] || tsiHallDialogues[npcId];
  if (!d) {
    if (typeof toast === 'function') toast('Dialogue missing for NPC: ' + npcId, 'error');
    return;
  }
  dialogueOpen = true;
  activeNpcId = npcId;
  activeDialogue = d;
  activeMsgIndex = 0;
  dlgEl?.classList.add('show');
  renderDialogue();
}

// --- Proximity + interaction ---
let nearest = null;

function updateNearest() {
  nearest = null;
  const p = player.position;
  let bestD = Infinity;
  for (const it of interactables) {
    const o = it.object.position;
    const dx = o.x - p.x;
    const dz = o.z - p.z;
    const d = Math.hypot(dx, dz);
    if (d <= it.radius && d < bestD) {
      bestD = d;
      nearest = it;
    }
  }
}

function renderPrompt() {
  if (!promptEl) return;
  if (dialogueOpen) {
    promptEl.classList.remove('show');
    return;
  }
  if (!nearest) {
    promptEl.classList.remove('show');
    return;
  }
  if (nearest.type === 'npc') {
    promptEl.innerHTML = `<kbd>E</kbd> Talk to <b>${nearest.label}</b>`;
    promptEl.classList.add('show');
    return;
  }
  if (nearest.type === 'host') {
    promptEl.innerHTML = `<kbd>E</kbd> Talk to <b>Museum Host</b>`;
    promptEl.classList.add('show');
    return;
  }
  if (nearest.type === 'gate') {
    const unlocked = isGateUnlocked(nearest.id);
    if (unlocked) {
      promptEl.innerHTML = `<kbd>E</kbd> Enter <b>${nearest.label}</b>`;
    } else {
      promptEl.innerHTML = `<kbd>E</kbd> <b>${nearest.label}</b> (locked)`;
    }
    promptEl.classList.add('show');
  }
}

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (dialogueOpen) return;
  if (key !== 'e' && key !== ' ') return;
  if (!nearest) return;
  if (nearest.type === 'npc') return openConversation(nearest.id);
  if (nearest.type === 'host') return openHostMenu(nearest.id, nearest.gateId);
  if (nearest.type === 'gate') {
    if (!isGateUnlocked(nearest.id)) {
      if (typeof toast === 'function') toast('Gate is locked. Solve the host riddle to unlock.', 'info');
      return;
    }
    window.location.href = nearest.href;
  }
});

// Language selector wiring
const langSelect = document.getElementById('lang3d');
if (langSelect && typeof LANGS !== 'undefined') {
  langSelect.innerHTML = LANGS.map((l) => {
    const sel = (typeof app !== 'undefined' && app.lang === l.key) ? 'selected' : '';
    return `<option value="${l.key}" ${sel}>${l.flag} ${l.label}</option>`;
  }).join('');

  langSelect.addEventListener('change', (e) => {
    if (typeof app !== 'undefined') {
      app.lang = e.target.value;
      if (typeof saveState === 'function') saveState();
      if (typeof toast === 'function') toast(`Language set to ${e.target.value}`, 'info');
    }
  });
}

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Render loop
let last = performance.now();
function animate(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  controller.update(dt);
  // Ambient crowd bob + subtle turning
  const t = now / 1000;
  for (const a of ambientCrowd) {
    a.mesh.position.y = a.baseY + Math.sin(t * 1.6 + a.phase) * a.bob;
    a.mesh.rotation.y += a.turn * dt;
  }
  updateNearest();
  renderPrompt();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
