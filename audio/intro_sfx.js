// SFX for PetalPopIntro (no music): a pop per flower (Nas's "POP 3 sfx.MP3", cut into audio/sfx/pop_1..3.wav), a wet wash under the dissolve, a pop per title letter,
// a soft breath as the title leaves and a shimmer under the NAFESA logo. All timed from src/intro/layout.json.
//   node audio/intro_sfx.js   ->  public/intro/sfx.wav
const fs = require('fs');
const path = require('path');
const { SR, Bus, reverb } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const { m } = require('./engine/music');
const L = require('../src/intro/layout.json');

const N = Math.ceil(L.DURATION * SR);
const fx = new Bus(N), verb = new Bus(N);

// 16-bit mono 48 kHz WAV -> Float32Array, optionally resampled to shift pitch (rate > 1 = higher)
function loadWav(file, rate = 1) {
  const b = fs.readFileSync(path.join(__dirname, 'sfx', file));
  const data = b.indexOf('data') + 8;
  const src = new Float32Array((b.length - data) >> 1).map((_, i) => b.readInt16LE(data + i * 2) / 32768);
  return Float32Array.from({ length: Math.floor(src.length / rate) }, (_, i) => src[Math.floor(i * rate)]);
}
const POPS = ['pop_1.wav', 'pop_2.wav', 'pop_3.wav'];

// flowers and the edge frame: Nas's three pops in turn, a little higher on screen = slightly higher pitch,
// panned by x; heroes a touch louder so the busy build still has accents
[...L.flowers, ...L.border].forEach((f, i) => {
  const y = Math.min(1, Math.max(0, 1 - f.y / L.H));
  const pan = Math.max(-0.7, Math.min(0.7, (f.x / L.W - 0.5) * 1.2));
  const pop = loadWav(POPS[i % 3], 0.94 + y * 0.14);
  fx.addMono(pop, f.popAt, f.hero ? 0.55 : 0.38, pan);
  verb.addMono(pop, f.popAt, 0.04);
});

// colorway cuts: a short airy swish into a round "bloop" right on the cut, with a tiny sparkle on top
function bloop(f0 = 260, f1 = 880) {
  const n = Math.round(0.16 * SR), out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = f1 - (f1 - f0) * Math.exp(-t / 0.018); // fast upward glide, like a bubble popping open
    ph += f / SR;
    out[i] = (Math.sin(2 * Math.PI * ph) + 0.25 * Math.sin(4 * Math.PI * ph)) * Math.exp(-t / 0.05) * Math.min(1, t / 0.002);
  }
  return out;
}
L.COLORWAYS.slice(1).forEach((c, i) => {
  fx.addMono(I.noiseSweep(0.22, 1200, 6000, { q: 0.8, pink: true, seed: 60 + i, shape: (x) => Math.pow(x, 2.2) * (1 - Math.pow(x, 8)) }), c.at - 0.2, 0.2, i % 2 ? 0.25 : -0.25);
  const b = bloop(240 + i * 30, 820 + i * 60);
  fx.addMono(b, c.at, 0.55);
  verb.addMono(b, c.at, 0.12);
  fx.addMono(I.ting(m(['C7', 'D7', 'E7', 'G7'][i])), c.at + 0.02, 0.07);
});

// dissolve: a wet, falling wash of filtered noise
const [d0, d1] = L.DISSOLVE;
fx.addMono(I.noiseSweep(d1 - d0 + 0.5, 4500, 450, { q: 0.9, pink: true, seed: 32 }), d0, 0.32, 0.1);
fx.addMono(I.noiseSweep(d1 - d0 + 0.3, 2500, 300, { q: 1.2, pink: true, seed: 33 }), d0 + 0.15, 0.18, -0.15);

// tagline: a soft key tick per typed character
const TICK = I.woodTick(1.6);
L.TAGLINE.text.join('').split('').forEach((ch, i) => {
  if (ch !== ' ') fx.addMono(TICK, L.TAGLINE.at + i * L.TAGLINE.perChar, 0.12 + (i % 3) * 0.03, (i % 5 - 2) * 0.08);
});

// logo: each letter one of Nas's pops, climbing in pitch
L.letters.forEach((l, i) => {
  const pop = loadWav(POPS[i % 3], 1 + i * 0.04);
  fx.addMono(pop, l.at, 0.5, (i - 3.5) * 0.08);
  verb.addMono(pop, l.at, 0.1);
});

// logo motifs: the big flower a deeper pop, the leaf a little flick of air, the tulip a rising swish
// as it grows, the heart a bloop and a sparkle
const LM = L.LOGO_MOTIFS;
const deep = loadWav(POPS[0], 0.82);
fx.addMono(deep, LM.flower, 0.6, -0.3);
verb.addMono(deep, LM.flower, 0.12);
fx.addMono(I.noiseSweep(0.18, 2500, 7000, { q: 1.1, pink: true, seed: 71, shape: (x) => Math.sin(Math.PI * x) }), LM.leaf - 0.08, 0.16, 0.1);
fx.addMono(loadWav(POPS[2], 1.3), LM.leaf + 0.05, 0.3, 0.1);
fx.addMono(I.noiseSweep(0.45, 500, 3200, { q: 0.9, pink: true, seed: 72, shape: (x) => Math.pow(x, 1.5) * (1 - Math.pow(x, 6)) }), LM.tulip, 0.18, 0.4);
fx.addMono(loadWav(POPS[1], 1.12), LM.tulip + 0.35, 0.45, 0.4);
const hb = bloop(300, 1100);
fx.addMono(hb, LM.heart, 0.5, 0.35);
verb.addMono(hb, LM.heart, 0.15);
fx.addMono(I.ting(m('A6')), LM.heart + 0.03, 0.1, 0.35);

// title out: a short airy breath
const [o0, o1] = L.TITLE_OUT;
fx.addMono(I.noiseSweep(o1 - o0 + 0.3, 900, 3800, { q: 0.7, pink: true, seed: 51, shape: (x) => Math.sin(Math.PI * x) }), o0, 0.16);

// logo: a gentle shimmer and one bell as the diamond appears
fx.addMono(I.ting(m('E6')), L.LOGO_AT, 0.16);
fx.addMono(I.ting(m('B6')), L.LOGO_AT + 0.35, 0.12);
const bell = I.bell(1318.5, 0.4, 2.4);
fx.addMono(bell, L.LOGO_AT + 0.05, 0.18);
verb.addMono(bell, L.LOGO_AT + 0.05, 0.25);

const mix = MIX.mixdown({ fx, verb: reverb(verb, { room: 0.8, damp: 0.4 }) }, { fx: 1, verb: 1 });
MIX.highpass(mix, 40);
MIX.fadeOut(mix, L.DURATION - 0.6, L.DURATION);
const M = MIX.master(mix, 0.8, undefined, { lufs: -16 });
MIX.writeWav(path.join(__dirname, '..', 'public', 'intro', 'sfx.wav'), mix);
console.log(`wrote public/intro/sfx.wav (${L.DURATION}s, ${M.lufs.toFixed(1)} LUFS)`);
