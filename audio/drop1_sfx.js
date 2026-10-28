// SFX for PetalPopDrop1 (no music): Nas's "POP 3" pops, mouse clicks, drag swishes, a zoom whoosh and a closing
// shimmer, all from the events in src/drop1/timeline.json.
//   node audio/drop1_sfx.js   ->  public/drop1/sfx.wav
const fs = require('fs');
const path = require('path');
const { SR, Bus, reverb } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const { m } = require('./engine/music');
const L = require('../src/drop1/timeline.json');

const N = Math.ceil(L.DURATION * SR);
const fx = new Bus(N), verb = new Bus(N);

function loadWav(file, rate = 1) {
  const b = fs.readFileSync(path.join(__dirname, 'sfx', file));
  const data = b.indexOf('data') + 8;
  const src = new Float32Array((b.length - data) >> 1).map((_, i) => b.readInt16LE(data + i * 2) / 32768);
  return Float32Array.from({ length: Math.floor(src.length / rate) }, (_, i) => src[Math.floor(i * rate)]);
}
const POPS = ['pop_1.wav', 'pop_2.wav', 'pop_3.wav'];
let n = 0;
for (const e of L.sfx) {
  if (e.kind === 'pop') {
    const p = loadWav(POPS[n++ % 3], e.pitch);
    fx.addMono(p, e.at, 0.5 * e.gain, ((n % 5) - 2) * 0.1);
    verb.addMono(p, e.at, 0.06 * e.gain);
  } else if (e.kind === 'click') {
    fx.addMono(I.woodTick(2.4 * e.pitch), e.at, 0.22 * e.gain);
  } else if (e.kind === 'swish') {
    fx.addMono(I.noiseSweep(0.32, 900, 5200, { q: 0.8, pink: true, seed: 10 + n++, shape: (x) => Math.sin(Math.PI * x) }), e.at, 0.16 * e.gain);
  } else if (e.kind === 'zoom') {
    const up = e.pitch >= 1;
    fx.addMono(I.noiseSweep(0.35, up ? 400 : 3000, up ? 3000 : 400, { q: 1.4, pink: true, seed: 40 + n++, shape: (x) => Math.sin(Math.PI * x) }), e.at, 0.22 * e.gain);
  } else if (e.kind === 'shimmer') {
    fx.addMono(I.ting(m('E6')), e.at, 0.16);
    fx.addMono(I.ting(m('B6')), e.at + 0.35, 0.12);
    const bell = I.bell(1318.5, 0.4, 2.4);
    fx.addMono(bell, e.at + 0.05, 0.18);
    verb.addMono(bell, e.at + 0.05, 0.25);
  }
}

const mix = MIX.mixdown({ fx, verb: reverb(verb, { room: 0.7, damp: 0.4 }) }, { fx: 1, verb: 1 });
MIX.highpass(mix, 40);
MIX.fadeOut(mix, L.DURATION - 0.6, L.DURATION);
MIX.master(mix, 0.8, undefined, { lufs: -16 });
MIX.writeWav(path.join(__dirname, '..', 'public', 'drop1', 'sfx.wav'), mix);
