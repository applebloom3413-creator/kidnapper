// core.js — the frame loop helpers, buttons, saving and small utilities.
// Story scripts are async functions: `await talk(...)`, `await wait(30)`.
'use strict';

const W = 320, H = 180;
const screen = document.createElement('canvas');
screen.width = W; screen.height = H;
const ctx = screen.getContext('2d');
ctx.imageSmoothingEnabled = false;

// ---------------------------------------------------------------- input

const BUTTONS = ['up', 'down', 'left', 'right', 'a', 'b', 'start'];
const Input = {
  held: {}, pressed: {}, _raw: {}, _hits: {}, _pad: {},
  poll() {
    const pad = readGamepad();
    for (const b of BUTTONS) {
      if (pad[b] && !this._pad[b]) { this._hits[b] = true; Audio.unlock(); }
      this.pressed[b] = !!this._hits[b];
      this.held[b] = !!this._raw[b] || !!pad[b];
      this._hits[b] = false;
    }
    this._pad = pad;
  },
  down(b) { if (!this._raw[b]) this._hits[b] = true; this._raw[b] = true; Audio.unlock(); },
  up(b) { this._raw[b] = false; },
};

const KEYMAP = {
  // the on-screen prompts say "A" and "B", so the A and B keys do exactly that
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  KeyA: 'a', KeyZ: 'a', Space: 'a', KeyE: 'a',
  KeyB: 'b', KeyX: 'b', ShiftLeft: 'b', ShiftRight: 'b', Backspace: 'b', Escape: 'b',
  Enter: 'start',
};
// game controllers (a PS5 DualSense, Xbox pad, etc. connected over Bluetooth or USB).
// Standard layout: 0 = Cross/A, 1 = Circle/B, 9 = Options/Start, 12-15 = D-pad.
function readGamepad() {
  const out = {};
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const gp of pads) {
    if (!gp) continue;
    const btn = i => gp.buttons[i] && gp.buttons[i].pressed;
    const ax = gp.axes || [];
    out.a = out.a || btn(0);
    out.b = out.b || btn(1) || btn(2);
    out.start = out.start || btn(9);
    out.up = out.up || btn(12) || ax[1] < -0.5;
    out.down = out.down || btn(13) || ax[1] > 0.5;
    out.left = out.left || btn(14) || ax[0] < -0.5;
    out.right = out.right || btn(15) || ax[0] > 0.5;
  }
  return out;
}

addEventListener('keydown', e => { const b = KEYMAP[e.code]; if (b) { Input.down(b); e.preventDefault(); } });
addEventListener('keyup', e => { const b = KEYMAP[e.code]; if (b) { Input.up(b); e.preventDefault(); } });

// ---------------------------------------------------------------- frame-based async helpers

let frameWaiters = [];
const nextFrame = () => new Promise(r => frameWaiters.push(r));
async function wait(frames) { for (let i = 0; i < frames; i++) await nextFrame(); }
async function waitPress(...btns) {
  if (!btns.length) btns = ['a', 'b'];
  for (;;) {
    await nextFrame();
    for (const b of btns) if (Input.pressed[b]) return b;
  }
}

// ---------------------------------------------------------------- fades

const Fade = { amount: 0, color: '#000' };
async function fadeOut(frames = 30, color = '#000') {
  Fade.color = color;
  for (let i = 1; i <= frames; i++) { Fade.amount = i / frames; await nextFrame(); }
}
async function fadeIn(frames = 30) {
  for (let i = frames - 1; i >= 0; i--) { Fade.amount = i / frames; await nextFrame(); }
}

// ---------------------------------------------------------------- saving

const SAVE_KEY = 'kidnapper-save-v1';
function saveGame() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.state)); return true; } catch (e) { return false; }
}
function loadSave() {
  try { const raw = localStorage.getItem(SAVE_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}

// ---------------------------------------------------------------- helpers

const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

// text in a given colour with a dark drop shadow, which reads well over dark scenes
function drawLabel(str, x, y, color = '#e8e4f0', shadow = '#0a0810') {
  return drawText(ctx, str, x, y, color, shadow);
}
