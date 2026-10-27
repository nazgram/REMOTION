// SFX for PetalPopIntro (no music): a pop per flower, a wet wash under the dissolve, a pop per title letter,
// a soft breath as the title leaves and a shimmer under the NAFESA logo. All timed from src/intro/layout.json.
//   node audio/intro_sfx.js   ->  public/intro/sfx.wav
const path = require('path');
const { SR, Bus, reverb } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const { m } = require('./engine/music');
const L = require('../src/intro/layout.json');

const N = Math.ceil(L.DURATION * SR);
const fx = new Bus(N), verb = new Bus(N);

// flowers: soft pops, higher on screen = brighter, panned by x; heroes a touch louder
for (const f of L.flowers) {
  const y = Math.min(1, Math.max(0, 1 - f.y / L.H));
  const pan = Math.max(-0.8, Math.min(0.8, (f.x / L.W - 0.5) * 1.4));
  const pop = I.pop(1200 + y * 1300, f.id + 3);
  fx.addMono(pop, f.popAt, f.hero ? 0.42 : 0.3, pan);
  verb.addMono(pop, f.popAt, 0.05);
}

// dissolve: a wet, falling wash of filtered noise
const [d0, d1] = L.DISSOLVE;
fx.addMono(I.noiseSweep(d1 - d0 + 0.5, 4500, 450, { q: 0.9, pink: true, seed: 32 }), d0, 0.32, 0.1);
fx.addMono(I.noiseSweep(d1 - d0 + 0.3, 2500, 300, { q: 1.2, pink: true, seed: 33 }), d0 + 0.15, 0.18, -0.15);

// title: each letter a crisp pop climbing in pitch
L.letters.forEach((l, i) => {
  const pop = I.pop(1900 + i * 140, 40 + i);
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
