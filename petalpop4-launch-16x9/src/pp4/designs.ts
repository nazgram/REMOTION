import pattern from './pattern.json';

export type DesignId = 'pearl' | 'dusty' | 'lilac' | 'sage' | 'powder' | 'dahlia';
export const ORDER: DesignId[] = ['pearl', 'dusty', 'lilac', 'sage', 'powder', 'dahlia'];

// way = nama fail SVG/jpg. ink = warna tulisan nama atas kad putih (warna gelap print itu sendiri).
// raws = klip raw setiap design (dari contact sheet 19 Nov).
export type Design = {name: string; way: string; bg: string; ink: string; raws: string[]};
const bgOf = (way: string) => (pattern.palettes as Record<string, {bg: string}>)[way].bg;
const d = (name: string, way: string, ink: string, raws: string[]): Design => ({name, way, bg: bgOf(way), ink, raws});

export const DESIGNS: Record<DesignId, Design> = {
  pearl: d('PEARL GREY', 'Pearl Grey', '#906577', ['C4574', 'C4575']),
  dusty: d('DUSTY ROSE', 'Dusty Rose', '#a57985', ['C4588', 'C4589', 'C4590']),
  lilac: d('LILAC MIST', 'Lilac Mist', '#9a6f93', ['C4594', 'C4595', 'C4596', 'C4597', 'C4598']),
  sage: d('SAGE PETAL', 'Sage Petal', '#6f7d6c', ['C4603', 'C4604', 'C4605']),
  powder: d('POWDER BLUE', 'Powder Blue', '#4c5468', ['C4580', 'C4581', 'C4582', 'C4583', 'C4584']),
  dahlia: d('BLACK DAHLIA', 'Black Dahlia', '#433c2c', ['C4567', 'C4568', 'C4569', 'C4570']),
};

export type Unit = {x: number; y: number; r: number; p: [string, number][]};
export const TILE = pattern.TILE as number;
export const UNITS = pattern.units as Unit[];
export const colorsOf = (id: DesignId): string[] => (pattern.palettes as Record<string, {colors: string[]}>)[DESIGNS[id].way].colors;
// Unit untuk bloom: bunga/daun berasingan (tangkai panjang yang masih bersambung dibuang).
export const BLOOM_UNITS = UNITS.filter((u) => u.r >= 14 && u.r <= 140);
