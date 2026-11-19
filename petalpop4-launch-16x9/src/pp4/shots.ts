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

const s = (raw: string, t: number, o: Partial<Shot> = {}): Shot => ({raw, t, speed: 0.6, ...o});
const det = (raw: string, t: number, o: Partial<Shot> = {}): Shot => s(raw, t, {detail: true, zoom: 1.35, ...o});

// Dipilih dari contact sheet + skor gegar (scripts/pp4_shake.json): tiada orang halang, model ready, tak gegar,
// tiada 2 s pertama raw, tiada saat berulang. Panel tengah = detail print.
export const SHOTS: Record<DesignId, DesignShots> = {
  pearl: {shape: 'A', panels: [s('C4574', 15.0, {focusY: 0.25}), det('C4575', 48.8, {focusY: 0.5}), s('C4575', 62.0, {focusY: 0.3})]},
  dusty: {shape: 'B', panels: [s('C4589', 6.2, {focusY: 0.25}), det('C4588', 34.5, {focusY: 0.5}), s('C4588', 47.8, {focusY: 0.3})]},
  lilac: {shape: 'C', panels: [s('C4596', 6.0, {focusY: 0.3}), det('C4594', 4.6, {focusX: 0.55, focusY: 0.45, zoom: 1.4}), s('C4597', 17.0, {focusY: 0.3})]},
  sage: {shape: 'H', panels: [s('C4605', 24.3, {focusY: 0.3}), det('C4605', 40.6, {focusY: 0.5}), s('C4603', 7.0, {focusY: 0.35})]},
  powder: {shape: 'I', panels: [s('C4580', 6.0, {focusY: 0.25}), det('C4580', 14.2, {focusY: 0.65, zoom: 1.4}), s('C4584', 12.2, {focusY: 0.35})]},
  dahlia: {shape: 'K', panels: [s('C4569', 4.5, {focusY: 0.3}), det('C4570', 5.0, {focusY: 0.5, zoom: 1.2}), s('C4568', 14.0, {focusY: 0.3})]},
};

// Klimaks: muka depan, satu jalur setiap design (ikut ORDER), slow-mo 50%.
const c = (raw: string, t: number): Shot => ({raw, t, speed: 0.5, focusY: 0.28, zoom: 1.1});
export const CLIMAX: Shot[] = [c('C4575', 19.0), c('C4589', 9.0), c('C4595', 21.6), c('C4605', 49.6), c('C4580', 21.4), c('C4568', 4.4)];

// Panjang raw (s) dan cut dalaman yang dikesan (lompatan frame besar).
export const RAW_DUR: Record<string, number> = {
  C4567: 33.0, C4568: 25.0, C4569: 20.0, C4570: 25.5, C4574: 23.0, C4575: 79.0, C4580: 43.0, C4581: 13.5, C4582: 14.5, C4583: 31.5, C4584: 33.0,
  C4588: 59.6, C4589: 20.5, C4590: 25.5, C4594: 12.0, C4595: 25.5, C4596: 45.0, C4597: 51.6, C4598: 15.5, C4603: 30.5, C4604: 12.0, C4605: 56.1,
};
export const RAW_CUTS: Record<string, number[]> = {C4567: [6, 24, 30], C4568: [10], C4570: [11, 17, 21], C4575: [13, 29, 31, 54], C4588: [11, 16, 38], C4595: [5, 24], C4597: [49], C4603: [29], C4605: [17, 32, 54]};

export const MIN_START = 2.0; // jangan ambil awal shot
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

export const validateShots = (shots = SHOTS, climax = CLIMAX): string[] => {
  const errs: string[] = [];
  for (const d of ORDER) {
    const p = shots[d].panels;
    if (p.filter((x) => x.detail).length !== 1) errs.push(`${d}: mesti ada tepat 1 shot detail`);
    for (const sh of p) if (!DESIGNS[d].raws.includes(sh.raw)) errs.push(`${d}: ${sh.raw} bukan raw design ini`);
  }
  climax.forEach((sh, k) => {
    if (!DESIGNS[ORDER[k]].raws.includes(sh.raw)) errs.push(`climax[${k}]: ${sh.raw} bukan raw ${ORDER[k]}`);
  });
  const uses = allUses(shots, climax);
  for (const u of uses) {
    const {shot: sh} = u;
    if (sh.speed < 0.5) errs.push(`${u.label}: speed ${sh.speed} < 0.5`);
    if ((sh.zoom ?? 1) > MAX_ZOOM) errs.push(`${u.label}: zoom ${sh.zoom} > ${MAX_ZOOM}`);
    if (u.a < MIN_START) errs.push(`${u.label}: mula ${u.a}s, awal shot (< ${MIN_START}s)`);
    if (u.b > (RAW_DUR[sh.raw] ?? 0) - 0.3) errs.push(`${u.label}: ${u.b.toFixed(2)}s lepas hujung raw ${sh.raw}`);
    for (const cut of RAW_CUTS[sh.raw] ?? []) if (u.a < cut + 1 && u.b > cut - 0.2) errs.push(`${u.label}: melintas cut ${cut}s dalam ${sh.raw}`);
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
