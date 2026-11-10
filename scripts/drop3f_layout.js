// Timeline for PetalPopDrop3Fabric: the Drop 3 catalog as a "fabric" reel (9:16, SFX only).
// Each colourway's print falls in like a silk scarf, shows its name, then a corner of the fabric is lifted and peeled
// away to reveal that colourway's catalog page. Opens on the Buttercup silk + a swinging logo hang-tag peeled off to the
// cover; ends with five print ribbons, the tag again, the ribbons drop away to the NAFESA back cover.
// The picture (src/drop3f/PetalPopDrop3Fabric.tsx) and the SFX (audio/drop3f_sfx.js) both read src/drop3f/timeline.json.
//   node scripts/drop3f_layout.js
const fs = require('fs');
const r = (x) => Math.round(x * 1000) / 1000;
const W = 1080, H = 1920, FPS = 30;
const PAGE = { w: 1400, h: 1986 };
const CARD = { w: 940, cy: 880 };
CARD.h = Math.round((CARD.w * PAGE.h) / PAGE.w);
const n = (x, y) => { const l = Math.hypot(x, y); return [r(x / l), r(y / l)]; };

const OPEN = { tagIn: 0.25, tagOut: 1.75, peel: [2.0, 2.9], way: 'Buttercup', dir: n(0.6, 0.8) };
const COVER = { page: 'page01', bg: 'Buttercup', hold: [2.9, 4.1] };
const CW = [
  { name: 'Buttercup', page: 'page03', dir: n(-0.6, 0.8) },
  { name: 'Camellia', page: 'page05', dir: n(0.7, -0.72) },
  { name: 'Lavender', page: 'page07', dir: n(0.45, 0.9) },
  { name: 'Marigold', page: 'page09', dir: n(-0.7, -0.72) },
  { name: 'Petunia', page: 'page11', dir: n(0.6, 0.8) },
];
const STEP = 2.75;
let t = 4.1;
for (const c of CW) {
  c.drape = [r(t), r(t + 0.7)];
  c.pill = r(t + 0.5);
  c.peel = [r(t + 1.25), r(t + 2.05)];
  t += STEP;
}
const END = { ribbons: r(t), tagIn: r(t + 0.75), fall: r(t + 2.6), back: r(t + 2.75) };
// NAFESA end card: the back cover's flowers replaced by Nas's motifs, one cluster per colourway, popping in one by one
// [motif file, x, y, size, rotation]; the leaf spray lands first, then its flowers
const CLUSTERS = [
  { way: 'Buttercup', m: [['L2', 95, 330, 560, 150], ['F1', 270, 420, 320, 10], ['F2', 105, 640, 200, -20]] },
  { way: 'Camellia', m: [['L1', 1000, 230, 600, -35], ['F1', 850, 330, 330, -12], ['F5', 1040, 540, 210, 25]] },
  { way: 'Lavender', m: [['L3', 1070, 1060, 520, -95], ['F1', 925, 1185, 290, 18], ['F3', 1035, 1360, 190, -15]] },
  { way: 'Marigold', m: [['L2', 30, 1250, 580, 65], ['F1', 190, 1140, 300, -8], ['F3', 95, 1460, 200, 30]] },
  { way: 'Petunia', m: [['L1', 760, 1820, 600, 195], ['F1', 545, 1715, 330, 12], ['F5', 320, 1845, 220, -25], ['F2', 905, 1640, 210, 35]] },
];
const BLOOMS = [];
CLUSTERS.forEach((c, j) => c.m.forEach(([f, x, y, size, rot], k) => BLOOMS.push({ way: c.way, f, x, y, size, rot, at: r(END.back + 0.45 + j * 0.32 + k * 0.1) })));
const DURATION = Math.ceil((Math.max(...BLOOMS.map((b) => b.at)) + 1.4) * 2) / 2;

const sfx = [];
const ev = (at, kind, gain = 1, pitch = 1) => sfx.push({ at: r(at), kind, gain, pitch });
ev(0, 'cloth', 0.6, 0.8);
ev(OPEN.tagIn + 0.35, 'drop', 0.9); ev(OPEN.tagIn + 0.38, 'pop', 0.9, 0.95);
ev(OPEN.tagOut, 'swish', 0.6);
ev(OPEN.peel[0], 'peel', 1); ev(OPEN.peel[0] + 0.35, 'sparkle', 0.5);
CW.forEach((c, i) => {
  ev(c.drape[0], 'cloth', 1, 1 + i * 0.04);
  ev(c.drape[1] - 0.12, 'drop', 0.55);
  ev(c.pill, 'pop', 0.85, 1 + i * 0.06);
  ev(c.peel[0], 'peel', 1, 1 + i * 0.03);
  ev(c.peel[0] + 0.35, 'sparkle', 0.55, 1 + i * 0.05);
});
for (let j = 0; j < 5; j++) ev(END.ribbons + j * 0.08, 'cloth', 0.45, 1.1 + j * 0.05);
ev(END.tagIn + 0.35, 'drop', 0.9); ev(END.tagIn + 0.38, 'pop', 1.1, 0.85);
ev(END.fall, 'swish', 0.9);
ev(END.back, 'shimmer', 1);
BLOOMS.forEach((b, i) => ev(b.at, 'pop', b.f[0] === 'L' ? 0.7 : 0.5, 0.9 + (i % 5) * 0.07));

fs.writeFileSync(__dirname + '/../src/drop3f/timeline.json', JSON.stringify({ W, H, FPS, DURATION, PAGE, CARD, OPEN, COVER, CW, STEP, END, BLOOMS, sfx }, null, 1));
console.log('DURATION', DURATION, 'events', sfx.length);
