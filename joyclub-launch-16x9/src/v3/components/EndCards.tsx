import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, useCurrentFrame} from 'remotion';
import {CREAM, OLIVE, TAN} from '../designs';
import {asset, FPS, rand} from '../util';
import {CircleItem, Circles} from './Circles';
import {LOGO_ELS, LOGO_LETTERS, LOGO_VIEWBOX, LogoEl} from '../logoSvg';

// Logo JOY CLUB dari SVG Nas (viewBox 1080x440, isi x 140-940). Dipapar 2025px lebar, berpusat (960, 470).
const LOGO_W = 2025;
const LOGO_H = (LOGO_W * LOGO_VIEWBOX.h) / LOGO_VIEWBOX.w;
const firstXY = (e: LogoEl): [number, number] => {
  if (e.cx !== undefined) return [e.cx, e.cy!];
  const m = /M\s*([-\d.]+)[ ,]([-\d.]+)/.exec(e.d!)!;
  return [+m[1], +m[2]];
};
// Titik polka dalam O dan U muncul satu-satu, ikut kedudukan (atas ke bawah, kiri ke kanan).
const DOT_ORDER = new Map<LogoEl, number>();
for (const L of ['O', 'U']) {
  LOGO_ELS.filter((e) => e.letter === L && e.dot)
    .sort((p, q) => firstXY(p)[1] - firstXY(q)[1] || firstXY(p)[0] - firstXY(q)[0])
    .forEach((e, j) => DOT_ORDER.set(e, j));
}

const LogoShape: React.FC<{e: LogoEl; style?: React.CSSProperties}> = ({e, style}) =>
  e.d ? <path d={e.d} fill={e.fill} style={style} /> : <circle cx={e.cx} cy={e.cy} r={e.r} fill={e.fill} style={style} />;

// Huruf muncul satu-satu setiap separuh beat: J O Y C L U B. Setiap huruf pop dari bawah (scale + naik + fade),
// titik polka dalam O dan U pop satu-satu selepas hurufnya. Kemudian AVAILABLE NOW muncul huruf demi huruf pada beat 4.
export const JoyClubEnd: React.FC<{beat: number}> = ({beat}) => {
  const t = useCurrentFrame() / FPS;
  const letterAt = (i: number) => i * (beat / 2);
  const pop = (t0: number, dur: number, over = 1.7) => interpolate(t, [t0, t0 + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(over))});
  const availAt = 4 * beat;
  const AVAIL = 'AVAILABLE NOW';
  return (
    <AbsoluteFill style={{background: '#d8d8d8'}}>
      <AbsoluteFill style={{backgroundImage: `url(${asset('pattern-silver.png')})`, backgroundSize: '960px 960px'}} />
      <AbsoluteFill style={{background: 'rgba(216,216,216,0.55)'}} />
      {/* kawasan logo bersih: corak cuma nampak di tepi dan sudut */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 62% 60% at 50% 52%, #d8d8d8 72%, rgba(216,216,216,0) 100%)'}} />
      <svg viewBox={`0 0 ${LOGO_VIEWBOX.w} ${LOGO_VIEWBOX.h}`} style={{position: 'absolute', width: LOGO_W, height: LOGO_H, left: 960 - LOGO_W / 2, top: 470 - LOGO_H / 2, overflow: 'visible'}}>
        {LOGO_LETTERS.map((L, i) => {
          const t0 = letterAt(i);
          const k = pop(t0, 0.42);
          const o = interpolate(t, [t0, t0 + 0.12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          const els = LOGO_ELS.filter((e) => e.letter === L);
          return (
            <g key={L}>
              <g style={{opacity: o, transform: `translateY(${(1 - k) * 34}px) scale(${0.35 + 0.65 * k})`, transformBox: 'fill-box', transformOrigin: '50% 100%'}}>
                {els.filter((e) => !e.dot).map((e, j) => <LogoShape key={j} e={e} />)}
              </g>
              {els.filter((e) => e.dot).map((e, j) => {
                const d = pop(t0 + 0.14 + DOT_ORDER.get(e)! * 0.016, 0.24, 2.2);
                return d <= 0 ? null : <LogoShape key={`d${j}`} e={e} style={{transform: `scale(${d})`, transformBox: 'fill-box', transformOrigin: 'center'}} />;
              })}
            </g>
          );
        })}
      </svg>
      <div style={{position: 'absolute', top: 690, width: '100%', textAlign: 'center', fontFamily: 'Poppins', fontWeight: 600, fontSize: 56, letterSpacing: '0.42em', marginLeft: '0.21em', color: '#5c484d', whiteSpace: 'pre'}}>
        {AVAIL.split('').map((ch, i) => {
          const k = interpolate(t, [availAt + i * 0.03, availAt + i * 0.03 + 0.3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
          return <span key={i} style={{display: 'inline-block', opacity: k, transform: `translateY(${(1 - k) * 18}px)`}}>{ch}</span>;
        })}
      </div>
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
