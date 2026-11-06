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
  if (e.pass !== null && e.pass < L.END.washAt + 1) {
    const big = e.kind === 'hero';
    const c = camAt(e.pass);
    const pan = Math.max(-0.85, Math.min(0.85, (e.x + e.vx * (e.pass - e.born) - c[1]) / 900));
    const len = big ? 1.5 : 1.0;
    const w = I.noiseSweep(len, big ? 2600 : 3400, big ? 380 : 900, { q: 0.8, pink: true, seed: seed++, shape: (x) => Math.pow(Math.sin(Math.PI * Math.min(1, x * 1.25)), 2) });
    fx.addMono(w, e.pass - len * 0.45, big ? 0.34 : 0.16, pan);
    verb.addMono(w, e.pass - len * 0.45, 0.06);
  }
  if (e.kind === 'blown' && e.born < L.END.washAt) {
    for (let i = 0; i < 4; i++) fx.addMono(I.paperFwip(1.3 + i * 0.08, seed++), e.born + 0.6 + i * 0.55, 0.05, -0.6 + i * 0.4);
  }
  if (e.kind === 'hero' && e.born < L.END.washAt) {
    const p = I.pop(1700, seed++);
    fx.addMono(p, e.born + 0.25, 0.14, 0);
    const mb = I.musicBox(m(['C6', 'D6', 'F6', 'G6', 'A6'][L.ways.indexOf(e.way)]), { decay: 1.0 });
    keys.addMono(mb, e.born + 0.25, 0.07);
    verb.addMono(mb, e.born + 0.25, 0.08);
  }
}
const E = L.END;
fx.addMono(I.noiseSweep(E.washDur + 0.8, 4200, 400, { q: 0.7, pink: true, seed: 70 }), E.washAt, 0.22);
['C5', 'F5', 'G5', 'A5', 'C6', 'F6'].forEach((n, k) => {
  const x = I.musicBox(m(n), { decay: 1.5 });
  keys.addMono(x, E.logoAt + k * (E.logoDur / 6), 0.17, (k - 2.5) * 0.12);
  verb.addMono(x, E.logoAt + k * (E.logoDur / 6), 0.14);
});
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
