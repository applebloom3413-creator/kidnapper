// audio.js — everything you hear, synthesized live: a low drone, wind, a lonely
// music box, crickets, knocks, footsteps. setMood() bends it all creepier.
'use strict';

const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);   // midi number -> Hz

const MOODS = {
  // music box notes are midi numbers; detune is in cents
  calm:   { drone: 0.035, wind: 0.025, box: 0.05, notes: [69, 72, 76, 74, 72, 71, 69, 64, 67, 69], detune: 0, gap: [0.55, 0.8], droneHz: 55 },
  uneasy: { drone: 0.05, wind: 0.03, box: 0.045, notes: [69, 70, 75, 72, 71, 66, 69, 63], detune: -35, gap: [0.7, 1.3], droneHz: 51.9 },
  night:  { drone: 0.045, wind: 0.04, box: 0.03, notes: [57, 60, 64, 63, 60, 59, 57], detune: -15, gap: [1.2, 2.2], droneHz: 49 },
  silent: { drone: 0, wind: 0.02, box: 0, notes: [69], detune: 0, gap: [9, 9], droneHz: 55 },
};

const Audio = {
  ac: null, master: null, mood: 'calm', moodWanted: 'calm', on: true,
  nextNote: 0, melodyI: 0, crickets: false, nextCricket: 0,

  unlock() {
    if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
    try { this.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.on = false; return; }
    const ac = this.ac;
    this.master = ac.createGain(); this.master.gain.value = 0.9; this.master.connect(ac.destination);

    // noise buffer, shared by wind, knocks and footsteps
    const len = ac.sampleRate * 2;
    this.noise = ac.createBuffer(1, len, ac.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    // drone: two detuned saws through a slowly breathing low-pass filter
    this.droneGain = ac.createGain(); this.droneGain.gain.value = 0;
    this.droneFilter = ac.createBiquadFilter(); this.droneFilter.type = 'lowpass'; this.droneFilter.frequency.value = 260; this.droneFilter.Q.value = 6;
    this.droneOsc = [0, 0.6, -7].map(cents => {
      const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 55; o.detune.value = cents;
      o.connect(this.droneFilter); o.start(); return o;
    });
    const lfo = ac.createOscillator(); lfo.frequency.value = 0.07;
    const lfoAmt = ac.createGain(); lfoAmt.gain.value = 140;
    lfo.connect(lfoAmt).connect(this.droneFilter.frequency); lfo.start();
    this.droneFilter.connect(this.droneGain).connect(this.master);

    // wind: filtered noise that swells and fades
    const wind = ac.createBufferSource(); wind.buffer = this.noise; wind.loop = true;
    const wf = ac.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 500; wf.Q.value = 0.7;
    this.windGain = ac.createGain(); this.windGain.gain.value = 0;
    const wlfo = ac.createOscillator(); wlfo.frequency.value = 0.11;
    const wlfoAmt = ac.createGain(); wlfoAmt.gain.value = 250;
    wlfo.connect(wlfoAmt).connect(wf.frequency); wlfo.start();
    wind.connect(wf).connect(this.windGain).connect(this.master); wind.start();

    // music box bus with a little echo
    this.boxGain = ac.createGain(); this.boxGain.gain.value = 0;
    const delay = ac.createDelay(); delay.delayTime.value = 0.33;
    const fb = ac.createGain(); fb.gain.value = 0.32;
    this.boxGain.connect(this.master);
    this.boxGain.connect(delay); delay.connect(fb).connect(delay); delay.connect(this.master);

    this.setMood(this.moodWanted, 0.1);
    this.nextNote = ac.currentTime + 1;
  },

  // go completely quiet whenever the game isn't on screen (app switched away, tab hidden, phone locked)
  pause() { if (this.ac && this.ac.state === 'running') this.ac.suspend(); },
  resume() { if (this.ac && this.ac.state === 'suspended') this.ac.resume(); },

  setMood(name, seconds = 3) {
    this.moodWanted = name;
    if (!this.ac) return;
    const m = MOODS[name], t = this.ac.currentTime;
    this.mood = name;
    const ramp = (param, v) => { param.cancelScheduledValues(t); param.setValueAtTime(param.value, t); param.linearRampToValueAtTime(v, t + seconds); };
    ramp(this.droneGain.gain, m.drone);
    ramp(this.windGain.gain, m.wind);
    ramp(this.boxGain.gain, m.box);
    this.droneOsc.forEach(o => ramp(o.frequency, m.droneHz));
  },

  // called every frame: plays the next music box note when it's due
  update() {
    if (!this.ac) return;
    const t = this.ac.currentTime, m = MOODS[this.mood];
    if (t >= this.nextNote && m.box > 0) {
      const n = m.notes[this.melodyI % m.notes.length];
      this.melodyI += Math.random() < 0.85 ? 1 : 2;
      this.boxNote(NOTE(n + 12), m.detune + (Math.random() - 0.5) * 12, t + 0.02);
      if (Math.random() < 0.25) this.boxNote(NOTE(n), m.detune, t + 0.02, 0.5);
      this.nextNote = t + m.gap[0] + Math.random() * (m.gap[1] - m.gap[0]);
    }
    if (this.crickets && t >= this.nextCricket) {
      for (let i = 0; i < 3; i++) this.tone(4200 + Math.random() * 300, 0.03, 'sine', 0.008, 0, i * 0.06);
      this.nextCricket = t + 0.6 + Math.random() * 1.6;
    }
  },

  boxNote(freq, detune, when, vol = 1) {
    const ac = this.ac;
    const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain();
    o.type = 'triangle'; o.frequency.value = freq; o.detune.value = detune;
    o2.type = 'sine'; o2.frequency.value = freq * 4.02; o2.detune.value = detune;
    const g2 = ac.createGain(); g2.gain.value = 0.18;
    o2.connect(g2).connect(g);
    o.connect(g).connect(this.boxGain);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(0.5 * vol, when + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 1.8);
    o.start(when); o2.start(when); o.stop(when + 1.9); o2.stop(when + 1.9);
  },

  tone(freq, dur, type = 'sine', vol = 0.05, slide = 0, delay = 0) {
    if (!this.ac) return;
    const t = this.ac.currentTime + delay;
    const o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.linearRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t); o.stop(t + dur + 0.05);
  },

  noiseHit(dur, freq, vol, delay = 0, type = 'lowpass') {
    if (!this.ac) return;
    const t = this.ac.currentTime + delay;
    const s = this.ac.createBufferSource(); s.buffer = this.noise;
    const f = this.ac.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = this.ac.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(this.master);
    s.start(t, Math.random()); s.stop(t + dur + 0.05);
  },

  knock(times = 3) {
    for (let i = 0; i < times; i++) {
      this.noiseHit(0.12, 260, 0.5, i * 0.28);
      this.tone(95, 0.12, 'sine', 0.35, -30, i * 0.28);
    }
  },
  step(alt) { this.noiseHit(0.05, alt ? 900 : 700, 0.06); },
  blip(pitch = 1) { this.tone(180 * pitch + Math.random() * 20, 0.035, 'square', 0.012); },
  select() { this.tone(520, 0.06, 'triangle', 0.05); this.tone(780, 0.08, 'triangle', 0.04, 0, 0.05); },
  creak() { this.tone(140, 0.7, 'sawtooth', 0.025, 90); this.noiseHit(0.5, 1800, 0.02, 0, 'bandpass'); },
  // a slow dissonant swell for "something is wrong" moments
  sting() {
    [0, 1, 6].forEach((semi, i) => this.tone(NOTE(45 + semi), 2.2, 'sawtooth', 0.025, -4, i * 0.05));
    this.tone(NOTE(81), 2.5, 'sine', 0.03, -20);
  },
  thud() { this.tone(60, 0.5, 'sine', 0.5, -30); this.noiseHit(0.3, 150, 0.4); },
  heartbeat(vol) {
    this.tone(58, 0.16, 'sine', vol, -18);
    this.tone(52, 0.18, 'sine', vol * 0.8, -16, 0.22);
  },
  caw() {
    for (let i = 0; i < 2; i++) {
      this.tone(720, 0.22, 'sawtooth', 0.03, -260, i * 0.32);
      this.noiseHit(0.2, 1400, 0.05, i * 0.32, 'bandpass');
    }
  },
  doorbell() { this.tone(NOTE(76), 0.9, 'sine', 0.08); this.tone(NOTE(72), 1.2, 'sine', 0.08, 0, 0.45); },
};
