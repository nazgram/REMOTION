import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {DESIGNS, DesignId} from '../designs';
import {FPS} from '../util';

// Plat bulat + nama design, ditengah (dalam kawasan selamat 54..1026).
const PLATE: Record<DesignId, {bg: string; fg: string}> = {
  pearl: {bg: '#a0c4e1', fg: '#ffffff'},
  sky: {bg: '#b11f24', fg: '#ffffff'},
  blush: {bg: '#738476', fg: '#ffffff'},
  ruby: {bg: '#a0c4e1', fg: '#b11f24'},
  silver: {bg: '#5c484d', fg: '#ffffff'},
};

export const NameCard: React.FC<{design: DesignId; outAt: number}> = ({design, outAt}) => {
  const t = useCurrentFrame() / FPS;
  const inP = interpolate(t, [0, 0.3], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.4))});
  const outP = interpolate(t, [outAt, outAt + 0.28], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
  const s = inP * outP;
  const txt = interpolate(t, [0.12, 0.36], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) * outP;
  const p = PLATE[design];
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{width: 560, height: 560, borderRadius: '50%', background: p.bg, transform: `scale(${s})`, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
        <div style={{opacity: txt, fontFamily: 'Poppins', fontWeight: 700, fontSize: 132, color: p.fg, letterSpacing: '0.04em', lineHeight: 1}}>{DESIGNS[design].name}</div>
        <div style={{opacity: txt, fontFamily: 'Poppins', fontWeight: 500, fontSize: 24, color: p.fg, letterSpacing: '0.32em', marginTop: 18, marginRight: '-0.32em'}}>JOY CLUB COLLECTION</div>
      </div>
    </AbsoluteFill>
  );
};
