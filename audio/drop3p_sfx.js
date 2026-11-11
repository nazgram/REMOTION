// SFX for PetalPopDrop3Photo: soft pops for the stickers / cards / flowers popping, a click for every grid cell, a lift
// when a cut-out comes off its cell, whooshes at the cut to the grid and the zoom-out, logo motifs, NAFESA shimmer.
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

// stickers, cards and flowers popping in (not every one, so the song stays the main thing)
let last = -1, k = 0;
S.pops.forEach((at) => {
  if (at - last < 0.09) return;
  last = at;
  const p = loadWav(POPS[k % 3], 1.0 + ((k * 7) % 6) * 0.05);
  fx.addMono(p, at, 0.2, ((k % 5) - 2) * 0.18);
  verb.addMono(p, at, 0.04);
  k++;
});
// grid cells click in, cut-outs lift
S.cells.forEach((at, i) => { fx.addMono(I.thud(140 - i * 3, 0.05, 400 + i), at, 0.22); fx.addMono(loadWav(POPS[i % 3], 0.8), at, 0.18, i % 2 ? 0.3 : -0.3); });
S.lifts.forEach((at, i) => { const p = loadWav(POPS[(i + 1) % 3], 1.35 + i * 0.02); fx.addMono(p, at, 0.2, i % 2 ? 0.3 : -0.3); verb.addMono(p, at, 0.1); });
// cut to the grid: a flick of air and a hit; the zoom-away: a falling whoosh
fx.addMono(air(0.5, 600, 5200, 31, 1), S.flash - 0.3, 0.2);
fx.addMono(I.thud(80, 0.12, 33), S.flash, 0.35);
fx.addMono(air(0.7, 4200, 400, 32, 0.8), S.zoom - 0.05, 0.2);
// logo motifs
S.logo.forEach((at, i) => { const p = loadWav(POPS[i % 3], 1.1 + i * 0.06); fx.addMono(p, at, 0.3, i % 2 ? 0.25 : -0.25); verb.addMono(p, at, 0.08); });
// date, NAFESA
fx.addMono(I.ting(m('B6')), S.date, 0.1);
fx.addMono(I.ting(m('E6')), S.nafesa, 0.14);
fx.addMono(I.ting(m('B6')), S.nafesa + 0.25, 0.1);
const bell = I.bell(1318.5, 0.5, 2.4); fx.addMono(bell, S.nafesa + 0.05, 0.16); verb.addMono(bell, S.nafesa + 0.05, 0.28);

const mix = MIX.mixdown({ fx, verb: reverb(verb, { room: 0.6, damp: 0.4 }) }, { fx: 1, verb: 1 });
MIX.highpass(mix, 60);
MIX.master(mix, 0.8, undefined, { lufs: -20 });
MIX.writeWav(path.join(__dirname, '..', 'public', 'drop3p', 'sfx.wav'), mix);
console.log('pops used', k);
