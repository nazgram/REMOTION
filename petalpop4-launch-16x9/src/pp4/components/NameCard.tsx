import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {DESIGNS, DesignId} from '../designs';
import {useFmt} from '../fmt';
import {FPS, NAME_FONT} from '../util';
const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

// Kad putih bulat bawah kiri (gaya SKILL.md Drop 2), saiz ikut tulisan sahaja (Nas 19 Nov). Nama dalam warna gelap print.
export const NameCard: React.FC<{design: DesignId}> = ({design}) => {
  const t = useCurrentFrame() / FPS;
  const {fmt} = useFmt();
  const k = interpolate(t, [0, 0.4], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.6))});
  const txt = interpolate(t, [0.12, 0.42], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute', left: 56, bottom: fmt === 'v' ? 460 : 56, // 9:16: atas UI TikTok (y < 1521)
          padding: '22px 40px 18px', borderRadius: 28, background: '#fff',
          boxShadow: '0 12px 32px rgba(0,0,0,0.2)', transform: `scale(${k})`, transformOrigin: '0% 100%',
        }}
      >
        <div style={{fontFamily: NAME_FONT, fontSize: 64, color: DESIGNS[design].ink, letterSpacing: '0.02em', lineHeight: 1, opacity: txt, transform: `translateY(${(1 - txt) * 24}px)`, whiteSpace: 'nowrap'}}>
          {titleCase(DESIGNS[design].name)}
        </div>
      </div>
    </AbsoluteFill>
  );
};
