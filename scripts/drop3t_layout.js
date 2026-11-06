// Timeline for PetalPopDrop3Teaser1 (Petal Pop Drop 3, teaser 1, in the Drop 1 / Drop 2 teaser style: the real
// print full frame, flowers that pop, words in an opening, logo, NAFESA last) with its own moves:
// a garden that grows up from the bottom, hanging-scarf strips, a leaf fan, a tile flip, a scarf that flips and
// folds into a triangle, corner clusters round the logo, strips rising into NAFESA.
//   node scripts/drop3t_layout.js  ->  src/drop3t/timeline.json
// 1080x1920 @30fps, 16 s. Text and logos stay inside the top 1521 px (TikTok UI).
const fs = require('fs');
const path = require('path');
const P = require('../src/drop3t/pattern.json');
const V = require('../src/drop3t/views.json');

const W = 1080, H = 1920, FPS = 30, DURATION = 16;
const TEXT_Y = 900;
let seed = 23;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const r3 = (v) => Math.round(v * 1000) / 1000;

const T = {
  strips: [2.85, 3.85],    // Buttercup -> Camellia: six hanging-scarf strips drop in, left to right
  window: [4.0, 5.45],     // the four-petal opening for "Coming Soon" (opens, closes)
  fan: [5.55, 6.35],       // Camellia -> Petunia: six leaf blades fan open from the centre
  tiles: [7.45, 8.35],     // Petunia -> Lavender: the frame flips over tile by tile from the centre
  zoom: [9.35, 10.3],      // Lavender pulls out to the whole square scarf
  flip: [10.35, 10.85],    // the scarf flips over: Marigold on the other side
  fold: [11.0, 11.65],     // folded corner to corner into a triangle, turned point down
  logo: [12.75, 13.15],    // triangle away, logo builds, corner clusters grow
  rise: [14.3, 14.9],      // strips rise in Camellia magenta
  nafesa: [14.85, 15.4],   // NAFESA
};
const SCARF = { size: 760, cy: 860 };

const screenOf = (C, s, u) => [(u.x - C[0]) * s + W / 2, (u.y - C[1]) * s + H / 2];
const visible = (x, y, r) => x + r > -40 && x - r < W + 40 && y + r > -40 && y - r < H + 40;

// four-petal opening (the Drop 3 ditsy flower): centre disc + four discs at 45 deg
const WIN = { x: W / 2, y: TEXT_Y, R: 300 };
const inWindow = (x, y, R = WIN.R) => {
  const a = R * 0.5, b = R * 0.52;
  if (Math.hypot(x - WIN.x, y - WIN.y) < R * 0.62) return true;
  return [45, 135, 225, 315].some((d) => { const t = (d * Math.PI) / 180; return Math.hypot(x - WIN.x - Math.cos(t) * a, y - WIN.y - Math.sin(t) * a) < b; });
};

// 1. GARDEN (Buttercup): every unit grows up out of its own base, bottom of the frame first, in a wavy front;
//    units inside the opening for "Pétal Pop" stay out
const garden = { way: 'Buttercup', C: V.views.Buttercup, s: V.S, units: [] };
P.units.forEach((u, i) => {
  const [x, y] = screenOf(garden.C, garden.s, u), r = u.r * garden.s;
  if (!visible(x, y, r) || inWindow(x, y, WIN.R * 0.95 + r * 0.5)) return;
  const front = (H - y) / H + 0.06 * Math.sin(x / 140);
  garden.units.push([i, r3(0.04 + front * 1.15 + rnd() * 0.14), Math.round((rnd() - 0.5) * 50)]);
});

// 2. LOGO corners (Buttercup on cream): clusters in the top-left and bottom-right corners only, three sizes
const corners = { way: 'Buttercup', units: [] };
for (const [cx, cy, sx, sy] of [[0, 0, 1, 1], [W, H, -1, -1]]) {
  // three scales: big near the very corner, smaller further out
  for (const [s, reach, inner, dt] of [[2.5, 400, 0, 0], [1.6, 640, 360, 0.12], [1.1, 880, 600, 0.24]]) {
    const C = [cx === 0 ? 700 + rnd() * 600 : 1900 + rnd() * 600, cy === 0 ? 700 + rnd() * 600 : 1900 + rnd() * 600];
    P.units.forEach((u, i) => {
      const x = (u.x - C[0]) * s + cx, y = (u.y - C[1]) * s + cy, r = u.r * s;
      // keep inside the quarter-disc around the corner, this ring of sizes only
      const d = Math.hypot(x - cx, y - cy);
      if (d > reach || d < inner || (x - cx) * sx < -r || (y - cy) * sy < -r) return;
      const at = T.logo[0] + 0.15 + dt + (d / reach) * 0.35 + rnd() * 0.1;
      corners.units.push([i, r3(x), r3(y), s, r3(at), Math.round((rnd() - 0.5) * 70)]);
    });
  }
}

// hanging-scarf strips (in) and rising strips (out to NAFESA)
const strips = Array.from({ length: 6 }, (_, i) => ({ x: i * 180, at: r3(T.strips[0] + i * 0.08 + (i % 2) * 0.03), swing: r3((rnd() - 0.5) * 6) }));
const rise = Array.from({ length: 6 }, (_, i) => ({ x: i * 180, at: r3(T.rise[0] + Math.abs(i - 2.5) * 0.07) }));

// tile flip: 6 x 11 tiles, from the centre outward
const tiles = [];
for (let r = 0; r < 11; r++)
  for (let c = 0; c < 6; c++) {
    const x = c * 180, y = r * 180 - 30;
    const d = Math.hypot(x + 90 - W / 2, y + 90 - TEXT_Y) / 1100;
    tiles.push({ x, y, at: r3(T.tiles[0] + d * 0.5 + rnd() * 0.04) });
  }

const words = {
  petal: { at: 1.25, step: 0.09, out: T.strips[0] + 0.25 },
  soon: { lines: ['Coming', 'Soon'], at: T.window[0] + 0.3, step: 0.18, out: T.window[1] },
  drop: { at: T.fan[1] + 0.1, letters: 0.5, wiggle: T.tiles[1] + 0.15, out: T.zoom[0] + 0.05 },
  date: { lines: ['15 November'], at: T.fold[1] + 0.05, out: T.logo[0] },
};
const L0 = T.logo[0] + 0.15;
const logo = { at: L0, parts: { flower: L0 + 0.45, leaf: L0 + 0.62, tulip: L0 + 0.7, stem: L0 + 0.7, heart: L0 + 0.85, pill: L0 + 0.55, drop: L0 + 0.6 }, out: T.rise[0] + 0.1 };

// SFX cues
const sfx = { pops: [], whoosh: [], swish: [], flips: [], letters: [], drop: [], fold: [], logo: [], corners: [], nafesa: [], sparkle: [] };
const perFrame = {};
for (const u of garden.units) { const f = Math.round(u[1] * FPS); perFrame[f] = (perFrame[f] || 0) + 1; }
Object.entries(perFrame).forEach(([f, n]) => sfx.pops.push([r3(f / FPS), n]));
const cf = {};
for (const u of corners.units) { const f = Math.round(u[4] * FPS); cf[f] = (cf[f] || 0) + 1; }
Object.entries(cf).forEach(([f, n]) => sfx.corners.push([r3(f / FPS), n]));
sfx.swish.push(...strips.map((s) => s.at));
sfx.whoosh.push(T.fan[0], T.zoom[0], T.flip[0], T.rise[0]);
const tf = new Set(tiles.map((t) => Math.round(t.at * 15) / 15));
sfx.flips.push(...[...tf].sort((a, b) => a - b).map(r3));
for (let i = 0; i < 8; i++) sfx.letters.push(r3(words.petal.at + i * words.petal.step));
sfx.letters.push(words.soon.at, r3(words.soon.at + words.soon.step));
sfx.drop.push(words.drop.at, r3(words.drop.at + words.drop.letters), words.drop.wiggle);
sfx.fold.push(T.fold[0] + 0.1, words.date.at);
sfx.logo.push(...Object.values(logo.parts).map(r3));
sfx.nafesa.push(T.nafesa[0]);
sfx.sparkle.push(r3(T.window[0] + 0.1), r3(logo.parts.heart), r3(T.nafesa[0] + 0.2));

const out = { W, H, FPS, DURATION, TEXT_Y, T, SCARF, WIN, garden, corners, strips, rise, tiles, words, logo, sfx };
fs.writeFileSync(path.join(__dirname, '../src/drop3t/timeline.json'), JSON.stringify(out));
console.log('garden', garden.units.length, 'corners', corners.units.length, 'tiles', tiles.length);
