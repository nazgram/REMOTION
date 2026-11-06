// Petal Pop Drop 3 Teaser 1 (v3): one slow flight forward. The camera never stops pushing in and sways left and
// right; a few Abstract Floral motifs hang in depth, one zone per colourway, drifting left to right on the wind.
// Each grows in from small far away, swells as the camera reaches it and slips past the edge of frame, behind
// the camera. At the end the flight slows, the garden blurs into a wash and the Drop 3 logo writes in.
//   node scripts/drop3_layout.js   ->  src/drop3/timeline.json
const fs = require('fs');
const path = require('path');
const A = require('../src/drop3/assets.json');

const W = 1080, H = 1920, FPS = 30, DURATION = 25.5;
const F = 900; // focal length: a motif at depth F is drawn at its own size
const FAR = 4600, NEAR = 160; // visible depths
const ZONE = 3300; // camera travel per colourway
const WAYS = ['Buttercup', 'Camellia', 'Petunia', 'Lavender', 'Marigold'];
const END = { washAt: 19.4, washDur: 1.4, logoAt: 20.2, logoDur: 1.3, logoOut: 23.3, nafAt: 23.7 };

// camera: forward speed eases down at the end; pan sweeps left/right slowly
const speed = (t) => (t < 16.5 ? 900 : t < 21 ? 900 - (900 - 160) * Math.sin(((t - 16.5) / 4.5) * Math.PI / 2) : 160);
const N = Math.round(DURATION * FPS);
const cam = [];
const Z0 = -1500; // the camera starts a little behind the first colourway
let z = Z0;
for (let f = 0; f < N; f++) {
  const t = f / FPS;
  cam.push([Math.round(z), Math.round(260 * Math.sin(t * 0.36 - 0.6) + 60 * Math.sin(t * 0.9)), +(Math.sin(t * 0.3 + 1) * 70).toFixed(1), +(Math.sin(t * 0.36 - 0.6 + 0.5) * -1.6).toFixed(2)]);
  z += speed(t) / FPS;
}
const camZAt = (t) => cam[Math.min(N - 1, Math.max(0, Math.round(t * FPS)))][0];
const timeAtZ = (zz) => { const f = cam.findIndex((c) => c[0] >= zz); return f < 0 ? null : f / FPS; };

// a small seeded random
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const pick = (a) => a[Math.floor(rnd() * a.length)];

// per zone: few motifs, kept apart. [kind, motifs, world height, x range, y range]
// hero: one big flower near the path that the camera flies close past
const AT = [0.55, 0.12, 0.33, 0.85]; // where in its zone's depth each role sits
const ROLE = [
  ['hero', ['F1', 'F4', 'F2'], 950, [-300, 300], [-500, 300]],
  ['spray', ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'], 1150, [-1000, -600], 'A'],
  ['spray', ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'], 1150, [600, 1000], 'B'],
  ['blown', ['P1', 'S1', 'S2', 'F3'], 340, [-1700, -1300], [-1100, 1100]],
];
const els = [];
WAYS.forEach((way, k) => {
  const z0 = k * ZONE;
  ROLE.forEach(([kind, ms, h, xr, yr0], r) => {
    // the two sprays take opposite halves of the frame, swapping every zone
    const up = [-1400, -450], down = [450, 1400];
    const yr = yr0 === 'A' ? (k % 2 ? down : up) : yr0 === 'B' ? (k % 2 ? up : down) : yr0;
    // spread each role through the zone's depth so things arrive one at a time
    const zz = z0 + 1000 + (AT[r] + (rnd() - 0.5) * 0.08) * ZONE;
    const m = kind === 'hero' ? ['F1', 'F4', 'F1', 'F4', 'F1'][k] : pick(ms);
    const a = A.motifs[m];
    const hh = h * (0.85 + rnd() * 0.3);
    els.push({
      id: `${k}-${r}`, way, kind, m, z: Math.round(zz),
      x: Math.round(xr[0] + rnd() * (xr[1] - xr[0])), y: Math.round(yr[0] + rnd() * (yr[1] - yr[0])),
      h: Math.round(hh), w: Math.round((hh * a.w) / a.h),
      rot: Math.round(rnd() * 360), spin: +((rnd() - 0.5) * (kind === 'blown' ? 60 : 10)).toFixed(1),
      vx: kind === 'blown' ? 520 + Math.round(rnd() * 160) : 70 + Math.round(rnd() * 50), // the wind, left to right
      flip: rnd() < 0.5, phase: +(rnd() * 6.28).toFixed(2),
    });
  });
});
// when each motif appears (grows in at FAR, or in the opening seconds for the first zone) and passes the camera
for (const e of els) {
  const ts = timeAtZ(e.z - FAR);
  e.born = +(ts === null ? 99 : Math.max(0, ts) + (ts !== null && ts <= 0 ? 0.15 + (e.z % 7) * 0.12 : 0)).toFixed(2);
  const tp = timeAtZ(e.z - 380);
  e.pass = tp === null ? null : +tp.toFixed(2);
}
const bg = WAYS.map((w) => (w === 'Petunia' ? '#f4ded0' : A.bg[w]));
fs.writeFileSync(
  path.join(__dirname, '../src/drop3/timeline.json'),
  JSON.stringify({ W, H, FPS, DURATION, Z0, F, FAR, NEAR, ZONE, END, ways: WAYS, bg, cam, els }),
);
console.log(els.map((e) => `${e.id} ${e.m} born ${e.born} pass ${e.pass}`).join('\n'));
