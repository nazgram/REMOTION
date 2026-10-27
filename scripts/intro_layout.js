// Builds src/intro/layout.json for the PetalPopIntro composition: where every motif sits, when it pops,
// when each title letter pops. The picture and audio/intro_sfx.js both read it, so every pop lands on its sound.
//   node scripts/intro_layout.js
const fs = require('fs');
const path = require('path');

const W = 1080, H = 1920, FPS = 30;
const DURATION = 12;
const POPS = [0.2, 1.6]; // first and last flower pop
// the whole print (motifs + background) cuts to the next colorway in place, on a pop; Peony stays to the end
const COLORWAYS = [
  { name: 'dahlia', bg: '#733548', at: 0 },
  { name: 'bluebell', bg: '#153D4F', at: 1.0 },
  { name: 'moonflower', bg: '#020202', at: 2.25 },
  { name: 'toffee', bg: '#774930', at: 3.5 },
  { name: 'peony', bg: '#971E5A', at: 4.75 },
];
const DISSOLVE = [6.0, 7.0]; // keep in sync with scripts/intro_assets.py
// thin line above the title, typed out one character at a time
const TAGLINE = { text: ['Ready to pop into', 'something pretty?'], at: 6.9, perChar: 0.03 };
const TITLE_AT = 8.05; // first letter of the Petal Pop logo
// the logo's drawn motifs land after the letters (parts from scripts/intro_newlogo.py)
const LOGO_MOTIFS = { flower: 8.85, leaf: 9.05, tulip: 9.2, heart: 9.55 };
const TITLE_OUT = [10.2, 10.65];
const LOGO_AT = 10.55; // NAFESA diamond; the wordmark follows

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

// a denser cluster in the middle so the centre fills up first and stays full
const CENTER = [[0.5, 0.42], [0.3, 0.33], [0.7, 0.36], [0.4, 0.52], [0.62, 0.55], [0.28, 0.62], [0.74, 0.66], [0.5, 0.7], [0.36, 0.44], [0.6, 0.46], [0.46, 0.6], [0.55, 0.3]];
CENTER.forEach(([cx, cy], i) => {
  const hero = i % 3 === 0;
  flowers.push({
    id: flowers.length,
    motif: hero ? HERO[h++ % HERO.length] : OTHER[(o++ * 5 + i) % OTHER.length],
    hero,
    x: Math.round(cx * W + between(-40, 40)),
    y: Math.round(cy * H + between(-40, 40)),
    height: Math.round(hero ? between(360, 420) : between(300, 380)),
    rotate: +between(-180, 180).toFixed(1),
    flip: rnd() < 0.5,
    swayPhase: +between(0, Math.PI * 2).toFixed(3),
    z: hero ? 3 : 1,
  });
});

// pop order: outwards from the centre, slightly shuffled so it feels hand-placed
const order = [...flowers].sort(
  (a, b) => Math.hypot(a.x - W / 2, (a.y - H / 2) * 0.6) + between(-120, 120) - Math.hypot(b.x - W / 2, (b.y - H / 2) * 0.6),
);
order.forEach((f, i) => {
  const p = i / (order.length - 1);
  f.popAt = +(POPS[0] + (POPS[1] - POPS[0]) * Math.pow(p, 0.85)).toFixed(3); // starts sparse, speeds up
});

// a light frame of flowers around the edges, popping in after the wash and staying under the title and logo
const BORDER_POPS = [6.75, 7.25];
const EDGE = [
  [-30, -20], [1110, 20], [-40, 1950], [1100, 1920], // corners
  [400, -90], [770, -70], [320, 2010], [740, 1990], // top, bottom
  [-70, 600], [-60, 1330], [1140, 720], [1130, 1260], // sides
];
const border = EDGE.map(([x, y], i) => ({
  id: 100 + i,
  motif: [...HERO, ...OTHER][(i * 4) % 9],
  hero: false,
  x,
  y,
  height: Math.round(between(400, 480)),
  rotate: +between(-180, 180).toFixed(1),
  flip: rnd() < 0.5,
  swayPhase: +between(0, Math.PI * 2).toFixed(3),
  z: 0,
}));
[...border]
  .sort(() => rnd() - 0.5)
  .forEach((f, i) => { f.popAt = +(BORDER_POPS[0] + ((BORDER_POPS[1] - BORDER_POPS[0]) * i) / (border.length - 1)).toFixed(3); });

// logo letters pop one by one, a short breath between the lines; names match public/intro/newlogo/
const TITLE = [['P', 'e', 't', 'a', 'l'], ['P2', 'o', 'p']];
const letters = [];
let t = TITLE_AT;
TITLE.forEach((line, j) => {
  if (j) t += 0.06;
  line.forEach((name) => { letters.push({ name, at: +t.toFixed(3) }); t += 0.09; });
});

const out = { W, H, FPS, DURATION, POPS, COLORWAYS, DISSOLVE, TAGLINE, TITLE_AT, LOGO_MOTIFS, TITLE_OUT, LOGO_AT, flowers, border, letters };
fs.mkdirSync(path.join(__dirname, '..', 'src', 'intro'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '..', 'src', 'intro', 'layout.json'), JSON.stringify(out, null, 1));
console.log(`${flowers.length} flowers + ${border.length} border, last pop ${Math.max(...flowers.map((f) => f.popAt))}s, ${letters.length} letters`);
