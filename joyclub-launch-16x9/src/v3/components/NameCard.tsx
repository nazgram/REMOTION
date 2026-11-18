import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {DESIGNS, DesignId} from '../designs';
import {FPS} from '../util';

// Nama di bawah kiri, atas bulatan sederhana yang terkeluar dari sudut (jauh dari muka model, tak makan ruang).
const PLATE: Record<DesignId, {bg: string; fg: string}> = {
  pearl: {bg: '#a0c4e1', fg: '#ffffff'},
  sky: {bg: '#b11f24', fg: '#ffffff'},
  blush: {bg: '#738476', fg: '#ffffff'},
  ruby: {bg: '#a0c4e1', fg: '#b11f24'},
  silver: {bg: '#5c484d', fg: '#ffffff'},
};

export const NameCard: React.FC<{design: DesignId; outAt: number}> = ({design, outAt}) => {
  const t = useCurrentFrame() / FPS;
  const inP = interpolate(t, [0, 0.32], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const outP = interpolate(t, [outAt, outAt + 0.28], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
  const txtIn = interpolate(t, [0.14, 0.4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const p = PLATE[design];
  const D = 540;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 190 - D / 2, top: 1000 - D / 2, width: D, height: D, borderRadius: '50%', background: p.bg, transform: `scale(${inP * outP})`, transformOrigin: '50% 50%'}} />
      <div style={{position: 'absolute', left: 66, bottom: 84, opacity: txtIn * outP, transform: `translateY(${(1 - txtIn) * 30}px)`}}>
        <div style={{fontFamily: 'Poppins', fontWeight: 700, fontSize: 90, color: p.fg, letterSpacing: '0.03em', lineHeight: 1}}>{DESIGNS[design].name}</div>
        <div style={{fontFamily: 'Poppins', fontWeight: 500, fontSize: 19, color: p.fg, letterSpacing: '0.3em', marginTop: 10}}>JOY CLUB COLLECTION</div>
      </div>
    </AbsoluteFill>
  );
};
