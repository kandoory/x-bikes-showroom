import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CONFIG } from './config.js';
import { buildShowroom } from './building.js';
import { Player } from './controls.js';
import { setupUI } from './ui.js';

const isMobile = matchMedia('(pointer: coarse)').matches;
const R = CONFIG.render;

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? R.mobileMaxPixelRatio : R.maxPixelRatio));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = R.exposure;
renderer.shadowMap.enabled = isMobile ? R.mobileShadows : R.shadows;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.environment.sky);
scene.fog = new THREE.Fog(CONFIG.environment.sky, 70, 240);

// soft studio reflections so paint, glass and metal read properly
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.6;

const camera = new THREE.PerspectiveCamera(CONFIG.player.fov, innerWidth / innerHeight, 0.05, 400);

const world = buildShowroom(scene, CONFIG);
const player = new Player(camera, canvas, world, CONFIG);
const ui = setupUI(world, player, CONFIG);
document.title = CONFIG.title;
window.showroom = { player, world, scene, camera }; // handy for debugging in the browser console

const clock = new THREE.Clock();
const p = { x: 0, z: 0, feetY: 0 };
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  player.update(dt);
  p.x = player.position.x; p.z = player.position.z; p.feetY = player.feetY;
  world.update(dt, p);
  ui.update();
  renderer.render(scene, camera);
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

document.getElementById('loading')?.remove();
