// art.js — pictures drawn in code: the officer, the Lollipop Kid, the street,
// the houses, and the masks (Ozzie's and Jeffery's come from real photos,
// see tools/make_masks.py; the turtle and the party hat are drawn here).
'use strict';

const ART = { people: {}, masks: {}, houses: {}, props: {} };
const INK = '#0c0a14';

// ---------------------------------------------------------------- the officer (side view, facing right)

function officerSprite(frame) {
  const p = new Pix(22, 42);
  const navy = '#27345c', navyLt = '#3a4c80', navyDk = '#1a2240', skin = '#d8a07c', skinDk = '#b07858';
  const swing = [0, 3, 0, -3][frame];
  const bob = frame % 2 ? 1 : 0;
  const thick = (x0, y0, x1, y1, c, w = 3) => { for (let i = 0; i < w; i++) p.line(x0 + i, y0, x1 + i, y1, c); };
  // back arm + back leg (darker, behind the body)
  thick(9, 16 + bob, 9 + swing, 26 + bob, navyDk, 3);
  thick(9, 28, 9 - swing, 38, '#151a2c', 3);
  p.rect(9 - swing, 38, 5, 2, '#08080c');
  // body
  p.rect(7, 15 + bob, 9, 13, navy);
  p.rect(7, 15 + bob, 9, 2, navyLt);
  p.set(13, 18 + bob, '#e8c040').set(13, 19 + bob, '#b08820');
  p.rect(7, 26 + bob, 9, 2, '#101018').set(12, 26 + bob, '#c0a040');
  // front leg
  thick(10, 28, 10 + swing, 38, '#1c2238', 3);
  p.rect(10 + swing, 38, 6, 2, '#08080c');
  // head
  p.rect(10, 13 + bob, 3, 2, skinDk);
  p.ellipse(11.5, 9 + bob, 4.4, 4.8, skin);
  p.rect(7, 7 + bob, 3, 5, '#3a2618');
  p.rect(14, 9 + bob, 1, 1, INK);
  p.set(15, 12 + bob, skinDk);
  // police cap with a little gold badge
  p.rect(7, 3 + bob, 9, 4, navyDk).rect(8, 2 + bob, 7, 1, navyDk);
  p.rect(12, 6 + bob, 6, 1, '#0c0c14');
  p.set(13, 4 + bob, '#e8c040');
  // front arm
  thick(10, 16 + bob, 10 - swing, 26 + bob, navyLt, 3);
  p.set(10 - swing, 27 + bob, skin).set(11 - swing, 27 + bob, skin);
  p.outline(INK);
  return p;
}

// ---------------------------------------------------------------- the Lollipop Kid (party hat, face in shadow)

function partyHatPix(w, h) {
  // based on the real hat: crinkly white cone, red / orange / yellow / blue dots, rainbow pom-pom
  const p = new Pix(w, h);
  const top = Math.round(h * 0.28);
  const big = w >= 30;            // bigger hats get chunkier, more spread-out dots
  p.poly([w / 2 - 1, top, w / 2 + 1, top, w - 1, h - 1, 0, h - 1], '#e8e4dc');
  p.poly([w / 2, top, w - 1, h - 1, w * 0.62, h - 1], '#c8c0b8');               // shaded side
  const dots = ['#e8482c', '#f09030', '#f0d040', '#3a8ce0'];
  const r = seeded(7);
  for (let i = 0; i < w * h / (big ? 40 : 9); i++) {
    const y = top + 2 + Math.floor(r() * (h - top - 4));
    const half = (y - top) / (h - top) * (w / 2);
    const x = Math.round(w / 2 - half + 1 + r() * (half * 2 - 3));
    p.set(x, y, dots[i % 4], ['#e8e4dc', '#c8c0b8']);
    if (big) { p.set(x + 1, y, dots[i % 4], ['#e8e4dc', '#c8c0b8']); p.set(x, y + 1, dots[i % 4], ['#e8e4dc', '#c8c0b8']); p.set(x + 1, y + 1, dots[i % 4], ['#e8e4dc', '#c8c0b8']); }
  }
  if (big) { const rr = seeded(3); for (let i = 0; i < 18; i++) { const y = top + 4 + Math.floor(rr() * (h - top - 6)); const half = (y - top) / (h - top) * (w / 2); p.line(w / 2 - half + 2, y, w / 2 - half + 2 + rr() * half, y + 1, '#d8d2c8', '#e8e4dc'); } }
  // the pom-pom: red on top, yellow in the middle, blue at the bottom, all fluffy
  const pr = Math.max(3, w * 0.22);
  const cy = top - pr * 0.6;
  const yarn = [['#3aa0e8', 0.35], ['#f0d040', -0.15], ['#e84838', -0.6]];
  for (const [col, off] of yarn) p.ellipse(w / 2, cy + off * pr, pr * (off < -0.3 ? 0.75 : 0.95), pr * 0.6, col);
  if (big) {
    const rr = seeded(12);
    for (let i = 0; i < 60; i++) {
      const a = rr() * Math.PI * 2, d = pr * (0.8 + rr() * 0.35);
      const x = w / 2 + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.9;
      const col = y < cy - pr * 0.4 ? '#e84838' : y < cy + pr * 0.1 ? '#f0d040' : '#3aa0e8';
      p.set(x, y, col);
    }
  }
  p.set(Math.round(w / 2 - 1), Math.round(cy - pr * 0.8), '#f8a090');
  return p;
}

function lollipopKidSprite(frame) {
  const p = new Pix(22, 36);
  const hop = [0, -2, -3, -2][frame];
  const shirtA = '#c84048', shirtB = '#f0e0c8';
  p.rect(7, 30 + Math.min(0, hop + 1), 3, 4, '#2c2a40').rect(12, 30 + Math.min(0, hop + 1), 3, 4, '#2c2a40');
  p.rect(6, 34, 4, 2, INK).rect(12, 34, 4, 2, INK);
  for (let y = 0; y < 10; y++) p.rect(6, 20 + y + hop, 10, 1, y % 3 < 2 ? shirtA : shirtB);
  p.ellipse(11, 15 + hop, 5.5, 5.5, '#2a2030');                    // face lost in shadow
  p.line(8, 17 + hop, 10, 18 + hop, '#f0ece0').line(10, 18 + hop, 13, 18 + hop, '#f0ece0').line(13, 18 + hop, 15, 16 + hop, '#f0ece0');
  p.set(9, 14 + hop, '#f0ece0').set(13, 14 + hop, '#f0ece0');      // two pinprick eyes
  // arm holding the lollipop up
  p.line(16, 22 + hop, 18, 16 + hop, shirtA).line(17, 22 + hop, 19, 16 + hop, shirtA);
  p.line(19, 15 + hop, 19, 8 + hop, '#e8e0d0');
  p.ellipse(19.5, 6 + hop, 3, 3, '#e84868');
  p.set(19, 5 + hop, '#f8f0f0').set(20, 7 + hop, '#f8f0f0').set(18, 7 + hop, '#a02040');
  p.paste(partyHatPix(10, 14), 6, -4 + hop + 4);
  p.outline(INK);
  return p;
}

// ---------------------------------------------------------------- the turtle mask (the Kidnapper)

function turtleMaskPix() {
  // a snapping-turtle face: sickly olive, warty, mismatched eye holes, a stitched-on grin
  const p = new Pix(64, 70);
  const skin = '#5d6640', light = '#7a8052', dark = '#3a4024', grime = '#2a2e16', line = '#14180a';
  const beak = '#a89c68', beakDk = '#6a5e34', stitch = '#cfc6a0';
  const SK = [skin, light, dark];
  p.ellipse(32, 29, 25, 27, skin);
  p.ellipse(32, 50, 19, 15, skin);
  p.ellipse(26, 17, 13, 8, light, skin);
  p.ellipse(32, 58, 18, 8, dark, SK);
  // warty bumps all over
  const r = seeded(31);
  for (let i = 0; i < 70; i++) {
    const x = 8 + Math.floor(r() * 48), y = 4 + Math.floor(r() * 60);
    p.set(x, y, r() < 0.5 ? dark : light, SK);
    if (r() < 0.4) p.set(x + 1, y, grime, SK);
  }
  // plates across the forehead, like the top of a shell
  const scute = (cx, cy, rx, ry) => {
    for (let a = 0; a < 6; a++) {
      const a0 = a * Math.PI / 3, a1 = (a + 1) * Math.PI / 3;
      p.line(cx + Math.cos(a0) * rx, cy + Math.sin(a0) * ry, cx + Math.cos(a1) * rx, cy + Math.sin(a1) * ry, line, true);
    }
  };
  scute(32, 10, 7, 5); scute(20, 15, 6, 5); scute(44, 15, 6, 5);
  // heavy, angry brow ridges
  p.poly([9, 22, 28, 27, 27, 30, 10, 26], dark);
  p.poly([55, 22, 36, 27, 37, 30, 54, 26], dark);
  // mismatched eye holes. Only one of them has anything looking out.
  p.ellipse(19, 33, 7.5, 8.5, '#030205');
  p.ellipse(45, 34, 5.5, 6.5, '#030205');
  p.set(46, 34, '#e8f4c8').set(46, 35, '#9aa880');
  // dark streaks running down from the eyes
  p.line(15, 41, 14, 50, grime, SK).line(21, 42, 21, 47, grime, SK).line(45, 40, 46, 46, grime, SK);
  // the hooked beak, chipped
  p.poly([25, 37, 39, 37, 37, 47, 32, 55, 27, 47], beak);
  p.poly([32, 41, 37, 47, 32, 55], beakDk);
  p.set(28, 39, line).set(36, 39, line);
  p.line(33, 43, 35, 46, beakDk).set(26, 38, null);
  // a grin sewn on far too wide, with little stitches across it
  const grin = x => Math.round(50 + Math.sin((x - 7) / 50 * Math.PI) * 6);
  for (let x = 7; x <= 57; x++) if (x < 27 || x > 37) p.set(x, grin(x), line, SK);
  for (let x = 9; x <= 55; x += 4) if (x < 26 || x > 38) { p.set(x, grin(x) - 1, stitch, SK); p.set(x, grin(x) + 1, stitch, SK); }
  p.outline('#080a04');
  return p;
}

// ---------------------------------------------------------------- dark figures for conversations

// a big shadowy figure standing in a doorway. kind: 'ozzie' | 'jeffery' | 'kidnapper'
function silhouettePix(kind) {
  const p = new Pix(150, 150);
  const body = '#08060e', rim = '#3c3454';
  if (kind === 'kidnapper') {
    p.ellipse(75, 150, 62, 82, body);                 // broad, tall
    p.rect(40, 92, 70, 60, body);
    p.poly([55, 96, 95, 96, 100, 150, 50, 150], '#14121c');  // an apron
    p.line(57, 96, 52, 150, '#221e30').line(93, 96, 98, 150, '#221e30');
  } else if (kind === 'jeffery') {
    p.ellipse(75, 150, 44, 74, body);                 // thin and hunched
    p.rect(50, 100, 50, 50, body);
    p.poly([31, 112, 52, 92, 56, 150, 33, 150], body);
    p.poly([119, 112, 98, 92, 94, 150, 117, 150], body);
  } else {
    p.ellipse(75, 150, 52, 70, body);                 // soft and round, a fuzzy cardigan
    p.rect(44, 100, 62, 50, body);
    for (let i = 0; i < 14; i++) p.set(30 + i * 7, 100 + (i % 3), body);
  }
  p.rect(64, 70, 22, 30, body);                       // neck
  // faint rim of light from the porch lamp up and to the left
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
    if (p.get(x, y) && !p.get(x - 1, y) && !p.get(x - 1, y - 1)) p.set(x, y, rim);
  }
  return p;
}

// ---------------------------------------------------------------- the street

const GROUND_Y = 146;      // where the houses sit
const FEET_Y = 160;        // where people walk on the sidewalk

// houses: walls, roof, a door and windows. Returns the picture plus where its lights are.
function housePix(o) {
  const w = o.w || 140, h = o.h || 116;
  const p = new Pix(w, h + 8);
  const lights = [];
  const wallDk = shade(o.wall, -0.25), roofDk = shade(o.roof, -0.35);
  // chimney
  if (o.chimney) p.rect(w - 38, 4, 10, 26, shade(o.wall, -0.45)).rect(w - 39, 3, 12, 3, '#201c24');
  // walls with siding lines
  p.rect(8, 40, w - 16, h - 40, o.wall);
  for (let y = 44; y < h; y += 4) p.rect(8, y, w - 16, 1, wallDk);
  if (o.peeling) { const r = seeded(5); for (let i = 0; i < 40; i++) p.rect(10 + Math.floor(r() * (w - 22)), 42 + Math.floor(r() * (h - 44)), rand(2, 5), 1, shade(o.wall, 0.25)); }
  // water stains running down from the roof, and dirt splashed up from the ground.
  // (Oliver's house is the only one on the street that's spotless.)
  if (!o.clean) {
    const g = seeded(w * 7 + o.wall.charCodeAt(2));
    for (let i = 0; i < 16; i++) {
      const x = 10 + Math.floor(g() * (w - 20)), len = 6 + Math.floor(g() * 34);
      p.line(x, 44, x + (g() < 0.3 ? 1 : 0), 44 + len, shade(o.wall, -0.3));
      if (g() < 0.5) p.line(x + 1, 44, x + 1, 44 + len * 0.5, shade(o.wall, -0.18));
    }
    for (let x = 8; x < w - 8; x++) { const hg = 2 + Math.floor(g() * 7); p.rect(x, h - hg, 1, hg, shade(o.wall, -0.42)); }
  }
  // roof
  const sag = o.sag ? 4 : 0;
  p.poly([0, 44, 18, 8 + sag, w / 2, 6 + sag * 1.5, w - 18, 8, w, 44], o.roof);
  for (let y = 14; y < 44; y += 5) p.line(4, y + 2, w - 4, y, roofDk);
  p.rect(0, 42, w, 3, roofDk);
  if (o.missingShingles) { const r = seeded(9); for (let i = 0; i < 8; i++) p.rect(20 + Math.floor(r() * (w - 50)), 14 + Math.floor(r() * 24), 5, 3, '#141018'); }
  // door + steps
  const dx = o.doorX ?? Math.floor(w / 2);
  p.rect(dx - 11, h - 40, 22, 38, shade(o.wall, -0.5));
  p.rect(dx - 9, h - 38, 18, 36, o.door);
  p.rect(dx - 7, h - 35, 6, 12, shade(o.door, -0.25)).rect(dx + 1, h - 35, 6, 12, shade(o.door, -0.25));
  p.rect(dx - 7, h - 20, 14, 14, shade(o.door, -0.25));
  p.set(dx + 6, h - 20, '#d8c070');
  p.rect(dx - 15, h - 2, 30, 3, '#5a5660').rect(dx - 13, h + 1, 26, 3, '#48444e');
  // windows, either side of the door
  for (const wx of [24, w - 46]) {
    p.rect(wx - 2, 54, 26, 24, '#d8d0c4');
    const glass = o.windows === 'lit' ? '#f0c060' : o.windows === 'curtains' ? '#3a2830' : '#1c2030';
    p.rect(wx, 56, 22, 20, glass);
    if (o.windows === 'lit') { p.rect(wx, 56, 22, 3, '#f8e0a0'); lights.push({ x: wx + 11, y: 66, r: 30, i: 0.65 }); }
    if (o.windows === 'curtains') { p.rect(wx, 56, 10, 20, '#5a3038').rect(wx + 12, 56, 10, 20, '#5a3038'); }
    p.rect(wx + 10, 56, 2, 20, '#d8d0c4').rect(wx, 65, 22, 2, '#d8d0c4');
    if (o.flowers) { p.rect(wx - 2, 78, 26, 4, '#6a4430'); for (let i = 0; i < 6; i++) p.set(wx + 1 + i * 4, 77, i % 2 ? '#f088b0' : '#f8c0d8').set(wx + 2 + i * 4, 77, '#58904a'); }
  }
  // porch lamp
  if (o.lamp !== false) {
    p.rect(dx + 14, h - 36, 4, 6, '#2a2630').rect(dx + 15, h - 35, 2, 4, o.lamp === 'off' ? '#3a3640' : '#f8e090');
    if (o.lamp !== 'off') lights.push({ x: dx + 16, y: h - 33, r: 46, i: 0.9, flicker: o.lamp === 'flicker' ? 3 : 0 });
  }
  // a basement window peeking out at ground level
  if (o.basement) { p.rect(w - 44, h - 8, 16, 7, '#d0c8bc').rect(w - 43, h - 7, 14, 5, '#0a0a10').set(w - 40, h - 5, '#3a3020'); }
  p.outline('#0c0a12');
  return { pix: p, lights, doorX: dx, w, h };
}

function streetLampPix() {
  const p = new Pix(26, 96);
  p.rect(4, 6, 3, 90, '#2a2a34').rect(3, 92, 5, 4, '#1c1c24');
  p.line(5, 6, 14, 2, '#2a2a34').line(5, 7, 14, 3, '#2a2a34');
  p.rect(12, 2, 10, 4, '#34343e').rect(13, 6, 8, 2, '#d8d0a8');
  p.outline('#08080c');
  return p;
}

function powerPolePix() {
  const p = new Pix(30, 120);
  p.rect(13, 0, 4, 120, '#3a2c24').rect(13, 0, 1, 120, '#4a3a30');
  p.rect(1, 10, 28, 3, '#3a2c24');
  for (const x of [3, 14, 25]) p.rect(x, 7, 2, 3, '#7a8890');
  p.outline('#0a0808');
  return p;
}

function mailboxPix(overflowing) {
  const p = new Pix(18, 34);
  p.rect(8, 12, 3, 22, '#3a3030');
  p.ellipse(9, 9, 8, 5, '#4a5058').rect(1, 9, 16, 6, '#4a5058');
  p.rect(16, 3, 2, 6, '#c03030');
  if (overflowing) {
    p.rect(0, 5, 6, 3, '#e8e0d0').rect(1, 3, 5, 2, '#d8d0b8').rect(13, 13, 5, 3, '#e8e0d0');
    p.rect(2, 30, 7, 3, '#d8d0c0').rect(10, 31, 6, 2, '#c8c0b0');      // letters that fell on the ground
  }
  p.outline('#0a0808');
  return p;
}

function turtleStatuePix() {
  const p = new Pix(24, 16);
  p.ellipse(12, 10, 10, 6, '#4a6230').ellipse(11, 8, 7, 4, '#5e7a3c');
  p.line(6, 8, 10, 6, '#2a3818').line(12, 5, 16, 8, '#2a3818');
  p.ellipse(21, 11, 3, 2.5, '#6a8044').set(22, 10, '#050505');
  p.rect(4, 14, 3, 2, '#4a6230').rect(16, 14, 3, 2, '#4a6230');
  p.outline('#0a0c06');
  return p;
}

function piePix() {
  const p = new Pix(14, 6);
  p.ellipse(7, 3, 7, 3, '#c89048').ellipse(7, 2.5, 5.5, 2, '#e0b060');
  p.line(3, 2, 11, 3, '#a87030').line(4, 3, 10, 2, '#a87030');
  p.rect(0, 4, 14, 2, '#8a8c98');
  return p;
}

function weedsPix(w) {
  const p = new Pix(w, 22);
  const r = seeded(w);
  for (let i = 0; i < w * 0.8; i++) {
    const x = Math.floor(r() * w), hgt = 6 + Math.floor(r() * 15);
    p.line(x, 21, x + Math.round((r() - 0.5) * 4), 21 - hgt, r() < 0.5 ? '#3a4a2a' : '#4c5c30');
  }
  return p;
}

function hedgePix(w) {
  const p = new Pix(w, 18);
  for (let x = 4; x < w; x += 8) p.ellipse(x, 10, 6, 8, '#2e5028');
  p.rect(0, 10, w, 8, '#2e5028');
  for (let x = 2; x < w; x += 5) p.set(x, 4 + (x % 3), '#44703a');
  p.outline('#0a140a');
  return p;
}

function treeSilhouettePix(seed, h) {
  const p = new Pix(70, h);
  const r = seeded(seed);
  p.rect(32, h - 30, 6, 30, '#120e1e');
  for (let i = 0; i < 9; i++) p.ellipse(35 + (r() - 0.5) * 40, h - 34 - r() * (h - 50), 12 + r() * 12, 10 + r() * 10, '#120e1e');
  return p;
}

// ---------------------------------------------------------------- build it all

async function buildArt() {
  ART.people.officer = [0, 1, 2, 3].map(f => officerSprite(f));
  ART.people.officerL = ART.people.officer.map(p => p.flipX().canvas());
  ART.people.officer = ART.people.officer.map(p => p.canvas());
  ART.people.kid = [0, 1, 2, 3].map(f => lollipopKidSprite(f).canvas());

  const [ozzie, jeffery] = await Promise.all([loadImage('art/ozzie.png'), loadImage('art/jeffery.png')]);
  ART.masks.ozzie = ozzie;
  ART.masks.jeffery = jeffery;
  ART.masks.kidnapper = turtleMaskPix().canvas();
  ART.masks.partyhat = partyHatPix(48, 70).canvas();
  for (const k of ['ozzie', 'jeffery', 'kidnapper']) ART.people['sil_' + k] = silhouettePix(k).canvas();

  ART.props.lamp = streetLampPix().canvas();
  ART.props.pole = powerPolePix().canvas();
  ART.props.mailbox = mailboxPix(false).canvas();
  ART.props.mailboxFull = mailboxPix(true).canvas();
  ART.props.turtle = turtleStatuePix().canvas();
  ART.props.pie = piePix().canvas();
  ART.props.trees = [1, 2, 3, 4].map(s => treeSilhouettePix(s, 70 + s * 8).canvas());
}
