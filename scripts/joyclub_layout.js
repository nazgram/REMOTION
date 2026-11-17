// Joy Club dot teaser timeline: dot positions, pop order per colourway, phase times and SFX events.
// Picture (src/joyclub/JoyClubDots.tsx) and sound (audio/joyclub_sfx.js) both read it.
//   node scripts/joyclub_layout.js  ->  src/joyclub/timeline.json
const fs = require('fs');
const path = require('path');
const { palettes, shapes } = require('../src/joyclub/shapes.json');

const FPS = 30, W = 1080, H = 1920, DURATION = 18;
const SEG = 3.4, FIRST_DELAY = 0.35;
// phases relative to segment start
const P = { pop: [0, 1.15], play: [1.15, 2.05], gather: [2.05, 2.75], expand: [2.75, SEG] };

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const CELL = 120, COLS = 10, ROWS = 17;
function makeDots() {
  const dots = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const x = (c + (r % 2 ? 0.5 : 0)) * CELL - 20 + (rnd() - 0.5) * 70;
      const y = r * CELL - 20 + (rnd() - 0.5) * 70;
      if (x < -25 || x > W + 25 || y < -25 || y > H + 25) continue;
      dots.push({ x: +x.toFixed(1), y: +y.toFixed(1), d: +(34 + rnd() * 8).toFixed(1), shape: Math.floor(rnd() * shapes.length), rot: Math.round(rnd() * 360), phase: +(rnd() * Math.PI * 2).toFixed(3) });
    }
  return dots;
}
const cx = W / 2, cy = H / 2, maxDist = Math.hypot(cx, cy);
const ORDER = [
  (q) => Math.hypot(q.x - cx, q.y - cy) / maxDist,                              // from the centre out
  (q) => 1 - q.y / H,                                                          // rising from the bottom
  (q) => (q.x / W + q.y / H) / 2 + 0.08 * Math.sin(q.x / 90),                  // diagonal wave
  () => rnd(),                                                                 // random sparkle
  (q) => { const a = (Math.atan2(q.y - cy, q.x - cx) + Math.PI) / (2 * Math.PI); return (Math.hypot(q.x - cx, q.y - cy) / maxDist) * 0.7 + a * 0.3; }, // spiral
];

const segments = [];
const sfx = { pops: [], gather: [], whoosh: [], cover: [], settle: [] };
const popFrames = {};
palettes.forEach((pal, i) => {
  const start = i === 0 ? 0 : FIRST_DELAY + i * SEG;
  const last = i === palettes.length - 1;
  const popStart = start + (i === 0 ? FIRST_DELAY : 0);
  const popLen = last ? 1.4 : P.pop[1] - 0.1;
  const dots = makeDots();
  const ord = dots.map(ORDER[i]);
  const lo = Math.min(...ord), hi = Math.max(...ord);
  dots.forEach((q, k) => {
    const o = (ord[k] - lo) / (hi - lo || 1);
    q.pop = +(popStart + 0.05 + Math.min(1, Math.max(0, o + (rnd() - 0.5) * 0.08)) * popLen).toFixed(3);
    q.gather = +(start + P.gather[0] + (Math.hypot(q.x - cx, q.y - cy) / maxDist) * 0.22).toFixed(3);
    const f = Math.round(q.pop * FPS);
    popFrames[f] = (popFrames[f] || 0) + 1;
  });
  const next = palettes[i + 1];
  const seg = { name: pal.name, bg: pal.bg, dot: pal.dot, nextBg: next ? next.bg : null, start, end: last ? DURATION : start + SEG + (i === 0 ? FIRST_DELAY : 0), last, dots };
  if (!last) {
    const o = i === 0 ? FIRST_DELAY : 0;
    seg.gather = [start + o + P.gather[0], start + o + P.gather[1]];
    seg.expand = [start + o + P.expand[0], start + o + P.expand[1]];
    seg.play = [start + o + P.play[0], start + o + P.play[1]];
    dots.forEach((q) => (q.gather = +(q.gather + o).toFixed(3)));
    sfx.gather.push(+seg.gather[0].toFixed(3));
    sfx.whoosh.push(+seg.expand[0].toFixed(3));
    sfx.cover.push(+seg.expand[1].toFixed(3));
  } else {
    seg.play = [popStart + 1.5, DURATION];
    sfx.settle.push(+(popStart + 1.6).toFixed(3));
  }
  segments.push(seg);
});
sfx.pops = Object.entries(popFrames).map(([f, n]) => [+(f / FPS).toFixed(3), n]).sort((a, b) => a[0] - b[0]);
fs.writeFileSync(path.join(__dirname, '..', 'src', 'joyclub', 'timeline.json'), JSON.stringify({ FPS, W, H, DURATION, segments, sfx }));
console.log(segments.map((s) => `${s.name} ${s.start.toFixed(2)}-${s.end.toFixed(2)} dots ${s.dots.length}`).join('\n'));
