// light.js — darkness, pools of light, film grain and a vignette.
// The dark is drawn pixel by pixel with ordered dithering, so the shadows
// get that crunchy, old-PC horror-game look instead of smooth gradients.
'use strict';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);

const Light = {
  ambient: 0.5,                 // 0 = broad daylight, 1 = pitch black
  dark: [10, 8, 22],            // the colour of the dark (deep blue-purple)
  lights: [],                   // { x, y, r, i (0..1), color [r,g,b], flicker }
  _buf: new Float32Array(W * H),
  _tint: new Float32Array(W * H * 3),
  _img: null, _cv: null, _cx: null,

  init() {
    this._cv = document.createElement('canvas'); this._cv.width = W; this._cv.height = H;
    this._cx = this._cv.getContext('2d');
    this._img = this._cx.createImageData(W, H);
    this.grain = [0, 1, 2, 3].map(() => {
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d'), im = x.createImageData(W, H);
      for (let i = 0; i < W * H; i++) {
        const v = Math.random() < 0.5 ? 0 : 255;
        im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v;
        im.data[i * 4 + 3] = Math.random() < 0.35 ? 14 : 0;
      }
      x.putImageData(im, 0, 0);
      return c;
    });
    const v = document.createElement('canvas'); v.width = W; v.height = H;
    const vx = v.getContext('2d'), vim = vx.createImageData(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = (x - W / 2) / (W / 2), dy = (y - H / 2) / (H / 2);
      const d = Math.max(0, Math.sqrt(dx * dx * 0.8 + dy * dy) - 0.45) * 1.55;
      const a = Math.min(1, d * d);
      const i = (y * W + x) * 4;
      vim.data[i] = 4; vim.data[i + 1] = 2; vim.data[i + 2] = 10;
      vim.data[i + 3] = a > BAYER[(y & 3) * 4 + (x & 3)] * 0.9 ? Math.round(a * 200) : 0;
    }
    vx.putImageData(vim, 0, 0);
    this.vignette = v;
  },

  // draw the darkness over whatever's on screen; lights are in screen pixels
  draw(frame) {
    const buf = this._buf, tint = this._tint;
    buf.fill(0); tint.fill(0);
    for (const L of this.lights) {
      let r = L.r, inten = L.i ?? 1;
      if (L.flicker) inten *= 0.85 + 0.15 * Math.sin(frame * 0.7 + L.x) * Math.sin(frame * 0.13 + L.y) + (Math.random() < 0.02 * L.flicker ? -0.5 : 0);
      if (inten <= 0) continue;
      const x0 = Math.max(0, Math.floor(L.x - r)), x1 = Math.min(W - 1, Math.ceil(L.x + r));
      const y0 = Math.max(0, Math.floor(L.y - r * (L.squash || 1))), y1 = Math.min(H - 1, Math.ceil(L.y + r * (L.squash || 1)));
      const col = L.color || [255, 190, 110];
      for (let y = y0; y <= y1; y++) {
        const dy = (y - L.y) / (L.squash || 1);
        for (let x = x0; x <= x1; x++) {
          const dx = x - L.x;
          // optional cone (for a flashlight): only light within `cone` radians of `dir`
          if (L.cone) {
            const ang = Math.atan2(dy, dx * L.dir) ;
            if (Math.abs(ang) > L.cone) continue;
          }
          const d = Math.sqrt(dx * dx + dy * dy) / r;
          if (d >= 1) continue;
          const b = (1 - d) * (1 - d) * inten;
          const i = y * W + x;
          if (b > buf[i]) {
            buf[i] = b;
            tint[i * 3] = col[0]; tint[i * 3 + 1] = col[1]; tint[i * 3 + 2] = col[2];
          }
        }
      }
    }
    const data = this._img.data, amb = this.ambient, [dr, dg, db] = this.dark;
    const steps = 6;
    for (let y = 0; y < H; y++) {
      const by = (y & 3) * 4;
      for (let x = 0; x < W; x++) {
        const i = y * W + x, b = Math.min(1, buf[i]);
        let a = amb * (1 - b);
        a = Math.floor(a * steps + BAYER[by + (x & 3)]) / steps;          // dithered steps
        const tb = Math.floor(b * 4 + BAYER[by + (x & 3)]) / 4;           // warm glow, also dithered
        const o = i * 4;
        if (tb > 0) {
          const k = tb * 0.5;
          data[o] = dr + (tint[i * 3] - dr) * k; data[o + 1] = dg + (tint[i * 3 + 1] - dg) * k; data[o + 2] = db + (tint[i * 3 + 2] - db) * k;
          data[o + 3] = Math.max(a * 255, tb * 34);
        } else {
          data[o] = dr; data[o + 1] = dg; data[o + 2] = db;
          data[o + 3] = a * 255;
        }
      }
    }
    this._cx.putImageData(this._img, 0, 0);
    ctx.drawImage(this._cv, 0, 0);
  },

  glitch: 0,          // frames of screen-tearing left to show
  glitchChance: 0,    // chance per frame of a random glitch (scenes turn this up)
  tint: [212, 222, 204],

  // colour grade, scanlines, flicker, glitches, grain + vignette: drawn last over everything
  post(frame) {
    // drain some colour and push everything toward a sickly green-grey
    ctx.globalCompositeOperation = 'saturation';
    ctx.globalAlpha = 0.26; ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 1; ctx.fillStyle = `rgb(${this.tint.join(',')})`; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    // the picture tears sideways now and then
    if (this.glitch <= 0 && Math.random() < this.glitchChance) this.glitch = rand(3, 8);
    if (this.glitch > 0) {
      this.glitch--;
      for (let i = 0; i < 3; i++) {
        const y = rand(0, H - 12), h = rand(2, 10), dx = rand(-8, 8);
        ctx.drawImage(screen, 0, y, W, h, dx, y, W, h);
      }
      ctx.globalAlpha = 0.08; ctx.fillStyle = '#ff2040'; ctx.fillRect(0, rand(0, H), W, rand(1, 3)); ctx.globalAlpha = 1;
    }
    // old-film flicker
    ctx.globalAlpha = 0.02 + Math.random() * 0.035; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
    ctx.drawImage(this.scanlines, 0, 0);
    ctx.drawImage(this.vignette, 0, 0);
    ctx.drawImage(this.grain[Math.floor(frame / 3) % 4], 0, 0);
  },
};

// faint scanlines, like an old TV
(() => {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,0.11)';
  for (let y = 0; y < H; y += 3) x.fillRect(0, y, W, 1);
  Light.scanlines = c;
})();
