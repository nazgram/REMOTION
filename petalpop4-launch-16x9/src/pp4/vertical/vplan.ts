import beatsData from '../../../public/pp4/beats.json';
import {beatAt} from '../beats';
import {SweepTiming} from '../components/Bloom';
import {DesignId, ORDER} from '../designs';
import {CLIMAX, CLIP_PAD, Shot, SHOTS} from '../shots';
import {buildTimeline} from '../timeline';
import {RampKeys} from './ramp';

// Pelan 9:16 (Nas 24 Nov): footage menegak sahaja, satu klip penuh skrin pada satu masa (tiada grid), speed ramp.
// Setiap design 5 beat: klip model (beat 0-3) -> cut atas beat 3 ke klip detail (beat 3-5). Klip laju masuk/keluar cut,
// slow-mo 0.5x di tengah. Pertukaran design = bunga print design baru mekar tutup skrin dan hilang (bloom wipe).
const BEATS = beatsData.beats as number[];
export const at = (k: number) => (k === 0 ? 0 : beatAt(k, BEATS));
export const TL = buildTimeline(BEATS);
const seg = (kind: string) => TL.find((s) => s.kind === kind)!;
export const BLOCKS = TL.filter((s) => s.kind === 'design');
export const CLIMAX_SEG = seg('climax');
export const COMING = seg('coming');
export const NAF = seg('nafesa');

export const SLOW = 0.5;
export const FAST = 2.4;
// Intro: print Pearl Grey mekar dari tengah dan mendarat (beat 0-2).
export const V_INTRO: SweepTiming = {pre: 0.35, maskLag: 0.15, spread: 0.4, grow: 0.35, settle: 0.35};
// Bloom wipe antara design: bunga penuh skrin tepat atas beat 0, hilang dan tunjuk klip model.
export const V_SWEEP: SweepTiming = {pre: 0.55, maskLag: 0.15, spread: 0.35, grow: 0.35, settle: 0.45};
export const V_SWEEP0: SweepTiming = {...V_SWEEP, pre: 0.15};
export const coverAt = (tm: SweepTiming) => tm.maskLag + tm.spread + 0.15;

// Satu penggunaan klip: dari/hingga saat mutlak, kunci ramp dalam saat dari `from`, punch = zoom masuk kecil di awal.
export type VUse = {label: string; shot: Shot; from: number; to: number; keys: RampKeys; punch: boolean; zoom: number};

export type VBlock = {design: DesignId; start: number; from: number; end: number; timing: SweepTiming; card: number; cut: number; uses: VUse[]};
const ORIGINS = ['center', 'bottom', 'bl', 'tr', 'center', 'bottom'] as const;
export const vOrigin = (i: number) => (i === 0 ? 'bottom' : ORIGINS[i]);

const climaxStart = CLIMAX_SEG.start;
export const V_CLIMAX_AT = [0, 1, 2, 3, 4, 5].map((k) => at(CLIMAX_SEG.beat0 + (k * 2) / 3));
export const V_CLIMAX_END = COMING.start + 0.85; // klip terakhir kekal sampai print Black Dahlia penuh

export const V_BLOCKS: VBlock[] = BLOCKS.map((s, i) => {
  const d = s.design!;
  const timing = i === 0 ? V_SWEEP0 : V_SWEEP;
  const from = s.start - timing.pre;
  const cut = at(s.beat0 + 3);
  const next = i < BLOCKS.length - 1 ? BLOCKS[i + 1].start : null;
  const end = next !== null ? next - V_SWEEP.pre + coverAt(V_SWEEP) + 0.05 : climaxStart;
  const [model, detail] = SHOTS[d].panels;
  const aKeys: RampKeys = [
    [0, i === 0 ? 1.6 : 1.3],
    [timing.pre + 0.1, SLOW],
    [cut - from - 0.45, SLOW],
    [cut - from, FAST],
  ];
  const bEnd = end;
  const bKeys: RampKeys =
    next !== null
      ? [[0, FAST], [0.35, SLOW], [next - V_SWEEP.pre - cut, SLOW], [bEnd - cut, 1.8]]
      : [[0, FAST], [0.35, SLOW], [bEnd - cut - 0.3, SLOW], [bEnd - cut, FAST]];
  return {
    design: d,
    start: s.start,
    from,
    end,
    timing,
    card: at(s.beat0 + 0.5),
    cut,
    uses: [
      {label: `${d}[model]`, shot: model, from, to: cut, keys: aKeys, punch: false, zoom: 1},
      {label: `${d}[detail]`, shot: detail, from: cut, to: bEnd, keys: bKeys, punch: true, zoom: detail.zoom ?? 1.3},
    ],
  };
});

export const V_CLIMAX: VUse[] = CLIMAX.map((shot, k) => {
  const from = V_CLIMAX_AT[k];
  const to = k < 5 ? V_CLIMAX_AT[k + 1] : V_CLIMAX_END;
  return {label: `climax[${k}]`, shot, from, to, keys: [[0, 2.0], [0.2, 0.6]], punch: true, zoom: 1.0};
});

// Panjang klip yang ada (fail clips/VG_<t>.mp4, mula t - CLIP_PAD): dari cutlist.
export const CLIP_LEN: Record<string, number> = {model: 2.7, detail: 2.35, climax0: 2.11, climax1: 1.97, climax2: 1.82, climax3: 1.68, climax4: 1.53, climax5: 1.39};
export const clipLen = (u: VUse) => (u.label.startsWith('climax') ? CLIP_LEN[`climax${u.label[7]}`] : u.label.endsWith('[model]') ? CLIP_LEN.model : CLIP_LEN.detail) - CLIP_PAD;
export const ALL_V_USES = (): VUse[] => [...V_BLOCKS.flatMap((b) => b.uses), ...V_CLIMAX];
export {ORDER};
