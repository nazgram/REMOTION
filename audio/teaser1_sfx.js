// SFX for PetalPopTeaser1 (no music): Nas's "POP 3" pops for the flowers (bundled per frame so a busy build is a
// soft patter, not a wall), letter pops climbing in pitch, soft whooshes into every wipe / iris / zoom, a round
// bloop on each colourway cut, sparkles on the words, a bouncy DROP 2 and a shimmer under NAFESA.
//   node audio/teaser1_sfx.js   ->  public/teaser1/sfx.wav
const fs = require('fs');
const path = require('path');
const { SR, Bus, reverb } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const { m } = require('./engine/music');
const L = require('../src/teaser1/timeline.json');

const N = Math.ceil(L.DURATION * SR);
const fx = new Bus(N), verb = new Bus(N);
function loadWav(file, rate = 1) {
  const b = fs.readFileSync(path.join(__dirname, 'sfx', file));
  const data = b.indexOf('data') + 8;
  const src = new Float32Array((b.length - data) >> 1).map((_, i) => b.readInt16LE(data + i * 2) / 32768);
  return Float32Array.from({ length: Math.floor(src.length / rate) }, (_, i) => src[Math.floor(i * rate)]);
}
const POPS = ['pop_1.wav', 'pop_2.wav', 'pop_3.wav'];
function bloop(f0 = 260, f1 = 880) {
  const n = Math.round(0.16 * SR), out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, f = f1 - (f1 - f0) * Math.exp(-t / 0.018);
    ph += f / SR;
    out[i] = (Math.sin(2 * Math.PI * ph) + 0.25 * Math.sin(4 * Math.PI * ph)) * Math.exp(-t / 0.05) * Math.min(1, t / 0.002);
  }
  return out;
}
const S = L.sfx;

// flower pops: one sample per busy frame, louder with more flowers, only every other frame when it is dense
let k = 0, last = -1;
for (const [at, n] of S.pops) {
  if (at - last < 0.05 && n < 6) continue;
  last = at;
  const p = loadWav(POPS[k % 3], 0.95 + ((k * 7) % 11) * 0.025);
  fx.addMono(p, at, Math.min(0.42, 0.12 + n * 0.02), ((k % 5) - 2) * 0.15);
  verb.addMono(p, at, 0.03);
  k++;
}
// soft whooshes
S.whoosh.forEach((at, i) => fx.addMono(I.noiseSweep(0.42, 600, 5200, { q: 0.8, pink: true, seed: 30 + i, shape: (x) => Math.pow(x, 1.6) * (1 - Math.pow(x, 6)) }), at - 0.12, 0.2, i % 2 ? 0.2 : -0.2));
// colourway cuts
S.bloop.forEach((at, i) => { const b = bloop(240 + i * 40, 820 + i * 80); fx.addMono(b, at, 0.5); verb.addMono(b, at, 0.12); });
// sparkles
S.sparkle.forEach((at, i) => {
  ['E7', 'G#7', 'B7'].forEach((n, j) => fx.addMono(I.ting(m(n)), at + j * 0.07, 0.07 - j * 0.01, (j - 1) * 0.3));
  const bell = I.bell(1318.5 * (1 + i * 0.06), 0.35, 2.4);
  fx.addMono(bell, at, 0.08);
  verb.addMono(bell, at, 0.15);
});
// Petal Pop letters
S.letters.forEach((at, i) => { const p = loadWav(POPS[i % 3], 1 + i * 0.05); fx.addMono(p, at, 0.55, (i - 3.5) * 0.08); verb.addMono(p, at, 0.1); });
// DROP 2: a deep pop with a boing, then a lighter pulse
const deep = loadWav(POPS[0], 0.78);
fx.addMono(deep, S.drop[0], 0.7); verb.addMono(deep, S.drop[0], 0.15);
fx.addMono(I.boing(), S.drop[0] + 0.03, 0.12);
fx.addMono(loadWav(POPS[1], 1.1), S.drop[1], 0.4);
// logo: soft swell then its motifs land
fx.addMono(I.noiseSweep(0.6, 300, 2400, { q: 0.7, pink: true, seed: 80, shape: (x) => Math.pow(x, 2) * (1 - Math.pow(x, 8)) }), S.logo[0] - 0.4, 0.15);
S.logo.slice(1).forEach((at, i) => { const p = loadWav(POPS[i % 3], 1.1 + i * 0.06); fx.addMono(p, at, 0.38, (i % 2 ? 0.25 : -0.25)); verb.addMono(p, at, 0.08); });
// NAFESA shimmer
for (const at of S.nafesa) {
  fx.addMono(I.ting(m('E6')), at, 0.14);
  fx.addMono(I.ting(m('B6')), at + 0.25, 0.1);
  const bell = I.bell(1318.5, 0.5, 2.4);
  fx.addMono(bell, at + 0.05, 0.16); verb.addMono(bell, at + 0.05, 0.28);
}

const mix = MIX.mixdown({ fx, verb: reverb(verb, { room: 0.7, damp: 0.4 }) }, { fx: 1, verb: 1 });
MIX.highpass(mix, 40);
MIX.fadeOut(mix, L.DURATION - 0.3, L.DURATION);
MIX.master(mix, 0.8, undefined, { lufs: -16 });
MIX.writeWav(path.join(__dirname, '..', 'public', 'teaser1', 'sfx.wav'), mix);
console.log('pops used', k);
