import {beatAt} from './beats';
import {DesignId, ORDER} from './designs';

export type Span = {start: number; end: number};
export type Segment = Span & {kind: 'intro' | 'design' | 'climax' | 'joyclub' | 'nafesa'; design?: DesignId; bars: Span[]};

export const END = 45;
const BAR = 4;

// Beat 0 dianggap downbeat bar 1. Intro 2 bar, 5 design x 3 bar, klimaks 1, JOY CLUB 1, NAFESA hingga 45s.
export const buildTimeline = (beats: number[]): Segment[] => {
  const at = (bar: number) => beatAt(bar * BAR, beats);
  const seg = (kind: Segment['kind'], b0: number, nBars: number, design?: DesignId): Segment => ({
    kind,
    design,
    start: b0 === 0 ? 0 : at(b0),
    end: at(b0 + nBars),
    bars: Array.from({length: nBars}, (_, k) => ({start: b0 + k === 0 ? 0 : at(b0 + k), end: at(b0 + k + 1)})),
  });
  const out: Segment[] = [seg('intro', 0, 2)];
  ORDER.forEach((d, i) => out.push(seg('design', 2 + i * 3, 3, d)));
  out.push(seg('climax', 17, 1), seg('joyclub', 18, 1));
  const last = out[out.length - 1].end;
  out.push({kind: 'nafesa', start: last, end: END, bars: [{start: last, end: END}]});
  return out;
};
