// Petal Pop Drop 3 Teaser 1 (v4): one slow flight forward through the five Abstract Floral colourways.
// Layers, far to near: the colourway's own ground + its whole print as a soft far wall (parallax) · big leaf
// sprays and one hero flower per colourway hanging in depth, always the next ones already fading in behind ·
// small flowers and petals floating on the wind, fluttering in 3D, some right by the lens (bokeh).
// Each colourway's hero flower flies through the camera and is the wipe: behind it the ground and wall turn to
// the next colourway. The last hero flies through into the wash, petals swirl in round the Drop 3 logo, NAFESA last.
//   node scripts/drop3_layout.js   ->  src/drop3/timeline.json
const fs = require('fs');
const path = require('path');
const A = require('../src/drop3/assets.json');

const W = 1080, H = 1920, FPS = 30, DURATION = 25;
const F = 900, FAR = 5200, NEAR = 150, ZONE = 3300, Z0 = -1500;
const WAYS = ['Buttercup', 'Camellia', 'Petunia', 'Lavender', 'Marigold'];
const BG = { Buttercup: '#ffe8c7', Camellia: '#fde0d3', Petunia: '#0f0b0a', Lavender: '#fde3dd', Marigold: '#fde1d2' };

// camera: steady forward flight, slowing after the last hero; a slow left/right sweep and a little roll
const speed = (t) => (t < 18.6 ? 900 : t < 21.5 ? 900 - 760 * Math.sin(((t - 18.6) / 2.9) * Math.PI / 2) : 140);
const N = Math.round(DURATION * FPS);
const cam = [];
let z = Z0;
for (let f = 0; f < N; f++) {
  const t = f / FPS;
  const sweep = Math.sin(t * 0.38 - 0.4);
  cam.push([Math.round(z), Math.round(300 * sweep + 50 * Math.sin(t * 0.95)), +(Math.sin(t * 0.31 + 1) * 80).toFixed(1), +(-1.8 * Math.cos(t * 0.38 - 0.4)).toFixed(2)]);
  z += speed(t) / FPS;
}
const timeAtZ = (zz) => { const f = cam.findIndex((c) => c[0] >= zz); return f < 0 ? null : +(f / FPS).toFixed(2); };

let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const R = (a, b) => a + rnd() * (b - a);
const SPRAYS = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'];

// the big motifs: per colourway two sprays (opposite halves), a third spray deep, the hero flower on the path
const els = [];
const add = (way, kind, m, zz, x, y, h, extra = {}) => {
  const a = A.motifs[m];
  els.push({ id: `e${els.length}`, way, kind, m, z: Math.round(zz), x: Math.round(x), y: Math.round(y), h: Math.round(h),
    w: Math.round((h * a.w) / a.h), rot: Math.round(R(0, 360)), spin: +R(-6, 6).toFixed(1), vx: Math.round(R(60, 120)),
    flip: rnd() < 0.5, phase: +R(0, 6.28).toFixed(2), ...extra });
};
WAYS.forEach((way, k) => {
  const z0 = k * ZONE + 1000;
  const up = k % 2 ? 1 : -1;
  add(way, 'spray', pick(SPRAYS), z0 + 0.1 * ZONE, R(-1050, -650), up * R(500, 1300), R(1050, 1300));
  add(way, 'spray', pick(SPRAYS), z0 + 0.3 * ZONE, R(650, 1050), -up * R(500, 1300), R(1050, 1300));
  add(way, 'spray', pick(SPRAYS), z0 + 0.72 * ZONE, R(-200, 200) + (k % 2 ? 900 : -900), R(-300, 300), R(900, 1100));
  // hero: the colourway's big flower, sailing close past one side of the lens (the cover flower does the cut)
  add(way, 'hero', ['F1', 'F4', 'F1', 'F4', 'F1'][k], z0 + 0.5 * ZONE, (k % 2 ? 1 : -1) * R(420, 560), R(-200, 100), 1050, { spin: +R(-14, 14).toFixed(1) });
});
// the opening: a Buttercup flower already right in front of the lens, flying past to open the film
add('Buttercup', 'hero', 'F4', Z0 + 1150, -140, 60, 900, { spin: 18, opener: true });
for (const e of els) {
  const ts = timeAtZ(e.z - FAR);
  e.born = ts === null ? 99 : ts;
  e.pass = timeAtZ(e.z - 260);
}
// colourway changes: at each hero's fly-through
// the cuts sit between colourways: after this zone's sprays and hero have passed, before the next zone's
const changes = WAYS.slice(0, 4).map((w, k) => timeAtZ(k * ZONE + 1000 + 0.86 * ZONE - 260));
const END = { washAt: timeAtZ(4 * ZONE + 1000 + 0.62 * ZONE - 260), washDur: 0.6 };
END.logoAt = +(END.washAt + 0.6).toFixed(2);
END.logoDur = 1.2;
END.logoOut = +(END.logoAt + 3.2).toFixed(2);
END.nafAt = +(END.logoOut + 0.4).toFixed(2);
// the changes are clean cuts hidden behind one giant flower of the incoming colourway crossing the frame left
// to right on the wind; at its peak its solid heart covers the whole frame and the colourway switches. The last
// one crosses into the wash for the logo.
const COVER_DUR = 0.9;
const covers = [...changes.map((c, i) => ({ peak: c, way: WAYS[i + 1], m: i % 2 ? 'F4' : 'F1' })), { peak: END.washAt, way: 'Marigold', m: 'F1' }]
  .map((c, i) => ({ id: `c${i}`, ...c, core: A.motifs[c.m].core, ar: A.motifs[c.m].h / A.motifs[c.m].w }));
const wayAt = (t) => WAYS[changes.filter((c) => t >= c).length];

// floaters: small flowers and petals on the wind, crossing left to right in front of the motifs, in the colourway
// of the moment; every few one rides right by the lens (big, blurred)
const floats = [];
for (let t = -2.5, i = 0; t < END.washAt + 1.2; t += R(0.38, 0.62), i++) {
  const near = i % 6 === 3 && t > 1.5;
  const d = near ? R(260, 380) : R(700, 2600);
  floats.push({ id: `f${i}`, way: wayAt(Math.max(0, t + 1.5)), m: pick(['F2', 'F3', 'F5', 'F2', 'F3', 'F5', 'P1', 'S1', 'S2']),
    born: +t.toFixed(2), d: Math.round(d), y: Math.round(R(-1, 1) * (near ? 700 : 1500)), h: Math.round(near ? R(200, 260) : R(200, 330)),
    sp: Math.round(R(240, 380) * (near ? 1.8 : 1)), fl: +R(0.6, 1.3).toFixed(2), phase: +R(0, 6.28).toFixed(2), spin: Math.round(R(-90, 90)), near });
}
// the logo frame: not a ring. Flowers in three size levels gathered in two opposite corners (top left and
// bottom right), the big ones half off the frame and soft, the small ones crisp and nearer the logo; each
// drifts in from its corner and settles, swaying.
const frame = [];
const CORNER = [
  // [x, y, height, level]  level 0 big & soft, 1 medium, 2 small
  [60, 120, 760, 0], [330, 70, 420, 1], [80, 470, 380, 1], [430, 300, 190, 2], [250, 560, 150, 2], [560, 150, 120, 2],
];
const FRAME_WAYS = ['Camellia', 'Lavender', 'Marigold', 'Buttercup', 'Petunia', 'Camellia'];
const FRAME_M = [['F1', 'L2'], ['F4', 'L4'], ['F2', 'L5'], ['F3', 'S1'], ['F5', 'P1'], ['F2', 'F3']];
[1, -1].forEach((side, c) => {
  CORNER.forEach(([x, y, h, level], i) => {
    const m = FRAME_M[i][(i + c) % 2 === 0 ? 0 : (i < 3 ? 1 : 0)];
    frame.push({ id: `k${c}-${i}`, way: FRAME_WAYS[(i + c * 2) % FRAME_WAYS.length], m, level,
      x: side > 0 ? x : W - x, y: side > 0 ? y : H - y, h: Math.round(h * R(0.9, 1.1)), rot: Math.round(R(0, 360)),
      flip: rnd() < 0.5, side, at: +(END.logoAt - 0.2 + c * 0.15 + (2 - level) * 0.0 + i * 0.07).toFixed(2), phase: +R(0, 6.28).toFixed(2) });
  });
});
for (const f of frame) { const a = A.motifs[f.m]; f.w = Math.round((f.h * a.w) / a.h); }
fs.writeFileSync(
  path.join(__dirname, '../src/drop3/timeline.json'),
  JSON.stringify({ W, H, FPS, DURATION, Z0, F, FAR, NEAR, ZONE, END, ways: WAYS, bg: WAYS.map((w) => BG[w]), changes, COVER_DUR, covers, cam, els, floats, frame }),
);
console.log('changes', changes, 'END', END, 'els', els.length, 'floats', floats.length);
