import beatsShort from '../../../public/pp4/beats.json';
import beatsLong from '../../../public/pp4/beats_long.json';
import {beatAt} from '../beats';
import {Origin, SweepTiming} from '../components/Bloom';
import {ComingTimes} from '../components/EndCards';
import {DesignId, ORDER} from '../designs';
import {CLIMAX, Shot, SHOTS} from '../shots';
import {RampKeys} from './ramp';

// Pelan 9:16 (Nas 24 Nov): footage menegak sahaja, satu klip penuh skrin pada satu masa (tiada grid), speed ramp.
// Klip laju masuk/keluar cut, slow-mo 0.5x di tengah. Pertukaran design = bunga print design baru mekar tutup skrin dan
// hilang (bloom wipe). Dua versi: pendek 26.5 s (5 beat setiap design, 2 klip) dan panjang ~51 s (Nas 27 Nov: 11 beat
// setiap design, 3 klip, semua 24 klip, tamat pada hit terakhir lagu).

export const SLOW = 0.5;
export const FAST = 2.4;
// Intro: print Pearl Grey mekar dari tengah dan mendarat (beat 0-2).
export const V_INTRO: SweepTiming = {pre: 0.35, maskLag: 0.15, spread: 0.4, grow: 0.35, settle: 0.35};
// Bloom wipe antara design: bunga penuh skrin tepat atas beat 0, hilang dan tunjuk klip pertama.
export const V_SWEEP: SweepTiming = {pre: 0.55, maskLag: 0.15, spread: 0.35, grow: 0.35, settle: 0.45};
export const V_SWEEP0: SweepTiming = {...V_SWEEP, pre: 0.15};
export const coverAt = (tm: SweepTiming) => tm.maskLag + tm.spread + 0.15;

// Satu penggunaan klip: dari/hingga saat mutlak, kunci ramp dalam saat dari `from`, punch = zoom masuk kecil di awal.
export type VUse = {label: string; shot: Shot; from: number; to: number; keys: RampKeys; punch: boolean; zoom: number};
export type VBlock = {design: DesignId; start: number; from: number; end: number; timing: SweepTiming; origin: Origin; card: number; cuts: number[]; acc: number; accOut: number; uses: VUse[]};
export type VPlan = {
  id: string;
  end: number;
  song: string;
  blocks: VBlock[];
  climax: VUse[];
  climaxEnd: number;
  coming: number;
  comingT: ComingTimes;
  nafesa: number;
  songFadeOut: number;
};

type Cfg = {
  id: string;
  beats: number[];
  end: number;
  song: string;
  designBeats: number;
  cuts: number[]; // beat dalam blok di mana cut ke klip seterusnya
  picks: number[]; // panel SHOTS yang dipakai, ikut susunan
  climaxBeat0: number;
  climaxStep: number; // beat antara muka klimaks
  comingBeat0: number;
  nafBeat0: number;
  songFadeOut: number;
};
const ORIGINS: Origin[] = ['bottom', 'bottom', 'bl', 'tr', 'center', 'bottom'];

const build = (c: Cfg): VPlan => {
  const at = (k: number) => (k === 0 ? 0 : beatAt(k, c.beats));
  const climaxStart = at(c.climaxBeat0);
  const coming = at(c.comingBeat0);
  const starts = ORDER.map((_, i) => 2 + i * c.designBeats);
  const blocks: VBlock[] = ORDER.map((d, i) => {
    const beat0 = starts[i];
    const S = at(beat0);
    const timing = i === 0 ? V_SWEEP0 : V_SWEEP;
    const from = S - timing.pre;
    const next = i < ORDER.length - 1 ? at(starts[i + 1]) : null;
    const end = next !== null ? next - V_SWEEP.pre + coverAt(V_SWEEP) + 0.05 : climaxStart;
    const cuts = c.cuts.map((k) => at(beat0 + k));
    const edges = [from, ...cuts, end];
    const uses: VUse[] = c.picks.map((p, k) => {
      const shot = SHOTS[d].panels[p];
      const a = edges[k], b = edges[k + 1], dur = b - a;
      const first = k === 0, last = k === c.picks.length - 1;
      let keys: RampKeys;
      if (first) keys = [[0, i === 0 ? 1.6 : 1.3], [timing.pre + 0.1, SLOW], [dur - 0.45, SLOW], [dur, FAST]];
      else if (!last) keys = [[0, FAST], [0.35, SLOW], [dur - 0.45, SLOW], [dur, FAST]];
      else if (next !== null) keys = [[0, FAST], [0.35, SLOW], [next - V_SWEEP.pre - a, SLOW], [dur, 1.8]];
      else keys = [[0, FAST], [0.35, SLOW], [dur - 0.3, SLOW], [dur, FAST]];
      const label = `${d}[${shot.detail ? 'detail' : p === 0 ? 'model' : `p${p}`}]`;
      return {label, shot, from: a, to: b, keys, punch: !first, zoom: shot.detail ? shot.zoom ?? 1.3 : 1};
    });
    return {design: d, start: S, from, end, timing, origin: ORIGINS[i], card: at(beat0 + 0.5), cuts, acc: at(beat0 + 1.5), accOut: at(beat0 + 2.7), uses};
  });
  const climaxEnd = coming + 0.85; // klip terakhir kekal sampai print Black Dahlia penuh
  const cAt = CLIMAX.map((_, k) => at(c.climaxBeat0 + k * c.climaxStep));
  const climax: VUse[] = CLIMAX.map((shot, k) => {
    const from = cAt[k];
    const to = k < CLIMAX.length - 1 ? cAt[k + 1] : climaxEnd;
    const dur = to - from;
    // Muka panjang (>= 1 beat): laju -> slow-mo -> laju ke cut seterusnya.
    const keys: RampKeys = c.climaxStep >= 1 && k < CLIMAX.length - 1 ? [[0, 1.8], [0.25, 0.5], [dur - 0.25, 0.5], [dur, 1.8]] : [[0, 2.0], [0.2, 0.6]];
    return {label: `climax[${k}]`, shot, from, to, keys, punch: true, zoom: 1.0};
  });
  const cb = (k: number) => at(c.comingBeat0 + k) - coming;
  const comingT: ComingTimes = {
    letters: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => cb(0.75 + i * 0.25)),
    shrink: cb(3.5),
    ring: cb(3.5),
    logoLetters: Array.from({length: 8}, (_, i) => cb(3.75 + i * 0.25)),
    motifs: cb(5.25),
    pill: cb(5.5),
    drops: Array.from({length: 5}, (_, i) => cb(5.6) + i * 0.07),
  };
  return {id: c.id, end: c.end, song: c.song, blocks, climax, climaxEnd, coming, comingT, nafesa: at(c.nafBeat0), songFadeOut: c.songFadeOut};
};

// Pendek: lagu 2:45.5-3:12 (26.5 s). Intro 0-2, design 2-32, klimaks 32-36 (muka setiap 2/3 beat), COMING 36-43, NAFESA 43.
export const SHORT: VPlan = build({
  id: 'short', beats: beatsShort.beats, end: 26.5, song: 'song.m4a', designBeats: 5, cuts: [3], picks: [0, 1],
  climaxBeat0: 32, climaxStep: 2 / 3, comingBeat0: 36, nafBeat0: 43, songFadeOut: 0.5,
});
// Panjang: lagu 2:45.5 hingga tamat lagu (hit terakhir 3:34.3 = beat 85, gema habis ~3:36.5). Intro 0-2, design 2-68
// (model 4 beat, detail 3, model kedua 4), klimaks 68-77 (muka setiap 1.5 beat), COMING 77-85, NAFESA atas hit terakhir.
export const LONG: VPlan = build({
  id: 'long', beats: beatsLong.beats, end: 51.2, song: 'song_long.m4a', designBeats: 11, cuts: [4, 7], picks: [0, 1, 2],
  climaxBeat0: 68, climaxStep: 1.5, comingBeat0: 77, nafBeat0: 85, songFadeOut: 0.3,
});

export const allUses = (p: VPlan): VUse[] => [...p.blocks.flatMap((b) => b.uses), ...p.climax];
