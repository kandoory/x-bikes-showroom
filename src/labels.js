import * as THREE from 'three';

// Text drawn on a canvas and used as a texture (signs, zone names).
export function textTexture(lines, { bg = '#1A1A1A', fg = '#FFFFFF', width = 1024, height = 256, font, accent = null } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  if (accent) {
    ctx.fillStyle = accent;
    ctx.fillRect(0, height - height * 0.06, width, height * 0.06);
  }
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const list = Array.isArray(lines) ? lines : [lines];
  const lineH = height / (list.length + 0.6);
  list.forEach((line, i) => {
    const size = Math.round(i === 0 ? lineH * 0.62 : lineH * 0.45);
    ctx.font = `700 ${size}px ${font}`;
    ctx.direction = /[؀-ۿ]/.test(line) ? 'rtl' : 'ltr';
    ctx.fillText(line, width / 2, lineH * (i + 0.8), width * 0.92);
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function signPanel(lines, w, h, opts = {}) {
  const tex = textTexture(lines, { width: 1024, height: Math.round(1024 * (h / w)), ...opts });
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
}
