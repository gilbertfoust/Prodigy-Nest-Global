import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

/**
 * Minimal third-person controller:
 * - WASD movement in camera-relative space
 * - Smooth character rotation toward movement direction
 * - Camera orbit around player (mouse drag) with follow smoothing
 * - Optional animation mixer hooks (idle/walk)
 */
export class ThirdPersonController {
  constructor({ camera, domElement, target, floorRaycastObjects = [] }) {
    this.camera = camera;
    this.domElement = domElement;
    this.target = target; // THREE.Object3D
    this.floorRaycastObjects = floorRaycastObjects;

    this.keys = new Set();
    this.isPointerDown = false;
    this.pointerLast = { x: 0, y: 0 };

    // Camera orbit state
    this.yaw = 0;
    this.pitch = 0.15;
    this.distance = 8.5;
    this.minPitch = -0.1;
    this.maxPitch = 0.55;
    this.minDistance = 4.5;
    this.maxDistance = 14.0;

    // When moving, gently pull camera yaw behind the character (reduces “reversed” feeling)
    // User preference: do NOT auto-spin camera on movement.
    this.alignCameraBehindOnMove = false;
    this.alignStrength = 3.5; // higher = more aggressive

    // Movement tuning
    this.speed = 4.2;
    this.turnSpeed = 10.0;
    this.moveDir = new THREE.Vector3();
    this.velocity = new THREE.Vector3();

    // Follow smoothing
    this.cameraPos = new THREE.Vector3().copy(camera.position);
    this.cameraTarget = new THREE.Vector3();

    // Animation hooks
    this.mixer = null;
    this.actions = { idle: null, walk: null };
    this.activeAction = null;

    this._bindEvents();
  }

  setAnimationMixer(mixer) {
    this.mixer = mixer;
  }

  setActions({ idle, walk }) {
    this.actions.idle = idle || null;
    this.actions.walk = walk || null;
    this._playAction('idle', 0.0);
  }

  _bindEvents() {
    window.addEventListener('keydown', (e) => this.keys.add(e.key.toLowerCase()));
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));

    this.domElement.addEventListener('pointerdown', (e) => {
      this.isPointerDown = true;
      this.pointerLast.x = e.clientX;
      this.pointerLast.y = e.clientY;
      this.domElement.setPointerCapture(e.pointerId);
    });
    this.domElement.addEventListener('pointerup', (e) => {
      this.isPointerDown = false;
      try { this.domElement.releasePointerCapture(e.pointerId); } catch {}
    });
    this.domElement.addEventListener('pointermove', (e) => {
      if (!this.isPointerDown) return;
      const dx = e.clientX - this.pointerLast.x;
      const dy = e.clientY - this.pointerLast.y;
      this.pointerLast.x = e.clientX;
      this.pointerLast.y = e.clientY;

      const sensitivity = 0.0045;
      this.yaw -= dx * sensitivity;
      this.pitch -= dy * sensitivity;
      this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
    });

    this.domElement.addEventListener('wheel', (e) => {
      const delta = Math.sign(e.deltaY);
      this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance + delta * 0.6));
    }, { passive: true });
  }

  update(dt) {
    this._stepArrowCameraTurn(dt);
    const moving = this._stepMovement(dt);
    this._stepCamera(dt);
    if (this.mixer) this.mixer.update(dt);
    this._stepAnimation(moving);
  }

  _stepArrowCameraTurn(dt) {
    // ArrowLeft / ArrowRight rotate camera yaw (not strafe).
    // This matches the “rotate camera angle” behavior you wanted.
    const turnLeft = this.keys.has('arrowleft') ? 1 : 0;
    const turnRight = this.keys.has('arrowright') ? 1 : 0;
    const turn = turnRight - turnLeft;
    if (turn === 0) return;
    const yawSpeed = 1.9; // radians/sec
    // Flip left/right only
    this.yaw -= turn * yawSpeed * dt;
  }

  _stepMovement(dt) {
    // Movement keys:
    // - W/ArrowUp: forward (toward view)
    // - S/ArrowDown: backward
    // - A/D: strafe left/right
    // ArrowLeft/ArrowRight are reserved for camera rotation (see _stepArrowCameraTurn).
    const forward = (this.keys.has('w') || this.keys.has('arrowup')) ? 1 : 0;
    const back = (this.keys.has('s') || this.keys.has('arrowdown')) ? 1 : 0;
    const left = this.keys.has('a') ? 1 : 0;
    const right = this.keys.has('d') ? 1 : 0;

    const ix = right - left;
    // Forward/back should match what the camera shows as “forward”.
    // ArrowUp/W should move toward camera forward, ArrowDown/S should move reverse.
    const iz = forward - back;
    const hasInput = (ix !== 0 || iz !== 0);

    if (!hasInput) {
      // Damp to stop
      this.velocity.multiplyScalar(Math.max(0, 1 - 10 * dt));
      this.target.position.addScaledVector(this.velocity, dt);
      return false;
    }

    // Camera-relative basis (ignoring pitch)
    const camForward = new THREE.Vector3();
    this.camera.getWorldDirection(camForward);
    camForward.y = 0;
    camForward.normalize();
    // Keep left/right strafing direction matching the previous feel.
    const camRight = new THREE.Vector3()
      .crossVectors(camForward, new THREE.Vector3(0, 1, 0))
      .normalize()
      .negate();

    this.moveDir.copy(camRight).multiplyScalar(ix).addScaledVector(camForward, iz).normalize();

    // Velocity target
    const desiredVel = this.moveDir.clone().multiplyScalar(this.speed);
    this.velocity.lerp(desiredVel, 1 - Math.pow(0.001, dt)); // frame-rate independent smoothing

    // Apply movement on XZ plane
    this.target.position.addScaledVector(this.velocity, dt);

    // Smooth rotate character toward movement direction
    const desiredYaw = Math.atan2(this.moveDir.x, this.moveDir.z);
    const currentYaw = this.target.rotation.y;
    const newYaw = _lerpAngle(currentYaw, desiredYaw, Math.min(1, this.turnSpeed * dt));
    this.target.rotation.y = newYaw;

    // Keep the camera roughly behind the character while moving
    if (this.alignCameraBehindOnMove) {
      this.yaw = _lerpAngle(this.yaw, this.target.rotation.y, Math.min(1, this.alignStrength * dt));
    }

    return true;
  }

  _stepCamera(dt) {
    const targetPos = new THREE.Vector3().copy(this.target.position);
    targetPos.y += 1.6;

    // Orbit offset
    const offset = new THREE.Vector3(0, 0, this.distance);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
    offset.applyQuaternion(q);

    const desiredCamPos = targetPos.clone().add(offset);

    // Smooth camera
    const t = 1 - Math.pow(0.0005, dt);
    this.cameraPos.lerp(desiredCamPos, t);
    this.cameraTarget.lerp(targetPos, t);
    this.camera.position.copy(this.cameraPos);
    this.camera.lookAt(this.cameraTarget);
  }

  _stepAnimation(isMoving) {
    if (!this.actions.idle && !this.actions.walk) return;
    if (isMoving) this._playAction('walk', 0.12);
    else this._playAction('idle', 0.18);
  }

  _playAction(name, fade) {
    const next = this.actions[name];
    if (!next || this.activeAction === next) return;
    if (this.activeAction) this.activeAction.fadeOut(fade);
    next.reset().fadeIn(fade).play();
    this.activeAction = next;
  }
}

function _lerpAngle(a, b, t) {
  const d = _wrapAngle(b - a);
  return a + d * t;
}
function _wrapAngle(r) {
  while (r > Math.PI) r -= Math.PI * 2;
  while (r < -Math.PI) r += Math.PI * 2;
  return r;
}

