// street.js — the neighborhood, seen from the side. You walk left and right
// along the sidewalk, knock on doors, and the sky slowly goes dark.
'use strict';

const STREET = {
  width: 1300,
  houses: [
    { id: 'home',      x: 14,  wall: '#5a6478', roof: '#3a2c2c', door: '#5a3a2a', windows: 'dark', chimney: true },
    { id: 'ozzie',     x: 236, wall: '#9a88b0', roof: '#4a3858', door: '#e8d8e0', windows: 'lit', flowers: true },
    { id: 'oldman',    x: 446, wall: '#6a7266', roof: '#2c2a2a', door: '#3a3028', windows: 'curtains', lamp: 'off', peeling: true, sag: true, missingShingles: true },
    { id: 'jeffery',   x: 656, wall: '#c8b878', roof: '#504838', door: '#7a6a50', windows: 'dark', lamp: 'flicker' },
    { id: 'kidnapper', x: 866, wall: '#e0d4b8', roof: '#3c5030', door: '#3c5a2c', windows: 'lit', chimney: true, basement: true, clean: true },
  ],
  lamps: [176, 600, 1010, 1240],
  poles: [210, 640, 1080],
};

const Street = {
  px: 70, dir: 1, frame: 0, walkT: 0, stepAlt: false,
  kid: { x: 412, dir: 1, frame: 0, t: 0, here: true },
  layer: null, far: null, lights: [], prompts: [],
  moths: [],
  watcher: false,       // someone standing in the Kidnapper's window
  crow: { x: 760, cawed: false },
  fog: null, beatT: 0,
};

// a crow perched on the power line
function crowPix(facing) {
  const p = new Pix(10, 9);
  const c = '#08070a';
  p.ellipse(5, 5, 3.5, 2.5, c).ellipse(7.5, 3, 2, 2, c);
  p.poly([1, 4, -1, 7, 3, 6], c).line(9, 3, 10, 3, '#3a3020');
  p.set(8, 2, '#c8b040');
  p.line(4, 7, 4, 8, '#201c18').line(6, 7, 6, 8, '#201c18');
  return facing < 0 ? p.flipX() : p;
}

// low fog that drifts along the street, in soft dithered clumps
function fogPix() {
  const w = 640, h = 46;
  const p = new Pix(w, h);
  const r = seeded(21);
  const blobs = [];
  for (let i = 0; i < 70; i++) blobs.push([r() * w, 14 + r() * 26, 20 + r() * 40, 5 + r() * 9]);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let d = 0;
    for (const [bx, by, rx, ry] of blobs) {
      for (const ox of [0, -w, w]) {
        const dx = (x - bx - ox) / rx, dy = (y - by) / ry;
        const v = 1 - (dx * dx + dy * dy);
        if (v > d) d = v;
      }
    }
    d = Math.min(1, d * (y / h + 0.3));
    if (d > BAYER[(y & 3) * 4 + (x & 3)] * 1.6 + 0.15) p.set(x, y, d > 0.75 ? '#9a98b0' : '#7a7890');
  }
  return p.canvas();
}

function buildStreet() {
  const cv = document.createElement('canvas');
  cv.width = STREET.width; cv.height = H;
  const c = cv.getContext('2d');
  c.imageSmoothingEnabled = false;
  // grass, sidewalk, curb, road
  c.fillStyle = '#26301e'; c.fillRect(0, GROUND_Y - 6, STREET.width, 20);
  for (let x = 0; x < STREET.width; x += 3) { c.fillStyle = x % 2 ? '#30402a' : '#1c2618'; c.fillRect(x, GROUND_Y - 7 - (x % 5 === 0 ? 2 : 0), 1, 3); }
  c.fillStyle = '#5c5a62'; c.fillRect(0, 152, STREET.width, 14);
  c.fillStyle = '#4a4850';
  for (let x = 0; x < STREET.width; x += 32) c.fillRect(x, 152, 1, 14);
  const r = seeded(3);
  for (let i = 0; i < 40; i++) { const x = Math.floor(r() * STREET.width); c.fillRect(x, 154 + Math.floor(r() * 9), rand(3, 7), 1); }
  c.fillStyle = '#7a7882'; c.fillRect(0, 152, STREET.width, 1);
  c.fillStyle = '#3a3840'; c.fillRect(0, 166, STREET.width, 3);
  c.fillStyle = '#1c1b22'; c.fillRect(0, 169, STREET.width, 11);
  c.fillStyle = '#6a6040';
  for (let x = 8; x < STREET.width; x += 40) c.fillRect(x, 175, 18, 1);

  // power poles and sagging wires behind the houses
  for (const x of STREET.poles) c.drawImage(ART.props.pole, x - 15, GROUND_Y - 114);
  c.strokeStyle = '#0c0a10'; c.lineWidth = 1;
  for (let i = 0; i < STREET.poles.length - 1; i++) {
    for (const off of [-11, 0, 11]) {
      const x0 = STREET.poles[i] + off, x1 = STREET.poles[i + 1] + off;
      for (let x = x0; x <= x1; x++) {
        const t = (x - x0) / (x1 - x0);
        c.fillStyle = '#0c0a10'; c.fillRect(x, Math.round(GROUND_Y - 106 + Math.sin(t * Math.PI) * 18), 1, 1);
      }
    }
  }

  Street.lights = [];
  STREET.doors = {};
  for (const hs of STREET.houses) {
    const built = housePix(hs);
    const img = built.pix.canvas();
    const top = GROUND_Y - built.h;
    c.drawImage(img, hs.x, top);
    hs.doorWorldX = hs.x + built.doorX;
    hs.w = built.w;
    STREET.doors[hs.id] = hs.doorWorldX;
    // a little front walk from the door down to the sidewalk
    c.fillStyle = '#4a4650'; c.fillRect(hs.doorWorldX - 9, GROUND_Y + 3, 18, 6);
    for (const L of built.lights) Street.lights.push({ ...L, x: L.x + hs.x, y: L.y + top, house: hs.id });
  }
  const H2 = id => STREET.houses.find(h => h.id === id);
  // the Kidnapper's perfect yard: trimmed hedges, a turtle statue, a pie cooling on the sill
  const k = H2('kidnapper');
  c.drawImage(hedgePix(34).canvas(), k.x + 6, GROUND_Y - 14);
  c.drawImage(hedgePix(34).canvas(), k.x + k.w - 40, GROUND_Y - 14);
  c.drawImage(ART.props.turtle, k.x + k.w + 4, GROUND_Y - 12);
  c.drawImage(ART.props.pie, k.x + 28, GROUND_Y - 116 + 76);
  // the old man's yard has gone wild, and his mail is piling up
  const o = H2('oldman');
  c.drawImage(weedsPix(46).canvas(), o.x + 2, GROUND_Y - 18);
  c.drawImage(weedsPix(40).canvas(), o.x + o.w - 40, GROUND_Y - 18);
  c.drawImage(ART.props.mailboxFull, o.doorWorldX + 22, 152 - 32);
  STREET.oldMailX = o.doorWorldX + 31;
  for (const id of ['home', 'ozzie', 'jeffery', 'kidnapper']) c.drawImage(ART.props.mailbox, H2(id).doorWorldX + 22, 152 - 32);
  // street lamps along the back of the sidewalk
  for (const x of STREET.lamps) c.drawImage(ART.props.lamp, x - 5, 152 - 94);
  // the dead end: a wall of dark trees and a sign
  for (let x = 1100; x < STREET.width; x += 26) c.drawImage(ART.props.trees[x % 4], x - 20, GROUND_Y - 80 - (x % 3) * 4);
  c.fillStyle = '#d8d0b8'; c.fillRect(1180, 118, 30, 12); c.fillStyle = '#3a3a40'; c.fillRect(1194, 130, 2, 22);
  drawText(c, 'DEAD', 1184, 120, '#802020', null);
  Street.layer = cv;

  // far background: tree line + rooftops, scrolls slower than the street
  const far = document.createElement('canvas');
  far.width = 900; far.height = H;
  const f = far.getContext('2d');
  for (let x = -20; x < far.width; x += 34) f.drawImage(ART.props.trees[Math.abs(Math.floor(x / 34)) % 4], x, GROUND_Y - 96 + Math.abs((x * 7) % 13));
  f.fillStyle = '#120e1e';
  f.fillRect(0, GROUND_Y - 30, far.width, 30);
  f.fillStyle = '#100c1a';
  for (let x = 0; x < far.width; x += 90) f.fillRect(x + 20, GROUND_Y - 58, 50, 50);
  for (let x = 0; x < far.width; x += 90) for (let i = 0; i < 26; i++) f.fillRect(x + 20 + i, GROUND_Y - 58 - Math.min(i, 26 - i), 50 - 2 * i < 0 ? 0 : 1, 1);
  Street.far = far;

  Street.fog = fogPix();
  Street.crowR = crowPix(1).canvas(); Street.crowL = crowPix(-1).canvas();
  for (let i = 0; i < 4; i++) Street.moths.push({ a: Math.random() * 6, r: 4 + Math.random() * 6, s: 0.05 + Math.random() * 0.08 });
}

// ---------------------------------------------------------------- time of day: 0 = dusk, 1 = night

function skyColors(t) {
  const mix = (a, b) => a.map((v, i) => Math.round(lerp(v, b[i], t)));
  return [mix([58, 40, 92], [8, 6, 20]), mix([170, 80, 90], [24, 16, 44]), mix([240, 150, 100], [40, 26, 56])];
}

// the sky only changes slowly, so it's painted once per shade and reused
const skyCache = { key: -1, cv: null };
function drawSky(t) {
  const key = Math.round(t * 60);
  if (skyCache.key !== key) {
    skyCache.key = key;
    if (!skyCache.cv) { skyCache.cv = document.createElement('canvas'); skyCache.cv.width = W; skyCache.cv.height = GROUND_Y; }
    paintSky(skyCache.cv.getContext('2d'), key / 60);
  }
  ctx.drawImage(skyCache.cv, 0, 0);
}

function paintSky(ctx, t) {
  const [top, mid, low] = skyColors(t);
  // smooth gradient, then dithered down to chunky colour steps
  const img = ctx.createImageData(W, GROUND_Y), d = img.data, STEP = 10;
  for (let y = 0; y < GROUND_Y; y++) {
    const k = y / GROUND_Y;
    const a = k < 0.6 ? top : mid, b = k < 0.6 ? mid : low;
    const kk = k < 0.6 ? k / 0.6 : (k - 0.6) / 0.4;
    const col = a.map((v, i) => lerp(v, b[i], kk));
    for (let x = 0; x < W; x++) {
      const th = BAYER[(y & 3) * 4 + (x & 3)];
      const o = (y * W + x) * 4;
      for (let i = 0; i < 3; i++) d[o + i] = Math.min(255, Math.floor(col[i] / STEP + th) * STEP);
      d[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  // stars come out as it gets dark
  if (t > 0.4) {
    const r = seeded(11);
    ctx.fillStyle = `rgba(220,210,240,${(t - 0.4) * 1.2})`;
    for (let i = 0; i < 40; i++) ctx.fillRect(Math.floor(r() * W), Math.floor(r() * 80), 1, 1);
  }
  // a big pale moon
  ctx.fillStyle = `rgba(232,224,200,${0.4 + t * 0.6})`;
  ctx.beginPath(); ctx.arc(262, 30, 11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = `rgba(200,190,170,${0.3 + t * 0.5})`;
  ctx.fillRect(257, 26, 3, 2); ctx.fillRect(265, 33, 4, 2);
}

// ---------------------------------------------------------------- updating + drawing

function streetCamX() { return Math.round(clamp(Street.px - 150, 0, STREET.width - W)); }

function updateStreet() {
  const s = Street;
  // the Lollipop Kid hops back and forth in front of Ozzie's place
  if (s.kid.here) {
    s.kid.t++;
    if (s.kid.t % 8 === 0) s.kid.frame = (s.kid.frame + 1) % 4;
    if (s.kid.t % 4 === 0) s.kid.x += s.kid.dir * 0.5 * 4 / 4;
    if (s.kid.x > 430) s.kid.dir = -1;
    if (s.kid.x < 380) s.kid.dir = 1;
  }
  for (const m of s.moths) m.a += m.s;
  // the crow screams once when you walk under it
  if (!s.crow.cawed && Math.abs(s.px - s.crow.x) < 30) { s.crow.cawed = true; Audio.caw(); }
  // after dark, your heart starts pounding near Oliver's house
  if (G.state.lampsOn && G.scene === 'street') {
    const d = Math.abs(s.px - STREET.doors.kidnapper);
    if (d < 240 && --s.beatT <= 0) {
      const near = 1 - d / 240;
      Audio.heartbeat(0.12 + near * 0.35);
      s.beatT = Math.round(70 - near * 32);
    }
  }
  Light.glitchChance = G.state.lampsOn ? 0.003 : 0.0008;
  if (G.busy) return;
  const left = Input.held.left, right = Input.held.right;
  if (left || right) {
    s.dir = right ? 1 : -1;
    const speed = Input.held.b ? 1.7 : 1;
    s.px = clamp(s.px + s.dir * speed, 24, STREET.width - 120);
    s.walkT += speed;
    if (s.walkT >= 9) { s.walkT = 0; s.frame = (s.frame + 1) % 4; if (s.frame % 2) Audio.step(s.stepAlt = !s.stepAlt); }
  } else { s.frame = 0; s.walkT = 0; }
  const near = nearestThing();
  if (Input.pressed.a && near) runScript(near.script);
}

// what the officer is standing next to: a door, the kid, the old man's mailbox
function nearestThing() {
  const s = Street;
  const list = [];
  for (const hs of STREET.houses) list.push({ x: hs.doorWorldX, label: hs.id === 'home' ? 'GO IN' : 'KNOCK', script: () => STORY.door(hs.id) });
  if (s.kid.here) list.push({ x: s.kid.x + 11, label: 'TALK', script: () => STORY.kid() });
  list.push({ x: STREET.oldMailX, label: 'LOOK', script: () => STORY.mailbox() });
  let best = null, bd = 22;   // generous: you don't have to stand exactly at the door
  for (const t of list) { const d = Math.abs(t.x - s.px); if (d < bd) { bd = d; best = t; } }
  return best;
}

function drawStreet() {
  const s = Street, t = G.state.time, cam = streetCamX();
  drawSky(t);
  ctx.drawImage(Street.far, -Math.round(cam * 0.35) % 900, 0);
  ctx.drawImage(Street.far, -Math.round(cam * 0.35) % 900 + 900, 0);
  ctx.drawImage(Street.layer, -cam, 0);

  // someone watching from the Kidnapper's window...
  if (s.watcher) {
    const k = STREET.houses.find(h => h.id === 'kidnapper');
    const wx = k.x + k.w - 46 - cam, wy = GROUND_Y - 116 + 56;
    ctx.fillStyle = '#0a080c'; ctx.fillRect(wx + 5, wy + 6, 12, 14); ctx.fillRect(wx + 7, wy + 2, 8, 6);
    ctx.fillStyle = '#d8e8c0'; ctx.fillRect(wx + 8, wy + 5, 1, 1); ctx.fillRect(wx + 13, wy + 5, 1, 1);
  }
  // moths around Jeffery's porch light
  const jl = Street.lights.find(L => L.house === 'jeffery');
  if (jl) {
    ctx.fillStyle = '#e8dcc0';
    for (const m of s.moths) ctx.fillRect(Math.round(jl.x - cam + Math.cos(m.a) * m.r), Math.round(jl.y + Math.sin(m.a * 1.7) * m.r * 0.7), 1, 1);
  }
  // the crow on the wire, always watching you
  const crowY = Math.round(GROUND_Y - 106 + Math.sin(((s.crow.x - 640) / 440) * Math.PI) * 18) - 8;
  ctx.drawImage(s.px < s.crow.x ? Street.crowL : Street.crowR, Math.round(s.crow.x - cam - 5), crowY);
  if (s.kid.here) ctx.drawImage(ART.people.kid[s.kid.frame], Math.round(s.kid.x - cam), FEET_Y - 36);
  const img = (s.dir > 0 ? ART.people.officer : ART.people.officerL)[s.frame];
  ctx.drawImage(img, Math.round(s.px - 11 - cam), FEET_Y - 42);

  // lights: windows and porch lamps, plus street lamps once they come on
  const lights = [];
  for (const L of Street.lights) lights.push({ ...L, x: L.x - cam });
  if (G.state.lampsOn) for (const x of STREET.lamps) {
    // the lamp outside Oliver's house can't stay on
    const bad = x === 1010;
    const i = bad ? (Math.random() < 0.12 ? 0.05 : Math.random() < 0.2 ? 0.5 : 1) : 1;
    lights.push({ x: x + 13 - cam, y: 152 - 86, r: 70, i, color: [255, 220, 150], squash: 1.3 });
  }
  if (G.state.flashlight) lights.push({ x: s.px - cam + s.dir * 8, y: FEET_Y - 28, r: 120, i: 1, cone: 0.32, dir: s.dir, color: [255, 245, 220], flicker: 1 });
  if (s.watcher) { const k = STREET.houses.find(h => h.id === 'kidnapper'); lights.push({ x: k.x + k.w - 35 - cam, y: GROUND_Y - 50, r: 24, i: 0.6, color: [160, 220, 120] }); }
  Light.lights = lights;
  // a faint glow around the officer, so you never lose yourself in the dark
  lights.push({ x: s.px - cam, y: FEET_Y - 22, r: 34, i: 0.38, color: [190, 200, 230] });
  Light.ambient = lerp(0.24, 0.85, t);
  Light.draw(G.frame);
  // fog creeping along the ground, catching the moonlight, thicker once it's dark
  ctx.globalAlpha = 0.07 + t * 0.13;
  const fx = -Math.round(cam * 1.1 + G.frame * 0.15) % 640;
  for (const off of [0, 640, 1280]) ctx.drawImage(Street.fog, fx + off - (fx > 0 ? 640 : 0), GROUND_Y - 22);
  ctx.globalAlpha = 1;
  Light.post(G.frame);

  // what pressing A would do here
  const near = !G.busy && nearestThing();
  if (near) {
    const x = Math.round(s.px - cam), y = FEET_Y - 56 + (Math.floor(G.frame / 20) % 2);
    const w = textWidth(near.label) + 18;
    ctx.fillStyle = 'rgba(8,6,14,0.75)'; ctx.fillRect(x - w / 2, y - 2, w, 13);
    ctx.fillStyle = '#c8a050'; ctx.fillRect(x - w / 2 + 1, y - 1, 9, 11); ctx.fillRect(x - w / 2, y, 11, 9);
    drawText(ctx, 'A', x - w / 2 + 3, y, '#1a1208', null);
    drawText(ctx, near.label, x - w / 2 + 14, y, '#e8dcc0', '#000');
  }
}
