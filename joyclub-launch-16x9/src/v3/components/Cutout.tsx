import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {FPS} from '../util';

export type CutShape = {x: number; y: number; w: number; h: number; at: number};

// Layer anak muncul dalam bentuk segi empat (sejajar garis panel), satu bentuk setiap beat, kemudian penuh pada fullAt.
export const Cutout: React.FC<{shapes: CutShape[]; fullAt: number; children: React.ReactNode}> = ({shapes, fullAt, children}) => {
  const t = useCurrentFrame() / FPS;
  if (t >= fullAt) return <AbsoluteFill>{children}</AbsoluteFill>;
  const d = shapes
    .filter((s) => t >= s.at)
    .map((s) => {
      const k = interpolate(t - s.at, [0, 0.16], [0.6, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
      const w = s.w * k, h = s.h * k, x = s.x + (s.w - w) / 2, y = s.y + (s.h - h) / 2;
      return `M${x} ${y} H${x + w} V${y + h} H${x} Z`;
    })
    .join(' ');
  if (!d) return null;
  return (
    <AbsoluteFill style={{filter: 'drop-shadow(0 12px 28px rgba(0,0,0,0.3))'}}>
      <AbsoluteFill style={{clipPath: `path('${d}')`}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};
