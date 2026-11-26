// SFX for PetalPopDrop3Teaser (no music): a soft air whoosh as each motif slips past the camera (louder and lower
// for the big flowers, panned to the side it leaves by), a light flutter for the petals the wind blows across, a
// tiny pop as each big flower grows in far away, a wash into the end, a music-box chime as the logo writes in and
// a bell under NAFESA. One reverb for all of it.
//   node audio/drop3_sfx.js   ->  public/drop3/sfx.wav
const path = require('path');
const { SR, Bus, reverb } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const { m } = require('./engine/music');
const L = require('../src/drop3/timeline.json');

const N = Math.ceil(L.DURATION * SR);
const fx = new Bus(N), keys = new Bus(N), verb = new Bus(N);
const camAt = (t) => L.cam[Math.min(L.cam.length - 1, Math.max(0, Math.round(t * L.FPS)))];
let seed = 60;
for (const e of L.els) {
  if (e.pass === null || e.pass > L.END.washAt + 0.6) continue;
  const big = e.kind === 'hero';
  const c = camAt(e.pass);
  const pan = Math.max(-0.85, Math.min(0.85, (e.x + e.vx * Math.max(0, e.pass - e.born) - c[1]) / 900));
  const len = big ? 1.6 : 1.0;
  const w = I.noiseSweep(len, big ? 2600 : 3400, big ? 360 : 900, { q: 0.8, pink: true, seed: seed++, shape: (x) => Math.pow(Math.sin(Math.PI * Math.min(1, x * 1.25)), 2) });
  fx.addMono(w, e.pass - len * 0.45, big ? 0.34 : 0.15, pan);
  verb.addMono(w, e.pass - len * 0.45, 0.06);
}
// every cover flower: a big soft whoosh panned left to right as it crosses, a low air thump at its peak (the cut)
// and a glassy note as the new colourway shows
L.covers.forEach((c, i) => {
  const d = L.COVER_DUR;
  const w = I.noiseSweep(d + 0.2, 900, 3000, { q: 0.7, pink: true, seed: 90 + i, shape: (x) => Math.pow(Math.sin(Math.PI * x), 1.6) });
  [-0.7, -0.2, 0.3, 0.75].forEach((pan, j) => fx.addMono(w.subarray(Math.round(j * w.length / 4), Math.round((j + 1) * w.length / 4)), c.peak - d / 2 - 0.1 + j * (d + 0.2) / 4, 0.3, pan));
  fx.addMono(I.thud(70, 0.16, 120 + i), c.peak, 0.22);
  if (i < L.changes.length) {
    const b = I.bell([1396.9, 1568, 1760, 2093][i], 0.9, 1.8, 2.0);
    fx.addMono(b, c.peak + 0.05, 0.08, 0.3);
    verb.addMono(b, c.peak + 0.05, 0.1);
  }
});
// petals right by the lens: a quick soft flutter-whoosh as they cross
for (const f of L.floats) {
  if (!f.near || f.born > L.END.washAt) continue;
  const tc = f.born + (L.W / 2 + 260) / f.sp;
  fx.addMono(I.noiseSweep(0.5, 4500, 1800, { q: 1.2, pink: true, seed: seed++ }), tc - 0.25, 0.09, 0);
  fx.addMono(I.paperFwip(1.4, seed++), tc - 0.05, 0.05, 0.2);
}
// the opening flower blooming in front of the lens
fx.addMono(I.pop(1200, 3), 0.05, 0.22);
keys.addMono(I.musicBox(m('C6'), { decay: 1.2 }), 0.08, 0.1);
// the logo's corner flowers settling: soft pops, smaller flowers higher
L.frame.forEach((f, i) => {
  fx.addMono(I.pop(1100 + f.level * 500, 200 + i), f.at + 0.3, f.level === 0 ? 0.1 : 0.06, f.side > 0 ? -0.5 : 0.5);
  if (f.level === 2) keys.addMono(I.musicBox(m(['C6', 'F6', 'A6'][i % 3]), { decay: 0.8 }), f.at + 0.3, 0.05, f.side > 0 ? -0.5 : 0.5);
});
const E = L.END;
fx.addMono(I.noiseSweep(E.washDur + 0.8, 4200, 400, { q: 0.7, pink: true, seed: 70 }), E.washAt, 0.22);
fx.addMono(I.pop(900, 300), E.logoAt + 0.05, 0.2);
fx.addMono(I.ting(m('A6')), E.logoAt + E.logoDur, 0.14);
fx.addMono(I.bell(1396.9, 0.6, 2.0), E.logoAt + E.logoDur, 0.14);
const nb = I.bell(698.5, 1.2, 1.6, 2.0);
fx.addMono(nb, E.nafAt + 0.1, 0.18);
verb.addMono(nb, E.nafAt + 0.1, 0.14);

const stems = { fx, keys, verb: reverb(verb, { room: 0.8, damp: 0.4 }) };
const mix = MIX.mixdown(stems, { fx: 1, keys: 1, verb: 1 });
MIX.highpass(mix, 40);
MIX.fadeOut(mix, L.DURATION - 1.2, L.DURATION);
const M = MIX.master(mix, 0.7, undefined, { lufs: -18 });
MIX.writeWav(path.join(__dirname, '..', 'public', 'drop3', 'sfx.wav'), mix);
console.log(`wrote public/drop3/sfx.wav (${L.DURATION}s, ${M.lufs.toFixed(1)} LUFS)`);
