import {DESIGNS, DesignId, ORDER} from './designs';

// cam v = vertical, l = landscape. t = saat dalam raw. dur = saat di skrin. speed < 1 = slow motion (min 0.5).
export type Shot = {cam: 'v' | 'l'; t: number; dur: number; speed?: number; focusY?: number};
export type DesignShots = {grid3: Shot[]; grid2: Shot[]; detail: Shot};

const v = (t: number, focusY = 0.4, dur = 1.6): Shot => ({cam: 'v', t, dur, focusY});

// PILIHAN SEMENTARA. Nas akan pilih sendiri dari contact sheet (nombor = saat dalam raw).
// grid3: 3 shot set A + 3 shot set B (tukar panel demi panel ikut beat). grid2: 2 set A + 2 set B.
export const SHOTS: Record<DesignId, DesignShots> = {
  pearl: {grid3: [v(94), v(99), v(100.5), v(97), v(92), v(91)], grid2: [v(102, 0.3), v(103, 0.3), v(95, 0.3), v(104, 0.5)], detail: {cam: 'l', t: 101.6, dur: 2.2, speed: 0.5}},
  sky: {grid3: [v(1), v(11), v(5), v(3), v(12), v(8)], grid2: [v(9, 0.3), v(16, 0.3), v(17, 0.3), v(14, 0.5)], detail: {cam: 'l', t: 14, dur: 2.2, speed: 0.5}},
  blush: {grid3: [v(26), v(30), v(43.5), v(28), v(31), v(45)], grid2: [v(33, 0.3), v(36, 0.3), v(40, 0.3), v(38, 0.5)], detail: {cam: 'l', t: 37, dur: 2.2, speed: 0.5}},
  ruby: {grid3: [v(69), v(80), v(84), v(71), v(82), v(85)], grid2: [v(73, 0.3), v(77, 0.3), v(75, 0.3), v(76, 0.5)], detail: {cam: 'l', t: 75, dur: 2.2, speed: 0.5}},
  silver: {grid3: [v(51), v(54), v(59), v(53), v(60), v(55)], grid2: [v(56, 0.3), v(61, 0.3), v(57, 0.3), v(62, 0.3)], detail: {cam: 'l', t: 57, dur: 2.2, speed: 0.5}},
};

// Klimaks: satu panel setiap design, ikut ORDER.
export const CLIMAX: Shot[] = [v(102, 0.3, 2.4), v(9, 0.3, 2.4), v(32, 0.3, 2.4), v(72, 0.3, 2.4), v(61, 0.3, 2.4)];

export const validateShots = (shots = SHOTS, climax = CLIMAX): string[] => {
  const errs: string[] = [];
  const check = (d: DesignId, label: string, s: Shot) => {
    const [a, b] = DESIGNS[d].block;
    const speed = s.speed ?? 1;
    if (speed < 0.5) errs.push(`${d} ${label}: speed ${speed} < 0.5`);
    if (s.t < a || s.t + s.dur * speed > b) errs.push(`${d} ${label}: ${s.t}+${(s.dur * speed).toFixed(2)}s keluar dari blok ${a}-${b}`);
  };
  for (const d of ORDER) {
    shots[d].grid3.forEach((s, i) => check(d, `grid3[${i}]`, s));
    shots[d].grid2.forEach((s, i) => check(d, `grid2[${i}]`, s));
    check(d, 'detail', shots[d].detail);
  }
  climax.forEach((s, i) => check(ORDER[i], `climax[${i}]`, s));
  return errs;
};
