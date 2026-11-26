// Timeline for PetalPopDrop2 (the Drop 2 catalog as an "editor moves" reel, 9:16).
// The picture (src/drop2/PetalPopDrop2.tsx) and the SFX (audio/drop2_sfx.js) both read src/drop2/timeline.json.
//   node scripts/drop2_layout.js
const fs = require('fs');
const r = (x) => Math.round(x * 1000) / 1000;

const W = 1080, H = 1920, FPS = 30;
// catalog pages are 1399x1985; the card is 1300 px tall under a small header
const PAGE = { w: 1399, h: 1985 };
const CARD = { h: 1300, w: Math.round((1300 * 1399) / 1985), cy: 985 }; // pictures may run past 1521 px, text may not
CARD.x = Math.round((W - CARD.w) / 2);
CARD.y = Math.round(CARD.cy - CARD.h / 2);
const HEAD = { cy: 175, w: 300 };

const LOGO = { in: 0.15, grab: 0.8, dragEnd: 1.45, release: 1.52, toHeader: [2.0, 2.45], startScale: 1.32 };
// every page is carried in by the move cursor and dropped onto the pile
const CARRY = 0.55;
const COVER = { in: 2.35, drop: r(2.35 + CARRY), marquee: [3.25, 3.75], end: 4.35 };
// colourway pages in catalog order: page, click point on the scarf (page px), scarf background hex, pile tilt
const CW = [
  { name: 'Butter Bliss', page: 'page03', way: 'Butter Bliss', hex: '#FFEAC5', pick: [600, 1300], tilt: -3 },
  { name: 'Expresso Poppy', page: 'page05', way: 'Expresso Poppy', hex: '#633B26', pick: [1050, 1100], tilt: 2.5 },
  { name: 'Forest Bloom', page: 'page07', way: 'Forest Bloom', hex: '#000000', pick: [720, 1150], tilt: -2 },
  { name: 'Olive Spritz', page: 'page09', way: 'Olive Spritz', hex: '#62634E', pick: [800, 1300], tilt: 3 },
  { name: 'Vanilla Sky', page: 'page11', way: 'Vanilla Sky', hex: '#F2F2F3', pick: [600, 1100], tilt: 0 },
];
let t = COVER.end;
const STEP = 1.95;
for (const c of CW) {
  c.in = r(t);
  c.drop = r(t + CARRY);
  c.click = r(t + CARRY + 0.55);
  t += STEP;
}
const PACK = { fan: [r(t), r(t + 0.5)], marquee: [r(t + 0.65), r(t + 1.05)], grab: r(t + 1.15), drag: [r(t + 1.15), r(t + 1.65)], pulse: r(t + 1.7) };
t += 1.9;
// outro: the Petal Pop Drop 2 logo alone in the centre, it pops away, then the NAFESA back cover comes in last
const END = { toCenter: [r(t), r(t + 0.5)], logoOut: [r(t + 2.0), r(t + 2.3)], back: r(t + 2.35) };
const DURATION = Math.ceil((t + 2.35 + 2.6) * 2) / 2;

const sfx = [];
const ev = (at, kind, gain = 1, pitch = 1) => sfx.push({ at: r(at), kind, gain, pitch });
ev(LOGO.in, 'pop', 1.1, 0.9);
ev(LOGO.grab, 'click'); ev(LOGO.grab + 0.05, 'swish', 0.8); ev(LOGO.release, 'click', 0.7, 1.2);
ev(LOGO.toHeader[0], 'swish', 0.6);
for (const p of [COVER, ...CW]) {
  ev(p.in, 'click', 0.8); ev(p.in + 0.03, 'swish', 0.75);
  ev(p.drop, 'drop', 1);
}
ev(COVER.marquee[0], 'click'); ev(COVER.marquee[0] + 0.03, 'swish', 0.4); ev(COVER.marquee[1], 'click', 0.7, 1.2);
CW.forEach((c, i) => {
  ev(c.click, 'click', 1, 1.1);
  ev(c.click + 0.05, 'sparkle', 0.7, 1 + i * 0.05);
  ev(c.click + 0.55, 'pop', 0.85, 1.05 + i * 0.06);
  for (let k = 0; k < 4; k++) ev(c.click + 0.12 + k * 0.07, 'pop', 0.32, 1.25 + k * 0.08);
});
ev(PACK.fan[0], 'swish', 0.7);
for (let j = 0; j < 5; j++) ev(PACK.fan[0] + 0.08 + j * 0.07, 'pop', 0.55, 1 + j * 0.06);
ev(PACK.marquee[0], 'click'); ev(PACK.marquee[0] + 0.03, 'swish', 0.4); ev(PACK.marquee[1], 'click', 0.7, 1.2);
ev(PACK.grab, 'click'); ev(PACK.grab + 0.05, 'swish', 0.9);
ev(PACK.pulse, 'pop', 1.2, 0.85);
ev(END.toCenter[0], 'swish', 0.5);
ev(END.logoOut[0], 'pop', 0.9, 0.8);
ev(END.back, 'shimmer', 1);

fs.writeFileSync(__dirname + '/../src/drop2/timeline.json',
  JSON.stringify({ W, H, FPS, DURATION, PAGE, CARD, HEAD, LOGO, CARRY, COVER, CW, PACK, END, sfx }, null, 1));
console.log('DURATION', DURATION, 'events', sfx.length);
