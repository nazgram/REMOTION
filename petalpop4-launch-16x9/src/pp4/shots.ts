import beatsData from '../../public/pp4/beats.json';
import {DesignId, DESIGNS, ORDER} from './designs';
import {CLIMAX_BEATS, DESIGN_BEATS} from './timeline';

// Satu shot = julat dalam raw (saat). speed < 1 = slow-mo (min 0.5). zoom = crop tambahan (maks 1.4).
// focusX/focusY = titik fokus cover (0-1). detail = close-up print.
export type Shot = {raw: string; t: number; speed: number; zoom?: number; focusX?: number; focusY?: number; detail?: boolean};
export type ShapeId = 'A' | 'B' | 'C' | 'H' | 'I' | 'K';
export type DesignShots = {shape: ShapeId; panels: [Shot, Shot, Shot]};

// Panel masuk beat 0, 1, 2 dan kekal hingga hujung blok (sweep tutup atasnya).
export const ENTER = [0, 1, 2];
// Klimaks: 6 jalur masuk setiap separuh beat.
export const CLIMAX_ENTER = [0, 0.5, 1, 1.5, 2, 2.5];

const s = (t: number, o: Partial<Shot> = {}): Shot => ({raw: 'VG', t, speed: 0.6, ...o});
const det = (t: number, o: Partial<Shot> = {}): Shot => s(t, {detail: true, zoom: 1.35, ...o});
// Masa dalam VIDEO GRADE .mp4 (footage Nas sudah grade, 19 Nov 14:21). Dipilih dari contact sheet VG: tiada orang halang,
// model ready, tak gegar, bukan awal segmen, tiada saat berulang. Panel tengah = detail print.
export const SHOTS: Record<DesignId, DesignShots> = {
  pearl: {shape: 'A', panels: [s(45.5, {focusY: 0.25}), det(59.6, {focusY: 0.5}), s(51.8, {focusY: 0.3})]},
  dusty: {shape: 'B', panels: [s(132.5, {focusY: 0.3}), det(121.0, {focusY: 0.5}), s(124.0, {focusY: 0.3})]},
  lilac: {shape: 'C', panels: [s(149.5, {focusY: 0.3}), det(154.6, {focusX: 0.5, focusY: 0.42}), s(182.5, {focusY: 0.3})]},
  sage: {shape: 'H', panels: [s(211.0, {focusY: 0.3}), det(224.7, {focusY: 0.5}), s(218.3, {focusY: 0.35})]},
  powder: {shape: 'I', panels: [s(70.0, {focusY: 0.3}), det(76.0, {focusY: 1.0, zoom: 1.4}), s(90.0, {focusY: 0.3})]},
  dahlia: {shape: 'K', panels: [s(21.0, {focusY: 0.3}), det(28.9, {focusY: 0.5, zoom: 1.2}), s(14.0, {focusY: 0.3})]},
};
// Klimaks: muka depan, satu jalur setiap design (ikut ORDER), slow-mo 50%.
const c = (t: number): Shot => ({raw: 'VG', t, speed: 0.5, focusY: 0.28, zoom: 1.1});
export const CLIMAX: Shot[] = [c(55.5), c(116.5), c(157.7), c(205.5), c(78.3), c(8.2)];
// Panjang VIDEO GRADE dan cut antara segmen (dikesan dari beza frame 10 fps, +-0.1 s).
export const RAW_DUR: Record<string, number> = {VG: 230.1};
export const RAW_CUTS: Record<string, number[]> = {
  VG: [7.6, 13.1, 16.5, 19.0, 28.3, 31.2, 34.4, 51.2, 54.8, 58.2, 62.7, 64.8, 69.1, 73.2, 79.4, 88.5, 96.9, 100.5, 103.7, 109.7, 115.4, 120.4, 123.1, 131.1, 136.9, 142.5, 147.7, 152.6, 160.5, 161.6, 168.0, 173.2, 181.4, 188.2, 195.1, 199.6, 202.6, 210.5, 214.1, 226.9],
};
export const MIN_START = 0.5; // jangan ambil awal shot: sekurang-kurangnya 0.5 s selepas mula segmen
export const MAX_ZOOM = 1.4;
const BEAT = 60 / beatsData.bpm;
export const SWEEP_TAIL = 0.1; // margin selepas blok (reveal mula 3 frame awal)

// Tempoh panel di skrin (saat) -> julat raw = t .. t + life*speed.
export const panelLife = (k: number) => (DESIGN_BEATS - ENTER[k]) * BEAT + SWEEP_TAIL;
export const climaxLife = (k: number) => (CLIMAX_BEATS - CLIMAX_ENTER[k]) * BEAT + SWEEP_TAIL;

export type Use = {label: string; shot: Shot; a: number; b: number};
export const allUses = (shots = SHOTS, climax = CLIMAX): Use[] => {
  const out: Use[] = [];
  for (const d of ORDER) shots[d].panels.forEach((sh, k) => out.push({label: `${d}[${k}]`, shot: sh, a: sh.t, b: sh.t + panelLife(k) * sh.speed}));
  climax.forEach((sh, k) => out.push({label: `climax[${k}]`, shot: sh, a: sh.t, b: sh.t + climaxLife(k) * sh.speed}));
  return out;
};

const inDesign = (d: DesignId, sh: Shot) => sh.t >= DESIGNS[d].vg[0] && sh.t <= DESIGNS[d].vg[1];
export const validateShots = (shots = SHOTS, climax = CLIMAX): string[] => {
  const errs: string[] = [];
  for (const d of ORDER) {
    const p = shots[d].panels;
    if (p.filter((x) => x.detail).length !== 1) errs.push(`${d}: mesti ada tepat 1 shot detail`);
    for (const sh of p) if (!inDesign(d, sh)) errs.push(`${d}: ${sh.t}s bukan dalam julat design ini`);
  }
  climax.forEach((sh, k) => {
    if (!inDesign(ORDER[k], sh)) errs.push(`climax[${k}]: ${sh.t}s bukan dalam julat ${ORDER[k]}`);
  });
  const uses = allUses(shots, climax);
  for (const u of uses) {
    const {shot: sh} = u;
    if (sh.speed < 0.5) errs.push(`${u.label}: speed ${sh.speed} < 0.5`);
    if ((sh.zoom ?? 1) > MAX_ZOOM) errs.push(`${u.label}: zoom ${sh.zoom} > ${MAX_ZOOM}`);
    const segStart = Math.max(0, ...(RAW_CUTS[sh.raw] ?? []).filter((c) => c <= u.a));
    if (u.a - segStart < MIN_START) errs.push(`${u.label}: mula ${u.a}s, awal shot (segmen mula ${segStart}s)`);
    if (u.b > (RAW_DUR[sh.raw] ?? 0) - 0.3) errs.push(`${u.label}: ${u.b.toFixed(2)}s lepas hujung ${sh.raw}`);
    for (const cut of RAW_CUTS[sh.raw] ?? []) if (u.a < cut && u.b > cut - 0.2) errs.push(`${u.label}: melintas cut ${cut}s dalam ${sh.raw}`);
  }
  for (let i = 0; i < uses.length; i++)
    for (let k = i + 1; k < uses.length; k++) {
      if (uses[i].shot.raw !== uses[k].shot.raw) continue;
      const o = Math.min(uses[i].b, uses[k].b) - Math.max(uses[i].a, uses[k].a);
      if (o > 0) errs.push(`${uses[i].label} & ${uses[k].label}: bertindih ${o.toFixed(2)}s dalam ${uses[i].shot.raw}`);
    }
  return errs;
};

// Nama fail klip yang dipotong (graded) dan offset mula dalam fail itu.
export const CLIP_PAD = 0.1;
export const clipFile = (sh: Shot) => `clips/${sh.raw}_${sh.t.toFixed(2)}.mp4`;
