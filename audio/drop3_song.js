// Music for PetalPopDrop3Teaser: a slow, dreamy 60 BPM fingerpicked guitar over a soft pad (one bar = one
// colourway), a music-box note + soft pop on every motif that pops or drops, a watery whoosh and a glassy
// glint under each watercolor bleed, and a music-box run + chime as the Drop 3 logo writes in.
//   node audio/drop3_song.js   ->  public/drop3/music.wav
const path = require('path');
const { SR, Bus, reverb } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const { m } = require('./engine/music');
const L = require('../src/drop3/timeline.json');

const BEAT = 60 / L.BPM, BAR = BEAT * 4, E8 = BEAT / 2;
const N = Math.ceil(L.DURATION * SR);
const bus = () => new Bus(N);
const gtr = bus(), pad = bus(), keys = bus(), perc = bus(), fx = bus(), verb = bus();
const addSt = (b, x, t, g) => { b.addMono(x.L, t, g, -0.5); b.addMono(x.R, t, g, 0.5); };

// bar per colourway, then the logo bar(s); chord = [bass, pad voicing, arpeggio pattern]
const PROG = [
  ['F2', ['A3', 'C4', 'E4'], ['F3', 'C4', 'E4', 'A4', 'C5', 'A4', 'E4', 'C4']], // Fmaj7 Buttercup
  ['A2', ['G3', 'C4', 'E4'], ['A3', 'E4', 'G4', 'C5', 'E5', 'C5', 'G4', 'E4']], // Am7 Camellia
  ['D2', ['F3', 'A3', 'E4'], ['D3', 'A3', 'E4', 'F4', 'A4', 'F4', 'E4', 'A3']], // Dm9 Petunia
  ['Bb1', ['A3', 'D4', 'F4'], ['Bb2', 'F3', 'A3', 'D4', 'F4', 'D4', 'A3', 'F3']], // Bbmaj7 Lavender
  ['C2', ['G3', 'C4', 'F4'], ['C3', 'G3', 'C4', 'F4', 'G4', 'F4', 'C4', 'G3']], // Csus Marigold
  ['F2', ['A3', 'C4', 'G4'], ['F3', 'C4', 'G4', 'A4', 'C5', 'G4', 'A4', 'C5']], // Fadd9 logo
  ['F2', ['A3', 'C4', 'G4'], ['F3', 'C4', 'G4', 'A4']], // NAFESA, let ring
];
PROG.forEach(([b, voicing, arp], bar) => {
  const t0 = bar * BAR;
  if (t0 >= L.DURATION) return;
  const len = Math.min(BAR, L.DURATION - t0);
  voicing.forEach((n, k) => addSt(pad, I.padNote(m(n), len, { cutoff: 1300, attack: 0.8, release: 1.4, seed: bar * 5 + k }), t0, 0.16));
  pad.addMono(I.bass(m(b), len * 0.9, { bright: 0.3, sub: 0.8 }), t0, 0.28);
  arp.forEach((n, k) => {
    const t = t0 + k * E8;
    if (t >= L.DURATION - 0.6) return;
    const last = bar === PROG.length - 1;
    const x = I.guitar(m(n), last ? 2.2 : 1.1, { bright: 0.45, sustain: 0.996, seed: bar * 10 + k });
    const pan = ((k % 4) - 1.5) * 0.15;
    gtr.addMono(x, t + (k % 2) * 0.012, (k === 0 ? 0.5 : 0.36) * (last ? 0.8 : 1), pan);
    verb.addMono(x, t, 0.12);
  });
});
// a whisper of shaker on the off-beats once the second colourway is in, gone under the logo
const SH = [I.shaker(0.6, 15), I.shaker(0.4, 16)];
for (let t = BAR; t < L.END.washAt; t += E8) {
  const i = Math.round(t / E8);
  if (i % 2) perc.addMono(SH[(i >> 1) % 2], t, 0.09, 0.4);
}

// motifs: a soft pop + a music-box note (higher on screen = higher note, panned by x)
const PENTA = ['F5', 'G5', 'A5', 'C6', 'D6', 'F6'].map(m);
let seed = 100;
for (const s of L.scenes)
  for (const e of s.els) {
    if (e.entrance === 'paint' || e.entrance === 'grow') continue;
    const y = Math.min(1, Math.max(0, 1 - e.y / L.H));
    const pan = Math.max(-0.7, Math.min(0.7, (e.x / L.W - 0.5) * 1.3));
    const at = e.at + (e.entrance === 'drop' ? 0.35 : 0.05);
    fx.addMono(I.pop(1300 + y * 1200, seed++), at, 0.3, pan);
    const mb = I.musicBox(PENTA[Math.round(y * (PENTA.length - 1))], { decay: 1.1 });
    keys.addMono(mb, at, 0.14, pan);
    verb.addMono(mb, at, 0.1);
  }
// leaves growing: a soft rising leafy swish on the first scene
fx.addMono(I.noiseSweep(1.6, 400, 2400, { q: 0.8, pink: true, seed: 41 }), 0.2, 0.12, -0.2);

// every watercolor bleed: a wet whoosh falling in pitch + a glass glint as the new colourway lands
L.scenes.slice(1).forEach((s, i) => {
  fx.addMono(I.noiseSweep(L.WASH_DUR + 0.3, 3800, 600, { q: 0.9, pink: true, seed: 50 + i }), s.start - 0.1, 0.22, i % 2 ? 0.3 : -0.3);
  const g = I.glass(i + 3, { size: 0.6 });
  fx.addMono(g, s.start + 0.45, 0.12, i % 2 ? -0.2 : 0.2);
  verb.addMono(g, s.start + 0.45, 0.08);
});
// the end wash, then the logo writes in on a climbing music-box run and a chime, NAFESA on a bell
const E = L.END;
fx.addMono(I.noiseSweep(E.washDur + 0.6, 4200, 400, { q: 0.7, pink: true, seed: 70 }), E.washAt, 0.26);
['C5', 'F5', 'G5', 'A5', 'C6', 'F6'].forEach((n, k) => {
  const x = I.musicBox(m(n), { decay: 1.6 });
  keys.addMono(x, E.logoAt + k * (E.logoDur / 6), 0.2, (k - 2.5) * 0.12);
  verb.addMono(x, E.logoAt + k * (E.logoDur / 6), 0.16);
});
fx.addMono(I.ting(m('A6')), E.logoAt + E.logoDur, 0.16);
fx.addMono(I.bell(1396.9, 0.6, 2.0), E.logoAt + E.logoDur, 0.16);
const nb = I.bell(m('F5') && 698.5, 1.2, 1.6, 2.0);
fx.addMono(nb, E.nafAt + 0.1, 0.2);
verb.addMono(nb, E.nafAt + 0.1, 0.14);

const stems = { gtr, pad, keys, perc, fx, verb: reverb(verb, { room: 0.86, damp: 0.4 }) };
const GAIN = { gtr: 2.0, pad: 1.0, keys: 1.0, perc: 0.6, fx: 0.8, verb: 1 };
const mix = MIX.mixdown(stems, GAIN);
MIX.highpass(mix, 30);
MIX.fadeOut(mix, L.DURATION - 1.4, L.DURATION);
const M = MIX.master(mix, 0.7, undefined, { lufs: -15 });
MIX.writeWav(path.join(__dirname, '..', 'public', 'drop3', 'music.wav'), mix);
console.log(`wrote public/drop3/music.wav (${L.DURATION}s, ${M.lufs.toFixed(1)} LUFS)`);
