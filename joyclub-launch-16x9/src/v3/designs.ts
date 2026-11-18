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
// Cut dalaman dalam raw (dikesan, saat). Satu klip panel mesti duduk dalam satu segmen (tiada cut dalam panel).
export const CUTS: Record<'v' | 'l', number[]> = {
  v: [3.17, 7.33, 11.2, 13.57, 16.3, 20.4, 24.1, 31.6, 34.93, 42.57, 45.27, 47.43, 50.1, 52.83, 55.83, 58.8, 61.5, 64.2, 66.97, 72.43, 75.5, 77.37, 79.9, 84.3, 87.67, 90.27, 93.8, 94.87, 97.1, 98.23, 101.83],
  l: [3.17, 7.33, 11.2, 13.57, 16.3, 20.4, 24.1, 29.83, 31.6, 34.93, 38.47, 42.57, 45.27, 47.43, 50.1, 52.83, 55.83, 58.8, 61.5, 64.2, 66.97, 69.47, 72.43, 75.5, 77.37, 79.9, 84.3, 87.67, 90.27, 93.8, 94.87, 97.1, 98.23, 101.83],
};

// Klip kain AI (Kling 3.0 pro, 5s, 1912x1080) untuk intro.
export const FABRIC: Record<DesignId, string> = {pearl: 'kain/kain-pearl.mp4', sky: 'kain/kain-sky.mp4', blush: 'kain/kain-blush.mp4', ruby: 'kain/kain-ruby.mp4', silver: 'kain/kain-silver.mp4'};

// Offset masa landscape berbanding vertical (disahkan 0 pada 30s & 95s).
export const CAMERA_OFFSET = 0;
