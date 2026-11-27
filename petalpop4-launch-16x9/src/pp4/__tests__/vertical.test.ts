import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';
import {CLIP_PAD, clipFile, RAW_CUTS} from '../shots';
import {f, FPS} from '../util';
import {speedAt, srcAt} from '../vertical/ramp';
import {allUses, coverAt, LONG, SHORT, V_SWEEP, VUse} from '../vertical/vplan';

// Panjang setiap fail klip (dari senarai potong Mac): clips/VG_<t>.mp4 -> saat.
const CUTLIST = Object.fromEntries(
  readFileSync('scripts/pp4_cutlist_vg.txt', 'utf8').trim().split('\n').map((l) => {
    const [, , dur, out] = l.split(/\s+/);
    return [out, +dur];
  }),
);
export const used = (u: VUse) => srcAt(u.keys, f(u.to - u.from) + 2, FPS);

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

for (const plan of [SHORT, LONG]) {
  describe(`pelan 9:16 ${plan.id}`, () => {
    it('setiap klip cukup panjang untuk ramp (tak lepas hujung fail)', () => {
      for (const u of allUses(plan)) expect(used(u), u.label).toBeLessThanOrEqual(CUTLIST[clipFile(u.shot)] - CLIP_PAD);
    });
    it('julat sumber tak melintas cut dalam VIDEO GRADE', () => {
      for (const u of allUses(plan)) {
        const b = u.shot.t + used(u);
        for (const c of RAW_CUTS.VG) expect(u.shot.t < c && b > c - 0.2, `${u.label} melintas ${c}`).toBe(false);
      }
    });
    it('kelajuan antara 0.5x dan 2.4x', () => {
      for (const u of allUses(plan)) for (const [, v] of u.keys) expect(v).toBeGreaterThanOrEqual(0.5), expect(v).toBeLessThanOrEqual(2.4);
    });
    it('tiada klip sama dipakai dua kali', () => {
      const files = allUses(plan).map((u) => clipFile(u.shot));
      expect(new Set(files).size).toBe(files.length);
    });
    it('blok lama kekal sampai bunga blok baru tutup skrin', () => {
      const B = plan.blocks;
      for (let i = 1; i < B.length; i++) expect(B[i - 1].end).toBeGreaterThanOrEqual(B[i].from + coverAt(V_SWEEP));
    });
    it('klimaks tertutup oleh COMING SOON, logo siap sebelum NAFESA, NAFESA terakhir', () => {
      expect(plan.climaxEnd).toBeGreaterThanOrEqual(plan.coming + 0.7);
      expect(plan.coming + plan.comingT.drops[4] + 0.4).toBeLessThan(plan.nafesa);
      expect(plan.nafesa).toBeLessThan(plan.end - 1.2);
    });
  });
}

describe('versi panjang', () => {
  it('guna semua 24 klip, ~51 s, NAFESA atas hit terakhir lagu (3:34.3 = 48.8 s)', () => {
    expect(allUses(LONG).length).toBe(24);
    expect(LONG.end).toBeCloseTo(51.2);
    expect(Math.abs(LONG.nafesa - 48.84)).toBeLessThan(0.05);
  });
});
