// main.js — boots the game: title screen, the frame loop, phone controls.
'use strict';

const G = { scene: 'loading', frame: 0, state: null, busy: false };

// ---------------------------------------------------------------- big creepy text

const bigCache = new Map();
function drawBig(str, x, y, color, scale, outline = '#000') {
  const key = str + color + outline;
  let cv = bigCache.get(key);
  if (!cv) {
    const w = textWidth(str) + 2, h = FONT_H + 6;
    cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const c = cv.getContext('2d');
    drawText(c, str, 1, 1, outline, null);
    drawText(c, str, 0, 0, color, null);
    // drips running off the bottoms of the letters
    const img = c.getImageData(0, 0, w, h), d = img.data, r = seeded(str.length * 13);
    for (let x = 0; x < w; x++) {
      let low = -1;
      for (let y = 0; y < 9; y++) if (d[(y * w + x) * 4 + 3] && d[(y * w + x) * 4] > 120) low = y;
      if (low < 6 || r() > 0.3) continue;
      const len = 1 + Math.floor(r() * 4);
      for (let y = low + 1; y <= low + len && y < h; y++) { const i = (y * w + x) * 4; d[i] = 122; d[i + 1] = 16; d[i + 2] = 24; d[i + 3] = 255; }
    }
    c.putImageData(img, 0, 0);
    bigCache.set(key, cv);
  }
  const w = cv.width * scale;
  ctx.drawImage(cv, Math.round(x === 'center' ? (W - w) / 2 : x), y, w, cv.height * scale);
}
function centerText(str, y, color, shadow = '#000') { drawText(ctx, str, Math.round((W - textWidth(str)) / 2), y, color, shadow); }

// ---------------------------------------------------------------- scenes

const Title = { menu: null, i: 0 };

function drawTitle() {
  ctx.fillStyle = '#05040a'; ctx.fillRect(0, 0, W, H);
  // the turtle mask, barely there, flickering in the dark
  const flick = Math.sin(G.frame / 50) * 0.5 + 0.5;
  const glitch = Math.random() < 0.015;
  ctx.globalAlpha = 0.18 + flick * 0.22 + (glitch ? 0.4 : 0);
  ctx.drawImage(ART.masks.kidnapper, 128 + (glitch ? rand(-3, 3) : 0), 26, 64, 64);
  ctx.globalAlpha = 1;
  Light.lights = [{ x: 160, y: 60, r: 90, i: 0.5 + flick * 0.2, color: [140, 200, 110], flicker: 2 }];
  Light.ambient = 0.6;
  Light.draw(G.frame);
  drawBig('KIDNAPPER', 'center', 98, '#c8c0b0', 3, '#2a0808');
  centerText('CHAPTER 1', 136, '#8a6a5a');
  if (Title.menu) {
    Title.menu.forEach((o, i) => {
      const y = 152 + i * 12;
      centerText(o, y, i === Title.i ? '#f0e4c8' : '#5a5468');
      if (i === Title.i) { ctx.fillStyle = GOLD; const x = Math.round((W - textWidth(o)) / 2) - 10; for (let k = 0; k < 4; k++) ctx.fillRect(x + k, y + 1 + k, 1, 7 - k * 2); }
    });
  } else if (Math.floor(G.frame / 35) % 2 === 0) centerText('PRESS A', 156, '#a89880');
  let beat = false;
  try { beat = localStorage.getItem('kidnapper-beat-day1') === '1'; } catch (e) {}
  if (beat) drawText(ctx, 'DAY 1 SURVIVED', 6, 168, '#6a8a5a', '#000');
  Light.post(G.frame);
}

function drawDayCard() {
  ctx.fillStyle = '#05040a'; ctx.fillRect(0, 0, W, H);
  drawBig('DAY ' + G.state.day, 'center', 60, '#c8c0b0', 3, '#2a0808');
  centerText('Hollow Lane, 6:42 PM', 100, '#8a8298');
  Light.post(G.frame);
}

function drawHome() {
  // the officer's dark living room
  ctx.fillStyle = '#0c0a14'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#18142a'; ctx.fillRect(200, 40, 60, 70);
  ctx.fillStyle = '#3a3860'; ctx.fillRect(204, 44, 24, 30); ctx.fillRect(232, 44, 24, 30); ctx.fillRect(204, 78, 24, 28); ctx.fillRect(232, 78, 24, 28);
  ctx.fillStyle = '#100c18'; ctx.fillRect(30, 110, 120, 40); ctx.fillRect(40, 96, 100, 18);
  Light.lights = [{ x: 230, y: 75, r: 120, i: 0.5, color: [140, 150, 220] }];
  Light.ambient = 0.85;
  Light.draw(G.frame);
  Light.post(G.frame);
}

function drawEnd() {
  ctx.fillStyle = '#05040a'; ctx.fillRect(0, 0, W, H);
  drawBig('END OF DAY 1', 'center', 40, '#c8c0b0', 2, '#2a0808');
  centerText('Someone on Hollow Lane is lying.', 84, '#a89cb8');
  centerText('DAY 2 is coming soon...', 104, '#8a6a5a');
  centerText('Story & masks by two very brave siblings', 140, '#5a5468');
  if (Math.floor(G.frame / 35) % 2 === 0) centerText('PRESS A', 158, '#a89880');
  Light.post(G.frame);
}

async function titleScreen() {
  G.scene = 'title';
  Audio.setMood('night', 1);
  await fadeIn(60);
  await waitPress('a', 'start');
  Audio.select();
  const save = loadSave();
  Title.menu = save ? ['CONTINUE', 'NEW GAME'] : ['NEW GAME'];
  Title.i = 0;
  for (;;) {
    await nextFrame();
    if (Input.pressed.up || Input.pressed.down) { Title.i = (Title.i + 1) % Title.menu.length; Audio.blip(1.3); }
    if (Input.pressed.a || Input.pressed.start) break;
  }
  Audio.select();
  const pick = Title.menu[Title.i];
  await fadeOut(40);
  if (pick === 'CONTINUE') {
    G.state = Object.assign(newState(), save);
    restoreStreet();
    G.scene = 'street';
    await fadeIn(40);
    return;
  }
  G.state = newState();
  G.scene = 'daycard';
  Audio.setMood('silent', 1);
  await fadeIn(30);
  await wait(120);
  await fadeOut(30);
  G.scene = 'street';
  Audio.setMood('calm', 3);
  await fadeIn(40);
  await runScript(STORY.intro);
  saveGame();
}

// put the street back the way the save left it
function restoreStreet() {
  if (G.state.flags.dusk) {
    Street.kid.here = false;
    Street.watcher = true;
    Audio.setMood('night', 2);
    Audio.crickets = true;
  } else Audio.setMood('calm', 2);
}

// ---------------------------------------------------------------- loop

function tick() {
  G.frame++;
  Input.poll();
  Audio.update();
  if (G.scene === 'street') updateStreet();
  const waiting = frameWaiters;
  frameWaiters = [];
  for (const r of waiting) r();
}

function render() {
  switch (G.scene) {
    case 'title': drawTitle(); break;
    case 'daycard': drawDayCard(); break;
    case 'street': drawStreet(); break;
    case 'talk': drawTalk(); break;
    case 'home': drawHome(); break;
    case 'end': drawEnd(); break;
    default: ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  }
  drawUI();
  if (Fade.amount > 0) {
    ctx.globalAlpha = Fade.amount; ctx.fillStyle = Fade.color; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
  }
  dctx.imageSmoothingEnabled = false;
  dctx.drawImage(screen, 0, 0, display.width, display.height);
}

let last = 0, acc = 0;
const STEP = 1000 / 60;
function loop(ts) {
  if (!last) last = ts;
  acc += Math.min(100, ts - last);
  last = ts;
  let n = 0;
  while (acc >= STEP - 1 && n < 2) { tick(); acc -= STEP; n++; }
  if (acc < 0) acc = 0;
  render();
  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------- display + controls

const display = document.getElementById('display');
const dctx = display.getContext('2d');

function fitDisplay() {
  const box = document.getElementById('screen-wrap').getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const fit = Math.min(box.width * dpr / W, box.height * dpr / H);
  const scale = fit >= 3 ? Math.floor(fit) : Math.max(1, fit);
  display.width = Math.round(W * scale); display.height = Math.round(H * scale);
  display.style.width = (display.width / dpr) + 'px';
  display.style.height = (display.height / dpr) + 'px';
}
addEventListener('resize', fitDisplay);
addEventListener('orientationchange', () => setTimeout(fitDisplay, 250));

function bindButton(el, btn) {
  const up = () => { Input.up(btn); el.classList.remove('on'); };
  el.addEventListener('pointerdown', e => { e.preventDefault(); el.setPointerCapture(e.pointerId); Input.down(btn); el.classList.add('on'); });
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('lostpointercapture', up);
}

function bindDpad(el) {
  let cur = null;
  const set = d => {
    if (d === cur) return;
    if (cur) Input.up(cur);
    cur = d;
    if (d) Input.down(d);
    el.dataset.dir = d || '';
  };
  const fromEvent = e => {
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(x, y) < r.width * 0.12) return cur;
    return Math.abs(x) > Math.abs(y) ? (x < 0 ? 'left' : 'right') : (y < 0 ? 'up' : 'down');
  };
  el.addEventListener('pointerdown', e => { e.preventDefault(); el.setPointerCapture(e.pointerId); set(fromEvent(e)); });
  el.addEventListener('pointermove', e => { if (cur) set(fromEvent(e)); });
  const end = () => set(null);
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('lostpointercapture', end);
}

document.querySelectorAll('[data-btn]').forEach(el => bindButton(el, el.dataset.btn));
bindDpad(document.getElementById('dpad'));
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('dblclick', e => e.preventDefault());

// ---------------------------------------------------------------- go!

(async () => {
  Light.init();
  fitDisplay();
  Fade.amount = 1;
  requestAnimationFrame(loop);
  await buildArt();
  buildStreet();
  titleScreen();
})();
