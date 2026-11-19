import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {DESIGNS, DesignId} from '../designs';
import {FPS, NAME_FONT} from '../util';
const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

// Kad putih bulat bawah kiri (gaya SKILL.md Drop 2), nama dalam warna gelap print itu sendiri. Jauh dari muka model.
export const NameCard: React.FC<{design: DesignId}> = ({design}) => {
  const t = useCurrentFrame() / FPS;
  const k = interpolate(t, [0, 0.4], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.6))});
  const txt = interpolate(t, [0.12, 0.42], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute', left: 56, bottom: 56, width: 520, height: 200, borderRadius: 36, background: '#fff',
          boxShadow: '0 14px 40px rgba(0,0,0,0.22)', transform: `scale(${k})`, transformOrigin: '0% 100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div style={{fontFamily: NAME_FONT, fontSize: 70, color: DESIGNS[design].ink, letterSpacing: '0.02em', lineHeight: 1, opacity: txt, transform: `translateY(${(1 - txt) * 24}px)`, whiteSpace: 'nowrap'}}>
          {titleCase(DESIGNS[design].name)}
        </div>
      </div>
    </AbsoluteFill>
  );
};
