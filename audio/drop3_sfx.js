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
// every colourway change: a soft rising swell into the bloom and a glassy note as the new ground opens
L.changes.forEach((c, i) => {
  fx.addMono(I.noiseSweep(0.8, 500, 5200, { q: 1.1, pink: true, seed: 90 + i, shape: (x) => Math.pow(x, 2.2) * (1 - Math.pow(x, 12)) }), c - 0.75, 0.16);
  const b = I.bell(m(['F6', 'G6', 'A6', 'C7'][i]) && [1396.9, 1568, 1760, 2093][i], 0.9, 1.8, 2.0);
  fx.addMono(b, c - 0.05, 0.1, i % 2 ? 0.3 : -0.3);
  verb.addMono(b, c - 0.05, 0.12);
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
// the ring round the logo: one tiny pop + music-box note per flower as it settles, climbing
const RING = ['C6', 'D6', 'F6', 'G6', 'A6', 'C7'].map(m);
L.ring.forEach((r, i) => {
  fx.addMono(I.pop(1800 + i * 90, 200 + i), r.at + 0.35, 0.08, Math.cos(r.a) * 0.6);
  keys.addMono(I.musicBox(RING[i % RING.length], { decay: 0.8 }), r.at + 0.35, 0.05, Math.cos(r.a) * 0.6);
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
