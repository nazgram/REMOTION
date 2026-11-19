import {describe, expect, it} from 'vitest';
import {CLIMAX, SHOTS, validateShots} from '../shots';

describe('pilihan shot', () => {
  it('semua shot lulus peraturan', () => {
    expect(validateShots()).toEqual([]);
  });
  it('tolak awal shot', () => {
    const bad = {...SHOTS, pearl: {...SHOTS.pearl, panels: [{...SHOTS.pearl.panels[0], t: 34.5}, SHOTS.pearl.panels[1], SHOTS.pearl.panels[2]] as typeof SHOTS.pearl.panels}};
    expect(validateShots(bad).some((e) => e.includes('awal shot'))).toBe(true);
  });
  it('tolak saat berulang', () => {
    const bad = [...CLIMAX];
    bad[0] = {...SHOTS.pearl.panels[2]};
    expect(validateShots(SHOTS, bad).some((e) => e.includes('bertindih'))).toBe(true);
  });
  it('tolak zoom > 1.4', () => {
    const bad = {...SHOTS, sage: {...SHOTS.sage, panels: [{...SHOTS.sage.panels[0], zoom: 1.5}, SHOTS.sage.panels[1], SHOTS.sage.panels[2]] as typeof SHOTS.sage.panels}};
    expect(validateShots(bad).some((e) => e.includes('zoom'))).toBe(true);
  });
  it('tolak design tanpa shot detail', () => {
    const p = SHOTS.dusty.panels.map((x) => ({...x, detail: false})) as typeof SHOTS.dusty.panels;
    expect(validateShots({...SHOTS, dusty: {...SHOTS.dusty, panels: p}}).some((e) => e.includes('detail'))).toBe(true);
  });
});
