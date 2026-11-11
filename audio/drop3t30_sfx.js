// SFX for PetalPopDrop3Teaser30 (no music): the v7 palette (garden pops, soft swell + patter per flower bloom, letter
// pops, bouncy DROP 3, fabric flap + fold, logo motifs, corner clusters, NAFESA shimmer) plus the footage: a riser
// and a tight hit on every cut of the hook, a soft airy swell when a four-petal opening grows into footage, and a
// low breath + bell where a slow-motion hero starts.
//   node audio/drop3t30_sfx.js   ->  public/drop3t/sfx30.wav
const fs = require('fs');
const path = require('path');
const { SR, Bus, reverb } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const { m } = require('./engine/music');
const L = require('../src/drop3t/timeline30.json');

const N = Math.ceil(L.DURATION * SR);
const fx = new Bus(N), verb = new Bus(N);
function loadWav(file, rate = 1) {
  const b = fs.readFileSync(path.join(__dirname, 'sfx', file));
  const data = b.indexOf('data') + 8;
  const src = new Float32Array((b.length - data) >> 1).map((_, i) => b.readInt16LE(data + i * 2) / 32768);
  return Float32Array.from({ length: Math.floor(src.length / rate) }, (_, i) => src[Math.floor(i * rate)]);
}
const POPS = ['pop_1.wav', 'pop_2.wav', 'pop_3.wav'];
const S = L.sfx, T = L.T;
const air = (len, f0, f1, seed, pow = 1.6) => I.noiseSweep(len, f0, f1, { q: 0.8, pink: true, seed, shape: (x) => Math.pow(x, pow) * (1 - Math.pow(x, 6)) });

// hook: a riser under the cuts, a tight low hit + a flick of air + a pop on every cut (pitch climbing), a light
// patter for the flowers popping round the frame, then a falling whoosh as the footage closes into the opening
const hookEnd = T.hookClose[0];
fx.addMono(I.noiseSweep(hookEnd + 0.1, 250, 5200, { q: 0.9, pink: true, seed: 300, shape: (x) => Math.pow(x, 2.4) }), 0, 0.2);
S.cuts.forEach((at, i) => {
  fx.addMono(I.thud(120 - i * 4, 0.07, 310 + i), at, 0.5);
  fx.addMono(air(0.22, 1800, 6500, 320 + i, 0.6), Math.max(0, at - 0.06), 0.2, i % 2 ? 0.3 : -0.3);
  const p = loadWav(POPS[i % 3], 0.9 + i * 0.07); fx.addMono(p, at + 0.01, 0.4, i % 2 ? -0.2 : 0.2); verb.addMono(p, at + 0.01, 0.06);
});
let e = 0;
for (const [at, n] of S.edge) { if (e++ % 3) continue; fx.addMono(loadWav(POPS[e % 3], 1.3 + (e % 5) * 0.05), at, Math.min(0.14, 0.04 + n * 0.02), ((e % 7) - 3) * 0.2); }
// the four-petal opening growing into footage (or closing back): a soft airy swell and a small glassy ting
S.opens.forEach((at, i) => {
  const closing = i === 0 || i === S.opens.length - 1;
  fx.addMono(closing ? air(0.75, 4200, 500, 340 + i, 1) : air(0.9, 400, 3600, 340 + i, 1.4), at - 0.05, 0.16, i % 2 ? 0.2 : -0.2);
  if (!closing) { const tg = I.ting(m(['A6', 'B6', 'E6', 'G#6'][i % 4])); fx.addMono(tg, at + 0.3, 0.07); verb.addMono(tg, at + 0.3, 0.1); }
});
// slow-motion heroes: time stretches out: a soft low boom, a long breath falling in pitch, one bell with a long tail
S.heroes.forEach((at, i) => {
  fx.addMono(I.subBoom(1.6, 58, 30), at, 0.2);
  fx.addMono(air(1.6, 3000, 350, 360 + i, 0.5), at, 0.07);
  const bell = I.bell(880 * (1 + i * 0.12), 0.9, 2.2); fx.addMono(bell, at + 0.02, 0.06); verb.addMono(bell, at + 0.02, 0.2);
});

// garden pops, softer and lower as it grows from the bottom up
let k = 0, last = -1;
for (const [at, n] of S.pops) {
  if (at - last < 0.05 && n < 5) continue;
  last = at;
  const p = loadWav(POPS[k % 3], 0.85 + Math.min(0.5, (at - T.garden) * 0.25) + ((k * 7) % 5) * 0.02);
  fx.addMono(p, at, Math.min(0.36, 0.1 + n * 0.025), ((k % 5) - 2) * 0.15);
  verb.addMono(p, at, 0.03);
  k++;
}
// flower transitions: a soft airy swell, a gentle patter of pops as the blooms open (every other busy frame),
// and a low breathy settle as they sink back into the print
S.blooms.forEach((list, bi) => {
  const t0 = list[0][0];
  fx.addMono(air(1.2, 300, 3000, 100 + bi, 1.2), t0 - 0.1, 0.12, bi % 2 ? 0.25 : -0.25);
  let q = 0;
  for (const [at, n] of list) {
    if (q++ % 2) continue;
    const p = loadWav(POPS[q % 3], 1.15 + (q % 6) * 0.03);
    fx.addMono(p, at, Math.min(0.2, 0.05 + n * 0.012), ((q % 7) - 3) * 0.12);
    verb.addMono(p, at, 0.05);
  }
  fx.addMono(air(0.8, 2400, 500, 120 + bi, 1), t0 + L.BLOOM.hold, 0.08);
});
// whooshes: pull-out, turn over
S.whoosh.forEach((at, i) => fx.addMono(air(0.7, 500, 4200, 60 + i), at - 0.15, 0.18, i % 2 ? 0.2 : -0.2));
// letters
S.letters.forEach((at, i) => { const p = loadWav(POPS[i % 3], 1 + i * 0.045); fx.addMono(p, at, 0.5, ((i % 8) - 3.5) * 0.08); verb.addMono(p, at, 0.1); });
// DROP 3: stretch (boing), letters land, the 3 wiggles
fx.addMono(I.boing(), S.drop[0] + 0.02, 0.16);
const deep = loadWav(POPS[0], 0.78); fx.addMono(deep, S.drop[0], 0.6); verb.addMono(deep, S.drop[0], 0.12);
for (let i = 0; i < 5; i++) fx.addMono(loadWav(POPS[(i + 1) % 3], 1.05 + i * 0.06), S.drop[0] + 0.33 + i * 0.07, 0.3, (i - 2) * 0.15);
fx.addMono(I.boing(), S.drop[2], 0.1);
// scarf fold + date
fx.addMono(I.paperFwip(0.6, 90), S.fold[0], 0.3);
fx.addMono(I.thud(90, 0.08, 91), T.fold[1] - 0.05, 0.3);
fx.addMono(loadWav(POPS[1], 1.0), S.fold[1], 0.35);
// logo: soft swell then its motifs
fx.addMono(air(0.7, 300, 2400, 80, 2), T.logo[0] - 0.3, 0.14);
for (let i = 0; i < 8; i++) fx.addMono(loadWav(POPS[i % 3], 1.2 + i * 0.03), L.logo.at + i * 0.06 + 0.25, 0.22, (i - 3.5) * 0.08);
S.logo.forEach((at, i) => { const p = loadWav(POPS[i % 3], 1.1 + i * 0.06); fx.addMono(p, at, 0.34, i % 2 ? 0.25 : -0.25); verb.addMono(p, at, 0.08); });
// corner clusters: a light patter, left then right
let j = 0;
for (const [at, n] of S.corners) { if (j++ % 2) continue; fx.addMono(loadWav(POPS[j % 3], 1.15 + (j % 4) * 0.04), at, Math.min(0.22, 0.06 + n * 0.02), j % 2 ? 0.5 : -0.5); }
// sparkles
S.sparkle.forEach((at, i) => {
  ['E7', 'G#7', 'B7'].forEach((n, q) => fx.addMono(I.ting(m(n)), at + q * 0.07, 0.07 - q * 0.01, (q - 1) * 0.3));
  const bell = I.bell(1318.5 * (1 + i * 0.06), 0.35, 2.4); fx.addMono(bell, at, 0.08); verb.addMono(bell, at, 0.15);
});
// NAFESA shimmer
for (const at of S.nafesa) {
  fx.addMono(I.ting(m('E6')), at, 0.14);
  fx.addMono(I.ting(m('B6')), at + 0.25, 0.1);
  const bell = I.bell(1318.5, 0.5, 2.4); fx.addMono(bell, at + 0.05, 0.16); verb.addMono(bell, at + 0.05, 0.28);
}

const mix = MIX.mixdown({ fx, verb: reverb(verb, { room: 0.7, damp: 0.4 }) }, { fx: 1, verb: 1 });
MIX.highpass(mix, 40);
MIX.fadeOut(mix, L.DURATION - 0.3, L.DURATION);
MIX.master(mix, 0.8, undefined, { lufs: -16 });
MIX.writeWav(path.join(__dirname, '..', 'public', 'drop3t', 'sfx30.wav'), mix);
console.log('pops used', k);
