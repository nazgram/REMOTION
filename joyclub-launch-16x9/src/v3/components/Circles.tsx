import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {FPS} from '../util';

// Bulatan solid gaya katalog. Masa dalam saat tempatan.
export type CircleItem = {x: number; y: number; d: number; color: string; inAt: number; outAt?: number; toX?: number; toY?: number; toD?: number; moveAt?: number};

const pop = (t: number) => {
  if (t <= 0) return 0;
  // 0 -> 1.1 -> 1 dalam 0.35s, licin (tiada bounce kuat)
  if (t < 0.22) return interpolate(t, [0, 0.22], [0, 1.1], {easing: Easing.out(Easing.cubic)});
  return interpolate(t, [0.22, 0.38], [1.1, 1], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
};

export const Circles: React.FC<{items: CircleItem[]; beat: number}> = ({items, beat}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {items.map((c, i) => {
        let s = pop(t - c.inAt);
        // bernafas ikut beat: 0.94-1.06
        if (t > c.inAt + 0.38) s *= 1 + 0.06 * Math.sin(((t - c.inAt) / beat) * Math.PI * 2 + i);
        if (c.outAt !== undefined) s *= interpolate(t, [c.outAt, c.outAt + 0.3], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
        let {x, y, d} = c;
        if (c.moveAt !== undefined) {
          const p = interpolate(t, [c.moveAt, c.moveAt + 0.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
          x += ((c.toX ?? x) - x) * p;
          y += ((c.toY ?? y) - y) * p;
          d += ((c.toD ?? d) - d) * p;
        }
        if (s <= 0.001) return null;
        return <div key={i} style={{position: 'absolute', left: x - d / 2, top: y - d / 2, width: d, height: d, borderRadius: '50%', background: c.color, transform: `scale(${s})`}} />;
      })}
    </AbsoluteFill>
  );
};
