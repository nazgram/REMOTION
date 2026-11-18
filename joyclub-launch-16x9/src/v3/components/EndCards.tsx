import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, useCurrentFrame} from 'remotion';
import {CREAM, OLIVE, TAN} from '../designs';
import {asset, FPS, rand} from '../util';
import {CircleItem, Circles} from './Circles';

// Logo typo1 dipapar 2000px lebar, berpusat pada y=470. Huruf O di (518,470), U di (1430,470), diameter ~226.
export const LOGO = {w: 2000, cy: 470, o: {x: 518, y: 470}, u: {x: 1430, y: 470}, d: 226};

const SILVER_CIRCLES: CircleItem[] = [
  {x: 160, y: 180, d: 420, color: '#a0c4e1', inAt: 0, moveAt: 0.35, toX: LOGO.o.x, toY: LOGO.o.y, toD: LOGO.d},
  {x: 1780, y: 900, d: 460, color: '#b11f24', inAt: 0.1, moveAt: 0.45, toX: LOGO.u.x, toY: LOGO.u.y, toD: LOGO.d},
];

export const JoyClubEnd: React.FC<{beat: number}> = ({beat}) => {
  const t = useCurrentFrame() / FPS;
  const logo = interpolate(t, [0.95, 1.25], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const logoS = interpolate(t, [0.95, 1.4], [0.94, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const avail = interpolate(t, [1.35, 1.7], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const circlesOut = logo > 0.99;
  return (
    <AbsoluteFill style={{background: '#d8d8d8'}}>
      <AbsoluteFill style={{backgroundImage: `url(${asset('pattern-silver.png')})`, backgroundSize: '960px 960px'}} />
      <AbsoluteFill style={{background: 'rgba(216,216,216,0.55)'}} />
      {/* kawasan logo bersih: corak cuma nampak di tepi dan sudut */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 62% 60% at 50% 52%, #d8d8d8 72%, rgba(216,216,216,0) 100%)'}} />
      {!circlesOut && <Circles items={SILVER_CIRCLES} beat={beat} />}
      <Img src={asset('typo1.png')} style={{position: 'absolute', width: LOGO.w, left: (1920 - LOGO.w) / 2, top: LOGO.cy - (LOGO.w * 1834) / 4500 / 2, opacity: logo, transform: `scale(${logoS})`}} />
      <div style={{position: 'absolute', top: 690, width: '100%', textAlign: 'center', opacity: avail, fontFamily: 'Poppins', fontWeight: 600, fontSize: 56, letterSpacing: '0.42em', marginLeft: '0.21em', color: '#5c484d'}}>AVAILABLE NOW</div>
    </AbsoluteFill>
  );
};

const FINE_DOTS = Array.from({length: 140}, (_, i) => ({x: rand(i + 300) * 1920, y: rand(i + 700) * 1080, d: 10 + rand(i + 900) * 8}));
const NAF_CIRCLES: CircleItem[] = [
  {x: 90, y: 140, d: 380, color: OLIVE, inAt: 0.0},
  {x: 1840, y: 960, d: 440, color: TAN, inAt: 0.15},
  {x: 1700, y: 120, d: 180, color: TAN, inAt: 0.3},
  {x: 230, y: 980, d: 220, color: OLIVE, inAt: 0.45},
];

export const NafesaEnd: React.FC<{beat: number}> = ({beat}) => {
  const t = useCurrentFrame() / FPS;
  const o = interpolate(t, [0.2, 0.8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: CREAM}}>
      {FINE_DOTS.map((p, i) => {
        const s = interpolate(t - i * 0.004, [0, 0.4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return <div key={i} style={{position: 'absolute', left: p.x, top: p.y, width: p.d, height: p.d, borderRadius: '50%', background: OLIVE, opacity: 0.16, transform: `scale(${s})`}} />;
      })}
      <Circles items={NAF_CIRCLES} beat={beat} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <Img src={asset('nafesa-olive.png')} style={{height: 1000, opacity: o}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
