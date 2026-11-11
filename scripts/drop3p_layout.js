// Timeline for PetalPopDrop3Photo v2, laid out like TikTok reference 1 on its song (123 BPM, 33 beats in 16.1 s):
// the camera pans without stopping along a strip of tall white-framed pages, one per colourway. Between two pages
// big tilted polaroids / a feed card overlap the page edge; the model on each page is cut out with a thin torn
// white border + a coloured line and pops off the page as it centres (the photo behind dims). The background takes
// each colourway's colour; big flower heads from the Petal Pop 3 print (no stems, no outline) sit behind and in
// front; only two pink stickers per page. The strip ends on a cream page that grows to fill the screen: logo,
// 15 November, flower corners, NAFESA last.
//   node scripts/drop3p_layout.js  ->  src/drop3p/timeline.json
const fs = require('fs');
const path = require('path');
const P = require('../src/drop3t/pattern.json');
const META = require('../public/drop3p/meta.json');

const W = 1080, H = 1920, FPS = 30, DURATION = 24.6;
// song: April Rain Rhythm - Funky Groove Town, from 0:08 (103.2 BPM, a beat on 0:08)
const BPM = 103.2, BEAT = 60 / BPM, T0 = 0.0;
const bt = (b) => T0 + b * BEAT;
const r3 = (v) => Math.round(v * 1000) / 1000;
let seed = 23;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (a) => a[Math.floor(rnd() * a.length)];

const WAYS = ['Buttercup', 'Camellia', 'Petunia', 'Lavender', 'Marigold'];
const PAGE = { w: 900, h: 1640, y: 140 }, SEG = 1240, SB = 6.5; // page size, page pitch, beats per page
// background colour of each stretch of the strip (from each colourway's own palette), then the cream end page
const BG = { Buttercup: '#e8b561', Camellia: '#c53b73', Petunia: '#3a1418', Lavender: '#9579a5', Marigold: '#cc8069', End: '#ffe8c7' };

// ---- camera: strip x at the screen centre as a function of the beat; eases a little as a page centres ----
const HOLD_FROM = 4.5 * 6.5, HOLD_TO = 33.5, WOB = 0.6, OFF_FROM = 26; // WOB: how much the camera slows on each page
const ulin = (b) => b / SB - (WOB * Math.sin((2 * Math.PI * b) / SB)) / (2 * Math.PI);
function u(b) {
  if (b <= HOLD_FROM) return ulin(b);
  if (b >= HOLD_TO) return 5;
  const T = HOLD_TO - HOLD_FROM, tau = (b - HOLD_FROM) / T;
  const h00 = 2 * tau ** 3 - 3 * tau ** 2 + 1, h10 = tau ** 3 - 2 * tau ** 2 + tau, h01 = -2 * tau ** 3 + 3 * tau ** 2;
  const m0 = (1 - WOB * Math.cos((2 * Math.PI * HOLD_FROM) / SB)) / SB;
  return h00 * ulin(HOLD_FROM) + h10 * T * m0 + h01 * 5;
}
const smooth = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
const camX = (t) => { const b = (t - T0) / BEAT; return u(b) * SEG + PAGE.w / 2 + 70 * (1 - smooth(OFF_FROM, HOLD_TO, b)); };
const quant = (t, q = 2) => bt(Math.ceil(((t - T0) / BEAT) * q - 1e-6) / q);
// first time a strip x is left of the screen's right edge minus a margin
function enters(xs, margin = 140) {
  for (let t = 0; t < DURATION; t += 1 / 120) if (xs - camX(t) + W / 2 < W - margin) return t;
  return DURATION;
}

// ---- flowers: the print's four-petal flower heads only ----
const FLOWERS = P.units.map((un, i) => [i, un]).filter(([, un]) => un.r >= 22 && un.r <= 41 && un.p.length >= 9).map(([i]) => i);
const flower = () => pick(FLOWERS);
// ---- print clusters (like the teaser's edge flowers): the print's own arrangement of leaves, flower heads and dots
//      inside a wavy band that straddles a page edge; no stalk branches (r >= 95) ----
const CS = 1.6, KS = 1.35; // print scale, extra growth of each unit
function band(way, [x0, y0, x1, y1], tEnter) {
  const len = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / len, uy = (y1 - y0) / len;
  const Cc = [700 + rnd() * 1840, 700 + rnd() * 1840], ph = rnd() * 6.28;
  const out = [];
  P.units.forEach((un, i) => {
    if (un.r >= 95) return;
    const x = (un.x - Cc[0]) * CS + (x0 + x1) / 2, y = (un.y - Cc[1]) * CS + (y0 + y1) / 2;
    const a = (x - x0) * ux + (y - y0) * uy, d = Math.abs((x - x0) * -uy + (y - y0) * ux); // along / across the edge
    if (a < -60 || a > len + 60) return;
    const taper = Math.sin(Math.PI * Math.min(1, Math.max(0, (a + 60) / (len + 120))));
    const depth = (190 + 80 * Math.sin(a / 160 + ph)) * Math.sqrt(taper);
    if (d > depth) return;
    out.push([i, r3(x), r3(y), r3(tEnter + (a / len) * 0.7 + (d / 250) * 0.25 + rnd() * 0.12), Math.round((rnd() - 0.5) * 60), r3(rnd() * 6.28)]);
  });
  return out;
}
// ---- stickers: two pink ones per page ----
const STK = ['bow2', 'bow3', 'bow4', 'butterfly1', 'butterfly2', 'butterfly3', 'heartg1', 'heartg2', 'strawberry', 'camera1', 'cherry', 'heartl1', 'bowg1', 'butterfly4'];
let sbag = STK.slice().sort(() => rnd() - 0.5);
const stkSize = (name, target) => { const [w, h] = META.stk[name]; const s = target / Math.max(w, h); return [Math.round(w * s), Math.round(h * s)]; };

// ---- per-page layouts (page-local: origin = the page's top-left) ----
const LAYOUT = [
  { cards: [{ k: 'pol', img: 'cardA', x: 720, y: 40, w: 500, h: 620, rot: 3 }, { k: 'pol', img: 'cardB', x: 690, y: 830, w: 470, h: 590, rot: -2.5 }],
    bands: [[0, 200, 0, 1100], [0, 1640, 700, 1640]], tagY: 1290 },
  { cards: [{ k: 'pol', img: 'cardB', x: 790, y: -40, w: 380, h: 470, rot: -5 }, { k: 'ig', img: 'cell', x: 700, y: 560, w: 560, h: 450, rot: 0 }],
    bands: [[0, 0, 650, 0], [0, 950, 0, 1640]], tagY: 1290 },
  { cards: [{ k: 'pol', img: 'cardA', x: 680, y: 250, w: 480, h: 600, rot: -4 }, { k: 'pol', img: 'cardB', x: 760, y: 990, w: 440, h: 550, rot: 5 }],
    bands: [[100, 0, 900, 0], [0, 1640, 600, 1640]], tagY: 1290 },
  { cards: [{ k: 'ig', img: 'cell', x: 690, y: 140, w: 560, h: 450, rot: 2 }, { k: 'pol', img: 'cardB', x: 760, y: 830, w: 440, h: 550, rot: -3 }],
    bands: [[0, 0, 0, 800], [200, 1640, 900, 1640]], tagY: 1290 },
  { cards: [{ k: 'pol', img: 'cardA', x: 700, y: 110, w: 500, h: 620, rot: -3 }, { k: 'pol', img: 'cardB', x: 720, y: 900, w: 460, h: 575, rot: 4 }],
    bands: [[0, 0, 650, 0], [0, 1050, 0, 1640]], tagY: 1290 },
];

const pages = WAYS.map((way, i) => {
  const X = i * SEG, L = LAYOUT[i];
  // the cut-out pops when the page has nearly centred
  const pop = r3(i === 0 ? bt(1) : quant(enters(X + PAGE.w / 2, W / 2 - 80), 1));
  let prev = 0;
  const cards = L.cards.map((c, j) => {
    const at = r3(i === 0 ? bt(0.5 + j) : Math.max(quant(enters(X + c.x + c.w / 2, 60)), bt(i * SB - 1.2), prev + BEAT * 0.5));
    prev = at;
    return { ...c, cell: META.ways[way].B.cell, at };
  });
  const stk = cards.map((c, j) => {
    if (!sbag.length) sbag = STK.slice().sort(() => rnd() - 0.5);
    const name = sbag.pop();
    const [w, h] = stkSize(name, 180 + rnd() * 40);
    const x = j === 0 ? c.x + c.w - 30 : c.x + 30, y = j === 0 ? c.y + 30 : c.y + c.h - 30;
    return { k: 'stk', name, x: r3(x), y: r3(y), w, h, rot: Math.round((rnd() - 0.5) * 40), at: r3(c.at + BEAT * 0.5), ph: r3(rnd() * 6.28) };
  });
  const clusters = L.bands.map((b, j) => band(way, b, i === 0 ? bt(0.2 + j * 1.2) : quant(enters(X + Math.min(b[0], b[2]) + 80, 40))));
  const tag = { k: 'tag', x: L.tagY ? 50 : 0, y: L.tagY, w: 330, at: r3(pop + BEAT) };
  return { way, i, X, pop, cards, stk, clusters, tag };
});

// ---------- end card: the same as the v7 teaser's (src/drop3t/timeline.json), shifted by D ----------
// logo + corner clusters in three sizes on cream, Camellia blooms from the centre melt it into magenta, NAFESA last.
// Here the cream page at the end of the strip grows to fill the screen while the logo builds.
const T7 = require('../src/drop3t/timeline.json');
const END_X = 5 * SEG;
const Z0 = bt(31.5), Z1 = bt(33.2);
const D = 18.9 - T7.logo.at, HOLD = 1.0; // HOLD: extra time on the logo before the Camellia bloom
const sh2 = (v) => r3(v + D + HOLD);
const sh = (v) => r3(v + D);
const corners = T7.corners.units.map(([i, x, y, s, at, rot]) => [i, x, y, s, r3(sh(at) - 2.2), rot]); // earlier: they grow in as the page arrives
const logo = { at: sh(T7.logo.at), parts: Object.fromEntries(Object.entries(T7.logo.parts).map(([k, v]) => [k, sh(v)])), out: sh2(T7.logo.out) };
const B7 = T7.BLOOM, BEND = B7.hold + B7.spread * 0.6 + 0.06 + B7.settle + 0.03;
const END = { x: END_X, z0: r3(Z0), z1: r3(Z1), D: r3(D), date: r3(logo.at + 0.55), bloom: sh2(T7.blooms.b4.at), magenta: r3(sh2(T7.blooms.b4.at) + BEND), nafesa: sh2(T7.T.nafesa[0]) };

// ---------- sfx cues ----------
const sfx = { cards: [], stk: [], flowers: [], cutouts: [], whoosh: [r3(Z0 - 0.05)], logo: Object.values(logo.parts).map(r3), corners: corners.map((c) => c[4]).sort((a, b) => a - b), date: END.date, bloom: END.bloom, nafesa: END.nafesa };
pages.forEach((p) => { p.cards.forEach((c) => sfx.cards.push(c.at)); p.stk.forEach((s) => sfx.stk.push(s.at)); p.clusters.forEach((c) => c.forEach((u, j) => { if (j % 4 === 0) sfx.flowers.push(u[3]); })); sfx.cutouts.push(p.pop); });

const out = { W, H, FPS, DURATION, BPM, BEAT, T0, PAGE, SEG, SB, HOLD_FROM, HOLD_TO, WOB, OFF_FROM, CS, KS, BG, WAYS, pages, corners, END, logo, sfx };
fs.writeFileSync(path.join(__dirname, '../src/drop3p/timeline.json'), JSON.stringify(out));
console.log('flowers', FLOWERS.length, 'clusters', pages.map((p) => p.clusters.map((c) => c.length)), 'corners', corners.length,
  'pops', pages.map((p) => r3(p.pop)), 'cards', pages.map((p) => p.cards.map((c) => c.at)), 'end', END);
