import pattern from './pattern.json';

export type DesignId = 'pearl' | 'dusty' | 'lilac' | 'sage' | 'powder' | 'dahlia';
export const ORDER: DesignId[] = ['pearl', 'dusty', 'lilac', 'sage', 'powder', 'dahlia'];

// way = nama fail SVG/jpg. ink = warna tulisan nama atas kad putih (warna gelap print itu sendiri).
// vg = julat design dalam VIDEO GRADE .mp4 (raw yang Nas sudah grade + susun, 19 Nov 14:21), saat.
export type Design = {name: string; way: string; bg: string; ink: string; vg: [number, number]};
const bgOf = (way: string) => (pattern.palettes as Record<string, {bg: string}>)[way].bg;
const d = (name: string, way: string, ink: string, vg: [number, number]): Design => ({name, way, bg: bgOf(way), ink, vg});

export const DESIGNS: Record<DesignId, Design> = {
  pearl: d('PEARL GREY', 'Pearl Grey', '#906577', [34.4, 64.8]),
  dusty: d('DUSTY ROSE', 'Dusty Rose', '#a57985', [109.7, 142.5]),
  lilac: d('LILAC MIST', 'Lilac Mist', '#9a6f93', [147.7, 195.1]),
  sage: d('SAGE PETAL', 'Sage Petal', '#6f7d6c', [199.6, 230.1]),
  powder: d('POWDER BLUE', 'Powder Blue', '#4c5468', [69.1, 103.7]),
  dahlia: d('BLACK DAHLIA', 'Black Dahlia', '#433c2c', [0, 31.2]),
};

export type Unit = {x: number; y: number; r: number; p: [string, number][]};
export const TILE = pattern.TILE as number;
export const UNITS = pattern.units as Unit[];
export const colorsOf = (id: DesignId): string[] => (pattern.palettes as Record<string, {colors: string[]}>)[DESIGNS[id].way].colors;
// Unit untuk bloom: bunga/daun berasingan (tangkai panjang yang masih bersambung dibuang).
export const BLOOM_UNITS = UNITS.filter((u) => u.r >= 14 && u.r <= 140);
