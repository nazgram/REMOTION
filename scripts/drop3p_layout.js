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

const W = 1080, H = 1920, FPS = 30, DURATION = 16.1;
const BPM = 123.05, BEAT = 60 / BPM, T0 = 0.07;
const bt = (b) => T0 + b * BEAT;
const r3 = (v) => Math.round(v * 1000) / 1000;
let seed = 23;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (a) => a[Math.floor(rnd() * a.length)];

const WAYS = ['Buttercup', 'Camellia', 'Petunia', 'Lavender', 'Marigold'];
const PAGE = { w: 900, h: 1640, y: 140 }, SEG = 1240, SB = 4.8; // page size, page pitch, beats per page
// background colour of each stretch of the strip (from each colourway's own palette), then the cream end page
const BG = { Buttercup: '#e8b561', Camellia: '#c53b73', Petunia: '#3a1418', Lavender: '#9579a5', Marigold: '#cc8069', End: '#ffe8c7' };

// ---- camera: strip x at the screen centre as a function of the beat; eases a little as a page centres ----
const HOLD_FROM = 21.6, HOLD_TO = 24.8, WOB = 0.14;
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
const camX = (t) => { const b = (t - T0) / BEAT; return u(b) * SEG + PAGE.w / 2 + 70 * (1 - smooth(19, HOLD_TO, b)); };
const quant = (t, q = 2) => bt(Math.ceil(((t - T0) / BEAT) * q - 1e-6) / q);
// first time a strip x is left of the screen's right edge minus a margin
function enters(xs, margin = 140) {
  for (let t = 0; t < DURATION; t += 1 / 120) if (xs - camX(t) + W / 2 < W - margin) return t;
  return DURATION;
}

// ---- flowers: the print's four-petal flower heads only ----
const FLOWERS = P.units.map((un, i) => [i, un]).filter(([, un]) => un.r >= 22 && un.r <= 41 && un.p.length >= 9).map(([i]) => i);
const flower = () => pick(FLOWERS);
// ---- stickers: two pink ones per page ----
const STK = ['bow2', 'bow3', 'bow4', 'butterfly1', 'butterfly2', 'butterfly3', 'heartg1', 'heartg2', 'strawberry', 'camera1', 'cherry', 'heartl1', 'bowg1', 'butterfly4'];
let sbag = STK.slice().sort(() => rnd() - 0.5);
const stkSize = (name, target) => { const [w, h] = META.stk[name]; const s = target / Math.max(w, h); return [Math.round(w * s), Math.round(h * s)]; };

// ---- per-page layouts (page-local: origin = the page's top-left) ----
const LAYOUT = [
  { cards: [{ k: 'pol', img: 'cardA', x: 720, y: 40, w: 500, h: 620, rot: 3 }, { k: 'pol', img: 'cardB', x: 690, y: 830, w: 470, h: 590, rot: -2.5 }],
    flowers: [[40, 70, 300], [600, 1610, 360]], tagY: 1290 },
  { cards: [{ k: 'pol', img: 'cardB', x: 790, y: -40, w: 380, h: 470, rot: -5 }, { k: 'ig', img: 'cell', x: 700, y: 560, w: 560, h: 450, rot: 0 }],
    flowers: [[870, 1200, 330], [60, 1520, 300]], tagY: 1290 },
  { cards: [{ k: 'pol', img: 'cardA', x: 680, y: 250, w: 480, h: 600, rot: -4 }, { k: 'pol', img: 'cardB', x: 760, y: 990, w: 440, h: 550, rot: 5 }],
    flowers: [[820, 110, 300], [70, 1590, 340]], tagY: 1290 },
  { cards: [{ k: 'ig', img: 'cell', x: 690, y: 140, w: 560, h: 450, rot: 2 }, { k: 'pol', img: 'cardB', x: 760, y: 830, w: 440, h: 550, rot: -3 }],
    flowers: [[60, 80, 320], [900, 1520, 350]], tagY: 1290 },
  { cards: [{ k: 'pol', img: 'cardA', x: 700, y: 110, w: 500, h: 620, rot: -3 }, { k: 'pol', img: 'cardB', x: 720, y: 900, w: 460, h: 575, rot: 4 }],
    flowers: [[50, 1560, 340], [870, 50, 300]], tagY: 1290 },
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
  const flowers = L.flowers.map(([x, y, size], j) => ({ k: 'flower', u: flower(), way, x, y, size: Math.round(size * 1.2), rot: Math.round(rnd() * 360), at: r3(i === 0 ? bt(1.5 + j) : quant(enters(X + x, 100))), ph: r3(rnd() * 6.28) }));
  const tag = { k: 'tag', x: L.tagY ? 50 : 0, y: L.tagY, w: 330, at: r3(pop + BEAT) };
  return { way, i, X, pop, cards, stk, flowers, tag };
});

// background flowers on a slower layer (parallax 0.75): along the top and bottom edges and in the gaps
const PAR = 0.75;
const bgFlowers = [];
for (let x = -300, j = 0; x < 5 * SEG * PAR + 1200; x += 210 + rnd() * 120, j++) {
  const top = j % 2 === 0;
  const xs = x; // in parallax space
  const stripX = xs / PAR; // which page stretch it sits over (for its colours)
  const wi = Math.max(0, Math.min(4, Math.floor((stripX + 200) / SEG)));
  bgFlowers.push({ u: flower(), way: WAYS[wi], x: r3(xs), y: Math.round(top ? 40 + rnd() * 110 : H - 30 - rnd() * 120), size: Math.round(380 + rnd() * 200), rot: Math.round(rnd() * 360), ph: r3(rnd() * 6.28) });
}

// ---------- end card ----------
const END_X = 5 * SEG;
const Z0 = bt(24.2), Z1 = bt(25.6); const CF = bt(21.4); // corner flowers start as the end page comes in // the cream page grows to fill the screen
const corners = [];
const CWAYS = ['Buttercup', 'Camellia', 'Lavender', 'Marigold'];
for (const [cx, cy] of [[0, 0], [W, 0], [0, H], [W, H]]) {
  const n = 7;
  for (let j = 0; j < n; j++) {
    const ang = (j / (n - 1)) * (Math.PI / 2), d = 90 + rnd() * 300;
    const sx = cx === 0 ? 1 : -1, sy = cy === 0 ? 1 : -1;
    const x = cx + sx * Math.cos(ang) * d, y = cy + sy * Math.sin(ang) * d * 1.15;
    corners.push({ u: flower(), way: pick(CWAYS), x: r3(x), y: r3(y), size: Math.round(380 - d * 0.55 + rnd() * 60), rot: Math.round(rnd() * 360), at: r3(CF + (d / 400) * 0.8 + rnd() * 0.25), ph: r3(rnd() * 6.28) });
  }
}
const END = { x: END_X, z0: r3(Z0), z1: r3(Z1), date: r3(bt(27.4)), nafesa: r3(bt(29.2)) };
const L0 = bt(22.8);
const logo = { at: r3(L0), parts: { flower: L0 + 0.45, leaf: L0 + 0.62, tulip: L0 + 0.7, stem: L0 + 0.7, heart: L0 + 0.85, pill: L0 + 0.55, drop: L0 + 0.6 } };

// ---------- sfx cues ----------
const sfx = { cards: [], stk: [], flowers: [], cutouts: [], whoosh: [r3(Z0 - 0.05)], logo: Object.values(logo.parts).map(r3), corners: corners.map((c) => c.at).sort((a, b) => a - b), date: END.date, nafesa: END.nafesa };
pages.forEach((p) => { p.cards.forEach((c) => sfx.cards.push(c.at)); p.stk.forEach((s) => sfx.stk.push(s.at)); p.flowers.forEach((f) => sfx.flowers.push(f.at)); sfx.cutouts.push(p.pop); });

const out = { W, H, FPS, DURATION, BPM, BEAT, T0, PAGE, SEG, SB, HOLD_FROM, HOLD_TO, WOB, PAR, BG, WAYS, pages, bgFlowers, corners, END, logo, sfx };
fs.writeFileSync(path.join(__dirname, '../src/drop3p/timeline.json'), JSON.stringify(out));
console.log('flowers', FLOWERS.length, 'bg flowers', bgFlowers.length, 'corners', corners.length,
  'pops', pages.map((p) => r3(p.pop)), 'cards', pages.map((p) => p.cards.map((c) => c.at)), 'end', END);
