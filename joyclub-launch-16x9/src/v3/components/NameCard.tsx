import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {DESIGNS, DesignId} from '../designs';
import {FPS} from '../util';

// Nama di bawah kiri, atas bulatan besar yang separuh terkeluar dari sudut (jauh dari muka model).
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
  const D = 760;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: -230, top: 1080 - D / 2 - 90, width: D, height: D, borderRadius: '50%', background: p.bg, transform: `scale(${inP * outP})`, transformOrigin: '50% 50%'}} />
      <div style={{position: 'absolute', left: 70, bottom: 92, opacity: txtIn * outP, transform: `translateY(${(1 - txtIn) * 30}px)`}}>
        <div style={{fontFamily: 'Poppins', fontWeight: 700, fontSize: 118, color: p.fg, letterSpacing: '0.03em', lineHeight: 1}}>{DESIGNS[design].name}</div>
        <div style={{fontFamily: 'Poppins', fontWeight: 500, fontSize: 24, color: p.fg, letterSpacing: '0.32em', marginTop: 14}}>JOY CLUB COLLECTION</div>
      </div>
    </AbsoluteFill>
  );
};
