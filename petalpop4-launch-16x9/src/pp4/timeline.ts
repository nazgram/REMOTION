import {beatAt} from './beats';
import {DesignId, ORDER} from './designs';

export type Segment = {kind: 'intro' | 'design' | 'climax' | 'coming' | 'nafesa'; design?: DesignId; start: number; end: number; beat0: number};

// Lagu April Rain Rhythm 2:45.5-3:12 (26.5 s, 103 BPM). Beat 0 = 2:45.5.
export const END = 26.5;
export const INTRO_BEATS = 2;
export const DESIGN_BEATS = 5;
export const CLIMAX_BEATS = 4;
export const COMING_BEATS = 5;

export const buildTimeline = (beats: number[]): Segment[] => {
  const at = (k: number) => (k === 0 ? 0 : beatAt(k, beats));
  const seg = (kind: Segment['kind'], b0: number, n: number, design?: DesignId): Segment => ({kind, design, beat0: b0, start: at(b0), end: at(b0 + n)});
  const out: Segment[] = [seg('intro', 0, INTRO_BEATS)];
  ORDER.forEach((d, i) => out.push(seg('design', INTRO_BEATS + i * DESIGN_BEATS, DESIGN_BEATS, d)));
  const c0 = INTRO_BEATS + ORDER.length * DESIGN_BEATS;
  out.push(seg('climax', c0, CLIMAX_BEATS), seg('coming', c0 + CLIMAX_BEATS, COMING_BEATS));
  const n0 = c0 + CLIMAX_BEATS + COMING_BEATS;
  out.push({kind: 'nafesa', beat0: n0, start: at(n0), end: END});
  return out;
};
