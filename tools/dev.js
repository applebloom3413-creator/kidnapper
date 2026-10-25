// tools/dev.js — test helpers, only loaded with ?dev in the URL.
// Drives the game frame by frame and saves screenshots through serve.js.
window.snap = async (name, s = 3) => {
  const c = document.createElement('canvas'); c.width = 320 * s; c.height = 180 * s;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(screen, 0, 0, c.width, c.height);
  return fetch('/__snap?name=' + name, { method: 'POST', body: c.toDataURL('image/png') }).then(r => r.text());
};
window.step = async (n = 1) => { for (let i = 0; i < n; i++) { tick(); render(); await new Promise(r => setTimeout(r, 0)); } };
window.press = async (b, hold = 2, after = 4) => { Input.down(b); await step(hold); Input.up(b); await step(after); };
window.walkTo = async px => {
  const dir = px > Street.px ? 'right' : 'left';
  Input.down('b'); Input.down(dir);
  for (let i = 0; i < 3000; i++) { await step(1); if (dir === 'right' ? Street.px >= px : Street.px <= px) break; }
  Input.up(dir); Input.up('b'); await step(2);
  return Street.px;
};
// press A through dialogue until the game is idle again (or a choice shows up)
window.advance = async (max = 80) => {
  for (let i = 0; i < max; i++) {
    if (UI.choice) return 'choice';
    if (!G.busy) return 'idle';
    await press('a'); await step(30);
  }
  return 'timeout';
};
