import * as THREE from 'https://esm.sh/three@0.160.0';

/**
 * Third-person controller:
 * - Desktop: WASD movement, mouse drag orbit, wheel zoom, arrows rotate camera yaw
 * - Mobile (one-finger):
 *    - Drag immediately => LOOK (rotate camera)
 *    - Press-and-hold (without dragging) => MOVE
 *      - While holding: drag left/right to strafe, drag up/down to adjust forward/back
 *      - If you hold without dragging: moves forward by default
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
    // Locked over-the-shoulder orbit:
    // keep a normal gameplay angle (not top-down), rotate only around yaw.
    this.pitch = 0.4;
    this.distance = 8.5;
    this.minPitch = 0.4;
    this.maxPitch = 0.4;
    this.minDistance = 8.5;
    this.maxDistance = 8.5;

    // Optional camera alignment
    this.alignCameraBehindOnMove = false;
    this.alignStrength = 3.5;

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

    // --- Mobile one-finger intent (virtual input) ---
    this.touch = {
      active: false,
      pointerId: null,
      mode: 'none', // 'pending' | 'look' | 'move'
      startX: 0,
      startY: 0,
      curX: 0,
      curY: 0,
      downTime: 0,
      holdTimer: null,
      movedBeyondThreshold: false,
    };

    // Virtual move axes ([-1..1])
    this.vMoveX = 0;
    this.vMoveZ = 0;

    // Tuning for one-finger mode
    this.touchHoldDelayMs = 220;     // how long to hold before we enter MOVE mode
    this.touchDragThresholdPx = 10;  // how far you can drift and still count as a "hold"
    this.touchMoveScale = 90;        // px-to-axis scaling while in MOVE mode
    this.touchLookSensitivity = 0.0045; // same feel as desktop pointer drag

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
    // Desktop keys
    window.addEventListener('keydown', (e) => this.keys.add(e.key.toLowerCase()));
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));

    // Pointer handling (desktop + mobile)
    this.domElement.addEventListener('pointerdown', (e) => {
      // Ignore right-click etc.
      if (e.button !== undefined && e.button !== 0) return;

      this.isPointerDown = true;
      this.pointerLast.x = e.clientX;
      this.pointerLast.y = e.clientY;

      // Improve mobile behavior: prevent page scroll/zoom while interacting
      if (e.pointerType === 'touch') {
        // Some browsers require non-passive listeners to preventDefault effectively.
        // pointer events here are typically non-passive; still safe to call.
        try { e.preventDefault(); } catch {}
        this._touchStart(e);
      }

      try { this.domElement.setPointerCapture(e.pointerId); } catch {}
    }, { passive: false });

    this.domElement.addEventListener('pointerup', (e) => {
      this.isPointerDown = false;
      try { this.domElement.releasePointerCapture(e.pointerId); } catch {}

      if (e.pointerType === 'touch') {
        this._touchEnd(e);
      }
    });

    this.domElement.addEventListener('pointercancel', (e) => {
      this.isPointerDown = false;
      try { this.domElement.releasePointerCapture(e.pointerId); } catch {}
      if (e.pointerType === 'touch') {
        this._touchEnd(e);
      }
    });

    this.domElement.addEventListener('pointermove', (e) => {
      if (!this.isPointerDown) return;

      const dx = e.clientX - this.pointerLast.x;
      this.pointerLast.x = e.clientX;
      this.pointerLast.y = e.clientY;

      if (e.pointerType === 'touch') {
        try { e.preventDefault(); } catch {}
        this._touchMove(e);
        return;
      }

      // Desktop: mouse drag rotates camera
      if (!this.isPointerDown) return;
      this.yaw -= dx * this.touchLookSensitivity;
      this.pitch -= dy * this.touchLookSensitivity;
      this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
    }, { passive: false });

    // Zoom intentionally disabled so the camera keeps a consistent elevated vantage point.
  }

  _touchStart(e) {
    // Only track one touch pointer
    if (this.touch.active) return;

    this.touch.active = true;
    this.touch.pointerId = e.pointerId;
    this.touch.mode = 'pending';
    this.touch.startX = e.clientX;
    this.touch.startY = e.clientY;
    this.touch.curX = e.clientX;
    this.touch.curY = e.clientY;
    this.touch.downTime = performance.now();
    this.touch.movedBeyondThreshold = false;

    // Reset virtual movement
    this.vMoveX = 0;
    this.vMoveZ = 0;

    // After a short hold (without dragging), enter MOVE mode
    if (this.touch.holdTimer) clearTimeout(this.touch.holdTimer);
    this.touch.holdTimer = setTimeout(() => {
      if (!this.touch.active) return;
      if (this.touch.mode !== 'pending') return;
      if (this.touch.movedBeyondThreshold) return;
      this.touch.mode = 'move';

      // Default: move forward even if user does not drag
      this.vMoveX = 0;
      this.vMoveZ = 1;
    }, this.touchHoldDelayMs);
  }

  _touchMove(e) {
    if (!this.touch.active) return;
    if (e.pointerId !== this.touch.pointerId) return;

    this.touch.curX = e.clientX;
    this.touch.curY = e.clientY;

    const totalDx = this.touch.curX - this.touch.startX;
    const totalDy = this.touch.curY - this.touch.startY;
    const dist = Math.hypot(totalDx, totalDy);

    // If the user drags before hold triggers, treat as LOOK mode
    if (this.touch.mode === 'pending' && dist > this.touchDragThresholdPx) {
      this.touch.movedBeyondThreshold = true;
      this.touch.mode = 'look';
      if (this.touch.holdTimer) {
        clearTimeout(this.touch.holdTimer);
        this.touch.holdTimer = null;
      }
    }

    if (this.touch.mode === 'look') {
      // Rotate camera based on incremental movement (use pointerLast deltas already computed)
      // We reconstruct dx/dy from last pointer diff for smoothness:
      // (pointerLast has already updated; use small deltas between events)
      // We'll approximate using event movementX/Y where available.
      const dx = (typeof e.movementX === 'number') ? e.movementX : (e.clientX - this.pointerLast.x);
      const dy = (typeof e.movementY === 'number') ? e.movementY : (e.clientY - this.pointerLast.y);

      // Some browsers do not provide movementX/Y for touch; fallback to totalDx/totalDy * small factor
      const useDx = Number.isFinite(dx) ? dx : totalDx * 0.1;
      const useDy = Number.isFinite(dy) ? dy : totalDy * 0.1;

      this.yaw -= useDx * this.touchLookSensitivity;
      this.pitch -= useDy * this.touchLookSensitivity;
      this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));

      // Ensure movement is off while in look mode
      this.vMoveX = 0;
      this.vMoveZ = 0;
      return;
    }

    if (this.touch.mode === 'move') {
      // While moving: drag relative to start becomes steering
      // - horizontal: strafe
      // - vertical: adjust forward/back (up = more forward, down = back)
      const ix = _clamp(totalDx / this.touchMoveScale, -1, 1);

      // Start from forward=1, then let vertical drag adjust it
      // Dragging up (negative dy) increases forward, down decreases into reverse
      const baseForward = 1;
      const adjust = _clamp((-totalDy) / (this.touchMoveScale * 1.1), -2, 2);
      const iz = _clamp(baseForward + adjust, -1, 1);

      this.vMoveX = ix;
      this.vMoveZ = iz;
      return;
    }
  }

  _touchEnd(e) {
    if (!this.touch.active) return;
    if (e.pointerId !== this.touch.pointerId) return;

    if (this.touch.holdTimer) {
      clearTimeout(this.touch.holdTimer);
      this.touch.holdTimer = null;
    }

    this.touch.active = false;
    this.touch.pointerId = null;
    this.touch.mode = 'none';
    this.touch.movedBeyondThreshold = false;

    // Stop virtual movement when finger lifts
    this.vMoveX = 0;
    this.vMoveZ = 0;
  }

  update(dt) {
    this._stepArrowCameraTurn(dt);
    const moving = this._stepMovement(dt);
    this._stepCamera(dt);
    if (this.mixer) this.mixer.update(dt);
    this._stepAnimation(moving);
  }

  _stepArrowCameraTurn(dt) {
    const turnLeft = this.keys.has('arrowleft') ? 1 : 0;
    const turnRight = this.keys.has('arrowright') ? 1 : 0;
    const turn = turnRight - turnLeft;
    if (turn === 0) return;
    const yawSpeed = 1.9; // radians/sec
    this.yaw -= turn * yawSpeed * dt;
  }

  _stepMovement(dt) {
    // Desktop input
    const forward = (this.keys.has('w') || this.keys.has('arrowup')) ? 1 : 0;
    const back = (this.keys.has('s') || this.keys.has('arrowdown')) ? 1 : 0;
    const left = this.keys.has('a') ? 1 : 0;
    const right = this.keys.has('d') ? 1 : 0;

    let ix = right - left;
    let iz = forward - back;

    // Mobile virtual input takes over if active in move mode
    const usingTouchMove = this.touch.active && this.touch.mode === 'move';
    if (usingTouchMove) {
      ix = this.vMoveX;
      iz = this.vMoveZ;
    }

    const hasInput = (ix !== 0 || iz !== 0);

    if (!hasInput) {
      this.velocity.multiplyScalar(Math.max(0, 1 - 10 * dt));
      this.target.position.addScaledVector(this.velocity, dt);
      return false;
    }

    // Camera-relative basis (ignoring pitch)
    const camForward = new THREE.Vector3();
    this.camera.getWorldDirection(camForward);
    camForward.y = 0;
    camForward.normalize();

    // Strafe direction (preserve your previous feel)
    const camRight = new THREE.Vector3()
      .crossVectors(camForward, new THREE.Vector3(0, 1, 0))
      .normalize()
      .negate();

    this.moveDir.copy(camRight).multiplyScalar(ix).addScaledVector(camForward, iz).normalize();

    // Velocity target
    const desiredVel = this.moveDir.clone().multiplyScalar(this.speed);
    this.velocity.lerp(desiredVel, 1 - Math.pow(0.001, dt));

    // Apply movement
    this.target.position.addScaledVector(this.velocity, dt);

    // Rotate toward movement direction
    const desiredYaw = Math.atan2(this.moveDir.x, this.moveDir.z);
    const currentYaw = this.target.rotation.y;
    const newYaw = _lerpAngle(currentYaw, desiredYaw, Math.min(1, this.turnSpeed * dt));
    this.target.rotation.y = newYaw;

    if (this.alignCameraBehindOnMove) {
      this.yaw = _lerpAngle(this.yaw, this.target.rotation.y, Math.min(1, this.alignStrength * dt));
    }

    return true;
  }

  _stepCamera(dt) {
    const targetPos = new THREE.Vector3().copy(this.target.position);
    targetPos.y += 1.6;

    const offset = new THREE.Vector3(0, 0, this.distance);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
    offset.applyQuaternion(q);

    const desiredCamPos = targetPos.clone().add(offset);
    // Guardrail: never let the camera dip near/under the floor plane.
    desiredCamPos.y = Math.max(desiredCamPos.y, 2.2);

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
function _clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
