import logo from './logo.json';

export type LogoRole = 'flower' | 'letter' | 'leaf' | 'tulip' | 'stem' | 'heart' | 'pill' | 'drop';
export type LogoShape = {d: string; fill: string; box: number[]; role: LogoRole; order: number};
// Logo Petal Pop Drop 4 (22 bentuk, susunan fail): 0 bunga, 1-8 huruf P e t a l P o p, 9-10 daun atas é,
// 11 tulip, 12 tangkai, 13 hati, 14-15 garis daun, 16 pil, 17-21 huruf DROP 4.
const ROLES: LogoRole[] = ['flower', ...Array(8).fill('letter'), 'leaf', 'leaf', 'tulip', 'stem', 'heart', 'stem', 'stem', 'pill', ...Array(5).fill('drop')];
export const LOGO_W = logo.w;
export const LOGO_H = logo.h;
// Latar gelap: huruf hitam/hijau gelap jadi putih (logo putih), motif warna kekal.
const WHITE = new Set(['#000000', '#042215']);
export const LOGO: LogoShape[] = logo.paths.map((p, i) => ({...p, role: ROLES[i], order: i, fill: WHITE.has(p.fill.toLowerCase()) ? '#ffffff' : p.fill}));
