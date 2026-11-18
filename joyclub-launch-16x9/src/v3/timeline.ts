import {beatAt} from './beats';
import {DesignId, ORDER} from './designs';

export type Span = {start: number; end: number};
export type Segment = Span & {kind: 'intro' | 'design' | 'climax' | 'joyclub' | 'nafesa'; design?: DesignId; bars: Span[]; beat0: number};

// Lagu Snap Back 1:47.8 hingga tamat semula jadi; video tamat 0.3s selepas lagu habis.
export const END = 63.4;
export const BAR = 4;
export const INTRO_BARS = 4;
export const DESIGN_BARS = 4;

// Beat 0 = downbeat bar 1. Intro kain 4 bar, 5 design x 4 bar, klimaks 1 bar, JOY CLUB 2 bar, NAFESA hingga END.
export const buildTimeline = (beats: number[]): Segment[] => {
  const at = (bar: number) => beatAt(bar * BAR, beats);
  const seg = (kind: Segment['kind'], b0: number, nBars: number, design?: DesignId): Segment => ({
    kind,
    design,
    beat0: b0 * BAR,
    start: b0 === 0 ? 0 : at(b0),
    end: at(b0 + nBars),
    bars: Array.from({length: nBars}, (_, k) => ({start: b0 + k === 0 ? 0 : at(b0 + k), end: at(b0 + k + 1)})),
  });
  const out: Segment[] = [seg('intro', 0, INTRO_BARS)];
  ORDER.forEach((d, i) => out.push(seg('design', INTRO_BARS + i * DESIGN_BARS, DESIGN_BARS, d)));
  const c0 = INTRO_BARS + ORDER.length * DESIGN_BARS;
  out.push(seg('climax', c0, 1), seg('joyclub', c0 + 1, 2));
  const last = out[out.length - 1].end;
  out.push({kind: 'nafesa', beat0: (c0 + 3) * BAR, start: last, end: END, bars: [{start: last, end: END}]});
  return out;
};
