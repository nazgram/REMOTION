import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {FPS} from '../util';

// Transition satu warna: dot muncul dari 4 bucu, kecil dulu kemudian makin besar sampai tutup skrin (cover).
// Reveal = terbalik: dot besar mengecil dulu, dot kecil di bucu hilang terakhir.
// u, v = jarak ke dalam dari bucu (px); at = masa mula (pecahan dur).
const DOTS: {u: number; v: number; d: number; at: number}[] = [
  {u: 70, v: 70, d: 110, at: 0},
  {u: 250, v: 80, d: 150, at: 0.07},
  {u: 90, v: 260, d: 170, at: 0.11},
  {u: 330, v: 280, d: 260, at: 0.18},
  {u: 560, v: 150, d: 300, at: 0.24},
  {u: 170, v: 520, d: 320, at: 0.28},
  {u: 620, v: 470, d: 520, at: 0.36},
  {u: 0, v: 0, d: 2700, at: 0.48},
];
const CORNERS: {x: number; y: number; sx: number; sy: number; lag: number}[] = [
  {x: 0, y: 0, sx: 1, sy: 1, lag: 0},
  {x: 1920, y: 1080, sx: -1, sy: -1, lag: 0.03},
  {x: 1920, y: 0, sx: -1, sy: 1, lag: 0.06},
  {x: 0, y: 1080, sx: 1, sy: -1, lag: 0.09},
];
const GROW = 0.36; // tempoh setiap dot membesar (pecahan dur)

export const SWEEP_COLOR: Record<string, string> = {pearl: '#dce9f4', sky: '#a0c4e1', blush: '#d1bdc1', ruby: '#b11f24', silver: '#d8d8d8'};

// hold = saat pertama reveal kekal penuh (tutup jurang frame antara cover dan reveal).
export const DotSweep: React.FC<{color: string; mode: 'cover' | 'reveal'; dur: number; hold?: number}> = ({color, mode, dur, hold = 0}) => {
  const t = useCurrentFrame() / FPS;
  const p = mode === 'cover' ? Math.min(1, t / dur) : 1 - Math.min(1, Math.max(0, t - hold) / dur);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {CORNERS.map((c, ci) =>
        DOTS.map((d, di) => {
          const a = Math.min(d.at + c.lag, 1 - GROW);
          const k = interpolate(p, [a, a + GROW], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
          if (k <= 0.001) return null;
          const x = c.x + c.sx * d.u, y = c.y + c.sy * d.v;
          return <div key={`${ci}-${di}`} style={{position: 'absolute', left: x - d.d / 2, top: y - d.d / 2, width: d.d, height: d.d, borderRadius: '50%', background: color, transform: `scale(${k})`}} />;
        }),
      )}
    </AbsoluteFill>
  );
};
