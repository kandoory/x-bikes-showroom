// On-screen UI: start screen, floor menu, show/hide panel, current-floor badge.
export function setupUI(world, player, C) {
  const $ = (id) => document.getElementById(id);
  const floorsEl = $('floors');
  const togglePanel = $('togglePanel');
  const toggleBtn = $('toggleBtn');
  const badge = $('floorBadge');
  const start = $('start');
  const resume = $('resume');

  document.body.classList.toggle('touch', player.isTouch);
  $('help-desktop').hidden = player.isTouch;
  $('help-touch').hidden = !player.isTouch;

  // ---- floors ----
  const goTo = (f) => { player.teleport(f.spawn); highlight(f.key); };
  const buttons = {};
  for (const f of C.floors) {
    const b = document.createElement('button');
    b.textContent = f.label;
    b.title = f.en;
    b.onclick = (e) => { e.stopPropagation(); goTo(f); };
    floorsEl.appendChild(b);
    buttons[f.key] = b;
  }
  function highlight(key) { for (const [k, b] of Object.entries(buttons)) b.classList.toggle('active', k === key); }
  addEventListener('keydown', (e) => {
    const i = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(e.code);
    if (i >= 0 && C.floors[i]) goTo(C.floors[i]);
  });

  // ---- show / hide ----
  for (const t of C.toggles) {
    const label = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = t.on;
    world.groups[t.key].visible = t.on;
    cb.onchange = () => { world.groups[t.key].visible = cb.checked; };
    label.append(cb, ' ', t.label);
    togglePanel.appendChild(label);
  }
  toggleBtn.onclick = (e) => { e.stopPropagation(); togglePanel.hidden = !togglePanel.hidden; };

  // ---- start / resume ----
  $('startBtn').onclick = () => {
    start.hidden = true;
    player.enabled = true;
    player.lock();
  };
  document.addEventListener('pointerlockchange', () => {
    resume.hidden = !!document.pointerLockElement || !player.enabled || player.isTouch;
  });

  // ---- falling out of the world ----
  player.onFellOut = () => goTo(C.floors.find((f) => f.key === C.startFloor));

  // initial position
  goTo(C.floors.find((f) => f.key === C.startFloor) || C.floors[0]);

  // ---- per-frame: current floor badge ----
  const fp = world.footprint;
  let last = '';
  return {
    update() {
      const y = player.feetY, p = player.position;
      let key;
      if (y < world.levels.lowerY / 2) key = 'lower';
      else if (y > world.levels.mezzY / 2) key = 'mezzanine';
      else key = p.x > fp.x0 && p.x < fp.x1 && p.z > fp.z0 && p.z < fp.z1 ? 'ground' : 'outside';
      if (key !== last) {
        last = key;
        const f = C.floors.find((x) => x.key === key);
        badge.textContent = f ? `${f.label} · ${f.en}` : '';
        highlight(key);
      }
    },
  };
}
