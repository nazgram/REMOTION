// SFX for PetalPopDrop3Photo v2: a paper flick for every polaroid, a swell + bright pop + glint when a model lifts off
// its page, soft pops for stickers and flowers, a whoosh as the end page grows, logo motifs, NAFESA shimmer.
// It sits under the song (public/drop3p/song.wav); scripts/drop3p_mix.sh mixes both into public/drop3p/mix.wav.
//   node audio/drop3p_sfx.js  ->  public/drop3p/sfx.wav
const fs = require('fs');
const path = require('path');
const { SR, Bus, reverb } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const { m } = require('./engine/music');
const L = require('../src/drop3p/timeline.json');

const N = Math.ceil(L.DURATION * SR);
const fx = new Bus(N), verb = new Bus(N);
function loadWav(file, rate = 1) {
  const b = fs.readFileSync(path.join(__dirname, 'sfx', file));
  const data = b.indexOf('data') + 8;
  const src = new Float32Array((b.length - data) >> 1).map((_, i) => b.readInt16LE(data + i * 2) / 32768);
  return Float32Array.from({ length: Math.floor(src.length / rate) }, (_, i) => src[Math.floor(i * rate)]);
}
const POPS = ['pop_1.wav', 'pop_2.wav', 'pop_3.wav'];
const S = L.sfx;
const air = (len, f0, f1, seed, pow = 1.6) => I.noiseSweep(len, f0, f1, { q: 0.8, pink: true, seed, shape: (x) => Math.pow(x, pow) * (1 - Math.pow(x, 6)) });

// polaroids / feed cards slide in: a paper flick + a soft tap
S.cards.forEach((at, i) => {
  fx.addMono(I.paperFwip(0.35, 140 + i), at - 0.08, 0.16, i % 2 ? 0.3 : -0.3);
  fx.addMono(loadWav(POPS[i % 3], 0.85), at + 0.04, 0.16, i % 2 ? 0.3 : -0.3);
});
// the model lifts off the page: an airy swell into a bright pop and a glint
S.cutouts.forEach((at, i) => {
  fx.addMono(air(0.45, 500, 4200, 50 + i, 1.4), at - 0.4, 0.13);
  const p = loadWav(POPS[i % 3], 1.15); fx.addMono(p, at, 0.36); verb.addMono(p, at, 0.1);
  const tg = I.ting(m(['E6', 'G#6', 'B6', 'C#7', 'E7'][i % 5])); fx.addMono(tg, at + 0.12, 0.08, 0.2); verb.addMono(tg, at + 0.12, 0.12);
});
// stickers and flowers
S.stk.forEach((at, i) => { const p = loadWav(POPS[(i + 1) % 3], 1.25 + (i % 4) * 0.05); fx.addMono(p, at, 0.2, ((i % 5) - 2) * 0.2); verb.addMono(p, at, 0.04); });
S.flowers.forEach((at, i) => fx.addMono(loadWav(POPS[(i + 2) % 3], 1.0 + (i % 3) * 0.08), at, 0.15, ((i % 5) - 2) * 0.2));
// end page grows to fill: a whoosh; corner flowers: a light patter
S.whoosh.forEach((at, i) => fx.addMono(air(0.7, 600, 4200, 32 + i, 1), at - 0.1, 0.2));
S.corners.forEach((at, i) => { if (i % 3) return; fx.addMono(loadWav(POPS[i % 3], 1.2 + (i % 4) * 0.05), at, 0.12, i % 2 ? 0.45 : -0.45); });
// logo motifs
S.logo.forEach((at, i) => { const p = loadWav(POPS[i % 3], 1.1 + i * 0.06); fx.addMono(p, at, 0.3, i % 2 ? 0.25 : -0.25); verb.addMono(p, at, 0.08); });
// date, NAFESA
fx.addMono(I.ting(m('B6')), S.date, 0.1);
fx.addMono(I.ting(m('E6')), S.nafesa, 0.14);
fx.addMono(I.ting(m('B6')), S.nafesa + 0.25, 0.1);
const bell = I.bell(1318.5, 0.5, 2.4); fx.addMono(bell, S.nafesa + 0.05, 0.16); verb.addMono(bell, S.nafesa + 0.05, 0.28);
const k = S.cards.length + S.stk.length + S.flowers.length;

const mix = MIX.mixdown({ fx, verb: reverb(verb, { room: 0.6, damp: 0.4 }) }, { fx: 1, verb: 1 });
MIX.highpass(mix, 60);
MIX.master(mix, 0.8, undefined, { lufs: -20 });
MIX.writeWav(path.join(__dirname, '..', 'public', 'drop3p', 'sfx.wav'), mix);
console.log('pops used', k);
