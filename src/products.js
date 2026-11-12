import * as THREE from 'three';

// Placeholder product shapes + optional GLB replacement.
// Every product = root group (position/rotation) holding:
//   visual   — placeholder meshes (replaced by the GLB when `model` is set)
//   collider — invisible box the player bumps into

const std = (color, r = 0.5, m = 0) => new THREE.MeshStandardMaterial({ color, roughness: r, metalness: m });
const MAT = {
  tyre: std('#141414', 0.9),
  rim: std('#9a9ea4', 0.3, 0.8),
  dark: std('#202124', 0.6),
  chrome: std('#c9ccd1', 0.2, 1),
  glass: std('#1c2630', 0.1, 0.3),
  white: std('#f2f2f2', 0.35),
  grey: std('#8a8d92', 0.5),
  red: std('#cc0000', 0.35),
  podium: std('#ececee', 0.25),
  lightF: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 1.5 }),
  lightR: new THREE.MeshStandardMaterial({ color: '#550000', emissive: '#ff1a1a', emissiveIntensity: 1.2 }),
};
const colliderMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });

function part(parent, geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const CYL = (r, h, s = 20) => new THREE.CylinderGeometry(r, r, h, s);

// ---------------- placeholders (length runs along local X) ----------------
function car(v, color) {
  const paint = std(color, 0.25, 0.6);
  part(v, B(4.6, 0.7, 1.85), paint, 0, 0.68, 0);
  part(v, B(2.5, 0.58, 1.66), MAT.glass, -0.25, 1.32, 0);
  part(v, B(2.3, 0.06, 1.6), paint, -0.25, 1.63, 0);
  for (const sx of [-1.45, 1.45]) for (const sz of [-0.86, 0.86]) {
    part(v, CYL(0.36, 0.26), MAT.tyre, sx, 0.36, sz, Math.PI / 2);
    part(v, CYL(0.22, 0.27), MAT.rim, sx, 0.36, sz, Math.PI / 2);
  }
  part(v, B(0.04, 0.08, 1.5), MAT.lightF, 2.31, 0.85, 0);
  part(v, B(0.04, 0.08, 1.6), MAT.lightR, -2.31, 0.9, 0);
  return { size: [4.7, 1.7, 1.95], base: 0 };
}

function bike(v) {
  const y0 = 0.12;
  part(v, B(2.4, 0.12, 1.1), MAT.podium, 0, 0.06, 0);
  for (const sx of [-0.72, 0.72]) {
    part(v, new THREE.TorusGeometry(0.32, 0.07, 10, 28), MAT.tyre, sx, y0 + 0.39, 0);
    part(v, CYL(0.12, 0.1), MAT.rim, sx, y0 + 0.39, 0, Math.PI / 2);
  }
  part(v, B(1.0, 0.3, 0.2), MAT.dark, 0, y0 + 0.72, 0);
  part(v, B(0.55, 0.26, 0.34), MAT.red, 0.18, y0 + 0.95, 0);
  part(v, B(0.62, 0.1, 0.28), MAT.dark, -0.38, y0 + 0.93, 0);
  part(v, B(0.07, 0.62, 0.07), MAT.chrome, 0.6, y0 + 0.75, 0, 0, 0, -0.35);
  part(v, B(0.06, 0.06, 0.78), MAT.dark, 0.5, y0 + 1.12, 0);
  part(v, B(0.5, 0.12, 0.12), MAT.chrome, -0.35, y0 + 0.42, 0.14);
  return { size: [2.2, 1.35, 0.9], base: y0 };
}

function outboard(v) {
  part(v, B(0.8, 0.1, 0.8), MAT.dark, 0, 0.05, 0);
  part(v, B(0.12, 1.55, 0.6), MAT.dark, -0.32, 0.85, 0);
  part(v, B(0.5, 0.7, 0.4), MAT.white, 0.02, 1.62, 0);
  part(v, B(0.36, 0.12, 0.36), MAT.grey, 0.02, 1.22, 0);
  part(v, B(0.16, 0.85, 0.14), MAT.grey, 0.02, 0.75, 0);
  part(v, B(0.42, 0.16, 0.14), MAT.grey, 0.08, 0.32, 0);
  part(v, CYL(0.15, 0.04, 6), MAT.dark, 0.32, 0.32, 0, 0, 0, Math.PI / 2);
  return { size: [0.85, 2.0, 0.85], base: 0 };
}

function power(v, kind) {
  part(v, B(1.0, 0.3, 0.8), MAT.podium, 0, 0.15, 0);
  const y = 0.3;
  if (kind === 'generator') {
    part(v, B(0.6, 0.46, 0.34), MAT.red, 0, y + 0.23, 0);
    part(v, B(0.5, 0.3, 0.02), MAT.dark, 0, y + 0.24, 0.18);
    part(v, B(0.45, 0.05, 0.05), MAT.dark, 0, y + 0.5, 0);
  } else if (kind === 'pump') {
    part(v, B(0.55, 0.05, 0.45), MAT.dark, 0, y + 0.03, 0);
    part(v, B(0.32, 0.3, 0.3), MAT.red, -0.08, y + 0.2, 0);
    part(v, CYL(0.1, 0.18), MAT.grey, 0.2, y + 0.15, 0, 0, 0, Math.PI / 2);
    part(v, B(0.5, 0.04, 0.04), MAT.dark, 0, y + 0.45, 0.2);
    part(v, B(0.5, 0.04, 0.04), MAT.dark, 0, y + 0.45, -0.2);
  } else if (kind === 'mower') {
    part(v, B(0.6, 0.18, 0.52), MAT.red, 0, y + 0.18, 0);
    part(v, B(0.26, 0.24, 0.26), MAT.dark, 0, y + 0.38, 0);
    for (const sx of [-0.25, 0.25]) for (const sz of [-0.25, 0.25]) part(v, CYL(0.08, 0.05), MAT.tyre, sx, y + 0.08, sz, Math.PI / 2);
    part(v, B(0.04, 0.75, 0.04), MAT.dark, -0.45, y + 0.55, 0.2, 0, 0, 0.5);
    part(v, B(0.04, 0.75, 0.04), MAT.dark, -0.45, y + 0.55, -0.2, 0, 0, 0.5);
  } else { // tiller
    part(v, CYL(0.18, 0.5, 8), MAT.grey, 0.15, y + 0.18, 0, Math.PI / 2);
    part(v, B(0.32, 0.3, 0.3), MAT.red, -0.05, y + 0.48, 0);
    part(v, B(0.04, 0.7, 0.04), MAT.dark, -0.4, y + 0.7, 0.2, 0, 0, 0.6);
    part(v, B(0.04, 0.7, 0.04), MAT.dark, -0.4, y + 0.7, -0.2, 0, 0, 0.6);
  }
  return { size: [1.0, 1.15, 0.8], base: 0.3 };
}

// ---------------- GLB loading ----------------
let loaderPromise = null;
function getLoader() {
  if (!loaderPromise) {
    loaderPromise = (async () => {
      const [{ GLTFLoader }, { DRACOLoader }, { MeshoptDecoder }] = await Promise.all([
        import('three/addons/loaders/GLTFLoader.js'),
        import('three/addons/loaders/DRACOLoader.js'),
        import('three/addons/libs/meshopt_decoder.module.js'),
      ]);
      const loader = new GLTFLoader();
      const draco = new DRACOLoader();
      draco.setDecoderPath(`https://cdn.jsdelivr.net/npm/three@0.${THREE.REVISION}.0/examples/jsm/libs/draco/gltf/`);
      loader.setDRACOLoader(draco);
      loader.setMeshoptDecoder(MeshoptDecoder);
      return loader;
    })();
  }
  return loaderPromise;
}

async function swapInModel(visual, url, footprint, base) {
  try {
    const loader = await getLoader();
    const gltf = await loader.loadAsync(url);
    const model = gltf.scene;
    model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const longest = Math.max(size.x, size.z) || 1;
    const s = footprint / longest;
    model.scale.setScalar(s);
    const center = box.getCenter(new THREE.Vector3());
    model.position.set(-center.x * s, base - box.min.y * s, -center.z * s);
    // keep the podium (first child) for bikes/power, drop the rest of the placeholder
    const keep = visual.userData.keepFirst ? visual.children[0] : null;
    visual.clear();
    if (keep) visual.add(keep);
    visual.add(model);
  } catch (err) {
    console.warn(`Model failed to load, keeping placeholder: ${url}`, err);
  }
}

// ---------------- public ----------------
export function createProduct(type, entry) {
  const root = new THREE.Group();
  root.position.set(entry.x, entry.y ?? 0, entry.z);
  root.rotation.y = entry.rot ?? 0;
  root.name = entry.label || type;
  const visual = new THREE.Group();
  root.add(visual);

  let info;
  if (type === 'car') info = car(visual, entry.color || '#888');
  else if (type === 'bike') { info = bike(visual); visual.userData.keepFirst = true; }
  else if (type === 'marine') info = outboard(visual);
  else { info = power(visual, entry.kind); visual.userData.keepFirst = true; }

  const [sx, sy, sz] = info.size;
  const collider = new THREE.Mesh(B(sx, sy, sz), colliderMat);
  collider.position.y = sy / 2;
  collider.name = 'collider';
  root.add(collider);

  if (entry.model) swapInModel(visual, entry.model, Math.max(sx, sz) * 0.98, info.base);
  return { root, collider };
}
