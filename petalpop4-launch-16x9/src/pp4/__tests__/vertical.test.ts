import {describe, expect, it} from 'vitest';
import {RAW_CUTS} from '../shots';
import {f, FPS} from '../util';
import {speedAt, srcAt} from '../vertical/ramp';
import {ALL_V_USES, clipLen, COMING, coverAt, V_BLOCKS, V_CLIMAX_END, V_SWEEP} from '../vertical/vplan';

describe('speed ramp', () => {
  it('licin antara kunci, kekal di luar', () => {
    const k: [number, number][] = [[0, 2], [1, 0.5]];
    expect(speedAt(k, -1)).toBe(2);
    expect(speedAt(k, 0.5)).toBeCloseTo(1.25);
    expect(speedAt(k, 3)).toBe(0.5);
  });
  it('masa sumber = jumlah kelajuan', () => {
    expect(srcAt([[0, 1]], 60, 60)).toBeCloseTo(1);
    expect(srcAt([[0, 0.5]], 120, 60)).toBeCloseTo(1);
  });
});

describe('pelan 9:16', () => {
  it('setiap klip cukup panjang untuk ramp (tak lepas hujung fail)', () => {
    for (const u of ALL_V_USES()) {
      const used = srcAt(u.keys, f(u.to - u.from) + 2, FPS);
      expect(used, u.label).toBeLessThanOrEqual(clipLen(u));
    }
  });
  it('julat sumber tak melintas cut dalam VIDEO GRADE', () => {
    for (const u of ALL_V_USES()) {
      const b = u.shot.t + srcAt(u.keys, f(u.to - u.from) + 2, FPS);
      for (const c of RAW_CUTS.VG) expect(u.shot.t < c && b > c - 0.2, `${u.label} melintas ${c}`).toBe(false);
    }
  });
  it('kelajuan antara 0.5x dan 2.4x', () => {
    for (const u of ALL_V_USES()) for (const [, v] of u.keys) expect(v).toBeGreaterThanOrEqual(0.5), expect(v).toBeLessThanOrEqual(2.4);
  });
  it('blok lama kekal sampai bunga blok baru tutup skrin', () => {
    for (let i = 1; i < V_BLOCKS.length; i++) expect(V_BLOCKS[i - 1].end).toBeGreaterThanOrEqual(V_BLOCKS[i].from + coverAt(V_SWEEP));
  });
  it('klimaks tertutup oleh COMING SOON', () => {
    expect(V_CLIMAX_END).toBeGreaterThanOrEqual(COMING.start + 0.7);
  });
});
