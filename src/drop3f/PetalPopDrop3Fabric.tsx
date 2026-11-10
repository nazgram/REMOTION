// Petal Pop Drop 3 catalog as a "fabric" reel (9:16, SFX only). Each colourway's print (Nas's vector, rasterized by
// scripts/drop3f_assets.js) falls in like a silk scarf with a soft sheen and its name tag, then one corner of the silk
// is lifted and peeled away (the folded flap shows the fabric's washed-out reverse, flowers shake off the fold) to reveal
// that colourway's catalog page. Opens on Buttercup silk with a swinging logo hang-tag, ends with five print ribbons,
// the tag again, then the ribbons drop away to the NAFESA back cover.
import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, interpolate, spring, staticFile, useCurrentFrame } from 'remotion';
import { loadFont } from '@remotion/fonts';
import L from './timeline.json';
import P from '../drop3t/pattern.json';
import LG from '../drop3t/logo.json';

const font = 'Montserrat';
loadFont({ family: font, url: staticFile('intro/fonts/Montserrat.ttf'), weight: '100 900' });
const TITLE = 'Transcity'; // the catalog's title face (Nas's file, letters only: the counter stays in Montserrat)
loadFont({ family: TITLE, url: staticFile('drop3f/fonts/Transcity.otf') });

const { W, H, CARD, OPEN, COVER, CW, END } = L;
const IVORY = '#fbf5ea';
const INK = '#2b1d14';
type Way = keyof typeof P.palettes;
const ACCENT: Record<string, string> = { Buttercup: '#8f8d55', Camellia: '#c53c74', Lavender: '#a6657b', Marigold: '#cc8069', Petunia: '#76552c' };
const FW = 1170, FH = 2080; // fabric image size

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.45, 0, 0.2, 1);
const lerp = (t: number, a: number, b: number, v0: number, v1: number, e: (x: number) => number = ease) =>
  interpolate(t, [a, b], [v0, v1], { ...clamp, easing: e });
const pop = (t: number, at: number, damping = 11, stiffness = 170) =>
  t < at ? 0 : spring({ frame: (t - at) * L.FPS, fps: L.FPS, config: { damping, mass: 0.6, stiffness } });
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------- geometry for the peel ----------
type Pt = [number, number];
const SCREEN: Pt[] = [[0, 0], [W, 0], [W, H], [0, H]];
// the part of a polygon where n·x <= s (keep = 'below') or >= s ('above')
const clipHalf = (poly: Pt[], n: number[], s: number, keep: 'below' | 'above'): Pt[] => {
  const f = (p: Pt) => (keep === 'below' ? s - (n[0] * p[0] + n[1] * p[1]) : n[0] * p[0] + n[1] * p[1] - s);
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const fa = f(a), fb = f(b);
    if (fa >= 0) out.push(a);
    if (fa * fb < 0) {
      const k = fa / (fa - fb);
      out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]);
    }
  }
  return out;
};
const pts = (p: Pt[]) => p.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ');
const reflect = (p: Pt, n: number[], s: number, lift: number): Pt => {
  const d = n[0] * p[0] + n[1] * p[1] - s; // distance past the fold
  return [p[0] - (1 + lift) * d * n[0], p[1] - (1 + lift) * d * n[1]];
};
const projRange = (n: number[]) => {
  const v = SCREEN.map((p) => n[0] * p[0] + n[1] * p[1]);
  return [Math.min(...v), Math.max(...v)];
};

// fabric face: the print image drifting slowly, with a moving silk sheen
const Fabric: React.FC<{ way: string; t: number; back?: boolean; seed?: number }> = ({ way, t, back, seed = 0 }) => {
  const dx = -45 + 40 * Math.sin(t * 0.35 + seed);
  const dy = -80 - 30 * t * 0.5 + 60 * Math.cos(t * 0.27 + seed);
  return <image href={staticFile(`drop3f/${way}${back ? '_back' : ''}.jpg`)} x={dx} y={Math.max(-160, Math.min(0, dy % 160))} width={FW} height={FH} preserveAspectRatio="none" />;
};
const Sheen: React.FC<{ t: number; id: string; strength?: number }> = ({ t, id, strength = 0.22 }) => {
  const p = ((t * 0.45) % 1.6) - 0.3; // band position across the diagonal
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2={W} y2={H} gradientUnits="userSpaceOnUse">
          <stop offset={Math.max(0, p - 0.18)} stopColor="#fff" stopOpacity={0} />
          <stop offset={Math.min(1, Math.max(0, p))} stopColor="#fff" stopOpacity={strength} />
          <stop offset={Math.min(1, p + 0.18)} stopColor="#fff" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill={`url(#${id})`} />
      {/* soft folds: two broad shadows that breathe, so the print reads as cloth */}
      <rect x={0} y={0} width={W} height={H} fill={`url(#${id}f)`} />
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2={W} y2="0" gradientUnits="userSpaceOnUse">
          {[0, 0.2, 0.38, 0.55, 0.72, 0.9, 1].map((o, i) => (
            <stop key={i} offset={o} stopColor={i % 2 ? '#000' : '#fff'} stopOpacity={i % 2 ? 0.07 + 0.03 * Math.sin(t * 1.3 + i) : 0.04} />
          ))}
        </linearGradient>
      </defs>
    </>
  );
};

// colour name tag sewn on the silk
const NameTag: React.FC<{ name: string; idx: number; k: number }> = ({ name, idx, k }) => {
  if (k <= 0.001) return null;
  const w = name.length * 60 + 170, h = 200, cx = W / 2, cy = 820;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${k}) rotate(${(1 - Math.min(1, k)) * -8})`}>
      <rect x={-w / 2 + 6} y={-h / 2 + 10} width={w} height={h} rx={100} fill="#000" opacity={0.18} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={100} fill={IVORY} />
      <rect x={-w / 2 + 12} y={-h / 2 + 12} width={w - 24} height={h - 24} rx={88} fill="none" stroke={ACCENT[name]} strokeWidth={3} strokeDasharray="10 9" />
      <text x={0} y={-38} textAnchor="middle" fontFamily={font} fontWeight={600} fontSize={28} letterSpacing={6} fill={ACCENT[name]}>
        {`0${idx + 1} / 05`}
      </text>
      <text x={0} y={50} textAnchor="middle" fontFamily={TITLE} fontSize={100} fill={ACCENT[name]}>
        {name}
      </text>
    </g>
  );
};

// the Petal Pop Drop 3 logo on an ivory hang-tag that swings from its string
const Tag: React.FC<{ t: number; tin: number; tout: number; cy?: number }> = ({ t, tin, tout, cy = 860 }) => {
  if (t < tin || t > tout + 0.6) return null;
  const k = pop(t, tin, 13, 120);
  const out = lerp(t, tout, tout + 0.5, 0, 1, Easing.in(Easing.back(1.4)));
  const lt = Math.max(0, t - tin - 0.25);
  const swing = 12 * Math.exp(-lt * 2.2) * Math.cos(lt * 7.5) + 1.2 * Math.sin(t * 1.6);
  const tw = 760, th = 600, pivotY = cy - th / 2 - 150;
  const y = interpolate(k, [0, 1], [-1300, 0]) - out * 1500;
  const s = tw * 0.82 / LG.w;
  return (
    <g transform={`translate(0 ${y}) rotate(${swing} ${W / 2} ${pivotY})`}>
      <line x1={W / 2} y1={pivotY - 900} x2={W / 2} y2={cy - th / 2 + 40} stroke="#d9c7a7" strokeWidth={5} />
      <rect x={W / 2 - tw / 2 + 10} y={cy - th / 2 + 18} width={tw} height={th} rx={46} fill="#000" opacity={0.2} />
      <rect x={W / 2 - tw / 2} y={cy - th / 2} width={tw} height={th} rx={46} fill={IVORY} />
      <rect x={W / 2 - tw / 2 + 18} y={cy - th / 2 + 18} width={tw - 36} height={th - 36} rx={32} fill="none" stroke="#98d4f1" strokeWidth={3} strokeDasharray="12 10" />
      <circle cx={W / 2} cy={cy - th / 2 + 52} r={16} fill="#e9dcc4" stroke="#d9c7a7" strokeWidth={4} />
      <g transform={`translate(${W / 2} ${cy + 40}) scale(${s}) translate(${-LG.w / 2} ${-LG.h / 2})`}>
        {LG.paths.map((p, i) => (
          <path key={i} d={p.d} fill={p.fill} />
        ))}
      </g>
    </g>
  );
};

// a silk sheet with a wavy bottom hem falling from the top of the frame; k 0..1
const drapePoly = (k: number, t: number, seed: number, x0 = 0, x1 = W): Pt[] => {
  const settle = Math.max(0, 1 - k);
  const bottom = interpolate(k, [0, 1], [-160, H + 160]);
  const amp = 30 + 60 * settle;
  const p: Pt[] = [[x0, -10], [x1, -10]];
  const steps = Math.max(4, Math.ceil((x1 - x0) / 24));
  for (let i = 0; i <= steps; i++) {
    const x = x1 - ((x1 - x0) * i) / steps;
    p.push([x, bottom + amp * Math.sin(x / 150 + t * 6 + seed) + 24 * Math.sin(x / 61 + seed * 2)]);
  }
  return p;
};

// ---------- what sits under the silk ----------
const PageCard: React.FC<{ page: string; k: number; tilt?: number }> = ({ page, k, tilt = 0 }) => {
  const s = 0.94 + 0.06 * k;
  return (
    <div style={{
      position: 'absolute', left: (W - CARD.w) / 2, top: CARD.cy - CARD.h / 2, width: CARD.w, height: CARD.h, borderRadius: 18, overflow: 'hidden',
      transform: `scale(${s}) rotate(${tilt * (1 - k)}deg)`, boxShadow: '0 26px 60px rgba(25,15,10,.35)', background: '#fff',
    }}>
      <Img src={staticFile(`drop3f/${page}.jpg`)} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};
const Ground: React.FC<{ way: string }> = ({ way }) => (
  <AbsoluteFill style={{ background: way === 'Petunia' ? '#1b1411' : P.palettes[way as Way].bg }}>
    <Img src={staticFile(`drop3f/${way}_back.jpg`)} style={{ width: FW, height: FH, marginLeft: -45, marginTop: -80, opacity: 0.55 }} />
  </AbsoluteFill>
);

// one peel: the current silk folds back from the n-side corner; flowers shake off the fold
const Peel: React.FC<{ t: number; a: number; b: number; way: string; n: number[]; id: string; seed: number; tag?: React.ReactNode }> = ({ t, a, b, way, n, id, seed, tag }) => {
  const [dmin, dmax] = projRange(n);
  const k = lerp(t, a, b, 0, 1, Easing.bezier(0.5, 0, 0.35, 1));
  const s = interpolate(k, [0, 1], [dmax + 2, dmin - 260]);
  if (t >= b) return null;
  const lift = 0.12 * Math.sin(Math.PI * k); // the flap rises a little off the cloth mid-peel
  const keep = clipHalf(SCREEN, n, s, 'below');
  const peeled = clipHalf(SCREEN, n, s, 'above');
  const flap = peeled.map((p) => reflect(p, n, s, lift));
  const m = [1 - 2 * n[0] * n[0], -2 * n[0] * n[1], -2 * n[0] * n[1], 1 - 2 * n[1] * n[1], 2 * s * n[0], 2 * s * n[1]];
  const on: Pt = [n[0] * s, n[1] * s]; // a point on the fold line
  const shadowW = 90;
  return (
    <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
      <defs>
        <clipPath id={`${id}k`}><polygon points={pts(keep)} /></clipPath>
        <clipPath id={`${id}p`}><polygon points={pts(peeled)} /></clipPath>
        <linearGradient id={`${id}s`} gradientUnits="userSpaceOnUse" x1={on[0]} y1={on[1]} x2={on[0] + n[0] * shadowW} y2={on[1] + n[1] * shadowW}>
          <stop offset={0} stopColor="#000" stopOpacity={0.38} />
          <stop offset={1} stopColor="#000" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${id}f`} gradientUnits="userSpaceOnUse" x1={on[0]} y1={on[1]} x2={on[0] - n[0] * 520} y2={on[1] - n[1] * 520}>
          <stop offset={0} stopColor="#fff" stopOpacity={0.55} />
          <stop offset={0.12} stopColor="#fff" stopOpacity={0.1} />
          <stop offset={1} stopColor="#000" stopOpacity={0.16} />
        </linearGradient>
      </defs>
      {/* silk still lying flat */}
      <g clipPath={`url(#${id}k)`}>
        <Fabric way={way} t={t} seed={seed} />
        <Sheen t={t} id={`${id}sh`} />
        {tag}
      </g>
      {/* shadow the lifted fold throws on the page underneath */}
      {peeled.length > 2 && <polygon points={pts(clipHalf(clipHalf(SCREEN, n, s, 'above'), n, s + shadowW, 'below'))} fill={`url(#${id}s)`} />}
      {/* the folded-back flap: reverse side of the silk */}
      {peeled.length > 2 && (
        <g style={{ filter: 'drop-shadow(0 10px 18px rgba(0,0,0,.28))' }}>
          <g transform={`matrix(${m.join(' ')})`}>
            <g clipPath={`url(#${id}p)`}>
              <g transform={`translate(${-lift * 0} 0)`}>
                <Fabric way={way} t={t} seed={seed} back />
              </g>
            </g>
          </g>
          <polygon points={pts(flap)} fill={`url(#${id}f)`} />
        </g>
      )}
      {/* flowers shaken off the fold */}
      {[0, 1, 2, 3, 4].map((j) => {
        const st = a + 0.12 + j * 0.07;
        const lt = t - st;
        if (lt < 0 || lt > 1.4) return null;
        const along = (rnd(seed * 10 + j) - 0.5) * 900;
        const sAt = interpolate(lerp(st, a, b, 0, 1, Easing.bezier(0.5, 0, 0.35, 1)), [0, 1], [dmax + 2, dmin - 260]);
        const px = n[0] * sAt - n[1] * along + W / 2 * (1 - Math.abs(n[0])) * 0;
        const py = n[1] * sAt + n[0] * along;
        const cx = Math.min(W - 60, Math.max(60, px + (n[1] === 0 ? 0 : 0)));
        const cy = Math.min(H - 120, Math.max(120, py));
        const fly = lt * 320;
        const x = cx + n[0] * fly + Math.sin(lt * 5 + j) * 30;
        const y = cy + n[1] * fly - 120 * lt + 90 * lt * lt;
        const sz = 120 + 90 * rnd(seed * 7 + j);
        const op = interpolate(lt, [0, 0.1, 1.0, 1.4], [0, 1, 1, 0], clamp);
        return (
          <image key={j} href={staticFile(`drop3f/fl_${way}_F${(j % 5) + 1}.png`)} x={x - sz / 2} y={y - sz / 2} width={sz} height={sz} opacity={op}
            transform={`rotate(${(j % 2 ? 1 : -1) * lt * 140} ${x} ${y})`} />
        );
      })}
    </svg>
  );
};

export const PetalPopDrop3Fabric: React.FC<{ withAudio?: boolean }> = ({ withAudio }) => {
  const t = useCurrentFrame() / L.FPS;
  const layers: React.ReactNode[] = [];

  // ---- scene under everything: which page is showing
  let under: React.ReactNode = null;
  if (t < CW[0].drape[1]) {
    const k = lerp(t, OPEN.peel[0] + 0.2, OPEN.peel[1] + 0.4, 0, 1);
    under = (<><Ground way={COVER.bg} /><PageCard page={COVER.page} k={k} tilt={-3} /></>);
  }
  CW.forEach((c, i) => {
    const next = CW[i + 1];
    const until = next ? next.drape[1] : END.ribbons + 0.9;
    if (t >= c.drape[1] && t < until) {
      const k = lerp(t, c.peel[0] + 0.2, c.peel[1] + 0.4, 0, 1);
      under = (<><Ground way={c.name} /><PageCard page={c.page} k={k} tilt={i % 2 ? 3 : -3} /></>);
    }
  });
  if (t >= END.ribbons + 0.9) {
    const back = pop(t, END.back - 0.2, 14);
    under = (
      <AbsoluteFill style={{ background: '#fff' }}>
        <div style={{ position: 'absolute', left: 0, top: 960 - 766, width: W, height: 1532, transform: `scale(${1.08 - 0.08 * back})` }}>
          <Img src={staticFile('drop3f/page13.jpg')} style={{ width: '100%', height: '100%' }} />
        </div>
      </AbsoluteFill>
    );
  }
  layers.push(<React.Fragment key="under">{under}</React.Fragment>);

  // ---- opening silk + hang-tag, then the first peel to the cover
  if (t < OPEN.peel[0]) {
    layers.push(
      <svg key="open" width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <Fabric way={OPEN.way} t={t} />
        <Sheen t={t} id="osh" />
      </svg>,
    );
  } else {
    layers.push(<Peel key="opeel" t={t} a={OPEN.peel[0]} b={OPEN.peel[1]} way={OPEN.way} n={OPEN.dir} id="op" seed={1} />);
  }
  layers.push(<svg key="otag" width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}><Tag t={t} tin={OPEN.tagIn} tout={OPEN.tagOut} /></svg>);

  // ---- colourways: drape in, name tag, peel away
  CW.forEach((c, i) => {
    if (t < c.drape[0] || t >= c.peel[1]) return;
    const tagK = pop(t, c.pill, 10) * (t < c.peel[0] ? 1 : 1);
    const tag = <NameTag name={c.name} idx={i} k={tagK} />;
    if (t < c.peel[0]) {
      const k = lerp(t, c.drape[0], c.drape[1], 0, 1, Easing.bezier(0.3, 0, 0.25, 1));
      const poly = drapePoly(k, t, i + 2);
      layers.push(
        <svg key={`d${i}`} width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, filter: 'drop-shadow(0 18px 22px rgba(0,0,0,.3))' }}>
          <defs><clipPath id={`dc${i}`}><polygon points={pts(poly)} /></clipPath></defs>
          <g clipPath={`url(#dc${i})`}>
            <Fabric way={c.name} t={t} seed={i + 2} />
            <Sheen t={t + i} id={`dsh${i}`} />
            {tag}
          </g>
        </svg>,
      );
    } else {
      layers.push(<Peel key={`p${i}`} t={t} a={c.peel[0]} b={c.peel[1]} way={c.name} n={c.dir} id={`pp${i}`} seed={i + 2} tag={tag} />);
    }
  });

  // ---- outro: five print ribbons, the tag, then everything drops to the NAFESA back cover
  if (t >= END.ribbons && t < END.fall + 1.2) {
    const rw = W / 5;
    layers.push(
      <svg key="rib" width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, filter: 'drop-shadow(0 16px 20px rgba(0,0,0,.28))' }}>
        {CW.map((c, j) => {
          const k = lerp(t, END.ribbons + j * 0.08, END.ribbons + 0.7 + j * 0.08, 0, 1, Easing.bezier(0.3, 0, 0.25, 1));
          if (k <= 0) return null;
          const fall = lerp(t, END.fall + (j % 2 ? 0.06 : 0) + Math.abs(j - 2) * 0.05, END.fall + 0.75 + Math.abs(j - 2) * 0.05, 0, 1, Easing.in(Easing.cubic));
          const x0 = j * rw, poly = drapePoly(k, t, j * 3 + 1, x0 - 1, x0 + rw + 1);
          return (
            <g key={c.name} transform={`translate(${(j - 2) * 30 * fall} ${fall * 2300}) rotate(${(j - 2) * 6 * fall} ${x0 + rw / 2} 0)`}>
              <defs><clipPath id={`rc${j}`}><polygon points={pts(poly)} /></clipPath></defs>
              <g clipPath={`url(#rc${j})`}>
                <Fabric way={c.name} t={t} seed={j} />
                <Sheen t={t + j * 0.4} id={`rsh${j}`} strength={0.18} />
                <rect x={x0 + rw - 3} y={0} width={3} height={H} fill="#000" opacity={0.12} />
              </g>
            </g>
          );
        })}
      </svg>,
    );
    layers.push(<svg key="etag" width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}><Tag t={t} tin={END.tagIn} tout={END.fall - 0.05} /></svg>);
  }

  return (
    <AbsoluteFill style={{ background: IVORY, overflow: 'hidden' }}>
      {layers}
      {withAudio && <Audio src={staticFile('drop3f/sfx.wav')} />}
    </AbsoluteFill>
  );
};
