import * as THREE from 'three';
import { signPanel, textTexture } from './labels.js';
import { createProduct } from './products.js';

// Builds the whole showroom from CONFIG. Returns the "world":
//   groups    — toggleable groups (walls, glass, roof, furniture, products, signage, exterior)
//   walkable  — meshes the player can stand on
//   solids    — meshes the player can't walk through
//   footprint — building rectangle (to tell inside from outside)
//   update()  — per-frame animation (doors, turntables)
export function buildShowroom(scene, C) {
  const Bd = C.building;
  const W = Bd.width, D = Bd.depth, T = Bd.slab, WT = Bd.wall;
  const hw = W / 2, hd = D / 2;
  const groundH = Bd.ground.height;
  const lowerY = -Bd.lowerGround.height;
  const mezzY = Bd.mezzanine.level;
  const mezzFront = -hd + Bd.mezzanine.depth;
  const ew = Bd.entrance.width, doorH = Bd.entrance.doorHeight;

  const walkable = [];
  const solids = [];
  const animators = [];

  const groups = { structure: new THREE.Group() };
  for (const t of C.toggles) groups[t.key] = new THREE.Group();
  for (const [k, g] of Object.entries(groups)) { g.name = k; scene.add(g); }

  // ---------- materials ----------
  const std = (color, r = 0.8, m = 0) => new THREE.MeshStandardMaterial({ color, roughness: r, metalness: m });
  const M = {
    floorGround: std(C.materials.groundFloor, 0.18, 0.05),
    floorLower: std(C.materials.lowerFloor, 0.3),
    floorMezz: std(C.materials.mezzFloor, 0.6),
    slabEdge: std('#d0d0d0', 0.7),
    wall: std(C.materials.wall, 0.9),
    exteriorWall: std(C.materials.exteriorWall, 0.7, 0.2),
    ceiling: std(C.materials.ceiling, 0.95),
    glass: new THREE.MeshStandardMaterial({ color: C.materials.glass, transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide }),
    rail: new THREE.MeshStandardMaterial({ color: C.materials.glass, transparent: true, opacity: 0.28, roughness: 0.05, depthWrite: false, side: THREE.DoubleSide }),
    mullion: std(C.materials.mullion, 0.35, 0.8),
    stair: std(C.materials.stair, 0.45),
    red: std(C.brand.red, 0.45),
    dark: std('#232427', 0.55),
    wood: std('#8a6a4a', 0.6),
    white: std('#f5f5f5', 0.4),
    fabric: std('#3d4148', 0.95),
    podium: std('#ededef', 0.2, 0.1),
    pavement: std(C.environment.pavement, 0.95),
    asphalt: std(C.environment.asphalt, 0.95),
    grass: std('#6f8f4e', 1),
    lightPanel: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 2.2 }),
    lineWhite: std('#e8e8e8', 0.8),
  };

  // ---------- helpers ----------
  function box(group, w, h, d, mat, x, yBottom, z, o = {}) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, yBottom + h / 2, z);
    m.castShadow = o.cast ?? true;
    m.receiveShadow = o.receive ?? true;
    if (o.walk) walkable.push(m);
    if (o.solid) solids.push(m);
    group.add(m);
    return m;
  }
  const rbox = (group, r, y0, y1, mat, o) =>
    box(group, r.x1 - r.x0, y1 - y0, r.z1 - r.z0, mat, (r.x0 + r.x1) / 2, y0, (r.z0 + r.z1) / 2, o);
  function minusHole(outer, hole) {
    return [
      { x0: outer.x0, x1: outer.x1, z0: outer.z0, z1: hole.z0 },
      { x0: outer.x0, x1: outer.x1, z0: hole.z1, z1: outer.z1 },
      { x0: outer.x0, x1: hole.x0, z0: hole.z0, z1: hole.z1 },
      { x0: hole.x1, x1: outer.x1, z0: hole.z0, z1: hole.z1 },
    ].filter((r) => r.x1 - r.x0 > 1e-3 && r.z1 - r.z0 > 1e-3);
  }
  function glassRail(group, x0, z0, x1, z1, yBase, h = 1.1) {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const alongX = Math.abs(x1 - x0) >= Math.abs(z1 - z0);
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    box(group, alongX ? len : 0.04, h, alongX ? 0.04 : len, M.rail, cx, yBase, cz, { solid: true, cast: false });
    box(group, alongX ? len : 0.06, 0.05, alongX ? 0.06 : len, M.mullion, cx, yBase + h, cz, { cast: false });
  }
  function stair(group, x0, x1, zStart, zEnd, yStart, yEnd) {
    const dy = yEnd - yStart, dz = zEnd - zStart;
    const n = Math.max(1, Math.round(Math.abs(dy) / Bd.stairs.riser));
    const tread = Math.abs(dz) / n, dir = Math.sign(dz);
    const yLow = Math.min(yStart, yEnd) - T;
    for (let i = 0; i < n; i++) {
      const top = yStart + ((i + 1) * dy) / n;
      const zc = zStart + dir * (i + 0.5) * tread;
      box(group, x1 - x0, top - yLow, tread + 0.002, M.stair, (x0 + x1) / 2, yLow, zc, { walk: true, solid: true });
    }
  }
  function ceilingLights(group, y, rect, stepX = 5, stepZ = 5, skip = null) {
    for (let x = rect.x0 + stepX / 2; x < rect.x1; x += stepX)
      for (let z = rect.z0 + stepZ / 2; z < rect.z1; z += stepZ) {
        if (skip && x > skip.x0 - 1 && x < skip.x1 + 1 && z > skip.z0 - 0.5 && z < skip.z1 + 0.5) continue;
        const p = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.35), M.lightPanel);
        p.rotation.x = Math.PI / 2;
        p.position.set(x, y, z);
        group.add(p);
      }
  }
  function addSign(group, lines, w, h, x, y, z, rotY = 0, opts = {}) {
    const s = signPanel(lines, w, h, { font: C.brand.font, ...opts });
    s.position.set(x, y, z);
    s.rotation.y = rotY;
    group.add(s);
    return s;
  }

  const S = groups.structure;
  const footprint = { x0: -hw, x1: hw, z0: -hd, z1: hd };

  // ================= SLABS =================
  // Lower ground floor
  rbox(S, footprint, lowerY - T, lowerY, M.floorLower, { walk: true, cast: false });

  // Ground floor slab with the stair opening down to the lower ground
  const sl = Bd.stairs.toLower;
  const holeLower = { x0: sl.x - sl.width / 2, x1: sl.x + sl.width / 2, z0: sl.zTop, z1: sl.zTop + sl.run };
  for (const r of minusHole(footprint, holeLower)) rbox(S, r, -T, 0, M.floorGround, { walk: true });

  // Mezzanine slab (back strip)
  const mezzRect = { x0: -hw, x1: hw, z0: -hd, z1: mezzFront };
  rbox(S, mezzRect, mezzY - T, mezzY, M.floorMezz, { walk: true });
  box(S, W, T + 0.02, 0.05, M.slabEdge, 0, mezzY - T - 0.01, mezzFront + 0.025, { cast: false });

  // Roof
  rbox(groups.roof, footprint, groundH + 0.02, groundH + T, M.exteriorWall, { cast: true });
  rbox(groups.roof, footprint, groundH, groundH + 0.02, M.ceiling, { cast: false });
  ceilingLights(groups.roof, groundH - 0.01, { x0: -hw, x1: hw, z0: mezzFront, z1: hd });
  // Lights under the mezzanine and in the lower ground ceiling
  ceilingLights(S, mezzY - T - 0.01, mezzRect);
  ceilingLights(S, -T - 0.01, footprint, 5, 5, holeLower);
  ceilingLights(groups.roof, groundH - 0.01, mezzRect);

  // ================= OUTSIDE GROUND =================
  const site = { x0: -120, x1: 120, z0: -120, z1: 120 };
  for (const r of minusHole(site, footprint)) rbox(S, r, -T, 0, M.pavement, { walk: true, cast: false });

  // ================= WALLS =================
  const Wg = groups.walls;
  const wallBottom = lowerY - T;
  // back + sides, full height (lower ground to roof)
  box(Wg, W + 2 * WT, groundH - wallBottom, WT, M.wall, 0, wallBottom, -hd - WT / 2, { solid: true });
  box(Wg, WT, groundH - wallBottom, D + 2 * WT, M.wall, -hw - WT / 2, wallBottom, 0, { solid: true });
  box(Wg, WT, groundH - wallBottom, D + 2 * WT, M.wall, hw + WT / 2, wallBottom, 0, { solid: true });
  // exterior cladding skin (dark) slightly outside, only above ground
  box(Wg, W + 2 * WT + 0.1, groundH + T, 0.05, M.exteriorWall, 0, 0, -hd - WT - 0.03, { cast: false });
  box(Wg, 0.05, groundH + T, D + 2 * WT + 0.1, M.exteriorWall, -hw - WT - 0.03, 0, 0, { cast: false });
  box(Wg, 0.05, groundH + T, D + 2 * WT + 0.1, M.exteriorWall, hw + WT + 0.03, 0, 0, { cast: false });
  // lower ground front wall (below grade, always solid)
  box(S, W + 2 * WT, -wallBottom, WT, M.wall, 0, wallBottom, hd + WT / 2, { solid: true });

  // Red accent wall behind the reception (under the mezzanine)
  box(S, 14, mezzY - T - 0.3, 0.08, M.red, 0, 0, -hd + 0.05, { cast: false });

  // ================= FRONT GLASS FACADE + DOORS =================
  const G = groups.glass;
  box(G, hw - ew / 2, groundH, 0.05, M.glass, -(hw + ew / 2) / 2, 0, hd, { solid: true, cast: false });
  box(G, hw - ew / 2, groundH, 0.05, M.glass, (hw + ew / 2) / 2, 0, hd, { solid: true, cast: false });
  box(G, ew, groundH - doorH, 0.05, M.glass, 0, doorH, hd, { solid: true, cast: false });
  // mullions (structure, so the facade rhythm stays when glass is hidden)
  for (let x = -hw; x <= hw + 0.01; x += 4) {
    if (Math.abs(x) < ew / 2) continue;
    box(S, 0.1, groundH, 0.15, M.mullion, x, 0, hd, { cast: false });
  }
  box(S, ew + 0.2, 0.15, 0.18, M.mullion, 0, doorH, hd, { cast: false });
  box(S, 0.12, doorH, 0.18, M.mullion, -ew / 2 - 0.06, 0, hd, { cast: false });
  box(S, 0.12, doorH, 0.18, M.mullion, ew / 2 + 0.06, 0, hd, { cast: false });
  box(S, W, 0.2, 0.2, M.mullion, 0, mezzY - 0.2, hd, { cast: false });

  // sliding doors (slide outward behind the fixed glass, just inside it)
  const doorZ = hd - 0.12;
  const doorL = box(G, ew / 2, doorH, 0.04, M.glass, -ew / 4, 0, doorZ, { solid: true, cast: false });
  const doorR = box(G, ew / 2, doorH, 0.04, M.glass, ew / 4, 0, doorZ, { solid: true, cast: false });
  const doorFrameMat = M.mullion;
  for (const d of [doorL, doorR]) {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.05, doorH, 0.06), doorFrameMat);
    frame.position.x = d === doorL ? ew / 4 - 0.025 : -ew / 4 + 0.025;
    d.add(frame);
  }
  let doorT = 0;
  animators.push((dt, p) => {
    const near = Math.hypot(p.x, p.z - hd) < C.door.triggerDistance && p.feetY > -1 && p.feetY < 2;
    doorT += Math.sign((near ? 1 : 0) - doorT) * Math.min(Math.abs((near ? 1 : 0) - doorT), dt * C.door.speed);
    const e = doorT * doorT * (3 - 2 * doorT);
    doorL.position.x = -ew / 4 - e * (ew / 2 - 0.05);
    doorR.position.x = ew / 4 + e * (ew / 2 - 0.05);
  });

  // canopy over the entrance
  box(S, ew + 6, 0.25, 3, M.exteriorWall, 0, doorH + 0.5, hd + 1.5, { cast: true });
  box(S, ew + 5.6, 0.02, 2.6, M.lightPanel, 0, doorH + 0.48, hd + 1.5, { cast: false });

  // ================= STAIRS =================
  // ground -> lower ground (right)
  stair(S, holeLower.x0, holeLower.x1, holeLower.z0, holeLower.z1, 0, lowerY);
  glassRail(S, holeLower.x0, holeLower.z0, holeLower.x0, holeLower.z1, 0);
  glassRail(S, holeLower.x1, holeLower.z0, holeLower.x1, holeLower.z1, 0);
  glassRail(S, holeLower.x0, holeLower.z1, holeLower.x1, holeLower.z1, 0);

  // ground -> mezzanine (left), arriving at the mezzanine front edge
  const sm = Bd.stairs.toMezzanine;
  const smx0 = sm.x - sm.width / 2, smx1 = sm.x + sm.width / 2;
  stair(S, smx0, smx1, mezzFront + sm.run, mezzFront, 0, mezzY);
  // mezzanine edge rail (gap where the stair arrives)
  glassRail(S, -hw, mezzFront, smx0, mezzFront, mezzY);
  glassRail(S, smx1, mezzFront, hw, mezzFront, mezzY);

  // ================= GROUND FLOOR =================
  const F = groups.furniture, P = groups.products, SG = groups.signage;
  const spinners = [];
  for (const c of C.products.cars) {
    const turntable = new THREE.Group();
    turntable.position.set(c.x, 0, c.z);
    P.add(turntable);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 0.12, 48), M.podium);
    disc.position.y = 0.06;
    disc.receiveShadow = true;
    turntable.add(disc);
    walkable.push(disc);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3, 0.03, 6, 64), M.lightPanel);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.1;
    turntable.add(ring);
    const { root, collider } = createProduct('car', { ...c, x: 0, z: 0, y: 0.12 });
    turntable.add(root);
    solids.push(collider);
    spinners.push(turntable);
  }
  animators.push((dt) => { for (const t of spinners) t.rotation.y += dt * C.products.turntableSpin; });

  // reception desk + lounge under the mezzanine
  box(F, 6, 1.05, 0.9, M.white, 0, 0, -hd + 3.2, { solid: true });
  box(F, 6.1, 0.06, 1.0, M.dark, 0, 1.05, -hd + 3.2, { cast: false });
  box(F, 6, 0.12, 0.05, M.red, 0, 0.85, -hd + 3.2 + 0.47, { cast: false });
  for (const sx of [-10, 10]) {
    box(F, 2.6, 0.45, 0.9, M.fabric, sx, 0, -hd + 4.2, { solid: true });
    box(F, 2.6, 0.45, 0.2, M.fabric, sx, 0.45, -hd + 3.85, { solid: true });
    box(F, 1.2, 0.4, 0.7, M.wood, sx, 0, -hd + 5.6, { solid: true });
  }

  // ================= LOWER GROUND =================
  for (const zn of C.zones) {
    const zx = (zn.x0 + zn.x1) / 2, zw = zn.x1 - zn.x0;
    // tinted floor zone
    const tint = new THREE.Mesh(new THREE.PlaneGeometry(zw - 0.6, D - 1.5), new THREE.MeshStandardMaterial({ color: zn.color, roughness: 0.4 }));
    tint.rotation.x = -Math.PI / 2;
    tint.position.set(zx, lowerY + 0.005, -0.4);
    tint.receiveShadow = true;
    S.add(tint);
    // back wall graphic + hanging sign
    addSign(SG, [zn.nameAr, zn.name], Math.min(zw - 2, 10), 2.2, zx, lowerY + 2.6, -hd + 0.06, 0, { bg: C.brand.dark, accent: C.brand.red });
    const hang = addSign(SG, [zn.name], 5, 0.9, zx, -1.2, 4, 0, { bg: C.brand.red });
    const hang2 = addSign(SG, [zn.name], 5, 0.9, zx, -1.2, 3.99, Math.PI, { bg: C.brand.red });
    hang.renderOrder = hang2.renderOrder = 1;
  }
  // low dividers between zones (back half)
  for (const x of [C.zones[0].x1, C.zones[1].x1]) box(F, 0.12, 1.2, 10, M.white, x, lowerY, -hd + 5, { solid: true });
  // service counter in the marine zone
  box(F, 4, 1.05, 0.8, M.white, 0, lowerY, -hd + 1.4, { solid: true });

  const lowerProducts = [['bike', C.products.bikes], ['marine', C.products.marine], ['power', C.products.power]];
  for (const [type, list] of lowerProducts) {
    for (const e of list) {
      const { root, collider } = createProduct(type, { ...e, y: lowerY });
      P.add(root);
      solids.push(collider);
    }
  }

  // ================= MEZZANINE (offices) =================
  // 4 glass offices along the back wall (each with a door gap), corridor in front
  const officeDepth = Math.min(4, Bd.mezzanine.depth - 3);
  const officeFront = -hd + officeDepth;
  const officeW = W / 4, partH = 2.8, doorGap = 1.2;
  for (let i = 0; i < 4; i++) {
    const x0 = -hw + i * officeW, x1 = x0 + officeW, cx = (x0 + x1) / 2;
    if (i > 0) box(G, 0.05, partH, officeDepth, M.glass, x0, mezzY, -hd + officeDepth / 2, { solid: true, cast: false });
    const gapX0 = x1 - 2.2, gapX1 = gapX0 + doorGap;
    box(G, gapX0 - x0, partH, 0.05, M.glass, (x0 + gapX0) / 2, mezzY, officeFront, { solid: true, cast: false });
    box(G, x1 - gapX1, partH, 0.05, M.glass, (gapX1 + x1) / 2, mezzY, officeFront, { solid: true, cast: false });
    box(S, 0.06, partH, 0.08, M.mullion, gapX0, mezzY, officeFront, { cast: false });
    box(S, 0.06, partH, 0.08, M.mullion, gapX1, mezzY, officeFront, { cast: false });
    // desk, chair, two visitor chairs, cabinet
    box(F, 1.8, 0.75, 0.8, M.wood, cx, mezzY, -hd + 1.8, { solid: true });
    box(F, 0.55, 0.95, 0.55, M.dark, cx, mezzY, -hd + 1.0, { solid: true });
    box(F, 0.5, 0.45, 0.5, M.fabric, cx - 0.5, mezzY, -hd + 2.7, { solid: true });
    box(F, 0.5, 0.45, 0.5, M.fabric, cx + 0.5, mezzY, -hd + 2.7, { solid: true });
    box(F, 1.6, 1.8, 0.45, M.white, x0 + 1.2, mezzY, -hd + 0.25, { solid: true });
    addSign(SG, [i === 1 ? 'الإدارة' : 'مكتب', i === 1 ? 'Management' : `Office ${i + 1}`], 2, 0.5, cx - 1.2, mezzY + 2.2, officeFront + 0.04, 0, { bg: C.brand.dark, accent: C.brand.red });
  }
  // lounge in the corridor
  box(F, 2.4, 0.45, 0.85, M.fabric, 6, mezzY, mezzFront - 1.3, { solid: true });
  box(F, 1.0, 0.4, 0.6, M.wood, 6, mezzY, mezzFront - 2.4, { solid: true });

  // ================= FACADE SIGN =================
  const facadeW = 14, facadeH = 2.4;
  const facadeSign = addSign(SG, [C.signage.facadeTitle, '[ Honda logo — من ملفات الـ CI ]'], facadeW, facadeH, 0, mezzY + 2.2, hd + 0.3, 0, { bg: C.brand.dark, accent: C.brand.red });
  if (C.signage.logoImage) {
    new THREE.TextureLoader().load(C.signage.logoImage, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      facadeSign.material.map = tex;
      facadeSign.material.transparent = true;
      facadeSign.material.needsUpdate = true;
    }, undefined, () => console.warn('Logo not found:', C.signage.logoImage));
  }
  addSign(SG, ['اللور جراوند ↓', 'Bikes · Marine · Power Products'], 3.2, 0.9, sl.x, 2.6, sl.zTop - 0.3, Math.PI, { bg: C.brand.dark, accent: C.brand.red });
  addSign(SG, ['الميزانين ↑', 'Offices'], 3.2, 0.9, sm.x, 2.6, mezzFront + sm.run + 0.3, 0, { bg: C.brand.dark, accent: C.brand.red });

  // ================= EXTERIOR DRESSING =================
  const E = groups.exterior;
  const roadZ0 = hd + 12, roadZ1 = hd + 22;
  box(E, 240, 0.02, roadZ1 - roadZ0, M.asphalt, 0, 0, (roadZ0 + roadZ1) / 2, { cast: false });
  for (let x = -110; x < 110; x += 6) box(E, 3, 0.025, 0.15, M.lineWhite, x, 0, (roadZ0 + roadZ1) / 2, { cast: false });
  // parking bays
  for (let x = -hw + 2; x <= hw - 2; x += 3) {
    if (Math.abs(x) < ew + 2) continue;
    box(E, 0.1, 0.022, 5, M.lineWhite, x, 0, hd + 7, { cast: false });
  }
  // planters with trees
  const trunkMat = M.wood, leafMat = new THREE.MeshStandardMaterial({ color: '#4d6b35', roughness: 1 });
  for (const x of [-hw + 1, -ew - 3, ew + 3, hw - 1]) {
    box(E, 1.6, 0.5, 1.6, M.exteriorWall, x, 0, hd + 4, { solid: true });
    box(E, 1.4, 0.02, 1.4, M.grass, x, 0.5, hd + 4, { cast: false });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 3.5, 8), trunkMat);
    trunk.position.set(x, 2.25, hd + 4);
    trunk.castShadow = true;
    E.add(trunk);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 0), leafMat);
    crown.position.set(x, 4.4, hd + 4);
    crown.castShadow = true;
    E.add(crown);
  }
  // street lamps
  for (let x = -40; x <= 40; x += 16) {
    box(E, 0.15, 6, 0.15, M.mullion, x, 0, roadZ0 - 1, { solid: true });
    box(E, 1.2, 0.12, 0.3, M.mullion, x, 6, roadZ0 - 1, { cast: false });
    box(E, 0.9, 0.03, 0.22, M.lightPanel, x, 5.98, roadZ0 - 1, { cast: false });
  }

  // ================= LIGHTS =================
  scene.add(new THREE.HemisphereLight('#eaf3ff', '#8a8378', 0.8));
  const sun = new THREE.DirectionalLight('#fff3df', 2.4);
  sun.position.set(35, 55, 45);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -40; sc.right = 40; sc.top = 40; sc.bottom = -40; sc.near = 10; sc.far = 160;
  sun.shadow.bias = -0.0005;
  scene.add(sun);
  const pt = (x, y, z, i = 60, d = 26) => { const l = new THREE.PointLight('#fff6ea', i, d, 2); l.position.set(x, y, z); scene.add(l); };
  // kept to 6 point lights so phones stay smooth
  pt(-10, groundH - 1, 4, 140, 32); pt(10, groundH - 1, 4, 140, 32);
  for (const x of [-13, 0, 13]) pt(x, -1, -2, 80, 22);
  pt(0, mezzY + 3.2, -hd + 4, 60, 26);

  // ---------- visibility-aware collision lists ----------
  // product colliders draw nothing but stay `visible`, so hiding their group still removes them
  const visibleDeep = (o) => { for (let n = o; n; n = n.parent) if (!n.visible) return false; return true; };

  return {
    groups,
    footprint,
    levels: { lowerY, mezzY, groundH },
    activeWalkable: () => walkable.filter(visibleDeep),
    activeSolids: () => solids.filter(visibleDeep),
    update(dt, p) { for (const a of animators) a(dt, p); },
    setShadows(on) { sun.castShadow = on; },
  };
}
