// SFX for PetalPopBTS (under the voiceover): Nas's "POP 3" pops for windows and captions, keyboard ticks while
// text types, swishes for the tear and storyboard, a shimmer when the render finishes.
//   node audio/bts_sfx.js   ->  public/bts/sfx.wav
const fs = require('fs');
const path = require('path');
const { SR, Bus, reverb } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const { m } = require('./engine/music');
const L = require('../src/bts/timeline.json');
const S = L.S;

const N = Math.ceil(L.DURATION * SR);
const fx = new Bus(N), verb = new Bus(N);
function loadWav(file, rate = 1) {
  const b = fs.readFileSync(path.join(__dirname, 'sfx', file));
  const data = b.indexOf('data') + 8;
  const src = new Float32Array((b.length - data) >> 1).map((_, i) => b.readInt16LE(data + i * 2) / 32768);
  return Float32Array.from({ length: Math.floor(src.length / rate) }, (_, i) => src[Math.floor(i * rate)]);
}
let n = 0, seed = 1;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pop = (at, gain = 1, pitch = 1) => {
  const p = loadWav(['pop_1.wav', 'pop_2.wav', 'pop_3.wav'][n++ % 3], pitch);
  fx.addMono(p, at, 0.42 * gain, ((n % 5) - 2) * 0.1);
  verb.addMono(p, at, 0.05 * gain);
};
const swish = (at, gain = 1, up = true) =>
  fx.addMono(I.noiseSweep(0.35, up ? 600 : 4000, up ? 4800 : 700, { q: 0.9, pink: true, seed: 20 + n++, shape: (x) => Math.sin(Math.PI * x) }), at, 0.15 * gain);
const typing = (a, b, gain = 1) => {
  for (let t = a; t < b; t += 0.055 + rnd() * 0.05) fx.addMono(I.woodTick(3.2 + rnd() * 1.2), t, 0.07 * gain, (rnd() - 0.5) * 0.4);
};
const shimmer = (at) => {
  fx.addMono(I.ting(m('E6')), at, 0.14);
  fx.addMono(I.ting(m('B6')), at + 0.3, 0.1);
  const bell = I.bell(1318.5, 0.4, 2.4);
  fx.addMono(bell, at + 0.05, 0.15);
  verb.addMono(bell, at + 0.05, 0.22);
};

// hook
pop(0.45, 1.1, 0.9); swish(0.85, 1.4); typing(0.95, 2.4, 0.8); pop(1.7, 0.8, 1.2); swish(S.hook[1] - 0.25, 0.8, false);
// chat
let a = S.chat[0]; pop(a, 0.9); pop(a + 0.4, 0.7, 1.1); typing(a + 0.3, a + 1.6); pop(a + 1.65, 0.8, 1.25); pop(a + 2.25, 0.6); typing(a + 2.25, a + 3.3, 0.6);
// code
a = S.code[0]; pop(a, 0.9); pop(a + 0.4, 0.7, 1.1); typing(a + 0.35, a + 4.6); pop(a + 1.3, 0.9, 1.15); pop(a + 3.0, 0.9, 1.05);
// preview
a = S.prev[0]; pop(a, 0.9); pop(a + 0.4, 0.7, 1.1); swish(a + 2.4, 1); pop(a + 3.2, 0.9, 0.95);
// render
a = S.rend[0]; pop(a, 0.9); pop(a + 0.4, 0.7, 1.1); typing(a + 0.3, a + 1.0); fx.addMono(I.woodTick(2.2), a + 1.05, 0.25);
shimmer(a + 3.05); [0, 1, 2].forEach((i) => pop(a + 3.1 + i * 0.08, 0.6, 1 + i * 0.1));
// payoff
a = S.pay[0]; swish(a, 1.1); [0, 1, 2].forEach((i) => pop(a + 0.75 + i * 0.35, 1, [0.95, 1.05, 1.2][i])); pop(a + 1.9, 0.7, 1.25); shimmer(a + 2.1);

const mix = MIX.mixdown({ fx, verb: reverb(verb, { room: 0.7, damp: 0.4 }) }, { fx: 1, verb: 1 });
MIX.highpass(mix, 40);
MIX.fadeOut(mix, L.DURATION - 0.6, L.DURATION);
MIX.master(mix, 0.8, undefined, { lufs: -22 });
MIX.writeWav(path.join(__dirname, '..', 'public', 'bts', 'sfx.wav'), mix);
