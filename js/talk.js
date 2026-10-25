// talk.js — conversations. The camera cuts to the doorway: a dark figure,
// a mask catching the porch light, and the gold-trimmed text box below.
'use strict';

const SPEAKERS = {
  you:       { name: 'YOU',            color: '#9fb4d8', pitch: 1.0 },
  ozzie:     { name: 'OZZIE',          color: '#f0a8c8', pitch: 1.5 },
  jeffery:   { name: 'JEFFERY',        color: '#f0d468', pitch: 1.2 },
  kidnapper: { name: 'OLIVER',         color: '#8ccc6a', pitch: 0.6 },
  kid:       { name: 'LOLLIPOP KID',   color: '#e8708c', pitch: 1.9 },
  nobody:    { name: '...',            color: '#6a6478', pitch: 0.8 },
};

const UI = { box: null, choice: null };

// ---------------------------------------------------------------- the text box

function wrap(text) { return wrapText(text, 290); }

// say(who, text): types it out, waits for A. Thoughts from 'you' show in parentheses.
async function say(who, text, opts = {}) {
  const sp = SPEAKERS[who];
  const lines = wrap(text);
  const box = { who, lines: [], arrow: false };
  UI.box = box;
  for (let page = 0; page < lines.length; page += 3) {
    const pl = lines.slice(page, page + 3);
    box.lines = pl.map(() => '');
    box.arrow = false;
    let skip = false;
    for (let li = 0; li < pl.length; li++) {
      for (let ci = 0; ci < pl[li].length; ci++) {
        box.lines[li] = pl[li].slice(0, ci + 1);
        const ch = pl[li][ci];
        if (!skip) {
          if (ci % 2 === 0 && ch !== ' ') Audio.blip(sp.pitch);
          await nextFrame();
          // a beat on the dots...
          if ('.?!'.includes(ch) && pl[li][ci + 1] !== '.' && !skip) await wait(ch === '.' && pl[li][ci - 1] === '.' ? 8 : 4);
          if (Input.pressed.a || Input.pressed.b) skip = true;
        }
      }
      box.lines[li] = pl[li];
    }
    if (opts.noWait && page + 3 >= lines.length) return;
    box.arrow = true;
    await waitPress('a', 'b');
    Audio.blip(1.4);
  }
  if (!opts.keep) UI.box = null;
}

// pick from a short list. Returns the index.
async function choose(options) {
  const c = { options, i: 0 };
  UI.choice = c;
  for (;;) {
    await nextFrame();
    const p = Input.pressed;
    if (p.up) { c.i = (c.i + options.length - 1) % options.length; Audio.blip(1.3); }
    if (p.down) { c.i = (c.i + 1) % options.length; Audio.blip(1.3); }
    if (p.a) { Audio.select(); break; }
  }
  UI.choice = null;
  UI.box = null;
  return c.i;
}

const GOLD = '#c8a050', GOLD_DK = '#6a5228', GOLD_LT = '#f0d898';

function drawGoldLine(y) {
  ctx.fillStyle = GOLD_DK; ctx.fillRect(10, y + 1, W - 20, 1);
  ctx.fillStyle = GOLD; ctx.fillRect(10, y, W - 20, 1);
  // little diamonds at the ends and a star in the middle, like a fancy visual novel
  for (const x of [8, W - 9]) { ctx.fillStyle = GOLD; ctx.fillRect(x, y - 1, 1, 3); ctx.fillRect(x - 1, y, 3, 1); }
  const cx = W / 2;
  ctx.fillStyle = GOLD_LT;
  ctx.fillRect(cx - 1, y - 4, 3, 9); ctx.fillRect(cx - 4, y - 1, 9, 3); ctx.fillRect(cx - 2, y - 2, 5, 5);
  ctx.fillStyle = GOLD; ctx.fillRect(cx, y - 5, 1, 11); ctx.fillRect(cx - 5, y, 11, 1);
}

function drawUI() {
  const box = UI.box, ch = UI.choice;
  if (!box && !ch) return;
  // dark see-through panel
  ctx.fillStyle = 'rgba(6,4,12,0.82)';
  ctx.fillRect(0, 124, W, 56);
  ctx.fillStyle = 'rgba(6,4,12,0.45)';
  ctx.fillRect(0, 120, W, 4);
  drawGoldLine(130);
  if (ch) {
    ch.options.forEach((o, i) => {
      const y = 137 + i * 13;
      drawText(ctx, o, 26, y, i === ch.i ? '#f0e4c8' : '#8a8298', '#000');
      if (i === ch.i) { ctx.fillStyle = GOLD; for (let k = 0; k < 4; k++) ctx.fillRect(16 + k, y + 1 + k, 1, 7 - k * 2); }
    });
    return;
  }
  const sp = SPEAKERS[box.who];
  drawText(ctx, sp.name, 14, 118, sp.color, '#000');
  const thought = box.who === 'you';
  // Oliver's words don't sit still
  const twitchy = box.who === 'kidnapper';
  box.lines.forEach((l, i) => {
    const jx = twitchy && Math.random() < 0.06 ? rand(-1, 1) : 0, jy = twitchy && Math.random() < 0.04 ? rand(-1, 1) : 0;
    drawText(ctx, l, 14 + jx, 138 + i * 13 + jy, thought ? '#aeb8cc' : twitchy ? '#e2ecd8' : '#ece6f4', '#000');
  });
  if (box.arrow && Math.floor(G.frame / 18) % 2 === 0) {
    ctx.fillStyle = GOLD_LT;
    for (let i = 0; i < 4; i++) ctx.fillRect(W - 20 + i, 170 + i, 7 - i * 2, 1);
  }
}

// ---------------------------------------------------------------- the doorway scene

const Talk = { kind: null, show: 0, door: 0, sweat: [], twitch: 0, house: null, closed: false };

// the porch behind the person you're talking to
function drawPorch(house) {
  const hs = STREET.houses.find(h => h.id === house);
  const wall = shade(hs.wall, -0.15);
  ctx.fillStyle = wall; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = shade(hs.wall, -0.35);
  for (let y = 2; y < H; y += 7) ctx.fillRect(0, y, W, 1);
  // door frame + the dark inside of the house
  ctx.fillStyle = '#2a2026'; ctx.fillRect(98, 8, 124, H);
  ctx.fillStyle = shade(hs.wall, 0.15); ctx.fillRect(102, 12, 116, H);
  const open = Talk.door;
  // the hallway behind them, dimly lit so whoever's in the doorway is a dark shape against it
  ctx.fillStyle = house === 'kidnapper' ? '#4a3418' : house === 'home' ? '#141018' : '#2e2634';
  ctx.fillRect(106, 16, 108, H);
  ctx.fillStyle = house === 'kidnapper' ? '#5a4020' : '#3a3040';
  ctx.fillRect(130, 30, 60, 80);
  if (house === 'kidnapper') {      // warm light and something cooking, deep inside
    ctx.fillStyle = '#3a2c14'; ctx.fillRect(150, 40, 30, 60);
  }
  // the door itself swings open
  const dw = Math.round(108 * (1 - open));
  if (dw > 0) {
    ctx.fillStyle = hs.door; ctx.fillRect(106, 16, dw, H);
    ctx.fillStyle = shade(hs.door, -0.25);
    ctx.fillRect(112, 24, Math.max(0, dw - 14), 50); ctx.fillRect(112, 84, Math.max(0, dw - 14), 70);
    ctx.fillStyle = '#d8c070'; ctx.fillRect(106 + dw - 10, 100, 3, 3);
  }
  // porch lamp up on the left
  ctx.fillStyle = '#1a1820'; ctx.fillRect(66, 40, 14, 22); ctx.fillRect(71, 34, 4, 6);
  ctx.fillStyle = hs.lamp === 'off' ? '#3a3440' : '#f8e0a0'; ctx.fillRect(68, 44, 10, 14);
  // porch floorboards
  ctx.fillStyle = '#2c2420'; ctx.fillRect(0, 168, W, 12);
  ctx.fillStyle = '#20181a'; for (let x = 0; x < W; x += 22) ctx.fillRect(x, 168, 1, 12);
}

// the Lollipop Kid, up close, out on the sidewalk at dusk
function drawKidCloseup() {
  drawSky(G.state.time);
  ctx.fillStyle = '#16121e'; ctx.fillRect(0, 120, W, 60);
  ctx.drawImage(Street.far, -40, 30);
  if (Talk.show <= 0) return;
  const bob = Math.round(Math.sin(G.frame / 12) * 2);
  const x = 160, top = 70 + bob + Math.round((1 - Talk.show) * 20);
  // small body in a striped shirt, face lost in shadow under the hat
  for (let y = 0; y < 60; y++) { ctx.fillStyle = y % 9 < 6 ? '#3a1a22' : '#4a3a36'; ctx.fillRect(x - 26, top + 46 + y, 52, 1); }
  ctx.fillStyle = '#0c0a12'; ctx.beginPath(); ctx.ellipse(x, top + 28, 22, 22, 0, 0, Math.PI * 2); ctx.fill();
  // the lollipop
  ctx.fillStyle = '#e8e0d0'; ctx.fillRect(x + 36, top + 20, 2, 50);
  ctx.fillStyle = '#e84868'; ctx.beginPath(); ctx.arc(x + 37, top + 14, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f8e8ec'; ctx.fillRect(x + 33, top + 11, 3, 2); ctx.fillRect(x + 38, top + 16, 3, 2);
}

function drawTalk() {
  const k = Talk.kind, house = Talk.house;
  const lights = [];
  if (house === 'street') {
    drawKidCloseup();
    lights.push({ x: 60, y: 30, r: 260, i: 0.8, color: [255, 180, 140] });
  } else {
    drawPorch(house);
    const hs = STREET.houses.find(h => h.id === house);
    if (hs.lamp !== 'off') lights.push({ x: 73, y: 50, r: 150, i: 1, flicker: hs.lamp === 'flicker' ? 4 : 0 });
    else lights.push({ x: 300, y: 0, r: 230, i: 0.35, color: [150, 160, 220] });
    if (house === 'kidnapper') lights.push({ x: 165, y: 70, r: 90, i: 0.75, color: [255, 160, 80] });
    else if (house !== 'home' && house !== 'oldman') lights.push({ x: 160, y: 70, r: 80, i: 0.5, color: [200, 170, 220] });
    if (house === 'home' && G.state.flags.pie) {
      ctx.drawImage(ART.props.pie, 132, 150, 56, 24);
      ctx.fillStyle = '#e8e0cc'; ctx.fillRect(176, 146, 14, 9); ctx.fillStyle = '#806050'; ctx.fillRect(178, 149, 9, 1); ctx.fillRect(178, 151, 6, 1);
      lights.push({ x: 160, y: 160, r: 60, i: 0.6 });
    }
  }

  if (k && Talk.show > 0) {
    const rise = Math.round((1 - Talk.show) * 20);
    const sway = Math.round(Math.sin(G.frame / 40) * 1);
    const sil = ART.people['sil_' + k];
    ctx.globalAlpha = Talk.show;
    if (sil) ctx.drawImage(sil, 85 + sway, 10 + rise);
    ctx.globalAlpha = 1;
  }
  Light.lights = lights;
  Light.ambient = house === 'kidnapper' ? 0.62 : 0.7;
  Light.draw(G.frame);

  // the masks are drawn after the darkness, so they glow out of the shadows
  if (k && Talk.show > 0) {
    const rise = Math.round((1 - Talk.show) * 20);
    const sway = Math.round(Math.sin(G.frame / 40) * 1);
    ctx.globalAlpha = Talk.show;
    if (k === 'ozzie') ctx.drawImage(ART.masks.ozzie, 124 + sway, 30 + rise);
    if (k === 'jeffery') {
      const tw = Talk.twitch > 0 ? (Talk.twitch % 4 < 2 ? -1 : 1) : 0;
      ctx.drawImage(ART.masks.jeffery, 113 + sway + tw, 22 + rise);
      Talk.sweat.forEach(s => { ctx.fillStyle = '#a8d0f0'; ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 2); });
    }
    if (k === 'kidnapper') ctx.drawImage(ART.masks.kidnapper, 128 + sway, 38 + rise);
    if (k === 'kid') {
      const bob = Math.round(Math.sin(G.frame / 12) * 2);
      const top = 70 + bob + rise;
      ctx.drawImage(ART.masks.partyhat, 160 - 24, top - 60);
      // two pinprick eyes and a grin that's a little too big
      ctx.fillStyle = '#f0ece0';
      ctx.fillRect(151, top + 24, 2, 2); ctx.fillRect(167, top + 24, 2, 2);
      for (let i = 0; i < 22; i++) ctx.fillRect(149 + i, top + 33 + Math.round(Math.sin(i / 21 * Math.PI) * 4), 1, 1);
    }
    ctx.globalAlpha = 1;
  }
  if (Talk.twitch > 0) Talk.twitch--;
  Talk.sweat = Talk.sweat.filter(s => (s.y += 0.35) < 70);
  Light.post(G.frame);
}

// cut to a doorway conversation
async function openTalk(house, kind, opts = {}) {
  Object.assign(Talk, { house, kind: null, show: 0, door: 0, sweat: [], twitch: 0 });
  Light.glitchChance = kind === 'kidnapper' ? 0.012 : 0.001;
  await fadeOut(18);
  G.scene = 'talk';
  await fadeIn(18);
  if (opts.closed) return;
  if (!opts.noKnock) { Audio.knock(3); await wait(70); }
  Audio.creak();
  for (let i = 1; i <= 24; i++) { Talk.door = i / 24; await nextFrame(); }
  Talk.kind = kind;
  for (let i = 1; i <= 30; i++) { Talk.show = i / 30; await nextFrame(); }
}

async function closeTalk() {
  for (let i = 30; i >= 0; i--) { Talk.show = i / 30; await nextFrame(); }
  Talk.kind = null;
  for (let i = 24; i >= 0; i--) { Talk.door = i / 24; await nextFrame(); }
  Audio.thud();
  await wait(20);
  await fadeOut(18);
  G.scene = 'street';
  await fadeIn(18);
}

function sweatDrop() { Talk.sweat.push({ x: 130 + Math.random() * 60, y: 40 + Math.random() * 10 }); }
