import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {FPS} from '../util';

// Sweep satu warna: bulatan besar pop dari tepi ikut giliran sehingga menutup skrin (cover), atau mengecil keluar (reveal).
const SEEDS: {x: number; y: number; delay: number}[] = [
  {x: 0, y: 0, delay: 0}, {x: 1920, y: 1080, delay: 0.08}, {x: 1920, y: 0, delay: 0.16}, {x: 0, y: 1080, delay: 0.24},
  {x: 960, y: -60, delay: 0.3}, {x: 960, y: 1140, delay: 0.36}, {x: 620, y: 540, delay: 0.44}, {x: 1300, y: 540, delay: 0.5},
];

export const SWEEP_COLOR: Record<string, string> = {pearl: '#dce9f4', sky: '#a0c4e1', blush: '#d1bdc1', ruby: '#b11f24', silver: '#d8d8d8'};

export const DotSweep: React.FC<{color: string; mode: 'cover' | 'reveal'; dur: number}> = ({color, mode, dur}) => {
  const p0 = Math.min(1, useCurrentFrame() / FPS / dur);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {SEEDS.map((s, i) => {
        const k = mode === 'cover'
          ? interpolate(p0, [s.delay, s.delay + 0.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)})
          : interpolate(p0, [s.delay * 0.6, s.delay * 0.6 + 0.55], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
        if (k <= 0.001) return null;
        const d = 1500;
        return <div key={i} style={{position: 'absolute', left: s.x - d / 2, top: s.y - d / 2, width: d, height: d, borderRadius: '50%', background: color, transform: `scale(${k})`}} />;
      })}
    </AbsoluteFill>
  );
};
