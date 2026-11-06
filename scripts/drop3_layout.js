// Petal Pop Drop 3 Teaser 1 timeline, in the style of Nas's "video contoh teaser 1": big drawn motifs grow in,
// hold with a breeze, a watercolor bleed paints the next colourway over the last, then everything washes out to
// a soft blur and the Drop 3 logo writes itself in, NAFESA last.
//   node scripts/drop3_layout.js   ->  src/drop3/timeline.json
const fs = require('fs');
const path = require('path');
const A = require('../src/drop3/assets.json');

const W = 1080, H = 1920, FPS = 30, BPM = 60; // one bar = 4 s = one colourway
// [motif, x, y, height, rotate, entrance, at (s after the scene starts), origin y% for grow]
// grow: rises from its base   drop: drifts down and settles   pop: springs open   paint: arrives with the wash
const TEMPLATES = {
  // garden: leaf sprays grow up from the bottom edge, flowers drift down from the top (like the reference's first scene)
  garden: [
    ['L5', 300, 1330, 760, -38, 'grow', 0.45, 90],
    ['V1', 760, 1120, 640, 12, 'grow', 0.7, 95],
    ['L4', 820, 1380, 820, 28, 'grow', 0.5, 90],
    ['L1', 170, 1560, 1000, -14, 'grow', 0.2, 92],
    ['L3', 560, 1660, 1060, 4, 'grow', 0.35, 92],
    ['L2', 950, 1580, 960, 22, 'grow', 0.55, 92],
    ['F1', 270, 330, 520, -12, 'drop', 0.3],
    ['F2', 790, 230, 460, 16, 'drop', 0.6],
    ['F3', 900, 640, 320, -20, 'drop', 0.9],
    ['F5', 500, 650, 280, 30, 'drop', 1.1],
    ['F4', 130, 880, 250, 8, 'drop', 1.3],
    ['P1', 640, 930, 130, 20, 'pop', 1.5],
  ],
  // two giants: one huge flower up top, one huge leaf spray below (the reference's orchid + leaf scene)
  giants: [
    ['L6', 1000, 270, 520, 200, 'paint', 0],
    ['S2', 140, 1820, 330, 40, 'paint', 0],
    ['F1', 430, 560, 900, -8, 'paint', 0],
    ['L4', 620, 1450, 1120, 10, 'paint', 0],
    ['P1', 840, 790, 150, -15, 'pop', 0.9],
    ['F2', 910, 1040, 270, 18, 'pop', 1.0],
    ['F3', 140, 1130, 230, -12, 'pop', 1.15],
  ],
  // diagonal: big leaf spray top right, big flower bottom left, a vine climbing the other side (the lily scene)
  diagonal: [
    ['V2', 160, 520, 720, -6, 'paint', 0],
    ['S1', 930, 1760, 340, 25, 'paint', 0],
    ['L2', 720, 520, 1000, -20, 'paint', 0],
    ['F4', 380, 1410, 840, 12, 'paint', 0],
    ['F2', 250, 930, 240, -18, 'pop', 0.9],
    ['F5', 930, 1160, 300, 22, 'pop', 1.05],
    ['P1', 680, 1080, 130, 40, 'pop', 1.2],
  ],
};
const SCENES = [
  { way: 'Buttercup', tpl: 'garden', mirror: false },
  { way: 'Camellia', tpl: 'giants', mirror: false, wash: 'wash_a' },
  { way: 'Petunia', tpl: 'diagonal', mirror: false, wash: 'wash_b' },
  { way: 'Lavender', tpl: 'giants', mirror: true, wash: 'wash_c' },
  { way: 'Marigold', tpl: 'diagonal', mirror: true, wash: 'wash_a' },
];
// one ground, one take: nothing cuts. At each change the old motifs are brushed away one by one, top to bottom,
// while the next colourway's motifs are painted in over the same spots with the same dry brush.
const OUT_DUR = 0.8, IN_DUR = 1.0, WASH_DUR = 1.6;
const scenes = SCENES.map((s, i) => {
  const start = i === 0 ? 0 : i * 4 - 0.4;
  const order = TEMPLATES[s.tpl].map((e, k) => k).sort((a, b) => TEMPLATES[s.tpl][a][2] - TEMPLATES[s.tpl][b][2]);
  const els = TEMPLATES[s.tpl].map(([m, x, y, h, rot, entrance, at, oy = 50], k) => {
    if (entrance === 'paint') at = 0.15 + order.indexOf(k) * 0.12; // painted in top to bottom
    // brush direction for this motif: alternate left-to-right / right-to-left so the strokes cross
    const dir = (i + k) % 2 ? -1 : 1;
    const a = A.motifs[m];
    const mx = s.mirror ? W - x : x;
    return {
      id: `${i}-${k}`, m, x: mx, y, h, w: Math.round((h * a.w) / a.h), rot: s.mirror ? -rot : rot,
      flip: s.mirror, entrance, at: +(start + at).toFixed(2), oy, phase: +((i * 7 + k * 2.3) % 6.28).toFixed(2), dir,
      order: order.indexOf(k),
    };
  });
  return { ...s, bg: s.way === 'Petunia' ? '#f4ded0' : A.bg[s.way], start, els };
});
// when each motif is brushed away: at the next change (top to bottom), or never for the last colourway
scenes.forEach((s, i) => {
  const next = scenes[i + 1];
  s.els.forEach((e) => (e.out = next ? +(next.start + e.order * 0.09).toFixed(2) : null));
});
const END = { washAt: 19.2, washDur: 1.2, logoAt: 20.0, logoDur: 1.3, logoOut: 23.2, nafAt: 23.6 };
const DURATION = 25.5;
fs.writeFileSync(
  path.join(__dirname, '../src/drop3/timeline.json'),
  JSON.stringify({ W, H, FPS, BPM, DURATION, WASH_DUR, OUT_DUR, IN_DUR, END, scenes }, null, 1),
);
console.log('scenes', scenes.map((s) => `${s.way}@${s.start}`).join(' '));
