import * as THREE from 'three';

// First-person "game" controls.
// Desktop: WASD / arrows + mouse look (pointer lock), Shift to run.
// Mobile: virtual joystick (bottom-left) + drag anywhere else to look.
export class Player {
  constructor(camera, dom, world, C) {
    this.camera = camera;
    this.dom = dom;
    this.world = world;
    this.P = C.player;
    this.position = new THREE.Vector3();
    this.feetY = 0;
    this.vy = 0;
    this.yaw = 0;
    this.pitch = 0;
    this.keys = new Set();
    this.joy = { x: 0, y: 0 };
    this.enabled = false;
    this.isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    this.ray = new THREE.Raycaster();
    camera.rotation.order = 'YXZ';
    this._bind();
  }

  teleport({ x, y, z, yaw = 0 }) {
    this.position.set(x, 0, z);
    this.feetY = y;
    this.vy = 0;
    this.yaw = yaw;
    this.pitch = 0;
    this._applyCamera();
  }

  lock() {
    if (this.isTouch || !this.dom.requestPointerLock) return;
    try { this.dom.requestPointerLock()?.catch?.(() => {}); } catch { /* embedded views may refuse pointer lock */ }
  }

  _bind() {
    const typing = (e) => e.target && /input|textarea/i.test(e.target.tagName);
    addEventListener('keydown', (e) => { if (!typing(e)) this.keys.add(e.code); });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());

    // mouse look (pointer lock)
    this.dom.addEventListener('click', () => { if (this.enabled) this.lock(); });
    addEventListener('mousemove', (e) => {
      if (document.pointerLockElement !== this.dom) return;
      this._look(e.movementX * this.P.mouseSensitivity, e.movementY * this.P.mouseSensitivity);
    });

    // touch look: any touch on the canvas
    const touches = new Map();
    this.dom.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.dom.setPointerCapture(e.pointerId);
    });
    this.dom.addEventListener('pointermove', (e) => {
      const t = touches.get(e.pointerId);
      if (!t) return;
      this._look((e.clientX - t.x) * this.P.touchSensitivity, (e.clientY - t.y) * this.P.touchSensitivity);
      t.x = e.clientX; t.y = e.clientY;
    });
    const end = (e) => touches.delete(e.pointerId);
    this.dom.addEventListener('pointerup', end);
    this.dom.addEventListener('pointercancel', end);

    // virtual joystick
    const pad = document.getElementById('joystick');
    const stick = document.getElementById('stick');
    if (pad && stick) {
      let id = null;
      const R = 48;
      const move = (e) => {
        const r = pad.getBoundingClientRect();
        let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        const len = Math.hypot(dx, dy);
        if (len > R) { dx *= R / len; dy *= R / len; }
        stick.style.transform = `translate(${dx}px, ${dy}px)`;
        this.joy.x = dx / R; this.joy.y = dy / R;
      };
      pad.addEventListener('pointerdown', (e) => { id = e.pointerId; pad.setPointerCapture(id); move(e); e.preventDefault(); });
      pad.addEventListener('pointermove', (e) => { if (e.pointerId === id) move(e); });
      const release = (e) => { if (e.pointerId !== id) return; id = null; this.joy.x = this.joy.y = 0; stick.style.transform = ''; };
      pad.addEventListener('pointerup', release);
      pad.addEventListener('pointercancel', release);
    }
  }

  _look(dx, dy) {
    if (!this.enabled) return;
    this.yaw -= dx;
    this.pitch = THREE.MathUtils.clamp(this.pitch - dy, -1.45, 1.45);
  }

  _blocked(dirX, dirZ, dist, solids) {
    if (dist <= 0) return false;
    const dir = new THREE.Vector3(dirX, 0, dirZ).normalize();
    for (const h of [0.55, 1.3]) {
      this.ray.set(new THREE.Vector3(this.position.x, this.feetY + h, this.position.z), dir);
      this.ray.far = this.P.radius + dist;
      if (this.ray.intersectObjects(solids, false).length) return true;
    }
    return false;
  }

  update(dt) {
    const k = this.keys;
    let f = 0, s = 0;
    if (this.enabled) {
      if (k.has('KeyW') || k.has('ArrowUp')) f += 1;
      if (k.has('KeyS') || k.has('ArrowDown')) f -= 1;
      if (k.has('KeyD') || k.has('ArrowRight')) s += 1;
      if (k.has('KeyA') || k.has('ArrowLeft')) s -= 1;
      f -= this.joy.y; s += this.joy.x;
    }
    const mag = Math.hypot(f, s);
    if (mag > 1) { f /= mag; s /= mag; }
    const run = k.has('ShiftLeft') || k.has('ShiftRight') || Math.hypot(this.joy.x, this.joy.y) > 0.95;
    const speed = this.P.walkSpeed * (run ? this.P.runMultiplier : 1);

    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    const mx = (-sin * f + cos * s) * speed * dt;
    const mz = (-cos * f - sin * s) * speed * dt;

    const solids = this.world.activeSolids();
    if (mx && !this._blocked(Math.sign(mx), 0, Math.abs(mx), solids)) this.position.x += mx;
    if (mz && !this._blocked(0, Math.sign(mz), Math.abs(mz), solids)) this.position.z += mz;

    // ground following (stairs, floors) + gravity
    this.ray.set(new THREE.Vector3(this.position.x, this.feetY + 0.6, this.position.z), new THREE.Vector3(0, -1, 0));
    this.ray.far = 60;
    const hit = this.ray.intersectObjects(this.world.activeWalkable(), false)[0];
    if (hit) {
      const gy = hit.point.y;
      if (gy >= this.feetY - 0.45) {           // level, step up or small step down: glide onto it
        this.feetY += (gy - this.feetY) * Math.min(1, dt * 14);
        if (Math.abs(gy - this.feetY) < 0.005) this.feetY = gy;
        this.vy = 0;
      } else {                                // real drop: fall
        this.vy -= 22 * dt;
        this.feetY = Math.max(gy, this.feetY + this.vy * dt);
        if (this.feetY === gy) this.vy = 0;
      }
    } else {
      this.vy -= 22 * dt;
      this.feetY += this.vy * dt;
    }
    if (this.feetY < -40) this.onFellOut?.();

    this._applyCamera();
  }

  _applyCamera() {
    this.camera.position.set(this.position.x, this.feetY + this.P.eyeHeight, this.position.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }
}
