// Timeline for PetalPopDrop1 (the Drop 1 catalog as an "editor moves" reel). The picture (src/drop1/PetalPopDrop1.tsx)
// and the SFX (audio/drop1_sfx.js) both read src/drop1/timeline.json, so every click and pop lands on its sound.
//   node scripts/drop1_layout.js
const fs = require('fs');
const r = (x) => Math.round(x * 1000) / 1000;

const W = 1080, H = 1920, FPS = 30;
// page PNGs are 1166x1654; the card shows them 860 wide under the header
const PAGE = { w: 1166, h: 1654 };
const CARD = { x: 110, y: 420, w: 860, h: Math.round(860 * PAGE.h / PAGE.w) };

const LOGO = { in: 0.15, grab: 0.75, dragEnd: 1.35, release: 1.42, pill: 1.6, toHeader: [2.2, 2.6], startScale: 1.45 };
const COVER = { in: 2.45, marquee: [2.95, 3.45], out: 3.95 };

// colorway pages, the click point on the scarf (page px) and the official colorway hex
const CW = [
  { name: 'Bluebell', page: 'page03', hex: '#153D4F', pick: [505, 1322], dur: 1.65 },
  { name: 'Dahlia', page: 'page05', hex: '#733548', pick: [272, 1244], dur: 1.65 },
  { name: 'Moonflower', page: 'page07', hex: '#020202', pick: [544, 1225], dur: 1.65 },
  { name: 'Peony', page: 'page09', hex: '#971E5A', pick: [560, 1150], dur: 1.65 },
  { name: 'Toffee Rose', page: 'page11', hex: '#774930', pick: [650, 1100], dur: 1.65 },
];
let t = COVER.out;
for (const c of CW) {
  c.in = r(t);
  if (c.zoom) {
    c.zoomIn = [r(t + 0.4), r(t + 0.72)];
    c.zoomOut = [r(t + 1.1), r(t + 1.4)];
    c.click = r(t + 1.62);
  } else c.click = r(t + 0.8);
  t += c.dur;
  c.out = r(t);
}
const PACK = { fan: [r(t), r(t + 0.4)], marquee: [r(t + 0.5), r(t + 0.85)], grab: r(t + 0.95), drag: [r(t + 0.95), r(t + 1.4)], pulse: r(t + 1.45) };
t += 1.6;
// outro: Petal Pop + DROP 1 alone in the centre, then it pops away and NAFESA comes in last on its own
const END = { toCenter: [r(t), r(t + 0.4)], logoOut: [r(t + 1.7), r(t + 2.0)], nafesa: r(t + 2.1) };
const DURATION = Math.ceil((t + 3.9) * 2) / 2;

// sound events: pop (Nas's POP 3), click, swish (drag / slide), zoom, shimmer
const sfx = [];
const ev = (at, kind, gain = 1, pitch = 1) => sfx.push({ at: r(at), kind, gain, pitch });
ev(LOGO.in, 'pop', 1.1, 0.9);
ev(LOGO.grab, 'click'); ev(LOGO.grab + 0.05, 'swish', 0.8); ev(LOGO.release, 'click', 0.7, 1.2);
ev(LOGO.pill, 'pop', 0.9, 1.15);
ev(LOGO.toHeader[0], 'swish', 0.6);
ev(COVER.in + 0.05, 'pop', 0.9);
ev(COVER.marquee[0], 'click'); ev(COVER.marquee[0] + 0.03, 'swish', 0.4); ev(COVER.marquee[1], 'click', 0.7, 1.2);
CW.forEach((c, i) => {
  ev(c.in - 0.02, 'swish', 0.7);
  ev(c.in + 0.15, 'pop', 0.9, 0.95 + i * 0.05);
  if (c.zoom) { ev(c.zoomIn[0], 'click'); ev(c.zoomIn[0] + 0.02, 'zoom', 0.8, 1); ev(c.zoomOut[0], 'zoom', 0.6, 0.8); }
  ev(c.click, 'click', 1, 1.1);
  ev(c.click + 0.45, 'pop', 0.8, 1.1 + i * 0.06);
});
ev(PACK.fan[0], 'swish', 0.7);
for (let j = 0; j < 5; j++) ev(PACK.fan[0] + 0.05 + j * 0.05, 'pop', 0.55, 1 + j * 0.06);
ev(PACK.marquee[0], 'click'); ev(PACK.marquee[0] + 0.03, 'swish', 0.4); ev(PACK.marquee[1], 'click', 0.7, 1.2);
ev(PACK.grab, 'click'); ev(PACK.grab + 0.05, 'swish', 0.9);
ev(PACK.pulse, 'pop', 1.2, 0.85);
ev(END.toCenter[0], 'swish', 0.5);
ev(END.logoOut[0], 'pop', 0.9, 0.8);
ev(END.nafesa, 'shimmer', 1);

fs.writeFileSync(__dirname + '/../src/drop1/timeline.json',
  JSON.stringify({ W, H, FPS, DURATION, PAGE, CARD, LOGO, COVER, CW, PACK, END, sfx }, null, 1));
console.log('DURATION', DURATION, 'events', sfx.length);
