import {describe, expect, it} from 'vitest';
import beatsData from '../../../public/pp4/beats.json';
import {beatAt} from '../beats';
import {ORDER} from '../designs';
import {buildTimeline, END} from '../timeline';

const B = beatsData.beats as number[];
const at = (k: number) => beatAt(k, B);

describe('timeline', () => {
  const tl = buildTimeline(B);
  it('susunan segmen', () => {
    expect(tl.map((s) => s.kind)).toEqual(['intro', 'design', 'design', 'design', 'design', 'design', 'design', 'climax', 'coming', 'nafesa']);
    expect(tl.filter((s) => s.kind === 'design').map((s) => s.design)).toEqual(ORDER);
  });
  it('sempadan ikut beat', () => {
    expect(tl[0].start).toBe(0);
    expect(tl[0].end).toBeCloseTo(at(2), 3);
    tl.filter((s) => s.kind === 'design').forEach((s, i) => {
      expect(s.beat0).toBe(2 + 5 * i);
      expect(s.start).toBeCloseTo(at(2 + 5 * i), 3);
      expect(s.end).toBeCloseTo(at(7 + 5 * i), 3);
    });
    const c = tl.find((s) => s.kind === 'climax')!;
    expect([c.start, c.end]).toEqual([at(32), at(36)]);
    const m = tl.find((s) => s.kind === 'coming')!;
    expect([m.start, m.end]).toEqual([at(36), at(41)]);
    const n = tl.find((s) => s.kind === 'nafesa')!;
    expect([n.start, n.end]).toEqual([at(41), END]);
    expect(END).toBe(26.5);
  });
  it('lagu dipotong atas beat', () => {
    expect(Math.abs(at(0))).toBeLessThan(0.03);
  });
  it('segmen bersambung tanpa jurang', () => {
    for (let i = 1; i < tl.length; i++) expect(tl[i].start).toBe(tl[i - 1].end);
  });
});
