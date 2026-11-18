import {CUTS, DESIGNS, DesignId, ORDER} from './designs';
import {ShapeId} from './layout';

// cam v = vertical, l = landscape. t = saat mula dalam raw. speed < 1 = slow motion (min 0.5).
// zoom = skala tambahan (vertical dizoom sikit, 1.15). focusX/focusY = titik fokus cover (0-1).
export type Shot = {cam: 'v' | 'l'; t: number; speed?: number; focusX?: number; focusY?: number; zoom?: number};
export type DesignShots = {shape3: ShapeId; shape2: ShapeId; grid3: Shot[]; grid2: Shot[]; detail: Shot};

// Struktur setiap design (16 beat): 3 panel masuk pada beat 0,1,2 dan main hingga beat 6;
// 2 panel masuk pada beat 6,7 dan main hingga beat 12; close-up landscape beat 12-16.
export const ENTER3 = [0, 1, 2];
export const END3 = 6;
export const ENTER2 = [6, 7];
export const END2 = 12;
export const DETAIL = [12, 16];
// Klimaks 1 bar: 5 panel masuk setiap separuh beat, main hingga beat 4.
export const CLIMAX_ENTER = [0, 0.5, 1, 1.5, 2];
export const CLIMAX_END = 4;

const ZV = 1.15;
const v = (t: number, speed = 1, focusY = 0.3): Shot => ({cam: 'v', t, speed, focusY, zoom: ZV});
const l = (t: number, speed = 0.5, focusX = 0.5): Shot => ({cam: 'l', t, speed, focusX, focusY: 0.4});

// Setiap klip dari segmen raw berbeza, tiada saat yang dipakai dua kali (kedua-dua kamera sync).
export const SHOTS: Record<DesignId, DesignShots> = {
  pearl: {shape3: 'A', shape2: 'E', grid3: [v(90.33), v(98.28, 0.75), v(94.9, 0.95)], grid2: [v(101.9, 0.6, 0.2), {...v(103.95, 0.6, 0), zoom: 1}], detail: l(106.7)},
  sky: {shape3: 'B', shape2: 'G', grid3: [v(3.25), v(0.05, 1, 0.2), v(11.25, 0.95)], grid2: [v(7.4, 1, 0.2), v(16.4, 1, 0.2)], detail: l(13.62)},
  blush: {shape3: 'C', shape2: 'G2', grid3: [v(24.2, 1, 0.25), v(31.65, 0.8), v(42.65)], grid2: [v(27.7, 1, 0.2), v(39.9, 0.85, 0.15)], detail: l(36.0)},
  ruby: {shape3: 'H', shape2: 'G3', grid3: [v(67.05), v(80.0), v(77.45)], grid2: [l(84.4), l(82.85)], detail: l(75.6)},
  silver: {shape3: 'I', shape2: 'G', grid3: [v(50.15, 0.6), v(55.88, 0.7), v(52.88, 0.6)], grid2: [v(58.85, 0.75, 0.2), v(61.55, 0.9, 0.2)], detail: l(54.3)},
};

// Klimaks: satu panel setiap design (ikut ORDER), close-up muka, dari saat yang belum dipakai.
export const CLIMAX: Shot[] = [l(100.5, 0.5, 0.2), v(19.3, 0.5, 0.2), v(33.98, 0.5, 0.2), l(70.55, 0.5, 0.6), l(57.95, 0.5, 0.6)];

type Use = {label: string; cam: 'v' | 'l'; a: number; b: number; speed: number};

// Guna raw setiap design (dengan beat nominal + margin) untuk semakan.
export const rawUses = (d: DesignId, shots = SHOTS, climax = CLIMAX, beat = 0.563): Use[] => {
  const s = shots[d];
  const use = (label: string, sh: Shot, beats: number): Use => {
    const speed = sh.speed ?? 1;
    return {label, cam: sh.cam, a: sh.t, b: sh.t + beats * beat * speed, speed};
  };
  const out: Use[] = [];
  s.grid3.forEach((sh, j) => out.push(use(`grid3[${j}]`, sh, END3 - ENTER3[j])));
  s.grid2.forEach((sh, j) => out.push(use(`grid2[${j}]`, sh, END2 - ENTER2[j])));
  out.push(use('detail', s.detail, DETAIL[1] - DETAIL[0]));
  const ci = ORDER.indexOf(d);
  out.push(use('climax', climax[ci], CLIMAX_END - CLIMAX_ENTER[ci]));
  return out;
};

const segmentOf = (cam: 'v' | 'l', t: number) => {
  const cuts = CUTS[cam];
  let a = 0;
  for (const c of cuts) {
    if (c > t) return [a, c];
    a = c;
  }
  return [a, Infinity];
};

export const validateShots = (shots = SHOTS, climax = CLIMAX): string[] => {
  const errs: string[] = [];
  for (const d of ORDER) {
    const [A, B] = DESIGNS[d].block;
    const uses = rawUses(d, shots, climax);
    for (const u of uses) {
      if (u.speed < 0.5) errs.push(`${d} ${u.label}: speed ${u.speed} < 0.5`);
      if (u.a < A || u.b > B) errs.push(`${d} ${u.label}: ${u.a.toFixed(2)}-${u.b.toFixed(2)} keluar dari blok ${A}-${B}`);
      const [sa, sb] = segmentOf(u.cam, u.a);
      if (u.b > sb) errs.push(`${d} ${u.label}: ${u.a.toFixed(2)}-${u.b.toFixed(2)} melintas cut ${sb} (${u.cam})`);
      if (u.a < sa) errs.push(`${d} ${u.label}: sebelum segmen`);
    }
    // Kamera sync: saat yang sama dari kamera lain pun dikira ulang.
    for (let i = 0; i < uses.length; i++)
      for (let k = i + 1; k < uses.length; k++) {
        const o = Math.min(uses[i].b, uses[k].b) - Math.max(uses[i].a, uses[k].a);
        if (o > 0) errs.push(`${d} ${uses[i].label} & ${uses[k].label}: bertindih ${o.toFixed(2)}s (klip berulang)`);
      }
  }
  return errs;
};
