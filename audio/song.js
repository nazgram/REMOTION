// THE SONG: a ukulele groove + one sound per flower pop, all read from src/layout.json.
//   node audio/song.js   ->  public/music.wav
// The synth engine in audio/engine/ is vendored from the animation-studio skill.
const path = require('path');
const { SR, Bus, reverb } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const { m } = require('./engine/music');
const L = require('../src/layout.json');

const BEAT = 60 / L.BPM, BAR = BEAT * 4, E8 = BEAT / 2;
const N = Math.ceil(L.DURATION * SR);
const bus = () => new Bus(N);
const uke = bus(), keys = bus(), perc = bus(), fx = bus(), verb = bus();

// ---------- ukulele (re-entrant GCEA voicings, strings in g-c-e-a order) ----------
const CHORDS = {
  F: ['A4', 'C4', 'F4', 'A4'],
  C: ['G4', 'C4', 'E4', 'C5'],
  Dm: ['A4', 'D4', 'F4', 'A4'],
  Bb: ['Bb4', 'D4', 'F4', 'Bb4'],
  Fadd9: ['G4', 'C4', 'F4', 'A4'],
};
const PROG = ['F', 'C', 'Dm', 'Bb', 'Fadd9']; // one chord per 2s bar
function strum(t, chord, { up = false, gain = 0.5, ring = 0.35, bright = 0.6 } = {}) {
  const notes = CHORDS[chord].map(m);
  const order = up ? [...notes].reverse() : notes;
  order.forEach((n, i) => {
    const x = I.guitar(n, ring, { bright, sustain: 0.994, seed: Math.round(t * 100) + i });
    const pan = (i - 1.5) * 0.12 * (up ? -1 : 1);
    uke.addMono(x, t + i * 0.011, gain * (up ? 0.7 : 1), pan);
    verb.addMono(x, t + i * 0.011, gain * 0.12);
  });
}
// island strum D . D U . U D U on 8ths; bar 0 only on the beats, bar 3 thins out under the wash
const PATTERN = [[0, false], [2, false], [3, true], [5, true], [6, false], [7, true]];
for (let bar = 0; bar < 4; bar++) {
  const t0 = bar * BAR, chord = PROG[bar];
  for (const [e, up] of PATTERN) {
    const t = t0 + e * E8;
    if (bar === 0 && e % 2) continue;
    if (bar === 3 && t > L.DISSOLVE[0] + 0.01) continue;
    strum(t, chord, { up, gain: bar === 0 ? 0.38 : 0.5 });
  }
}
strum(L.DISSOLVE[0] + E8, 'Bb', { gain: 0.42, ring: 1.4, bright: 0.45 }); // lets ring through the wash
strum(L.TITLE_AT, 'Fadd9', { gain: 0.55, ring: 1.8 });
strum(L.TITLE_AT + 1.0, 'Fadd9', { up: true, gain: 0.35, ring: 1.6, bright: 0.45 });

// ---------- light percussion: shaker 8ths, soft kick on 1 & 3 while the garden grows ----------
const K = I.kick({ punch: 0.7, tail: 0.25 }), SH = [I.shaker(1, 15), I.shaker(0.6, 16)];
for (let t = 0; t < L.DISSOLVE[0]; t += E8) {
  const i = Math.round(t / E8);
  if (t >= BAR) perc.addMono(SH[i % 2], t, i % 2 ? 0.12 : 0.18, 0.35);
  if (t >= BAR && i % 4 === 0) perc.addMono(K, t, 0.45);
}

// ---------- every flower pop = a pop + a marimba note (higher on screen = higher note, panned by x) ----------
const PENTA = ['F4', 'G4', 'A4', 'C5', 'D5', 'F5', 'G5', 'A5', 'C6'].map(m);
for (const f of L.flowers) {
  const y = Math.min(1, Math.max(0, 1 - f.y / L.H));
  const note = PENTA[Math.round(y * (PENTA.length - 1))];
  const pan = Math.max(-0.8, Math.min(0.8, (f.x / L.W - 0.5) * 1.4));
  fx.addMono(I.pop(1500 + y * 1400, f.id + 3), f.popAt, 0.55, pan);
  const mb = I.marimba(note, { thock: 0.1, seed: f.id });
  keys.addMono(mb, f.popAt, f.hero ? 0.42 : 0.3, pan);
  verb.addMono(mb, f.popAt, 0.1);
}

// ---------- wind under the gust, water wash under the dissolve ----------
const [w0, , , w3] = L.WIND;
fx.addMono(I.noiseSweep(w3 - w0, 350, 1400, { q: 0.7, pink: true, seed: 31, shape: (x) => Math.pow(Math.sin(Math.PI * x), 1.5) }), w0, 0.22, -0.2);
fx.addMono(I.noiseSweep(L.DISSOLVE[1] - L.DISSOLVE[0] + 0.3, 5000, 500, { q: 0.9, pink: true, seed: 32 }), L.DISSOLVE[0], 0.3, 0.15);

// ---------- title: each letter pops on a music-box note climbing the scale, a chime on the last ----------
const TITLE_NOTES = ['F5', 'G5', 'A5', 'C6', 'D6', 'C6', 'D6', 'F6'].map(m);
L.letters.forEach((l, i) => {
  fx.addMono(I.pop(2200 + i * 120, 40 + i), l.at, 0.45);
  const mb = I.musicBox(TITLE_NOTES[i], { decay: 1.2 });
  keys.addMono(mb, l.at, 0.22, (i - 3.5) * 0.08);
  verb.addMono(mb, l.at, 0.16);
});
const last = L.letters[L.letters.length - 1].at;
fx.addMono(I.bell(1396.9, 0.5, 2.2), last + E8, 0.25);
fx.addMono(I.ting(m('A6')), last + E8, 0.2);
keys.addMono(I.musicBox(m('F6'), { decay: 2 }), L.TITLE_AT + 1.0, 0.18);

// ---------- mix ----------
const stems = { uke, keys, perc, fx, verb: reverb(verb, { room: 0.82, damp: 0.35 }) };
const GAIN = { uke: 2.4, keys: 1.0, perc: 0.6, fx: 0.8, verb: 1 };
const mix = MIX.mixdown(stems, GAIN);
MIX.highpass(mix, 30);
MIX.fadeOut(mix, L.DURATION - 0.9, L.DURATION);
const M = MIX.master(mix, 0.8, undefined, { lufs: -14 });
const out = path.join(__dirname, '..', 'public', 'music.wav');
MIX.writeWav(out, mix);
console.log(`wrote public/music.wav (${L.DURATION}s, ${M.lufs.toFixed(1)} LUFS)`);
