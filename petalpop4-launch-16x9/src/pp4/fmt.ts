import {createContext, useContext} from 'react';
// Format video: 'h' = LED 16:9 (1920x1080), 'v' = 9:16 (1080x1920). Komponen baca dari context.
export type Fmt = 'h' | 'v';
export const DIMS: Record<Fmt, {W: number; H: number}> = {h: {W: 1920, H: 1080}, v: {W: 1080, H: 1920}};
export const FmtCtx = createContext<Fmt>('h');
export const useFmt = () => {
  const fmt = useContext(FmtCtx);
  return {fmt, ...DIMS[fmt]};
};
