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
const DURATION = Math.ceil((END.back + 2.4) * 2) / 2;

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

fs.writeFileSync(__dirname + '/../src/drop3f/timeline.json', JSON.stringify({ W, H, FPS, DURATION, PAGE, CARD, OPEN, COVER, CW, STEP, END, sfx }, null, 1));
console.log('DURATION', DURATION, 'events', sfx.length);
