import {describe, expect, it} from 'vitest';
import {BLOOM_UNITS, colorsOf, DESIGNS, ORDER} from '../designs';
import {LOGO} from '../logo';

describe('aset print Drop 4', () => {
  it('6 design, setiap satu ada warna latar dan palet', () => {
    expect(ORDER).toHaveLength(6);
    for (const id of ORDER) {
      expect(DESIGNS[id].bg).toMatch(/^#[0-9a-f]{3,6}$/);
      expect(colorsOf(id).length).toBeGreaterThanOrEqual(5);
      expect(DESIGNS[id].vg[1] - DESIGNS[id].vg[0]).toBeGreaterThan(25);
    }
  });
  it('cukup bunga untuk bloom', () => {
    expect(BLOOM_UNITS.filter((u) => u.r > 20).length).toBeGreaterThanOrEqual(40);
  });
  it('logo: 8 huruf, 5 huruf DROP 4, huruf putih', () => {
    expect(LOGO.filter((s) => s.role === 'letter')).toHaveLength(8);
    expect(LOGO.filter((s) => s.role === 'drop')).toHaveLength(5);
    expect(LOGO.filter((s) => s.role === 'letter').every((s) => s.fill === '#ffffff')).toBe(true);
  });
});
