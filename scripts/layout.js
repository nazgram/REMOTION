// Builds src/layout.json: where every flower sits, how it is turned, and the exact beat it pops on.
// The picture (src/) and the soundtrack (audio/song.js) both read this file, so they never drift.
//   node scripts/layout.js
const fs = require('fs');
const path = require('path');

const W = 1080, H = 1920, FPS = 30;
const BPM = 120, BEAT = 60 / BPM, EIGHTH = BEAT / 2;
const DURATION = 10;
const DISSOLVE = [6.5, 8.0]; // keep in sync with scripts/make_assets.py
const TITLE_AT = 8.0;

// seeded RNG so every run gives the same arrangement
let s = 20261023;
const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const between = (a, b) => a + rnd() * (b - a);

const HERO = [1, 6, 4, 8]; // the big lilies: front, larger
const OTHER = [2, 3, 5, 7, 9, 10];

// 3 x 6 jittered grid that bleeds past the frame edges, like the reference
const COLS = 3, ROWS = 6;
const cw = (W + 200) / COLS, ch = (H + 200) / ROWS;
const cells = [];
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    cells.push({
      x: -100 + cw * (c + 0.5) + between(-0.22, 0.22) * cw + (r % 2 ? cw * 0.18 : -cw * 0.18),
      y: -100 + ch * (r + 0.5) + between(-0.2, 0.2) * ch,
    });
  }
}

// hero lilies go to a few chosen central / lower cells, the rest cycle through the other sprigs
const heroCells = new Set([4, 9, 13, 15]);
let o = 0, h = 0;
const flowers = cells.map((cell, i) => {
  const hero = heroCells.has(i);
  const sprig = hero ? HERO[h++ % HERO.length] : OTHER[(o++ * 7 + i) % OTHER.length];
  return {
    id: i,
    sprig,
    hero,
    x: Math.round(cell.x),
    y: Math.round(cell.y),
    height: Math.round(hero ? between(780, 860) : between(540, 660)),
    rotate: +between(-38, 38).toFixed(1),
    flip: rnd() < 0.4,
    swayPhase: +between(0, Math.PI * 2).toFixed(3),
    z: hero ? 2 : rnd() < 0.5 ? 0 : 1,
  };
});

// pop order: outwards from two seeds (top-right and bottom-centre), as in the reference
const seeds = [{ x: 860, y: 260 }, { x: 520, y: 1560 }];
const dist = (f) => Math.min(...seeds.map((p) => Math.hypot(f.x - p.x, f.y - p.y)));
const order = [...flowers].sort((a, b) => dist(a) - dist(b));

// beat grid (seconds): on the beat in bar 1, then every 8th note, one flower per slot
const slots = [0.5, 1.0, 1.5, 1.75];
for (let t = 2.0; t <= 5.25 + 1e-9; t += EIGHTH) slots.push(t);
slots.sort((a, b) => a - b);
order.forEach((f, i) => { f.popAt = +slots[Math.min(i, slots.length - 1)].toFixed(3); });

// title letters pop on 16ths, a short breath between the two words
const TITLE = ['P', 'E', 'T', 'A', 'L', ' ', 'P', 'O', 'P'];
const letters = [];
let t = TITLE_AT;
TITLE.forEach((ch, i) => {
  if (ch === ' ') { t += EIGHTH / 2; return; }
  letters.push({ ch, i, at: +t.toFixed(3), line: i < 5 ? 0 : 1 });
  t += EIGHTH / 2;
});

const out = { W, H, FPS, BPM, DURATION, DISSOLVE, TITLE_AT, flowers, letters };
fs.writeFileSync(path.join(__dirname, '..', 'src', 'layout.json'), JSON.stringify(out, null, 1));
console.log(`${flowers.length} flowers, last pop ${Math.max(...flowers.map((f) => f.popAt))}s, ${letters.length} letters`);
