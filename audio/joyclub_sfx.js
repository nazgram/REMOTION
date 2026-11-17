// SFX for JoyClubDots (no music): Nas's POP 3 pops for every dot (bundled per frame so a busy pop-on is a soft
// patter), a rising suck as the dots gather, a whoosh as the giant dot swells, a round bloop when it covers the
// screen, and a soft bell when the last colourway settles.
//   node audio/joyclub_sfx.js   ->  public/joyclub/sfx.wav
const fs = require('fs');
const path = require('path');
const { SR, Bus, reverb } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const L = require('../src/joyclub/timeline.json');

const N = Math.ceil(L.DURATION * SR);
const fx = new Bus(N), verb = new Bus(N);
function loadWav(file, rate = 1) {
  const b = fs.readFileSync(path.join(__dirname, 'sfx', file));
  const data = b.indexOf('data') + 8;
  const src = new Float32Array((b.length - data) >> 1).map((_, i) => b.readInt16LE(data + i * 2) / 32768);
  return Float32Array.from({ length: Math.floor(src.length / rate) }, (_, i) => src[Math.floor(i * rate)]);
}
const POPS = ['pop_1.wav', 'pop_2.wav', 'pop_3.wav'];
function bloop(f0, f1) {
  const n = Math.round(0.18 * SR), out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, f = f1 - (f1 - f0) * Math.exp(-t / 0.02);
    ph += f / SR;
    out[i] = (Math.sin(2 * Math.PI * ph) + 0.25 * Math.sin(4 * Math.PI * ph)) * Math.exp(-t / 0.06) * Math.min(1, t / 0.002);
  }
  return out;
}
const S = L.sfx;
let k = 0, last = -1;
for (const [at, n] of S.pops) {
  if (at - last < 0.06 && n < 5) continue;
  last = at;
  const p = loadWav(POPS[k % 3], 0.92 + ((k * 7) % 13) * 0.03);
  fx.addMono(p, at, Math.min(0.4, 0.1 + n * 0.025), ((k % 5) - 2) * 0.18);
  verb.addMono(p, at, 0.03);
  k++;
}
S.gather.forEach((at, i) => fx.addMono(I.noiseSweep(0.6, 2400, 500, { q: 1.2, pink: true, seed: 10 + i, shape: (x) => Math.pow(x, 2.2) }), at, 0.12, 0));
S.whoosh.forEach((at, i) => fx.addMono(I.noiseSweep(0.55, 500, 5200, { q: 0.8, pink: true, seed: 40 + i, shape: (x) => Math.pow(x, 1.6) * (1 - Math.pow(x, 6)) }), at, 0.22, i % 2 ? 0.2 : -0.2));
S.cover.forEach((at, i) => { const b = bloop(220 + i * 30, 760 + i * 70); fx.addMono(b, at - 0.03, 0.45); verb.addMono(b, at, 0.12); });
S.settle.forEach((at) => { const bell = I.bell(1046.5, 0.5, 2.6); fx.addMono(bell, at, 0.1); verb.addMono(bell, at, 0.22); });

const mix = MIX.mixdown({ fx, verb: reverb(verb, { room: 0.7, damp: 0.4 }) }, { fx: 1, verb: 1 });
MIX.highpass(mix, 40);
MIX.fadeOut(mix, L.DURATION - 0.4, L.DURATION);
MIX.master(mix, 0.8, undefined, { lufs: -16 });
MIX.writeWav(path.join(__dirname, '..', 'public', 'joyclub', 'sfx.wav'), mix);
console.log('pops used', k);
