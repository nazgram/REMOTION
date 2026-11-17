// Joy Club teaser V2 timeline ("playful luxury 2.5D"): five scenes, each with its own dot set in three depth
// layers (bg tiny + soft, mid mixed sizes + sharp, fg oversized + blurred) and its own choreography timing.
// Picture (src/joyclub/JoyClubDotsV2.tsx) and sound (audio/joyclub_v2_sfx.js) both read it.
//   node scripts/joyclub_v2_layout.js  ->  src/joyclub/v2.json
const fs = require('fs');
const path = require('path');
const { palettes, shapes } = require('../src/joyclub/shapes.json');

const FPS = 30, W = 1080, H = 1920, DURATION = 18;
const ORDER = ['White Sky blue', 'Red Sky blue', 'Sage Taupe', 'Sky blue Red', 'Silver Brownie'];
const BOUNDS = [0, 3.3, 6.7, 10.1, 13.5, 18];
const CX = W / 2, CY = H / 2;

let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const between = (a, b) => a + rnd() * (b - a);
const r2 = (v) => Math.round(v * 100) / 100;
const shape = () => Math.floor(rnd() * shapes.length);

function midDots(forceLargeAt) {
  const dots = [];
  const CELL = 132;
  for (let r = -1; r <= Math.ceil(H / CELL); r++)
    for (let c = -1; c <= Math.ceil(W / CELL); c++) {
      const x = (c + (r % 2 ? 0.5 : 0)) * CELL + between(-38, 38);
      const y = r * CELL + 40 + between(-38, 38);
      if (x < -60 || x > W + 60 || y < -60 || y > H + 60) continue;
      const k = rnd();
      const size = k < 0.42 ? between(22, 30) : k < 0.86 ? between(34, 48) : between(66, 104);
      dots.push({ x, y, size, cat: size > 60 ? 'L' : size > 32 ? 'M' : 'S' });
    }
  if (forceLargeAt) {
    let best = dots[0];
    dots.forEach((q) => { if (Math.hypot(q.x - forceLargeAt[0], q.y - forceLargeAt[1]) < Math.hypot(best.x - forceLargeAt[0], best.y - forceLargeAt[1])) best = q; });
    best.size = 96; best.cat = 'L'; best.anchor = true;
  }
  // keep large dots breathing room: neighbours shrink
  dots.filter((q) => q.cat === 'L').forEach((L) => dots.forEach((q) => {
    if (q !== L && q.cat !== 'L' && Math.hypot(q.x - L.x, q.y - L.y) < L.size / 2 + q.size / 2 + 34) { q.size = between(16, 22); q.cat = 'T'; }
  }));
  dots.forEach((q) => Object.assign(q, { x: r2(q.x), y: r2(q.y), size: r2(q.size), shape: shape(), rot: Math.round(between(0, 360)), phase: r2(between(0, 6.28)), layer: 'mid' }));
  return dots;
}
function bgDots(mid, n = 70) {
  const out = [];
  let tries = 0;
  while (out.length < n && tries++ < 4000) {
    const x = between(-20, W + 20), y = between(-20, H + 20);
    if (mid.some((q) => Math.hypot(q.x - x, q.y - y) < q.size / 2 + 26)) continue;
    if (out.some((q) => Math.hypot(q.x - x, q.y - y) < 40)) continue;
    out.push({ x: r2(x), y: r2(y), size: r2(between(9, 17)), shape: shape(), rot: Math.round(between(0, 360)), phase: r2(between(0, 6.28)), layer: 'bg' });
  }
  return out;
}
const fg = (x0, y0, x1, y1, t0, t1, size) => ({ x0, y0, x1, y1, t0: r2(t0), t1: r2(t1), size, shape: shape(), rot: Math.round(between(0, 360)), layer: 'fg' });

const sfx = { pops: [], ticks: [], swoosh: [], cover: [], settle: [] };
const popAt = {};
const addPop = (t) => { const f = Math.round(t * FPS); popAt[f] = (popAt[f] || 0) + 1; };

const scenes = ORDER.map((name, i) => {
  const pal = palettes.find((p) => p.name === name);
  const s = BOUNDS[i], e = BOUNDS[i + 1];
  const mid = midDots(i === 3 ? [CX + 40, CY - 60] : null);
  const bg = bgDots(mid);
  const all = [...bg, ...mid];
  const scene = { name, bg: pal.bg, dot: pal.dot, start: s, end: e, fg: [] };
  if (i === 0) {
    // macro intro: hero dot in focus, mid dots fly in from every side and bounce, bg pops soft
    scene.hero = { x: CX - 60, y: CY + 80, size0: 1500, size1: 104, t0: 0, t1: 1.5, shape: 3, rot: 20 };
    mid.forEach((q) => {
      const a = Math.atan2(q.y - CY, q.x - CX) + between(-0.5, 0.5);
      q.fx = r2(q.x + Math.cos(a) * between(700, 1100)); q.fy = r2(q.y + Math.sin(a) * between(700, 1100));
      q.t = r2(0.55 + rnd() * 1.25); q.dur = r2(between(0.45, 0.6));
      addPop(q.t + q.dur * 0.75); if (q.cat === 'L') sfx.ticks.push(r2(q.t + q.dur));
    });
    bg.forEach((q) => { q.t = r2(0.3 + rnd() * 1.4); });
    scene.fg = [fg(-300, 1500, 1400, 300, 1.45, 2.05, 340), fg(1350, 1750, -320, 900, 2.0, 2.55, 260)];
    scene.trans = { kind: 'fly', t0: 2.7, t1: 3.3, from: [W * 0.9, H * 1.1], color: null };
  } else if (i === 1) {
    // gravity shift: half drop from above and bounce, half float up from below; camera drifts sideways
    all.forEach((q) => {
      q.mode = rnd() < 0.55 ? 'fall' : 'float';
      if (q.mode === 'fall') { q.t = r2(s + 0.05 + rnd() * 1.0); q.dur = r2(between(0.8, 1.05)); q.fy = r2(-150 - rnd() * 500); addPop(q.t + q.dur * 0.36); if (q.layer === 'mid' && q.size > 40) sfx.ticks.push(r2(q.t + q.dur * 0.36)); }
      else { q.t = r2(s + 0.1 + rnd() * 0.9); q.dur = r2(between(1.2, 1.6)); q.fy = r2(H + 150 + rnd() * 400); }
    });
    scene.fg = [fg(1300, 400, -300, 600, s + 0.9, s + 1.6, 300), fg(-280, 1300, 1350, 1500, s + 1.9, s + 2.6, 380)];
    scene.trans = { kind: 'wipe', t0: 6.05, t1: 6.7 };
  } else if (i === 2) {
    // layered focus: quick soft pop-in, slow fg giants, bg in focus first then rack focus to the mid layer
    all.forEach((q) => { q.t = r2(s + rnd() * 0.65); addPop(q.t + 0.08); });
    scene.fg = [fg(-250, 500, 600, 380, s, s + 2.4, 420), fg(1350, 1350, 700, 1500, s + 0.2, s + 2.6, 360), fg(800, -300, 1150, 300, s + 0.6, s + 2.5, 300)];
    scene.rack = [s + 1.0, s + 1.6];
    scene.trans = { kind: 'gather', t0: 9.2, t1: 9.75, t2: 10.1 };
    mid.forEach((q) => { q.g = r2(9.2 + (Math.hypot(q.x - CX, q.y - CY) / Math.hypot(CX, CY)) * 0.22); });
  } else if (i === 3) {
    // wave bounce: dots arrive on a diagonal ripple, a second ripple lifts them, camera pushes in
    all.forEach((q) => {
      const o = (q.x / W) * 0.45 + (1 - q.y / H) * 0.55;
      q.t = r2(s + 0.05 + o * 1.15 + between(-0.04, 0.04));
      if (q.layer === 'mid') addPop(q.t + 0.1);
      q.w = r2(s + 1.55 + o * 0.9);
    });
    scene.fg = [fg(1350, 300, -350, 1100, s + 1.5, s + 2.2, 320)];
    scene.push = [11.4, 12.8];
    scene.anchor = mid.find((q) => q.anchor);
    scene.trans = { kind: 'zoom', t0: 12.8, t1: 13.5 };
  } else {
    // playful settle: spiral in with a spin, depth and size variety fade out into the clean flat pattern
    all.forEach((q) => {
      const a0 = Math.atan2(q.y - CY, q.x - CX), d = Math.hypot(q.x - CX, q.y - CY);
      const a = a0 - between(0.5, 0.8), dd = d * between(1.25, 1.45) + 120;
      q.fx = r2(CX + Math.cos(a) * dd); q.fy = r2(CY + Math.sin(a) * dd);
      q.t = r2(s + 0.05 + (d / Math.hypot(CX, CY)) * 0.7 + between(0, 0.25)); q.dur = r2(between(1.0, 1.3));
      q.flat = r2(between(30, 38));
      if (q.layer === 'mid') addPop(q.t + q.dur * 0.6);
    });
    scene.fg = [fg(300, 700, -500, 400, s, s + 1.8, 380), fg(850, 1450, 1600, 1700, s + 0.1, s + 1.9, 300)];
    scene.flatten = [15.0, 16.3];
    scene.hold = 17.2;
    sfx.settle.push(16.4);
  }
  scene.fg.forEach((f) => sfx.swoosh.push(r2(f.t0 + (f.t1 - f.t0) * 0.35)));
  if (scene.trans) { sfx.swoosh.push(r2(scene.trans.t0)); sfx.cover.push(r2(scene.trans.t2 || scene.trans.t1)); }
  scene.dots = all;
  return scene;
});
scenes.forEach((sc, i) => { if (sc.trans) sc.trans.color = scenes[i + 1].bg; });
sfx.pops = Object.entries(popAt).map(([f, n]) => [r2(f / FPS), n]).sort((a, b) => a[0] - b[0]);
sfx.ticks.sort((a, b) => a - b);
fs.writeFileSync(path.join(__dirname, '..', 'src', 'joyclub', 'v2.json'), JSON.stringify({ FPS, W, H, DURATION, scenes, sfx }));
scenes.forEach((s) => console.log(s.name, s.start, s.end, 'mid', s.dots.filter((q) => q.layer === 'mid').length, 'bg', s.dots.filter((q) => q.layer === 'bg').length, 'fg', s.fg.length));
