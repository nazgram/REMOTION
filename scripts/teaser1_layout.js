// Timeline for PetalPopTeaser1 (Petal Pop Drop 2, teaser 1): which scarf flowers pop when, per scene, plus every SFX cue.
//   node scripts/teaser1_layout.js  ->  src/teaser1/timeline.json
// Screen 1080x1920 @30fps, 10 s. TikTok UI covers the bottom, so text and logos sit inside the top 1521 px.
const fs = require('fs');
const path = require('path');
const P = require('../src/teaser1/pattern.json');

const W = 1080, H = 1920, FPS = 30, DURATION = 15;
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// scenes: colourway, view (tile point C at screen (540, Y0), tile scale s), and the screen box kept clear for the words
const TEXT_Y = 960; // frame centre // vertical centre of every word / logo
const scenes = {
  petal:   { way: 'Butter Bliss',   C: [1620, 1620], s: 0.8, clear: [540, TEXT_Y, 330] },
  bloom:   { way: 'Vanilla Sky',    C: [1350, 1500], s: 0.8, clear: [540, TEXT_Y, 320] },
  drop1:   { way: 'Expresso Poppy', C: [1900, 1700], s: 0.8, clear: [540, TEXT_Y, 300] },
  drop2:   { way: 'Forest Bloom',   C: [1480, 1850], s: 0.8, clear: [540, TEXT_Y, 300] },
  tuned:   { way: 'Olive Spritz',   C: [1620, 1620], s: 0.8, clear: null },
  logo:    { way: 'Butter Bliss',   C: [1700, 1400], s: 0.8, clear: [540, TEXT_Y, 420] },
};
const T = {
  wipe1: [2.9, 3.75],     // diagonal floral wipe Butter Bliss -> Vanilla Sky
  iris1: [5.6, 6.3],      // round bloom iris -> Expresso Poppy
  iris2: [7.3, 8.0],      // round bloom iris -> Forest Bloom
  wipe2: [8.75, 9.6],     // floral wipe top -> bottom -> Olive Spritz
  zoom: [10.1, 11.1],     // zoom out: the whole Olive Spritz scarf as a square on Butter Bliss cream
  shrink: [12.0, 12.45],  // scarf shrinks away, logo scales up
  outro: [13.75, 14.25],  // flowers + logo leave, NAFESA on Expresso brown
  nafesa: [14.15, 14.7],  // NAFESA fades in, holds to the end
};
const SCARF = { size: 760, cy: 880 }; // full scarf square after the zoom

const screenOf = (sc, u) => [(u.x - sc.C[0]) * sc.s + W / 2, (u.y - sc.C[1]) * sc.s + H / 2];
// the words sit in a round opening in the flowers
const inClear = (sc, x, y, r) => sc.clear && Math.hypot(x - sc.clear[0], y - sc.clear[1]) < sc.clear[2] + r;
const visible = (x, y, r) => x + r > -40 && x - r < W + 40 && y + r > -40 && y - r < H + 40;

function build(name, popOf) {
  const sc = scenes[name];
  sc.units = [];
  P.units.forEach((u, i) => {
    const [x, y] = screenOf(sc, u), r = u.r * sc.s;
    if (!visible(x, y, r) || inClear(sc, x, y, r * 0.6)) return;
    const pop = popOf(x, y, u);
    if (pop) sc.units.push([i, ...pop.map((v) => Math.round(v * 1000) / 1000)]);
  });
}

// 1. PETAL POP: flowers pop in from the four edges toward the centre (outermost first), sliding in from their nearest edge
build('petal', (x, y, u) => {
  const dl = x, dr = W - x, dt = y, db = H - y, m = Math.min(dl, dr, dt, db);
  const e = 1 - Math.min(1, Math.hypot(x - 540, y - TEXT_Y) / 1100); // outermost first, closing in as a circle
  const dir = m === dl ? [-1, 0] : m === dr ? [1, 0] : m === dt ? [0, -1] : [0, 1];
  return [0.1 + e * 1.35 + rnd() * 0.16, dir[0] * 90, dir[1] * 90, (rnd() - 0.5) * 70];
});
// 2. BLOOMING SOON: flowers bloom outward from the middle with a twist
build('bloom', (x, y) => {
  const dx = x - 540, dy = y - TEXT_Y, d = Math.hypot(dx, dy) || 1;
  return [T.wipe1[0] + 0.4 + Math.min(1, d / 1150) * 1.1 + rnd() * 0.1, (-dx / d) * 110, (-dy / d) * 110, -60 - rnd() * 60];
});
// 3. DROP 2: two fast colourways, flowers pop in rings on the eighth notes
for (const [name, t0] of [['drop1', T.iris1[0] + 0.2], ['drop2', T.iris2[0] + 0.2]]) {
  build(name, (x, y) => {
    const ring = Math.floor(Math.hypot(x - 540, y - TEXT_Y) / 260);
    return [t0 + ring * 0.1 + rnd() * 0.06, 0, 0, (rnd() - 0.5) * 90];
  });
}
// 4. STAY TUNED: the pattern spreads from the centre until the scarf is complete (every unit, so the zoom-out shows it all)
{
  const sc = scenes.tuned;
  sc.units = P.units.map((u, i) => {
    const [x, y] = screenOf(sc, u);
    // bloom right behind the wipe's flower edge (top to bottom), so the scarf fills in as the wipe passes
    const e = Math.min(1, Math.max(0, (y + 200) / (H + 760)));
    return [i, Math.round((T.wipe2[0] + 0.05 + e * (T.wipe2[1] - T.wipe2[0]) * 1.1 + rnd() * 0.1) * 1000) / 1000, 0, 0, Math.round((rnd() - 0.5) * 80)];
  });
}
// 5. LOGO: a frame of Butter Bliss flowers around the logo, top and bottom bands first
build('logo', (x, y) => {
  const d = Math.min(1, Math.abs(y - TEXT_Y) / 900);
  return [T.shrink[0] + 0.2 + (1 - d) * 0.5 + rnd() * 0.12, 0, 0, (rnd() - 0.5) * 80, T.outro[0] + (1 - d) * 0.08 + rnd() * 0.35];
});

// the iris shape: a five-petal scarf flower
const IRIS = P.units.findIndex((u) => u.k === 'f' && u.p.length === 5 && new Set(u.p.map((p) => p[1])).size === 1);

// floral wipe bands: big flowers on a grid, each one blooms as the wipe edge passes it
function band(dir, palette, step = 210) {
  const cells = [];
  for (let y = -100; y <= H + 100; y += step * 0.866)
    for (let x = -100 + ((Math.round(y / (step * 0.866)) % 2) * step) / 2; x <= W + 100; x += step) {
      const units = P.units.filter((u) => u.k === 'f');
      cells.push({ x: Math.round(x + (rnd() - 0.5) * 50), y: Math.round(y + (rnd() - 0.5) * 50), unit: P.units.indexOf(units[Math.floor(rnd() * units.length)]), rot: Math.round(rnd() * 360) });
    }
  return { dir, palette, cells };
}
const wipes = {
  wipe1: { ...band([0.7071, -0.7071], 'Vanilla Sky'), at: T.wipe1 },   // from bottom-left to top-right
  wipe2: { ...band([0, 1], 'Olive Spritz'), at: T.wipe2 },             // from top to bottom
};

// words
const words = {
  // at = first pop, out = gone (each word eases out over the 0.35 s before it, ahead of the transition)
  petal: { at: 1.2, step: 0.11, out: T.wipe1[0] + 0.05 },          // logo letters P e t a l P o p
  bloom: { lines: ['Blooming', 'Soon'], at: T.wipe1[1] + 0.25, step: 0.3, out: T.iris1[0] + 0.05 },
  drop:  { at: T.iris1[1] + 0.15, pulse: T.iris2[0] + 0.1, out: T.wipe2[0] + 0.15 },
  tuned: { lines: ['Stay Tuned'], at: T.zoom[1] - 0.1, step: 0.2, out: T.shrink[0] + 0.05 },
};
const L0 = T.shrink[1];
const logo = { at: L0 - 0.08, parts: { flower: L0 + 0.3, leaf: L0 + 0.4, tulip: L0 + 0.52, stem: L0 + 0.52, heart: L0 + 0.66, pill: L0 + 0.42, drop: L0 + 0.42 } };

// SFX cues (seconds). Pops are bundled per frame so ~1000 flower pops stay a soft patter.
const sfx = { pops: [], whoosh: [], bloop: [], sparkle: [], letters: [], drop: [], logo: [], nafesa: [] };
const perFrame = {};
for (const name of ['petal', 'bloom', 'drop1', 'drop2', 'logo']) for (const u of scenes[name].units) {
  const f = Math.round(u[1] * FPS);
  perFrame[f] = (perFrame[f] || 0) + 1;
}
for (const u of scenes.tuned.units) {
  const [x, y] = screenOf(scenes.tuned, P.units[u[0]]);
  if (visible(x, y, 0)) { const f = Math.round(u[1] * FPS); perFrame[f] = (perFrame[f] || 0) + 1; }
}
Object.entries(perFrame).forEach(([f, n]) => sfx.pops.push([Math.round((f / FPS) * 1000) / 1000, n]));
sfx.whoosh.push(T.wipe1[0] - 0.05, T.iris1[0] - 0.12, T.iris2[0] - 0.12, T.wipe2[0] - 0.05, T.zoom[0], T.shrink[0], T.outro[0]);
sfx.bloop.push(T.iris1[0] + 0.05, T.iris2[0] + 0.05);
sfx.sparkle.push(words.bloom.at + 0.1, words.tuned.at + 0.1, logo.parts.heart, T.nafesa[0] + 0.15);
for (let i = 0; i < 8; i++) sfx.letters.push(words.petal.at + i * words.petal.step);
sfx.drop.push(words.drop.at, words.drop.pulse);
sfx.logo.push(logo.at, ...Object.values(logo.parts));
sfx.nafesa.push(T.nafesa[0]);

const out = { W, H, FPS, DURATION, TEXT_Y, T, SCARF, IRIS, scenes, wipes, words, logo, sfx };
fs.writeFileSync(path.join(__dirname, '../src/teaser1/timeline.json'), JSON.stringify(out));
console.log(Object.fromEntries(Object.entries(scenes).map(([k, v]) => [k, v.units.length])), 'iris', IRIS);
