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
scene.background = new THREE.Color('#cfe6ff');
scene.fog = new THREE.Fog('#dff0ff', 22, 155);

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
  roughness: 0.2,
  metalness: 0.03,
  clearcoat: 0.75,
  clearcoatRoughness: 0.18,
  reflectivity: 0.7,
});
const floor = new THREE.Mesh(new THREE.CircleGeometry(28, 64), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
scene.add(floor);

// Inner “marble” disc
const inner = new THREE.Mesh(
  new THREE.CircleGeometry(10.5, 48),
  new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.17, metalness: 0.02, clearcoat: 0.62, clearcoatRoughness: 0.2 })
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
    roughness: 0.34,
    metalness: 0.02,
    clearcoat: 0.45,
    clearcoatRoughness: 0.35,
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
  }
}

const wallMat = new THREE.MeshPhysicalMaterial({
  color: 0xf8f8fb,
  roughness: 0.38,
  metalness: 0.02,
  clearcoat: 0.42,
  clearcoatRoughness: 0.32,
  emissive: new THREE.Color(0xe9eef6),
  emissiveIntensity: 0.12,
});

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
  const characterUrl = new URL('./assets/character.glb', import.meta.url).href;
  return new Promise((resolve) => {
    loader.load(
      characterUrl,
      (gltf) => resolve({ ok: true, gltf }),
      undefined,
      (err) => resolve({ ok: false, err })
    );
  });
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
  const targetHeight = 2.3;
  const uniformScale = targetHeight / height;
  model.scale.setScalar(uniformScale);

  const boxAfterScale = new THREE.Box3().setFromObject(model);
  model.position.y -= boxAfterScale.min.y;
}

// Load character if present; otherwise keep placeholder capsule
(async () => {
  const res = await tryLoadCharacterGLB();
  if (!res.ok) {
    console.info('[hall3d] No character GLB found in /hall3d/assets (character|player|avatar). Using capsule placeholder.');
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

  console.info(`[hall3d] Loaded player model: ${res.modelUrl}`);
})();

// --- Interactables (NPCs + Gates) ---
const interactables = [];
const gateMeshes = new Map();
const npcMeshes = new Map();
const ambientCrowd = [];
let gateToHost = new Map(); // filled after layout is built

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
  mat.opacity = unlocked ? 1.0 : 0.45;
  mat.transparent = !unlocked;
  mat.emissive = new THREE.Color(unlocked ? 0x2a8bff : 0x222222);
  mat.emissiveIntensity = unlocked ? 0.45 : 0.1;
  mat.needsUpdate = true;
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

  const glowHalo = new THREE.Mesh(
    new THREE.TorusGeometry(1.18, 0.11, 14, 64),
    new THREE.MeshStandardMaterial({ color: 0xfff2d1, roughness: 0.28, metalness: 0.65, emissive: new THREE.Color(0xffe5a1), emissiveIntensity: 0.33 })
  );
  glowHalo.rotation.x = Math.PI / 2;
  glowHalo.position.y = 2.75;
  gateGroup.add(glowHalo);

  const frameMat = new THREE.MeshStandardMaterial({ color: 0xd9b466, roughness: 0.22, metalness: 0.92 });
  const leftPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 2.9, 16), frameMat);
  leftPillar.position.set(-0.72, 1.45, 0.02);
  gateGroup.add(leftPillar);
  const rightPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 2.9, 16), frameMat);
  rightPillar.position.set(0.72, 1.45, 0.02);
  gateGroup.add(rightPillar);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.24, 0.26), frameMat);
  lintel.position.set(0, 2.86, 0.03);
  gateGroup.add(lintel);

  const portal = new THREE.Mesh(
    new THREE.BoxGeometry(1.26, 2.5, 0.2),
    new THREE.MeshPhysicalMaterial({
      color: 0xfff8eb,
      roughness: 0.08,
      metalness: 0.08,
      transparent: true,
      opacity: 0.94,
      transmission: 0.08,
      emissive: new THREE.Color(0xb8deff),
      emissiveIntensity: 0.55,
    })
  );
  portal.position.set(0, 1.35, 0);
  gateGroup.add(portal);

  const cloudBase = new THREE.Mesh(
    new THREE.CylinderGeometry(1.05, 1.2, 0.22, 24),
    new THREE.MeshStandardMaterial({ color: 0xf8fbff, roughness: 0.58, metalness: 0.02 })
  );
  cloudBase.position.y = 0.1;
  gateGroup.add(cloudBase);

  gateGroup.position.set(position.x, 0, position.z);
  gateGroup.lookAt(0, 1.3, 0);
  scene.add(gateGroup);

  gateMeshes.set(gate.id, portal);
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
