import {describe, expect, test} from 'vitest';
import {panelRects} from '../layout';
import {nearestBeat, beatAt} from '../beats';
import {buildTimeline} from '../timeline';
import {validateShots, SHOTS, CLIMAX} from '../shots';
import {ORDER} from '../designs';

const fakeBeats = (gap: number, n = 115, first = 0.25) => Array.from({length: n}, (_, i) => +(first + i * gap).toFixed(3));

describe('layout', () => {
  test('panelRects covers frame', () => {
    for (const n of [2, 3, 5] as const) {
      const r = panelRects(n);
      expect(r[0].x).toBe(0);
      expect(r[r.length - 1].x + r[r.length - 1].w).toBe(1920);
    }
  });
  test('panelRects 3 gaps are 4px', () => {
    const r = panelRects(3);
    expect(r[1].x - (r[0].x + r[0].w)).toBe(4);
    expect(Math.abs(r[0].w - r[2].w)).toBeLessThanOrEqual(1);
  });
});

describe('beats', () => {
  test('nearestBeat clamps', () => {
    const b = [0.5, 1.05, 1.6];
    expect(nearestBeat(0, b)).toBe(0.5);
    expect(nearestBeat(1.3, b)).toBe(1.05);
    expect(nearestBeat(9, b)).toBe(1.6);
  });
  test('beatAt extrapolates past the end with the median gap', () => {
    const b = [0, 0.5, 1.0, 1.6];
    expect(beatAt(5, b)).toBeCloseTo(1.6 + 2 * 0.5, 5);
    expect(beatAt(-1, b)).toBeCloseTo(-0.5, 5);
  });
  test('beatAt interpolates half beats', () => {
    const b = [0, 0.5, 1.0, 1.6];
    expect(beatAt(2.5, b)).toBeCloseTo(1.3, 5);
    expect(beatAt(0.5, b)).toBeCloseTo(0.25, 5);
    expect(beatAt(3.5, b)).toBeCloseTo(1.85, 5);
  });
});

describe('timeline', () => {
  test('order, contiguity and end', () => {
    const tl = buildTimeline(fakeBeats(0.557));
    expect(tl.filter((s) => s.kind === 'design').map((s) => s.design)).toEqual(['pearl', 'sky', 'blush', 'ruby', 'silver']);
    expect(tl[0].start).toBe(0);
    expect(tl[tl.length - 1].end).toBe(63.4);
    for (let i = 1; i < tl.length; i++) expect(tl[i].start).toBe(tl[i - 1].end);
    expect(tl.find((s) => s.kind === 'design')!.bars).toHaveLength(4);
    expect(tl[0].bars).toHaveLength(4);
    expect(tl.find((s) => s.kind === 'joyclub')!.bars).toHaveLength(2);
  });
});

describe('shots', () => {
  test('placeholder shots valid', () => {
    expect(validateShots()).toEqual([]);
  });
  test('rejects too-slow, out-of-block and repeated shots', () => {
    const slow = structuredClone(SHOTS);
    slow.pearl.detail = {cam: 'l', t: 106.7, speed: 0.4};
    expect(validateShots(slow, CLIMAX).join(' ')).toMatch(/pearl detail: speed 0.4/);

    const out = structuredClone(SHOTS);
    out.silver.grid3[0] = {cam: 'v', t: 63};
    expect(validateShots(out, CLIMAX).join(' ')).toMatch(/silver grid3\[0\].*keluar dari blok/);

    // kamera lain pada saat yang sama tetap dikira ulang
    const rep = structuredClone(SHOTS);
    rep.sky.detail = {cam: 'l', t: 3.3, speed: 0.5};
    expect(validateShots(rep, CLIMAX).join(' ')).toMatch(/sky grid3\[0\] & detail: bertindih/);
  });
  test('every design has shots', () => {
    for (const d of ORDER) {
      expect(SHOTS[d].grid3.length).toBe(3);
      expect(SHOTS[d].grid2.length).toBe(2);
    }
    expect(CLIMAX).toHaveLength(5);
  });
});
