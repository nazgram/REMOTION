import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {COLORS, DoodleDefs, mulberry, popScale, Sticker, StickerType} from './doodles';
import {COLLAGE_T0, DURATION as MAIN_DUR, Main} from './Main';
import LINES from './bodylines.json';

const C = COLORS;
const SLOT = 44; // frames per photo
const TR = 12; // transition length (overlaps start of next photo)
const N = 10;
const PH_END = SLOT * N; // 440
const MAIN_OFF = PH_END - COLLAGE_T0; // Main's collage starts as last photo ends
export const FULL_DURATION = MAIN_DUR + MAIN_OFF;

const K = 1920 / 1650; // photo px -> container px (container 1280x1920, left -100)

type TrType = 'heart' | 'scribble' | 'cutout' | 'star' | 'dissolve';
const TRANS: TrType[] = ['heart', 'scribble', 'cutout', 'star', 'dissolve', 'cutout', 'heart', 'scribble', 'star'];

type P = [number, number];
const smoothPath = (pts: P[]) => {
  const n = pts.length;
  const g = (i: number) => pts[Math.max(0, Math.min(n - 1, i))];
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
};
const segLen = (pts: P[]) => pts.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
const pointAt = (pts: P[], t: number): P => {
  const L = segLen(pts) * t;
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (acc + l >= L) {
      const u = (L - acc) / l;
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u];
    }
    acc += l;
  }
  return pts[pts.length - 1];
};

// stickers riding on the body line: [fraction along longest segment, type, colour, size, side offset]
const RIDE: {t: number; type: StickerType; c: string; s: number}[][] = [
  [{t: 0.18, type: 'star', c: C.yellow, s: 110}, {t: 0.8, type: 'heart', c: C.pink, s: 100}],
  [{t: 0.22, type: 'sparkle', c: C.yellow, s: 90}, {t: 0.85, type: 'smiley', c: C.lilac, s: 105}],
  [{t: 0.2, type: 'heart', c: C.pink, s: 100}, {t: 0.78, type: 'sparkle', c: C.blue, s: 85}],
  [{t: 0.15, type: 'flower', c: C.pink, s: 100}, {t: 0.82, type: 'star', c: C.lilac, s: 100}],
  [{t: 0.2, type: 'spiky', c: C.yellow, s: 100}, {t: 0.8, type: 'heart', c: C.lilac, s: 95}],
  [{t: 0.2, type: 'star', c: C.pink, s: 100}, {t: 0.85, type: 'sparkle', c: C.yellow, s: 85}],
  [{t: 0.2, type: 'smiley', c: C.yellow, s: 100}, {t: 0.8, type: 'heart', c: C.pink, s: 95}],
  [{t: 0.18, type: 'sparkle', c: C.lilac, s: 90}, {t: 0.8, type: 'flower', c: C.yellow, s: 100}],
  [{t: 0.2, type: 'heart', c: C.blue, s: 95}, {t: 0.82, type: 'star', c: C.yellow, s: 105}],
  [{t: 0.2, type: 'star', c: C.lilac, s: 105}, {t: 0.8, type: 'smiley', c: C.pink, s: 100}],
];
const LINE_COL = [C.pink, C.lilac, C.yellow, C.blue, C.pink, C.yellow, C.lilac, C.blue, C.pink, C.lilac];

const DRAW0 = 8;
const DRAWLEN = 24;

const segs = (i: number): P[][] => ((LINES as Record<string, number[][][]>)[`p${String(i + 1).padStart(2, '0')}`] || []).map((s) => s.map((p) => [p[0], p[1]] as P));

const BodyLine: React.FC<{i: number; l: number}> = ({i, l}) => {
  const all = segs(i);
  const total = all.reduce((a, s) => a + segLen(s), 0);
  const boil = Math.floor((l + i * 3) / 4);
  let start = 0;
  return (
    <svg viewBox="0 0 1100 1650" width={1280} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {all.map((s, k) => {
        const frac = segLen(s) / total;
        const a = start;
        start += frac;
        const p = interpolate(l, [DRAW0 + a * DRAWLEN, DRAW0 + (a + frac) * DRAWLEN], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        if (p <= 0) return null;
        const r = mulberry(i * 100 + k * 7 + (boil % 3));
        const jit = s.map(([x, y]) => [x + (r() - 0.5) * 3, y + (r() - 0.5) * 3] as P);
        const r2 = mulberry(i * 100 + k * 7 + 50 + (boil % 3));
        const jit2 = s.map(([x, y]) => [x + 7 + (r2() - 0.5) * 4, y + 5 + (r2() - 0.5) * 4] as P);
        return (
          <g key={k} filter="url(#crayon)">
            <path d={smoothPath(jit2)} fill="none" stroke={LINE_COL[i]} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} opacity={0.95} />
            <path d={smoothPath(jit)} fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} style={{filter: 'drop-shadow(0 1px 2px rgba(40,25,60,0.35))'}} />
          </g>
        );
      })}
    </svg>
  );
};

const FOCUS: P[] = [[540, 700], [520, 820], [560, 700], [560, 820], [600, 640], [430, 820], [560, 760], [600, 860], [560, 640], [640, 860]];

const PhotoScene: React.FC<{i: number; l: number; frame: number}> = ({i, l, frame}) => {
  const n = `p${String(i + 1).padStart(2, '0')}`;
  const z = 1 + 0.07 * interpolate(l, [0, SLOT + TR], [0, 1], {extrapolateRight: 'clamp'});
  const [fx, fy] = FOCUS[i];
  const all = segs(i);
  const longest = all.slice().sort((a, b) => segLen(b) - segLen(a))[0];
  const total = all.reduce((a, s) => a + segLen(s), 0);
  // when does the line reach fraction t of longest segment
  let off = 0;
  for (const s of all) {
    if (s === longest) break;
    off += segLen(s) / total;
  }
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#FBF7F1'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${z})`, transformOrigin: `${fx}px ${fy}px`}}>
        <div style={{position: 'absolute', left: -100, top: 0, width: 1280, height: 1920}}>
          <Img src={staticFile(`photos/${n}.jpg`)} style={{width: 1280, height: 1920, objectFit: 'cover'}} />
          <BodyLine i={i} l={l} />
          {RIDE[i].map((st, j) => {
            let [x, y] = pointAt(longest, st.t);
            x *= K;
            y *= K;
            // keep stickers out of the top text area and inside the frame
            y = Math.max(y, 520);
            x = Math.min(Math.max(x, 190), 1090);
            const tReach = DRAW0 + (off + (segLen(longest) / total) * st.t) * DRAWLEN;
            return <Sticker key={j} type={st.type} color={st.c} x={x} y={y} size={st.s * 1.15} rot={(j ? 12 : -10)} start={frame - l + Math.round(tReach) + 1} frame={frame} seed={i * 10 + j + 300} />;
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const heartPath = (cx: number, cy: number, s: number) => {
  let d = '';
  for (let k = 0; k <= 48; k++) {
    const t = (k / 48) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3;
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    d += `${k ? 'L' : 'M'}${(cx + x * s).toFixed(1)},${(cy - y * s).toFixed(1)}`;
  }
  return d + 'Z';
};
const starPath = (cx: number, cy: number, s: number) => {
  let d = '';
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    const r = (k % 2 ? 0.45 : 1) * s;
    d += `${k ? 'L' : 'M'}${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`;
  }
  return d + 'Z';
};

const Transition: React.FC<{type: TrType; t: number; i: number; frame: number; children: React.ReactNode}> = ({type, t, i, frame, children}) => {
  // t: 0..1 progress of revealing the incoming photo (children)
  const e = Easing.inOut(Easing.cubic)(t);
  const [fx, fy] = FOCUS[i];
  if (t >= 1) return <>{children}</>;
  if (type === 'heart' || type === 'star') {
    const s = type === 'heart' ? interpolate(e, [0, 1], [0, 150]) : interpolate(e, [0, 1], [0, 2600]);
    const d = type === 'heart' ? heartPath(fx, fy, s) : starPath(fx, fy, s);
    const rot = type === 'star' ? (1 - e) * 40 : 0;
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{clipPath: `path('${d}')`, transform: `rotate(${rot}deg)`, transformOrigin: `${fx}px ${fy}px`}}>
          <AbsoluteFill style={{transform: `rotate(${-rot}deg)`, transformOrigin: `${fx}px ${fy}px`}}>{children}</AbsoluteFill>
        </AbsoluteFill>
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible', transform: `rotate(${rot}deg)`, transformOrigin: `${fx}px ${fy}px`}}>
          <g filter="url(#crayon)">
            <path d={d} fill="none" stroke={LINE_COL[i]} strokeWidth={26} strokeLinejoin="round" />
            <path d={d} fill="none" stroke="#fff" strokeWidth={12} strokeLinejoin="round" />
          </g>
        </svg>
      </AbsoluteFill>
    );
  }
  if (type === 'dissolve') {
    return <AbsoluteFill style={{opacity: e, transform: `scale(${1.12 - 0.12 * e})`, filter: `blur(${(1 - e) * 14}px)`}}>{children}</AbsoluteFill>;
  }
  if (type === 'cutout') {
    // model cut-out pops first, background fades in behind
    const n = `p${String(i + 1).padStart(2, '0')}`;
    const cs = popScale(t * 18);
    const bg = interpolate(t, [0.45, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{background: '#FBF7F1', opacity: interpolate(t, [0, 0.25], [0, 0.88], {extrapolateRight: 'clamp'}) * (1 - bg)}} />
        <AbsoluteFill style={{opacity: bg}}>{children}</AbsoluteFill>
        {bg < 1 ? (
          <div style={{position: 'absolute', left: -100, top: 0, width: 1280, height: 1920, transform: `scale(${cs})`, transformOrigin: `${fx + 100}px ${fy + 300}px`, filter: `drop-shadow(0 0 3px #fff) drop-shadow(0 0 3px #fff) drop-shadow(0 18px 30px rgba(50,30,80,${0.35 * (1 - bg)}))`}}>
            <Img src={staticFile(`cut/${n}.png`)} style={{width: 1280, height: 1920}} />
          </div>
        ) : null}
      </AbsoluteFill>
    );
  }
  // scribble: thick crayon strokes cover the frame, incoming photo is revealed as they retract
  const cover = interpolate(t, [0, 0.5], [0, 1], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const uncover = interpolate(t, [0.5, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const r = mulberry(i * 17 + Math.floor(frame / 4) % 3);
  let d = 'M-200,-150';
  for (let k = 0; k < 9; k++) d += ` L${k % 2 ? 1280 : -200},${-150 + k * 280 + (r() - 0.5) * 50}`;
  return (
    <AbsoluteFill>
      {t >= 0.5 ? children : null}
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <path d={d} fill="none" stroke={LINE_COL[i]} strokeWidth={330} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${cover - uncover} 2`} strokeDashoffset={-uncover} filter="url(#crayonEdge)" />
      </svg>
    </AbsoluteFill>
  );
};

export const Full: React.FC = () => {
  const frame = useCurrentFrame();
  const scenes: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const s0 = i * SLOT;
    const l = frame - s0;
    const visibleEnd = (i + 1) * SLOT + TR;
    if (l < 0 || frame >= visibleEnd) continue;
    const scene = <PhotoScene i={i} l={l} frame={frame} />;
    if (i > 0 && l < TR) {
      scenes.push(
        <AbsoluteFill key={i}>
          <Transition type={TRANS[i - 1]} t={l / TR} i={i} frame={frame}>
            {scene}
          </Transition>
        </AbsoluteFill>,
      );
    } else scenes.push(<AbsoluteFill key={i}>{scene}</AbsoluteFill>);
  }
  // last photo shrinks away into the paper as the collage arrives
  const outP = interpolate(frame, [PH_END - 8, PH_END + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
  return (
    <AbsoluteFill style={{background: '#FBF7F1'}}>
      <DoodleDefs />
      {frame >= PH_END - 6 ? (
        <Sequence from={MAIN_OFF}>
          <Main skipGallery />
        </Sequence>
      ) : null}
      {frame < PH_END + 8 ? (
        <AbsoluteFill style={{zIndex: 1000, transform: `scale(${1 - 0.62 * outP}) rotate(${-8 * outP}deg)`, opacity: interpolate(outP, [0.6, 1], [1, 0], {extrapolateLeft: 'clamp'}), overflow: 'hidden', boxShadow: outP > 0 ? `0 0 0 ${30 * outP}px #fffdf9, 0 40px 80px rgba(60,40,90,${0.3 * outP})` : undefined}}>{scenes}</AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
