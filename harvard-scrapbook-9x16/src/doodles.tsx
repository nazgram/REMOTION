import React from 'react';
import {Easing, interpolate} from 'remotion';

// ---------- seeded helpers ----------
export const mulberry = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

type P = [number, number];

const jitter = (pts: P[], amp: number, seed: number): P[] => {
  const r = mulberry(seed);
  return pts.map(([x, y]) => [x + (r() - 0.5) * 2 * amp, y + (r() - 0.5) * 2 * amp]);
};

// Catmull-Rom -> cubic bezier
const smooth = (pts: P[], closed: boolean) => {
  const n = pts.length;
  const get = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    const c1: P = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: P = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return closed ? d + ' Z' : d;
};
const poly = (pts: P[], closed: boolean) =>
  pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + (closed ? ' Z' : '');

// ---------- shape generators (box -100..100) ----------
const starPts = (): P[] => {
  const out: P[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? 40 : 92;
    out.push([Math.cos(a) * r, Math.sin(a) * r + 6]);
  }
  return out;
};
const heartPts = (): P[] => {
  const out: P[] = [];
  for (let i = 0; i < 36; i++) {
    const t = (i / 36) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3;
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    out.push([x * 5.4, -y * 5.4 - 8]);
  }
  return out;
};
const circlePts = (rx: number, ry: number, turns: number, n: number, grow = 0): P[] => {
  const out: P[] = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * turns * Math.PI * 2 - 2.4;
    const k = 1 + grow * (i / n);
    out.push([Math.cos(t) * rx * k, Math.sin(t) * ry * k]);
  }
  return out;
};
const spiralPts = (): P[] => {
  const out: P[] = [];
  const n = 60;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2 * 2.7;
    const r = 6 + (i / n) * 82;
    out.push([Math.cos(t) * r, Math.sin(t) * r]);
  }
  return out;
};
const flowerPts = (): P[] => {
  const out: P[] = [];
  for (let i = 0; i < 50; i++) {
    const t = (i / 50) * Math.PI * 2;
    const r = 62 + 30 * Math.cos(5 * t);
    out.push([Math.cos(t) * r, Math.sin(t) * r]);
  }
  return out;
};
const burstPolyPts = (): P[] => {
  const out: P[] = [];
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    const r = i % 2 ? 54 : 94;
    out.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return out;
};
const wavePts = (x0: number, x1: number, y: number, amp: number, waves: number): P[] => {
  const out: P[] = [];
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push([x0 + (x1 - x0) * t, y + Math.sin(t * waves * Math.PI * 2) * amp]);
  }
  return out;
};
const scribblePts = (): P[] => {
  const out: P[] = [];
  let x = -92;
  let up = true;
  while (x < 92) {
    out.push([x, up ? -46 : 46]);
    x += 15;
    up = !up;
  }
  return out;
};

export type StickerType =
  | 'star' | 'starOutline' | 'heart' | 'heartOutline' | 'sparkle' | 'arrow' | 'smiley'
  | 'circle' | 'burst' | 'spiky' | 'underline' | 'scribble' | 'swirl' | 'flower' | 'plus' | 'dots' | 'cloud';

export const COLORS = {
  white: '#FFFFFF',
  pink: '#F7A8C8',
  yellow: '#FBE07C',
  lilac: '#C7B2F0',
  blue: '#A8D2F4',
  ink: '#6B5A8E',
};

// ---------- animation helpers ----------
const eo = Easing.out(Easing.cubic);
export const popScale = (l: number) => {
  if (l <= 0) return 0;
  if (l < 7) return interpolate(l, [0, 7], [0, 1.1], {easing: eo});
  if (l < 12) return interpolate(l, [7, 12], [1.1, 0.97], {easing: Easing.inOut(Easing.sin)});
  return interpolate(l, [12, 16], [0.97, 1], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin)});
};
const drawP = (l: number, dur = 16) =>
  interpolate(l, [0, dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});

type Spec = {
  stroke: string[]; // stroke-only paths (draw-on capable)
  fill?: string[]; // filled shapes
  sharp?: boolean;
  draw?: boolean; // draws itself on
};

const build = (type: StickerType, seed: number): Spec => {
  const J = 2.4;
  switch (type) {
    case 'star':
    case 'starOutline': {
      const s = starPts();
      return {stroke: [poly(jitter(s, J, seed), true), poly(jitter(s, J * 1.6, seed + 9), true)], fill: type === 'star' ? [poly(s, true)] : undefined};
    }
    case 'heart':
    case 'heartOutline': {
      const h = heartPts();
      return {stroke: [smooth(jitter(h, J, seed), true), smooth(jitter(h.map(([x, y]) => [x * 0.94, y * 0.94 + 2] as P), J * 1.5, seed + 3), true)], fill: type === 'heart' ? [smooth(h, true)] : undefined};
    }
    case 'sparkle': {
      const r = mulberry(seed);
      const k = 10 + r() * 6;
      const d = `M0,-96 Q${k},${-k} 92,0 Q${k},${k} 0,96 Q${-k},${k} -92,0 Q${-k},${-k} 0,-96 Z`;
      return {stroke: [d], fill: [d]};
    }
    case 'arrow': {
      const body = 'M-92,46 C-64,70 -26,30 -38,6 C-50,-18 -78,12 -54,34 C-22,62 34,34 70,-38';
      const head = 'M40,-36 L70,-38 L74,-8';
      return {stroke: [body, head], draw: true};
    }
    case 'smiley': {
      const c = smooth(jitter(circlePts(84, 84, 1, 30), J, seed), true);
      return {
        stroke: [c, 'M-30,-30 L-30,-6', 'M30,-30 L30,-6', 'M-44,18 Q0,62 44,18'],
        fill: [c],
      };
    }
    case 'circle':
      return {stroke: [smooth(jitter(circlePts(96, 58, 1.18, 40, 0.06), J, seed), false)], draw: true};
    case 'burst': {
      const out: string[] = [];
      const r = mulberry(seed);
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2 + 0.2;
        const r0 = 46 + r() * 8;
        const r1 = 82 + r() * 16;
        out.push(`M${(Math.cos(a) * r0).toFixed(1)},${(Math.sin(a) * r0).toFixed(1)} L${(Math.cos(a) * r1).toFixed(1)},${(Math.sin(a) * r1).toFixed(1)}`);
      }
      return {stroke: out, draw: true};
    }
    case 'spiky': {
      const s = burstPolyPts();
      return {stroke: [poly(jitter(s, J, seed), true)], fill: [poly(s, true)]};
    }
    case 'underline':
      return {stroke: [smooth(jitter(wavePts(-95, 95, -14, 11, 2.5), 1.5, seed), false), smooth(jitter(wavePts(-70, 80, 18, 4, 1), 1.5, seed + 1), false)], draw: true};
    case 'scribble':
      return {stroke: [smooth(jitter(scribblePts(), 5, seed), false)], draw: true};
    case 'swirl':
      return {stroke: [smooth(jitter(spiralPts(), 1.6, seed), false)], draw: true};
    case 'flower': {
      const f = flowerPts();
      const c = smooth(jitter(circlePts(20, 20, 1, 12), 1.5, seed), true);
      return {stroke: [smooth(jitter(f, J, seed), true), c], fill: [smooth(f, true)]};
    }
    case 'plus':
      return {stroke: ['M0,-70 L0,70', 'M-70,0 L70,0']};
    case 'dots':
      return {stroke: [], fill: [smooth(circlePts(24, 24, 1, 12).map(([x, y]) => [x - 62, y] as P), true), smooth(circlePts(24, 24, 1, 12), true), smooth(circlePts(24, 24, 1, 12).map(([x, y]) => [x + 62, y] as P), true)]};
    case 'cloud': {
      const out: P[] = [];
      for (let i = 0; i < 60; i++) {
        const t = (i / 60) * Math.PI * 2;
        const r = 1 + 0.16 * Math.abs(Math.sin(3.5 * t));
        out.push([Math.cos(t) * 92 * r, Math.sin(t) * 58 * r]);
      }
      return {stroke: [smooth(jitter(out, J, seed), true)], fill: [smooth(out, true)]};
    }
  }
};

export type StickerProps = {
  type: StickerType;
  color: string; // main colour
  x: number;
  y: number;
  size: number;
  rot?: number;
  start: number;
  frame: number;
  seed?: number;
  pen?: boolean; // white pen doodle on photo (no die-cut)
  bounceAt?: number; // global frame for end bounce
};

const FILLED: StickerType[] = ['star', 'heart', 'sparkle', 'smiley', 'spiky', 'flower', 'dots', 'cloud'];

export const Sticker: React.FC<StickerProps> = ({type, color, x, y, size, rot = 0, start, frame, seed = 1, pen, bounceAt}) => {
  const l = frame - start;
  if (l < 0) return null;
  const boil = Math.floor(frame / 4); // stop-motion line boil
  const spec = build(type, seed * 31 + (boil % 3));
  const filled = FILLED.includes(type);
  const draws = !!spec.draw;

  let scale = draws ? interpolate(l, [0, 6], [0.85, 1], {extrapolateRight: 'clamp', easing: eo}) : popScale(l);
  let r = rot;
  let ty = 0;
  let op = 1;
  if (type === 'star' || type === 'starOutline') {
    ty = l > 6 && l < 22 ? -Math.sin(((l - 6) / 16) * Math.PI) * 10 : 0;
  }
  if (type === 'heart' || type === 'heartOutline') {
    const pulse = (a: number) => (l > a && l < a + 10 ? Math.sin(((l - a) / 10) * Math.PI) * 0.12 : 0);
    scale *= 1 + pulse(18) + pulse(32);
  }
  if (type === 'sparkle' || type === 'plus') {
    scale *= 1 + 0.08 * Math.sin(l * 0.32 + seed);
    r += Math.sin(l * 0.12 + seed) * 10;
    op = 0.82 + 0.18 * Math.sin(l * 0.45 + seed * 2);
  }
  if (type === 'smiley') {
    r += Math.sin(l * 0.55) * 11 * Math.exp(-l / 26) + Math.sin(l * 0.12) * 3;
  }
  if (type === 'flower' || type === 'spiky') r += l * 0.6;
  if (type === 'cloud' || type === 'dots') ty += Math.sin(l * 0.1 + seed) * 4;

  if (bounceAt !== undefined) {
    const b = frame - bounceAt;
    if (b > 0 && b < 18) {
      ty -= Math.sin((b / 18) * Math.PI) * 22;
      scale *= 1 + Math.sin((b / 18) * Math.PI) * 0.06;
    }
  }

  const p = draws ? drawP(l, type === 'scribble' ? 20 : 15) : 1;
  const sw = type === 'scribble' ? 15 : 10;
  const strokeCol = filled ? (pen ? '#FFFFFF' : COLORS.ink) : color;
  const fillCol = color;
  const shadow = pen
    ? 'drop-shadow(0 2px 3px rgba(40,25,60,0.35))'
    : filled
      ? 'drop-shadow(0 3px 2px rgba(70,50,100,0.18)) drop-shadow(0 10px 14px rgba(70,50,100,0.16))'
      : color === '#FFFFFF'
        ? 'drop-shadow(0 1px 2px rgba(70,50,100,0.45))'
        : 'none';

  return (
    <svg
      viewBox="-130 -130 260 260"
      width={size * 1.3}
      height={size * 1.3}
      style={{
        position: 'absolute',
        left: x - (size * 1.3) / 2,
        top: y - (size * 1.3) / 2,
        transform: `translateY(${ty}px) rotate(${r}deg) scale(${scale})`,
        overflow: 'visible',
        filter: shadow,
        opacity: op,
      }}
    >
      <g filter="url(#crayon)">
        {/* die-cut white sticker border */}
        {filled && !pen && spec.fill
          ? spec.fill.map((d, i) => (
              <path key={'b' + i} d={d} fill="#fff" stroke="#fff" strokeWidth={34} strokeLinejoin="round" />
            ))
          : null}
        {spec.fill?.map((d, i) => <path key={'f' + i} d={d} fill={fillCol} />)}
        {spec.stroke.map((d, i) => (
          <path
            key={'s' + i}
            d={d}
            fill="none"
            stroke={strokeCol}
            strokeWidth={filled ? (i === 0 ? 7 : 5.5) : sw}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={draws ? 1 : undefined}
            strokeDasharray={draws ? 1 : undefined}
            strokeDashoffset={draws ? 1 - p : undefined}
            opacity={filled && i > 0 && (type === 'star' || type === 'heart') ? 0.55 : 1}
          />
        ))}
      </g>
    </svg>
  );
};

export const DoodleDefs: React.FC = () => (
  <svg width={0} height={0} style={{position: 'absolute'}}>
    <defs>
      <filter id="crayon" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} seed={4} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={4} xChannelSelector="R" yChannelSelector="G" result="d" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 2.05" result="g" />
        <feComposite in="d" in2="g" operator="in" />
      </filter>
      <filter id="crayonEdge" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves={2} seed={7} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={30} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
  </svg>
);
