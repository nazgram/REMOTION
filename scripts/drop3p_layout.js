// Timeline for PetalPopDrop3Photo: the ten Drop 3 photos in the style of the two TikTok references, on the song of
// reference 1 (123 BPM, 33 beats in 16.1 s):
//   A (beats 0-16)  camera pans along a strip of five white-framed pages (one per colourway), each with the model
//                   cut out with a torn white border, two tilted polaroid cards and pink stickers + the print's own
//                   flowers (die-cut) that pop as they come into view
//   B (beats 16-27) 2 x 5 grid of face crops (one row per colourway), cut-outs lift out of the cells, stickers slapped on
//                   in stop-motion wiggle
//   C (beats 27-33) the grid zooms away, cream end card: Pétal Pop logo, 15 November, corner flowers, NAFESA last
//   node scripts/drop3p_layout.js  ->  src/drop3p/timeline.json
const fs = require('fs');
const path = require('path');
const P = require('../src/drop3t/pattern.json');
const META = require('../public/drop3p/meta.json');

const W = 1080, H = 1920, FPS = 30, DURATION = 16.1;
const BPM = 123.05, BEAT = 60 / BPM, T0 = 0.07;
const bt = (b) => T0 + b * BEAT;
const r3 = (v) => Math.round(v * 1000) / 1000;
let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (a) => a[Math.floor(rnd() * a.length)];

const WAYS = ['Buttercup', 'Camellia', 'Petunia', 'Lavender', 'Marigold'];
const PAGE = { w: 960, h: 1700, x: 60, y: 110 }, SPACING = 1040, PAGE_BEATS = 3.2;

// ---- camera: the strip x (centre of the screen) as a function of the beat; slows a little as a page centres ----
const HOLD_FROM = 11.2, HOLD_TO = 13.6, U_HOLD = 3.5;
function u(b) {
  const lin = (x) => x / PAGE_BEATS;
  if (b <= HOLD_FROM) return lin(b) - (0.16 * Math.sin(2 * Math.PI * lin(b))) / (2 * Math.PI);
  if (b >= HOLD_TO) return 4;
  const T = HOLD_TO - HOLD_FROM, tau = (b - HOLD_FROM) / T;
  const h00 = 2 * tau ** 3 - 3 * tau ** 2 + 1, h10 = tau ** 3 - 2 * tau ** 2 + tau, h01 = -2 * tau ** 3 + 3 * tau ** 2;
  const m0 = (1 - 0.16 * Math.cos(2 * Math.PI * lin(HOLD_FROM))) / PAGE_BEATS;
  return h00 * (U_HOLD - 0.16 * Math.sin(2 * Math.PI * U_HOLD) / (2 * Math.PI)) + h10 * T * m0 + h01 * 4;
}
const camX = (t) => u((t - T0) / BEAT) * SPACING;
const quant = (t) => bt(Math.ceil(((t - T0) / BEAT) * 2 - 1e-6) / 2); // next half beat
// first time an element at strip x (its centre) is within the screen (centre 540, half-width margin)
function enters(xStrip, margin = 170) {
  for (let t = 0; t < bt(16); t += 1 / 60) if (xStrip - camX(t) + 540 < W - margin) return t;
  return bt(16);
}

// ---- stickers ----
const STK_OK = ['bow2', 'bow3', 'bow4', 'bow5', 'bowg1', 'bowg2', 'butterfly1', 'butterfly2', 'butterfly3', 'butterfly4', 'camera1', 'camera2', 'candle', 'cat', 'cherry',
  'cloud1', 'cup1', 'cup2', 'envelope', 'hat', 'headphones', 'heart1', 'heart2', 'heart4', 'heart5', 'hearts5', 'heartg1', 'heartg2', 'heartg3', 'heartg4', 'heartg5',
  'heartl1', 'heartl2', 'jar', 'moon', 'polaroid', 'scrunchie', 'strawberry', 'sunglasses', 'books'];
const BIG = new Set(['camera1', 'camera2', 'cat', 'cup1', 'cup2', 'books', 'hat', 'headphones', 'polaroid', 'sunglasses', 'envelope', 'butterfly1', 'butterfly2', 'butterfly3', 'butterfly4', 'strawberry', 'scrunchie', 'jar', 'cherry', 'bowg1', 'bowg2', 'bow2', 'bow3', 'bow4', 'candle']);
const SMALL = STK_OK.filter((n) => !BIG.has(n));
let bag = [];
const nextBig = () => { if (!bag.length) bag = STK_OK.filter((n) => BIG.has(n)).sort(() => rnd() - 0.5); return bag.pop(); };
const stkSize = (name, target) => { const [w, h] = META.stk[name]; const s = target / Math.max(w, h); return [Math.round(w * s), Math.round(h * s)]; };

// flower stickers: the colourway's own biggest units
const unitsBy = P.units.map((u, i) => [i, u.r]).filter(([, r]) => r > 70 && r < 175).map(([i]) => i);
const flowerPick = () => pick(unitsBy);

// ---------- A: the strip ----------
const pages = WAYS.map((way, i) => {
  const X = i * SPACING, flip = i % 2 === 1;
  const fx = (x, w = 0) => (flip ? PAGE.w - x - w : x); // mirror page-local x for odd pages
  const els = [];
  const at = (cx, minB) => {
    const t = i === 0 ? bt(minB) : Math.max(quant(enters(X + PAGE.x + cx)), bt(Math.max(0, i * PAGE_BEATS - 1.8)));
    return r3(t);
  };
  // the model cut-out with its torn border sits on the page from the start of the page's approach
  els.push({ k: 'cut', at: r3(i === 0 ? bt(0.5) : quant(enters(X + PAGE.x + 480, 300))) });
  const cardA = { k: 'cardA', x: fx(650, 330) , y: 150, w: 330, h: 412, rot: flip ? -6 : 6 };
  const cardB = { k: 'cardB', x: fx(-80, 300), y: 1040, w: 300, h: 375, rot: flip ? 5 : -5 };
  cardA.at = at(cardA.x + 165, 1); cardB.at = at(cardB.x + 150, 2);
  els.push(cardA, cardB);
  els.push({ k: 'tag', x: fx(470, 400), y: 1330, w: 400, rot: flip ? 3 : -3, at: at(fx(470, 400) + 200, 3) });
  const slots = [[110, 170, 'big', 230], [60, 760, 'big', 250], [880, 1090, 'big', 250], [330, 1600, 'big', 270], [900, 800, 'small', 130], [190, 1000, 'small', 120]];
  slots.forEach(([sx, sy, kind, size], j) => {
    const name = kind === 'big' ? nextBig() : pick(SMALL);
    const [w, h] = stkSize(name, size);
    const x = fx(sx), dx = (j % 2 ? -1 : 1) * rnd() * 16;
    els.push({ k: 'stk', name, x: r3(x + dx), y: sy, w, h, rot: Math.round((rnd() - 0.5) * 36), at: at(x, 1 + j * 0.5), ph: r3(rnd() * 6.28) });
  });
  const fslots = [[160, 520, 200], [820, 880, 210], [760, 1480, 190], [120, 1380, 180]];
  fslots.forEach(([sx, sy, size], j) => els.push({ k: 'flower', u: flowerPick(), x: fx(sx), y: sy, size, rot: Math.round((rnd() - 0.5) * 60), at: at(fx(sx), 1.5 + j * 0.5), ph: r3(rnd() * 6.28) }));
  return { way, i, X, flip, els };
});

// ---------- B: the grid ----------
const B0 = 16, B1 = 27;
const cells = [];
WAYS.forEach((way, r) => {
  const info = META.ways[way];
  const order = r % 2 ? ['B', 'A'] : ['A', 'B'];
  order.forEach((role, c) => cells.push({ k: info[role].cell, way, row: r, col: c, at: r3(bt(B0 + 0.5 * (r * 2 + c))) , lift: r3(bt(B0 + 5.5 + 0.5 * (r * 2 + c))) }));
});
const gridStk = [];
const GRID_SLOTS = [[130, 380], [940, 250], [520, 770], [920, 1150], [140, 1530], [560, 1920 - 330], [980, 1700], [60, 940], [700, 560], [330, 1140], [1000, 560], [420, 330], [780, 1380], [250, 1780]];
GRID_SLOTS.forEach(([x, y], j) => {
  const big = j % 3 !== 2;
  const name = big ? nextBig() : pick(SMALL);
  const [w, h] = stkSize(name, big ? 230 : 130);
  gridStk.push({ k: 'stk', name, x, y, w, h, rot: Math.round((rnd() - 0.5) * 40), at: r3(bt(B0 + 6.5 + j * 0.28)), ph: r3(rnd() * 6.28) });
});
const gridFlowers = [];
[[540, 380], [60, 770], [1020, 770], [540, 1150], [1040, 1540], [40, 1920 - 40], [540, 1530]].forEach(([x, y], j) => {
  gridFlowers.push({ k: 'flower', u: flowerPick(), way: WAYS[Math.floor(y / 384)], x, y, size: 190, rot: Math.round((rnd() - 0.5) * 60), at: r3(bt(B0 + 7 + j * 0.3)), ph: r3(rnd() * 6.28) });
});

// ---------- C: end card ----------
const C0 = bt(B1);
const corners = [];
for (const [cx, cy, sx, sy] of [[0, 0, 1, 1], [W, H, -1, -1], [W, 0, -1, 1], [0, H, 1, -1]]) {
  for (const [s, reach, inner, dt] of [[2.1, 380, 0, 0.1], [1.4, 600, 330, 0.26]]) {
    const Cc = [cx === 0 ? 700 + rnd() * 600 : 1900 + rnd() * 600, cy === 0 ? 700 + rnd() * 600 : 1900 + rnd() * 600];
    P.units.forEach((un, i) => {
      const x = (un.x - Cc[0]) * s + cx, y = (un.y - Cc[1]) * s + cy, r = un.r * s;
      const d = Math.hypot(x - cx, y - cy);
      if (d > reach || d < inner || (x - cx) * sx < -r || (y - cy) * sy < -r) return;
      corners.push([i, r3(x), r3(y), s, r3(C0 + 0.35 + dt + (d / reach) * 0.4 + rnd() * 0.1), Math.round((rnd() - 0.5) * 70)]);
    });
  }
}
const END = { at: r3(C0 + 0.3), date: r3(bt(B1 + 3.0)), nafesa: r3(bt(B1 + 4.2)) };
const L0 = END.at + 0.1;
const logo = { at: r3(L0), parts: { flower: L0 + 0.45, leaf: L0 + 0.62, tulip: L0 + 0.7, stem: L0 + 0.7, heart: L0 + 0.85, pill: L0 + 0.55, drop: L0 + 0.6 } };

// ---------- sfx cues ----------
const sfx = { pops: [], cells: [], lifts: [], whoosh: [], logo: [], nafesa: END.nafesa, date: END.date, flash: bt(B0), zoom: C0, cuts: [] };
pages.forEach((p) => p.els.forEach((e) => { if (e.k === 'stk' || e.k === 'flower') sfx.pops.push(e.at); if (e.k === 'cardA' || e.k === 'cardB') sfx.pops.push(e.at); }));
gridStk.concat(gridFlowers).forEach((e) => sfx.pops.push(e.at));
cells.forEach((c) => { sfx.cells.push(c.at); sfx.lifts.push(c.lift); });
sfx.whoosh = [bt(B0 - 0.1), C0];
sfx.logo = Object.values(logo.parts).map(r3);
sfx.pops.sort((a, b) => a - b);

const out = { W, H, FPS, DURATION, BPM, BEAT, T0, PAGE, SPACING, PAGE_BEATS, HOLD_FROM, HOLD_TO, U_HOLD, WAYS, B0, B1, pages, cells, gridStk, gridFlowers, corners, END, logo, sfx };
fs.writeFileSync(path.join(__dirname, '../src/drop3p/timeline.json'), JSON.stringify(out));
console.log('pages', pages.map((p) => p.els.length), 'grid stk', gridStk.length, 'corners', corners.length, 'pops', sfx.pops.length, 'beat', r3(BEAT), 'B0', r3(bt(B0)), 'C0', r3(C0));
