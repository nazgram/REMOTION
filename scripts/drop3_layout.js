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
  // hero: on the path so it fills the frame as it flies through; it is the colourway change
  add(way, 'hero', ['F1', 'F4', 'F1', 'F4', 'F1'][k], z0 + 0.55 * ZONE, R(-90, 90), R(-120, 60), 1050, { spin: +R(-14, 14).toFixed(1) });
});
// the opening: a Buttercup flower already right in front of the lens, flying past to open the film
add('Buttercup', 'hero', 'F4', Z0 + 1150, -140, 60, 900, { spin: 18, opener: true });
for (const e of els) {
  const ts = timeAtZ(e.z - FAR);
  e.born = ts === null ? 99 : ts;
  e.pass = timeAtZ(e.z - 260);
}
// colourway changes: at each hero's fly-through
const heroes = els.filter((e) => e.kind === 'hero' && !e.opener).sort((a, b) => a.z - b.z);
const changes = heroes.slice(0, 4).map((h) => h.pass);
const END = { washAt: heroes[4].pass - 0.35, washDur: 1.2 };
END.logoAt = +(END.washAt + 0.9).toFixed(2);
END.logoDur = 1.2;
END.logoOut = +(END.logoAt + 3.2).toFixed(2);
END.nafAt = +(END.logoOut + 0.4).toFixed(2);
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
// the logo: twelve small flowers spiral in and settle round it, then drift off with it
const ring = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2 + 0.3;
  return { id: `r${i}`, way: WAYS[i % 5], m: pick(['F2', 'F3', 'F5', 'F2', 'P1']), a: +a.toFixed(3), r: Math.round(R(470, 560)),
    h: Math.round(R(70, 120)), at: +(END.logoAt + 0.25 + i * 0.05).toFixed(2), spin: Math.round(R(-40, 40)), phase: +R(0, 6.28).toFixed(2) };
});
fs.writeFileSync(
  path.join(__dirname, '../src/drop3/timeline.json'),
  JSON.stringify({ W, H, FPS, DURATION, Z0, F, FAR, NEAR, ZONE, END, ways: WAYS, bg: WAYS.map((w) => BG[w]), changes, cam, els, floats, ring }),
);
console.log('changes', changes, 'END', END, 'els', els.length, 'floats', floats.length);
