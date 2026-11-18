export type DesignId = 'pearl' | 'sky' | 'blush' | 'ruby' | 'silver';

export type Design = {name: string; bg: string; dot: string; accents: string[]; block: [number, number]};

// Warna dari SVG corak + katalog. block = julat saat dalam raw (vertical & landscape serentak).
export const DESIGNS: Record<DesignId, Design> = {
  pearl: {name: 'PEARL', bg: '#ffffff', dot: '#a0c4e1', accents: ['#a0c4e1', '#dce9f4'], block: [90.3, 107.9]},
  sky: {name: 'SKY', bg: '#a0c4e1', dot: '#b11f24', accents: ['#a0c4e1', '#b11f24'], block: [0, 20.4]},
  blush: {name: 'BLUSH', bg: '#d1bdc1', dot: '#738476', accents: ['#d1bdc1', '#738476'], block: [24.1, 47.4]},
  ruby: {name: 'RUBY', bg: '#b11f24', dot: '#a0c4e1', accents: ['#b11f24', '#a0c4e1'], block: [67.0, 87.7]},
  silver: {name: 'SILVER', bg: '#d8d8d8', dot: '#5c484d', accents: ['#d8d8d8', '#5c484d'], block: [50.1, 64.2]},
};

export const ORDER: DesignId[] = ['pearl', 'sky', 'blush', 'ruby', 'silver'];

export const OLIVE = '#545e3a';
export const TAN = '#c9a27a';
export const CREAM = '#f5f0e6';
// Offset masa landscape berbanding vertical (disahkan 0 pada 30s & 95s).
export const CAMERA_OFFSET = 0;
