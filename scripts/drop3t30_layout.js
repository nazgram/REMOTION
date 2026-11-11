// Timeline for PetalPopDrop3Teaser30: the Drop 3 teaser (v7 motion: garden, flower-bloom transitions, scarf fold,
// logo, NAFESA last) stretched to ~31 s with the raw shoot footage in it:
//   a fast-cut hook, then for each colourway a four-petal opening in the print grows into the footage
//   (one normal-speed shot, one slow-motion hero) while the print's own flowers stay round the frame edges.
//   node scripts/drop3t30_layout.js  ->  src/drop3t/timeline30.json
// 1080x1920 @30fps. Text and logos stay inside the top 1521 px (TikTok UI).
const fs = require('fs');
const path = require('path');
const P = require('../src/drop3t/pattern.json');
const V = require('../src/drop3t/views.json');

const W = 1080, H = 1920, FPS = 30, DURATION = 31.2;
const TEXT_Y = 900;
let seed = 23;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const r3 = (v) => Math.round(v * 1000) / 1000;

const T = {
  hookClose: [2.15, 2.75], // the hook footage closes into a four-petal opening, the garden is behind it
  garden: 2.15,            // Buttercup garden grows up from the bottom (edge flowers are already there)
  v1: 5.0,                 // Buttercup footage opens where "Pétal Pop" stood
  b1: 8.0,                 // -> Camellia: blooms up from the bottom, settle into the print
  window: 9.4,             // the four-petal opening for "Coming Soon"
  v2: 10.85,               // ... which grows into the Camellia footage
  b2: 13.8,                // -> Petunia: blooms open out from the centre
  v3: 16.3,                // Petunia footage opens where the DROP 3 pill was
  b3: 19.2,                // -> Lavender: blooms drift in from the top-right corner
  v4: [21.0, 22.95],       // Lavender footage opens, then closes back into the print
  zoom: [23.4, 24.3],      // Lavender pulls out to the whole square scarf
  flip: [24.4, 25.1],      // the scarf turns over: Marigold on the other side
  fold: [25.25, 25.95],    // folded corner to corner into a triangle, turned point down
  logo: [27.2, 27.8],      // triangle lifts away softly, logo builds, corner clusters grow
  b4: 28.9,                // Camellia blooms from the centre cover the logo and melt into magenta
  nafesa: [29.9, 30.45],   // NAFESA, once the blooms have melted
};
const BLOOM = { grow: 0.45, spread: 0.55, hold: 0.62, settle: 0.55, cover: 2.1, maskLag: 0.3 };
const BEND = BLOOM.hold + BLOOM.spread * 0.6 + 0.06 + BLOOM.settle + 0.03;
const SCARF = { size: 760, cy: 860 };

const screenOf = (C, s, u) => [(u.x - C[0]) * s + W / 2, (u.y - C[1]) * s + H / 2];
const visible = (x, y, r) => x + r > -40 && x - r < W + 40 && y + r > -40 && y - r < H + 40;

// four-petal opening (the Drop 3 ditsy flower): centre disc + four discs at 45 deg
const WIN = { x: W / 2, y: TEXT_Y, R: 300, RMAX: 1800 };
const inWindow = (x, y, R = WIN.R) => {
  const a = R * 0.5, b = R * 0.52;
  if (Math.hypot(x - WIN.x, y - WIN.y) < R * 0.62) return true;
  return [45, 135, 225, 315].some((d) => { const t = (d * Math.PI) / 180; return Math.hypot(x - WIN.x - Math.cos(t) * a, y - WIN.y - Math.sin(t) * a) < b; });
};

// flowers that stay round the frame while footage plays: the colourway's own units, at their real places in the
// view, inside a wavy band along the frame edges (deeper at the bottom, where the TikTok UI sits anyway)
const edgeBand = (x, y) => {
  const d = Math.min(x, W - x, y * 0.9, (H - y) * 0.6);
  return d < 80 + 38 * Math.sin(x / 150 + y / 210);
};
function edgeUnits(way) {
  const C = V.views[way], s = V.S * 1.03, out = [];
  P.units.forEach((u, i) => {
    const [x, y] = screenOf(C, s, u), r = u.r * s;
    if (!visible(x, y, r) || !edgeBand(x, y)) return;
    out.push([i, r3(1.2 + rnd() * 0.45), r3(rnd() * 6.28)]); // unit, size while the footage shows, sway phase
  });
  return out;
}

// 1. GARDEN (Buttercup): every unit grows up out of its own base, bottom of the frame first, in a wavy front;
//    units inside the opening for "Pétal Pop" stay out. The edge units pop in during the hook, over the footage.
const garden = { way: 'Buttercup', C: V.views.Buttercup, s: V.S, units: [], edge: [] };
P.units.forEach((u, i) => {
  const [x, y] = screenOf(garden.C, garden.s, u), r = u.r * garden.s;
  if (!visible(x, y, r) || inWindow(x, y, WIN.R * 0.95 + r * 0.5)) return;
  if (edgeBand(x, y)) { garden.edge.push([i, r3(0.12 + rnd() * 1.85), Math.round((rnd() - 0.5) * 50), r3(1.2 + rnd() * 0.45), r3(rnd() * 6.28)]); return; }
  const front = (H - y) / H + 0.06 * Math.sin(x / 140);
  garden.units.push([i, r3(T.garden + 0.04 + front * 1.15 + rnd() * 0.14), Math.round((rnd() - 0.5) * 50)]);
});

// 2. LOGO corners (Buttercup on cream): big clusters top-left and bottom-right in three sizes (the first, biggest
//    ring already grows under the folded scarf), smaller ones in the other two corners
const corners = { way: 'Buttercup', units: [] };
const BIG = [[2.5, 400, 0, -1], [1.6, 640, 360, 0.12], [1.1, 880, 600, 0.24]], SMALL = [[1.9, 300, 0, 0.1], [1.2, 470, 260, 0.26]];
for (const [cx, cy, sx, sy, layers] of [[0, 0, 1, 1, BIG], [W, H, -1, -1, BIG], [W, 0, -1, 1, SMALL], [0, H, 1, -1, SMALL]]) {
  for (const [s, reach, inner, dt] of layers) {
    const C = [cx === 0 ? 700 + rnd() * 600 : 1900 + rnd() * 600, cy === 0 ? 700 + rnd() * 600 : 1900 + rnd() * 600];
    P.units.forEach((u, i) => {
      const x = (u.x - C[0]) * s + cx, y = (u.y - C[1]) * s + cy, r = u.r * s;
      const d = Math.hypot(x - cx, y - cy);
      if (d > reach || d < inner || (x - cx) * sx < -r || (y - cy) * sy < -r) return;
      const t0 = dt < 0 ? T.fold[1] - 0.25 : T.logo[0] + 0.15 + dt;
      const at = t0 + (d / reach) * 0.35 + rnd() * 0.1;
      corners.units.push([i, r3(x), r3(y), s, r3(at), Math.round((rnd() - 0.5) * 70)]);
    });
  }
}

// flower transitions (as v7)
function bloom(at, way, origin, landTo = 1) {
  const C = V.views[way], s = V.S;
  const items = [];
  let dmax = 0;
  for (const [cx, cy] of [[0, 0], [W, 0], [0, H], [W, H]]) dmax = Math.max(dmax, Math.hypot(cx - origin[0], cy - origin[1]));
  P.units.forEach((u, i) => {
    const [x, y] = screenOf(C, s, u), r = u.r * s;
    if (!visible(x, y, r * BLOOM.cover)) return;
    const d = Math.hypot(x - origin[0], y - origin[1]);
    items.push([i, r3((d / dmax) * BLOOM.spread + rnd() * 0.06), Math.round((rnd() - 0.5) * 80)]);
  });
  return { at, way, origin, dmax: Math.round(dmax), land: landTo, units: items };
}
const blooms = {
  b1: bloom(T.b1, 'Camellia', [W / 2, H + 500]),
  b2: bloom(T.b2, 'Petunia', [W / 2, TEXT_Y]),
  b3: bloom(T.b3, 'Lavender', [W + 150, -200]),
  b4: bloom(T.b4, 'Camellia', [W / 2, TEXT_Y], 0),
};

// 3. FOOTAGE. shot = id (raw/drop3t/<id>.mp4), start on the timeline, length, speed (1 normal, 0.5 slow motion from
//    the 59.94 fps source), ss = where in the proxy it starts. Frames: scripts/drop3t30_frames.js.
const shot = (id, at, dur, speed, ss) => ({ id, at: r3(at), dur: r3(dur), speed, ss, n: Math.ceil(dur * FPS) + 1 });
const seq = (t0, list) => { let t = t0; return list.map(([id, dur, speed, ss]) => { const s = shot(id, t, dur, speed, ss); t += dur; return s; }); };
const videos = {
  hook: {
    way: 'Buttercup', open: null, close: T.hookClose, r0: 0, until: T.hookClose[1],
    shots: seq(0, [['h1', 0.4, 1, 0.2], ['h3', 0.35, 1, 0.3], ['h7', 0.3, 1, 0.3], ['h5', 0.3, 1, 0.3], ['h6', 0.3, 1, 0.4], ['h8', 0.25, 1, 0.5], ['h4', 0.25, 1, 0.3], ['h2', 0.65, 1, 0.1]]),
  },
  v1: { way: 'Buttercup', open: T.v1, close: null, r0: 0, until: T.b1 + BEND, shots: seq(T.v1, [['butA', 1.3, 1, 0.6], ['butB', T.b1 + 1.05 - T.v1 - 1.3, 0.5, 0.3]]) },
  v2: { way: 'Camellia', open: T.v2, close: null, r0: WIN.R, until: T.b2 + BEND, shots: seq(T.v2 - 0.1, [['camA', 1.4, 1, 0.3], ['camB', T.b2 + 1.05 - T.v2 - 1.3, 0.5, 1.05]]) },
  v3: { way: 'Petunia', open: T.v3, close: null, r0: 0, until: T.b3 + BEND, shots: seq(T.v3, [['petA', 1.25, 1, 0.3], ['petB', T.b3 + 1.05 - T.v3 - 1.25, 0.5, 0.8]]) },
  v4: { way: 'Lavender', open: T.v4[0], close: [T.v4[1], T.v4[1] + 0.5], r0: 0, until: T.v4[1] + 0.5, shots: seq(T.v4[0], [['lavB', T.v4[1] + 0.55 - T.v4[0], 0.5, 0.2]]) },
};
videos.hook.edge = garden.edge.map(([i, at, rot, ks, ph]) => [i, ks, ph, at, rot]);
videos.v1.edge = videos.hook.edge;
for (const k of ['v2', 'v3', 'v4']) videos[k].edge = edgeUnits(videos[k].way);

const words = {
  petal: { at: T.garden + 1.2, step: 0.09, out: T.v1 + 0.1 },
  soon: { lines: ['Coming', 'Soon'], at: T.window + 0.3, step: 0.18, out: T.v2 },
  drop: { at: T.b2 + 1.15, letters: 0.5, wiggle: T.b2 + 1.95, out: T.v3 + 0.1 },
  date: { lines: ['15 November'], at: T.fold[1] + 0.05, out: T.logo[0] },
};
const L0 = T.logo[0] + 0.15;
const logo = { at: L0, parts: { flower: L0 + 0.45, leaf: L0 + 0.62, tulip: L0 + 0.7, stem: L0 + 0.7, heart: L0 + 0.85, pill: L0 + 0.55, drop: L0 + 0.6 }, out: T.b4 + 0.25 };

// SFX cues
const sfx = { pops: [], whoosh: [], blooms: [], letters: [], drop: [], fold: [], logo: [], corners: [], nafesa: [], sparkle: [], cuts: [], opens: [], heroes: [], edge: [] };
const count = (times) => { const f = {}; for (const t of times) { const k = Math.round(t * FPS); f[k] = (f[k] || 0) + 1; } return Object.entries(f).map(([k, n]) => [r3(k / FPS), n]); };
sfx.pops = count(garden.units.map((u) => u[1]));
sfx.edge = count(garden.edge.map((u) => u[1]));
sfx.corners = count(corners.units.map((u) => u[4]));
for (const b of Object.values(blooms)) sfx.blooms.push(count(b.units.map((u) => b.at + u[1])));
sfx.whoosh.push(T.zoom[0], T.flip[0]);
sfx.cuts = videos.hook.shots.map((s) => s.at);
sfx.opens = [T.hookClose[0], T.v1, T.v2, T.v3, T.v4[0], T.v4[1]];
sfx.heroes = ['v1', 'v2', 'v3'].map((k) => videos[k].shots[1].at).concat([T.v4[0] + 0.35]);
for (let i = 0; i < 8; i++) sfx.letters.push(r3(words.petal.at + i * words.petal.step));
sfx.letters.push(words.soon.at, r3(words.soon.at + words.soon.step));
sfx.drop.push(words.drop.at, r3(words.drop.at + words.drop.letters), words.drop.wiggle);
sfx.fold.push(T.fold[0] + 0.1, words.date.at);
sfx.logo.push(...Object.values(logo.parts).map(r3));
sfx.nafesa.push(T.nafesa[0]);
sfx.sparkle.push(r3(T.window + 0.1), r3(logo.parts.heart), r3(T.nafesa[0] + 0.2));

const out = { W, H, FPS, DURATION, TEXT_Y, T, BLOOM, SCARF, WIN, garden, corners, blooms, videos, words, logo, sfx };
fs.writeFileSync(path.join(__dirname, '../src/drop3t/timeline30.json'), JSON.stringify(out));
console.log('garden', garden.units.length, 'edge', garden.edge.length, 'corners', corners.units.length,
  Object.fromEntries(Object.entries(videos).map(([k, v]) => [k, v.edge.length + ' edge, ' + v.shots.map((s) => `${s.id}@${s.at}+${s.dur}`).join(' ')])));
