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

// colorway changes: Nas's whole three-pop clip on each recolour, so the print goes pop-pop-pop into its new colours
const POP3 = loadWav('pop3.wav');
L.COLORWAYS.slice(1).forEach((c) => {
  fx.addMono(POP3, c.at, 0.6);
  verb.addMono(POP3, c.at, 0.06);
});

// dissolve: a wet, falling wash of filtered noise
const [d0, d1] = L.DISSOLVE;
fx.addMono(I.noiseSweep(d1 - d0 + 0.5, 4500, 450, { q: 0.9, pink: true, seed: 32 }), d0, 0.32, 0.1);
fx.addMono(I.noiseSweep(d1 - d0 + 0.3, 2500, 300, { q: 1.2, pink: true, seed: 33 }), d0 + 0.15, 0.18, -0.15);

// title: each letter one of Nas's pops, climbing in pitch
L.letters.forEach((l, i) => {
  const pop = loadWav(POPS[i % 3], 1 + i * 0.04);
  fx.addMono(pop, l.at, 0.5, (i - 3.5) * 0.08);
  verb.addMono(pop, l.at, 0.1);
});

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
