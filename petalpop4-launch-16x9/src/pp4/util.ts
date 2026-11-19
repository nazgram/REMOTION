import {staticFile} from 'remotion';
export const FPS = 60;
export const f = (sec: number) => Math.round(sec * FPS);
export const asset = (p: string) => staticFile(`pp4/${p}`);
export const fontCss = `
@font-face{font-family:'Poppins';src:url('${staticFile('v3/Poppins-Bold.ttf')}') format('truetype');font-weight:700;}
@font-face{font-family:'Poppins';src:url('${staticFile('v3/Poppins-SemiBold.ttf')}') format('truetype');font-weight:600;}
@font-face{font-family:'Poppins';src:url('${staticFile('v3/Poppins-Medium.ttf')}') format('truetype');font-weight:500;}`;
// Pseudo-random tetap (supaya setiap render sama)
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
