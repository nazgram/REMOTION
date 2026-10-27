// Builds src/intro/layout.json for the PetalPopIntro composition: where every motif sits, when it pops,
// when each title letter pops. The picture and audio/intro_sfx.js both read it, so every pop lands on its sound.
//   node scripts/intro_layout.js
const fs = require('fs');
const path = require('path');

const W = 1080, H = 1920, FPS = 30;
const DURATION = 10;
const POPS = [0.3, 2.0]; // first and last flower pop
const DISSOLVE = [5.0, 6.3]; // keep in sync with scripts/intro_assets.py
const TITLE_AT = 6.45; // first letter
const TITLE_OUT = [8.0, 8.55];
const LOGO_AT = 8.45; // diamond; the wordmark follows

let s = 20261027;
const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const between = (a, b) => a + rnd() * (b - a);

// motifs cut from FLOWER.png (scripts/intro_assets.py, reading order)
const HERO = [1, 7, 8]; // pink star flowers and the lily: a bit larger, in front
const OTHER = [2, 3, 4, 5, 6, 9];

// 4 x 8 jittered grid bleeding past the frame edges, dense like the Peony print
const COLS = 4, ROWS = 8, BLEED = 150;
const cw = (W + BLEED * 2) / COLS, ch = (H + BLEED * 2) / ROWS;
const flowers = [];
let h = 0, o = 0;
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const hero = (r + c * 3) % 3 === 0;
    flowers.push({
      id: flowers.length,
      motif: hero ? HERO[h++ % HERO.length] : OTHER[(o++ * 5 + r) % OTHER.length],
      hero,
      x: Math.round(-BLEED + cw * (c + 0.5) + between(-0.22, 0.22) * cw + (r % 2 ? cw * 0.2 : -cw * 0.2)),
      y: Math.round(-BLEED + ch * (r + 0.5) + between(-0.2, 0.2) * ch),
      height: Math.round(hero ? between(400, 460) : between(340, 420)),
      rotate: +between(-180, 180).toFixed(1),
      flip: rnd() < 0.5,
      swayPhase: +between(0, Math.PI * 2).toFixed(3),
      z: hero ? 2 : rnd() < 0.5 ? 0 : 1,
    });
  }
}

// pop order: outwards from the centre, slightly shuffled so it feels hand-placed
const order = [...flowers].sort(
  (a, b) => Math.hypot(a.x - W / 2, (a.y - H / 2) * 0.6) + between(-120, 120) - Math.hypot(b.x - W / 2, (b.y - H / 2) * 0.6),
);
order.forEach((f, i) => {
  const p = i / (order.length - 1);
  f.popAt = +(POPS[0] + (POPS[1] - POPS[0]) * Math.pow(p, 0.85)).toFixed(3); // starts sparse, speeds up
});

// title letters pop one by one, a short breath at the space
const TITLE = 'Petal Pop';
const letters = [];
let t = TITLE_AT;
[...TITLE].forEach((ch, i) => {
  if (ch === ' ') { t += 0.06; return; }
  letters.push({ ch, i, at: +t.toFixed(3) });
  t += 0.09;
});

const out = { W, H, FPS, DURATION, POPS, DISSOLVE, TITLE_AT, TITLE_OUT, LOGO_AT, flowers, letters };
fs.mkdirSync(path.join(__dirname, '..', 'src', 'intro'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '..', 'src', 'intro', 'layout.json'), JSON.stringify(out, null, 1));
console.log(`${flowers.length} flowers, last pop ${Math.max(...flowers.map((f) => f.popAt))}s, ${letters.length} letters`);
