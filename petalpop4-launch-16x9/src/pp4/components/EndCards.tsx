import React from 'react';
import {AbsoluteFill, Easing, Img, useCurrentFrame} from 'remotion';
import {colorsOf, DesignId, ORDER, UNITS} from '../designs';
import {Fmt, useFmt} from '../fmt';
import {LOGO, LOGO_H, LOGO_W} from '../logo';
import {asset, ease, FPS, pop, SERIF} from '../util';
import {BloomSweep, SweepTiming, UnitG, unitLightness} from './Bloom';

export const COMING_SWEEP: SweepTiming = {pre: 0.7, maskLag: 0.1, spread: 0.35, grow: 0.4, settle: 0.5};
// Atas klip (9:16): mask lebih lambat supaya bunga sentiasa tutup tepinya.
export const COMING_SWEEP_OVER: SweepTiming = {...COMING_SWEEP, maskLag: 0.25};
// Masa (saat tempatan dari mula segmen) dikira dari beat dalam PetalPop4Launch.
export type ComingTimes = {letters: number[]; shrink: number; ring: number; logoLetters: number[]; motifs: number; pill: number; drops: number[]};

const TEXT = 'COMING SOON';
const RING_R = 380;
const LOGO_S = 0.54;
// Susun atur ikut format. 9:16: tulisan 2 baris berpusat y 900, kemudian bulatan + logo di y 800 dan tulisan kecil di
// bawahnya (semua dalam 1521 px atas, luar UI TikTok).
type Lay = {ring: [number, number]; y0: number; y1: number; sc1: number; size: number; lines: 1 | 2; small: [number, number][]; vig: (sh: number) => string};
const LAY: Record<Fmt, Lay> = {
  h: {
    ring: [960, 468], y0: 540, y1: 985, sc1: 0.4, size: 168, lines: 1,
    small: [[300, 420], [1620, 430], [180, 640], [1740, 650], [520, 300], [1400, 300], [560, 790], [1360, 790]],
    vig: (sh) => `ellipse ${760 + 200 * sh}px ${420 + 200 * sh}px at 50% ${50 - 8 * sh}%`,
  },
  v: {
    ring: [540, 790], y0: 900, y1: 1385, sc1: 0.46, size: 205, lines: 2,
    small: [[150, 620], [930, 640], [120, 1180], [960, 1170], [330, 470], [750, 470], [330, 1330], [750, 1330]],
    vig: (sh) => `ellipse ${560 + 160 * sh}px ${620 + 380 * sh}px at 50% ${47 + 4 * sh}%`,
  },
};

// Unit kecil cerah Black Dahlia yang mekar di sekeliling tulisan.
const dahliaColors = colorsOf('dahlia');
const SMALL = UNITS.filter((u) => u.r >= 30 && u.r <= 70 && u.p.length >= 4 && unitLightness(u, dahliaColors) > 0.45).slice(0, 8);
// Bulatan bunga: unit campur 6 design.
const RING_UNITS = UNITS.filter((u) => u.r >= 50 && u.r <= 95 && u.p.length >= 6);
const RING_N = 30;
const ring = Array.from({length: RING_N}, (_, i) => {
  const u = RING_UNITS[(i * 13) % RING_UNITS.length];
  const a = (i / RING_N) * Math.PI * 2 - Math.PI / 2;
  return {u, a, d: ORDER[i % ORDER.length] as DesignId, s: (i % 2 === 0 ? 70 : 54) / u.r};
});

const Letters: React.FC<{t: number; at: number[]; size: number; lines: 1 | 2}> = ({t, at, size, lines}) => {
  let li = 0;
  return (
    <div style={{fontFamily: SERIF, fontSize: size, color: '#fff', letterSpacing: '0.05em', whiteSpace: 'nowrap', lineHeight: lines === 2 ? 0.95 : 1, textAlign: 'center'}}>
      {TEXT.split('').map((ch, i) => {
        if (ch === ' ') return lines === 2 ? <br key={i} /> : <span key={i} style={{display: 'inline-block', width: '0.35em'}} />;
        const a = at[li++];
        const k = ease(t, a, a + 0.32, Easing.out(Easing.back(1.8)));
        const o = ease(t, a, a + 0.12, Easing.linear);
        return (
          <span key={i} style={{display: 'inline-block', opacity: o, transform: `translateY(${(1 - Math.min(1, k)) * 30}px) scale(${k})`, transformOrigin: '50% 100%'}}>
            {ch}
          </span>
        );
      })}
    </div>
  );
};

// COMING SOON atas print Black Dahlia (unit cerah), kemudian bulatan bunga + logo Petal Pop 4 putih. t = 0 mula segmen.
// overlay (9:16): tiada latar hitam, bunga Black Dahlia mekar terus atas klip klimaks terakhir.
export const ComingSoon: React.FC<{times: ComingTimes; overlay?: boolean}> = ({times: T, overlay = false}) => {
  const t = useCurrentFrame() / FPS;
  const {fmt, W, H} = useFmt();
  const L = LAY[fmt];
  const RING_C = L.ring;
  const vig = ease(t, 0.45, 0.95);
  const sh = ease(t, T.shrink, T.shrink + 0.45, Easing.inOut(Easing.cubic));
  const ty = L.y0 + (L.y1 - L.y0) * sh, sc = 1 - (1 - L.sc1) * sh;
  const smallOut = ease(t, T.shrink, T.shrink + 0.3, Easing.in(Easing.back(1.4)));
  let li = 0;
  return (
    <AbsoluteFill style={{background: overlay ? undefined : '#000'}}>
      <BloomSweep design="dahlia" origin="center" timing={overlay ? COMING_SWEEP_OVER : COMING_SWEEP} light />
      <AbsoluteFill style={{opacity: vig, background: `radial-gradient(${L.vig(sh)}, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0) 100%)`}} />
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        {SMALL.map((u, i) => {
          const k = pop(t, T.letters[Math.min(T.letters.length - 1, i + 1)], 10) * (1 - smallOut);
          if (k <= 0.001) return null;
          const [x, y] = L.small[i];
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${Math.sin(t * 2 + i) * 8}) scale(${(55 / u.r) * k}) translate(${-u.x} ${-u.y})`}>
              <UnitG u={u} colors={dahliaColors} k={1} />
            </g>
          );
        })}
        <g transform={`translate(${RING_C[0]} ${RING_C[1]}) rotate(${(t - T.ring) * 5})`}>
          {ring.map(({u, a, d, s}, i) => {
            const k = pop(t, T.ring + i * 0.022, 10);
            if (k <= 0.001) return null;
            return (
              <g key={i} transform={`translate(${Math.cos(a) * RING_R} ${Math.sin(a) * RING_R}) rotate(${(a * 180) / Math.PI + 90}) scale(${s * k}) translate(${-u.x} ${-u.y})`}>
                <UnitG u={u} colors={colorsOf(d)} k={1} />
              </g>
            );
          })}
        </g>
        <g transform={`translate(${RING_C[0]} ${RING_C[1]}) scale(${LOGO_S}) translate(${-LOGO_W / 2} ${-(327 + 1022) / 2})`}>
          {LOGO.map((p, i) => {
            const [bx, by, bw, bh] = p.box;
            const cx = bx + bw / 2, cy = by + bh / 2;
            let at: number;
            if (p.role === 'letter') at = T.logoLetters[li++];
            else if (p.role === 'pill') at = T.pill;
            else if (p.role === 'drop') at = T.drops[p.order - 17];
            else at = T.motifs + (p.order % 7) * 0.05;
            if (t < at) return null;
            if (p.role === 'letter' || p.role === 'drop') {
              const k = ease(t, at, at + 0.3, Easing.out(Easing.back(1.8)));
              const o = ease(t, at, at + 0.1, Easing.linear);
              return <path key={i} d={p.d} fill={p.fill} opacity={o} transform={`translate(0 ${(1 - Math.min(1, k)) * 50}) translate(${cx} ${by + bh}) scale(${k}) translate(${-cx} ${-(by + bh)})`} />;
            }
            const k = pop(t, at, 9);
            const spin = p.role === 'flower' ? (1 - Math.min(1, k)) * -120 : 0;
            const sx = p.role === 'pill' ? Math.max(0.05, k) : k, sy = p.role === 'pill' ? 0.4 + 0.6 * Math.min(1, k) : k;
            return <path key={i} d={p.d} fill={p.fill} transform={`translate(${cx} ${cy}) rotate(${spin}) scale(${sx} ${sy}) translate(${-cx} ${-cy})`} />;
          })}
        </g>
      </svg>
      <div style={{position: 'absolute', left: 0, width: W, top: ty, display: 'flex', justifyContent: 'center', transform: `translateY(-50%) scale(${sc})`}}>
        <Letters t={t} at={T.letters} size={L.size} lines={L.lines} />
      </div>
    </AbsoluteFill>
  );
};

// NAFESA: hitam, logo putih fade in 0.8 s. Sedikit bunga print (campur 6 design) di bucu kiri atas dan kanan bawah,
// fade in perlahan bersama logo dan bergoyang sikit (Nas 19 Nov: "bagi ada bunga sikit").
const NAF_UNITS = UNITS.filter((u) => u.r >= 55 && u.r <= 110 && u.p.length >= 12);
const NAF_CORNER: [number, number, number][] = [
  [60, 50, 150], [240, 10, 95], [10, 240, 100], [200, 175, 60], [370, 30, 48], [40, 400, 46], [330, 140, 34],
];
const nafFlowers = (W: number, H: number) => [0, 1].flatMap((side) =>
  NAF_CORNER.map(([dx, dy, size], i) => {
    const u = NAF_UNITS[(side * 23 + i * 7 + 3) % NAF_UNITS.length];
    const x = side === 0 ? dx : W - dx, y = side === 0 ? dy : H - dy;
    return {u, x, y, s: size / u.r, d: ORDER[(i + side * 3) % ORDER.length] as DesignId, k: side * 7 + i};
  }),
);
export const NafesaFade: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const {fmt, W, H} = useFmt();
  // 9:16: logo berpusat y 900 (bukan 960), sedikit lebih besar.
  return (
    <AbsoluteFill style={{background: `rgba(0,0,0,${ease(t, 0, 0.25, Easing.linear)})`, alignItems: 'center', justifyContent: 'center', paddingBottom: fmt === 'v' ? 120 : 0}}>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        {nafFlowers(W, H).map(({u, x, y, s, d, k}) => {
          const o = ease(t, 0.2 + (k % 7) * 0.06, 0.9 + (k % 7) * 0.06, Easing.inOut(Easing.sin));
          if (o <= 0) return null;
          const g = 0.85 + 0.15 * o;
          return (
            <g key={k} opacity={o} transform={`translate(${x} ${y}) rotate(${Math.sin(t * 1.6 + k) * 5}) scale(${s * g}) translate(${-u.x} ${-u.y})`}>
              <UnitG u={u} colors={colorsOf(d)} k={1} />
            </g>
          );
        })}
      </svg>
      <Img src={asset('logo-nafesa-putih.png')} style={{width: fmt === 'v' ? 640 : 560, opacity: ease(t, 0.15, 0.95, Easing.inOut(Easing.sin))}} />
    </AbsoluteFill>
  );
};
