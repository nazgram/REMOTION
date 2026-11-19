import {describe, expect, it} from 'vitest';
import {DESIGN_SWEEP} from '../components/Bloom';
import {COMING_SWEEP} from '../components/EndCards';
import {SEGMENT_TIMES} from '../PetalPop4Launch';
import {END} from '../timeline';

const coverAt = (tm: typeof DESIGN_SWEEP) => tm.maskLag + tm.spread + 0.15; // print penuh (mask tiada tepi) selepas mula sweep

describe('susun lapis video', () => {
  const B = SEGMENT_TIMES.blocks;
  it('print penuh sebelum blok baru mula, blok lama kekal sehingga itu (tiada jurang 1 frame)', () => {
    for (let i = 1; i < B.length; i++) {
      expect(B[i].from + coverAt(DESIGN_SWEEP)).toBeLessThanOrEqual(B[i].start - 0.05);
      expect(B[i - 1].end).toBeGreaterThanOrEqual(B[i].start + 0.03);
    }
  });
  it('klimaks atas Black Dahlia, COMING SOON tutup klimaks', () => {
    const last = B[B.length - 1];
    expect(last.end).toBeGreaterThan(SEGMENT_TIMES.climaxAt[5] + 0.32);
    expect(SEGMENT_TIMES.climaxEnd).toBeGreaterThanOrEqual(SEGMENT_TIMES.coming + coverAt(COMING_SWEEP));
  });
  it('NAFESA terakhir', () => {
    expect(SEGMENT_TIMES.nafesa).toBeLessThan(END - 1.2);
  });
});
