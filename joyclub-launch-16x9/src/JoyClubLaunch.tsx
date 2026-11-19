import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {BAR, BEAT, CLIMAX, cwStart, END, f, FPS, INTRO_END, JOY, NAFESA} from './timing';

export {FPS};
export const TOTAL_FRAMES = f(END);

const W = 1920;
const H = 1080;
const G = 8; // lebar gutter cream
const G2 = G / 2;
const CREAM = '#f5f0e6';

const fontFace = `@font-face{font-family:'JoyPlaceholder';src:url('${staticFile('InterDisplay-Black.otf')}') format('opentype');font-weight:900;}`;

// ---------- Geometri ----------
type Pt = [number, number];
type Box = {x: number; y: number; w: number; h: number};
type Geom = {pts: Pt[]; box: Box};

const rect = (x: number, y: number, w: number, h: number): Geom => ({
  pts: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]],
  box: {x, y, w, h},
});
// Parallelogram: tepi atas diserong ke kanan sebanyak s
const para = (x: number, y: number, w: number, h: number, s: number): Geom => ({
  pts: [[x + s, y], [x + w + s, y], [x + w, y + h], [x, y + h]],
  box: {x, y, w: w + s, h},
});
const polyCss = (pts: Pt[]) => `polygon(${pts.map(([x, y]) => `${x}px ${y}px`).join(',')})`;

// ---------- Video ----------
const raw = (c: string) => staticFile(`raw/${c}.mp4`);
const kain = (c: string) => staticFile(`kain/${c}.mp4`);

const Vid: React.FC<{src: string; from: number; fy?: number; style?: React.CSSProperties}> = ({src, from, fy = 0.35, style}) => (
  <OffthreadVideo
    src={src}
    muted
    startFrom={f(from)}
    style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: `50% ${fy * 100}%`, ...style}}
  />
);

const FullKain: React.FC<{clip: string; from: number; zoom?: [number, number]; dur: number}> = ({clip, from, zoom = [1.04, 1.1], dur}) => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, f(dur)], zoom, {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{transform: `scale(${s})`}}>
      <Vid src={kain(clip)} from={from} fy={0.5} />
    </AbsoluteFill>
  );
};

// ---------- Sel layout ----------
// Masa dalam unit beat, relatif kepada mula colorway (0 = colorway penuh skrin).
type CellShot = {at: number; clip: string; t: number; fy?: number; zoom?: number};
type Cell = {
  geom: Geom | ((beat: number) => Geom);
  shots: CellShot[];
  from?: number; // beat sel mula wujud
  to?: number; // beat sel tamat
};

const ShotView: React.FC<{shot: CellShot; box: Box; life: number}> = ({shot, box, life}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, f(BEAT * 1.5)], [1.1, 1.0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const drift = interpolate(frame, [0, Math.max(1, f(life))], [1, 1.05], {extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, overflow: 'hidden'}}>
      <div style={{width: '100%', height: '100%', transform: `scale(${enter * drift * (shot.zoom ?? 1)})`}}>
        <Vid src={raw(shot.clip)} from={shot.t} fy={shot.fy} />
      </div>
    </div>
  );
};

const CellView: React.FC<{cell: Cell; origin: number}> = ({cell, origin}) => {
  const frame = useCurrentFrame();
  const beat = origin + frame / FPS / BEAT;
  const g = typeof cell.geom === 'function' ? cell.geom(beat) : cell.geom;
  const end = cell.to ?? 99;
  return (
    <AbsoluteFill style={{clipPath: polyCss(g.pts)}}>
      {cell.shots.map((s, k) => {
        const s0 = Math.max(s.at, origin);
        const s1 = Math.min(cell.shots[k + 1]?.at ?? end, end);
        const from = f((s0 - origin) * BEAT);
        const dur = f((s1 - origin) * BEAT) - from;
        if (dur <= 0) return null;
        return (
          <Sequence key={k} from={from} durationInFrames={dur} layout="none">
            <ShotView shot={s} box={g.box} life={(s1 - s0) * BEAT} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

// Semua sel satu colorway. lead = berapa beat sebelum colorway penuh ia mula muncul (dalam cutout).
const Layout: React.FC<{cells: Cell[]; lead: number}> = ({cells, lead}) => (
  <AbsoluteFill style={{background: CREAM}}>
    {cells.map((c, i) => {
      const origin = Math.max(c.from ?? -lead, -lead);
      const from = f((origin + lead) * BEAT);
      const dur = c.to !== undefined ? f((c.to + lead) * BEAT) - from : undefined;
      return (
        <Sequence key={i} from={from} durationInFrames={dur} layout="none">
          <CellView cell={c} origin={origin} />
        </Sequence>
      );
    })}
  </AbsoluteFill>
);

// ---------- Shape cutout transition ----------
// Klip seterusnya muncul dalam beberapa bentuk berselerak, satu bentuk setiap beat, kemudian penuh skrin.
type Shape = {pts: Pt[]; at: number};

const popScale = (pts: Pt[], s: number): Pt[] => {
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  return pts.map(([x, y]) => [cx + (x - cx) * s, cy + (y - cy) * s]);
};

const Cutout: React.FC<{lead: number; shapes: Shape[]; children: React.ReactNode}> = ({lead, shapes, children}) => {
  const frame = useCurrentFrame();
  const sec = frame / FPS;
  const fullAt = lead * BEAT;
  if (sec >= fullAt) return <AbsoluteFill>{children}</AbsoluteFill>;
  const live = shapes
    .map((s) => {
      const t0 = (lead + s.at) * BEAT;
      if (sec < t0) return null;
      const p = interpolate(sec - t0, [0, 0.16], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.6))});
      return popScale(s.pts, 0.55 + 0.45 * p);
    })
    .filter((x): x is Pt[] => x !== null);
  const d = live.length
    ? live.map((pts) => 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L') + ' Z').join(' ')
    : 'M0 0 Z';
  return (
    <AbsoluteFill style={{filter: 'drop-shadow(0 14px 30px rgba(0,0,0,0.4))'}}>
      <AbsoluteFill style={{clipPath: `path('${d}')`}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- Rancangan setiap colorway (footage sementara, Nas akan pilih) ----------
type Plan = {name: string; lead: number; shapes: Shape[]; cells: Cell[]};

// G: 4 jalur tak sama lebar, lebar bertukar pada beat 9
const G_W1 = [300, 760, 520, 316];
const G_W2 = [560, 380, 316, 640];
const gStrip = (i: number) => (beat: number): Geom => {
  const p = interpolate(beat, [9, 9.7], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const ws = G_W1.map((w, k) => w + (G_W2[k] - w) * p);
  const x = ws.slice(0, i).reduce((a, w) => a + w + G, 0);
  const g = rect(x, 0, ws[i], H);
  const cx = x + ws[i] / 2;
  return {pts: g.pts, box: {x: cx - 450, y: 0, w: 900, h: H}};
};

// A: diagonal 2 (garis dari atas 1150 ke bawah 770)
const A_L: Geom = {pts: [[0, 0], [1150 - G2, 0], [770 - G2, H], [0, H]], box: {x: 0, y: 0, w: 1150, h: H}};
const A_R: Geom = {pts: [[1150 + G2, 0], [W, 0], [W, H], [770 + G2, H]], box: {x: 770, y: 0, w: 1150, h: H}};
const A_SLANT = 380;

// B: diagonal 3 (garis atas x+260 ke bawah x, x = 700, 1320)
const B_S = 260;
const B0: Geom = {pts: [[0, 0], [960 - G2, 0], [700 - G2, H], [0, H]], box: {x: 0, y: 0, w: 960, h: H}};
const B1: Geom = {pts: [[960 + G2, 0], [1580 - G2, 0], [1320 - G2, H], [700 + G2, H]], box: {x: 700, y: 0, w: 880, h: H}};
const B2: Geom = {pts: [[1580 + G2, 0], [W, 0], [W, H], [1320 + G2, H]], box: {x: 1320, y: 0, w: 600, h: H}};

const PW = (W - G) / 2; // 956
const PH = (H - G) / 2; // 536

const PLANS: Plan[] = [
  {
    // Reveal dari intro kain: 4 kotak berselerak
    name: 'White Sky blue',
    lead: 4,
    shapes: [
      {pts: rect(1190, 150, 430, 560).pts, at: -4},
      {pts: rect(250, 470, 540, 400).pts, at: -3},
      {pts: rect(820, 60, 320, 420).pts, at: -2},
      {pts: rect(964, 650, 640, 330).pts, at: -1},
    ],
    cells: [
      // F: split 2 (jauh + dekat)
      {geom: rect(0, 0, PW, H), to: 6, shots: [{at: -4, clip: 'C4619', t: 1, fy: 0.3}]},
      {geom: rect(PW + G, 0, PW, H), to: 6, shots: [{at: -4, clip: 'C4619', t: 13, fy: 0.2}, {at: 3, clip: 'C4618', t: 12, fy: 0.25}]},
      // G: 4 jalur tak sama lebar
      {geom: gStrip(0), from: 6, shots: [{at: 6, clip: 'C4618', t: 3}]},
      {geom: gStrip(1), from: 6, shots: [{at: 6, clip: 'C4619', t: 21}]},
      {geom: gStrip(2), from: 6, shots: [{at: 6, clip: 'C4619', t: 27}]},
      {geom: gStrip(3), from: 6, shots: [{at: 6, clip: 'C4618', t: 15}]},
    ],
  },
  {
    // Bentuk serong ikut sudut diagonal 2
    name: 'Sky blue Red',
    lead: 3,
    shapes: [
      {pts: para(1120, 90, 460, 520, 520 * (A_SLANT / H)).pts, at: -3},
      {pts: para(240, 430, 520, 560, 560 * (A_SLANT / H)).pts, at: -2},
      {pts: para(760, 160, 360, 760, 760 * (A_SLANT / H)).pts, at: -1},
    ],
    cells: [
      {geom: A_L, to: 8, shots: [{at: -3, clip: 'C4607', t: 4, fy: 0.15}, {at: 4, clip: 'C4606', t: 32, fy: 0.25}]},
      {geom: A_R, to: 8, shots: [{at: -3, clip: 'C4606', t: 15, fy: 0.35}, {at: 4.5, clip: 'C4607', t: 16, fy: 0.3}]},
      // E: zoom detail penuh skrin
      {geom: rect(0, 0, W, H), from: 8, shots: [{at: 8, clip: 'C4606', t: 21, fy: 0.5}]},
    ],
  },
  {
    // Kotak ikut garis grid Hero + 2
    name: 'Sage Taupe',
    lead: 3,
    shapes: [
      {pts: rect(768, 0, 1152, PH).pts, at: -3},
      {pts: rect(0, 300, 760, 560).pts, at: -2},
      {pts: rect(768, PH + G, 700, PH).pts, at: -1},
    ],
    cells: [
      // C: hero kiri + 2 detail
      {geom: rect(0, 0, 760, H), to: 6, shots: [{at: -3, clip: 'C4612', t: 14, fy: 0.3}]},
      {geom: rect(768, 0, 1152, PH), to: 6, shots: [{at: -3, clip: 'C4612', t: 30, fy: 0.25}]},
      {geom: rect(768, PH + G, 1152, PH), to: 6, shots: [{at: -3, clip: 'C4612', t: 33, fy: 0.55}]},
      // C cermin: hero kanan
      {geom: rect(W - 760, 0, 760, H), from: 6, shots: [{at: 6, clip: 'C4612', t: 2, fy: 0.3}]},
      {geom: rect(0, 0, 1152, PH), from: 6, shots: [{at: 6, clip: 'C4612', t: 24, fy: 0.3}]},
      {geom: rect(0, PH + G, 1152, PH), from: 6, shots: [{at: 6, clip: 'C4612', t: 46, fy: 0.6}]},
    ],
  },
  {
    // 2x2: blok pop satu demi satu ikut beat
    name: 'Silver Brownie',
    lead: 3,
    shapes: [
      {pts: rect(0, 0, PW, PH).pts, at: -3},
      {pts: rect(PW + G, PH + G, PW, PH).pts, at: -2},
      {pts: rect(PW + G, 0, PW, PH).pts, at: -1},
    ],
    cells: [
      {geom: rect(0, 0, PW, PH), shots: [{at: -3, clip: 'C4616', t: 10, fy: 0.2}, {at: 6, clip: 'C4617', t: 5, fy: 0.3}]},
      {geom: rect(PW + G, 0, PW, PH), shots: [{at: -3, clip: 'C4617', t: 14, fy: 0.25}, {at: 6.5, clip: 'C4616', t: 30, fy: 0.3}]},
      {geom: rect(0, PH + G, PW, PH), shots: [{at: -3, clip: 'C4616', t: 24, fy: 0.45}, {at: 7, clip: 'C4616', t: 18, fy: 0.5}]},
      {geom: rect(PW + G, PH + G, PW, PH), shots: [{at: -3, clip: 'C4617', t: 11, fy: 0.6}, {at: 7.5, clip: 'C4617', t: 2, fy: 0.6}]},
    ],
  },
  {
    // Bentuk serong ikut diagonal 3
    name: 'Red Sky blue',
    lead: 3,
    shapes: [
      {pts: para(1000, 140, 430, 420, 420 * (B_S / H)).pts, at: -3},
      {pts: para(140, 480, 560, 480, 480 * (B_S / H)).pts, at: -2},
      {pts: B2.pts, at: -1},
    ],
    cells: [
      {geom: B0, shots: [{at: -3, clip: 'C4625', t: 40, fy: 0.3}, {at: 6, clip: 'C4625', t: 18, fy: 0.3}]},
      {geom: B1, shots: [{at: -3, clip: 'C4625', t: 10, fy: 0.25}, {at: 6.5, clip: 'C4625', t: 32, fy: 0.3}]},
      {geom: B2, shots: [{at: -3, clip: 'C4625', t: 26, fy: 0.4}, {at: 7, clip: 'C4625', t: 46, fy: 0.35}]},
    ],
  },
];

// ---------- Intro kain ----------
const INTRO_CUTS: {clip: string; from: number; start: number; len: number}[] = [
  {clip: 'k0-macro-white-skyblue', from: 0.3, start: 0, len: BAR * 2},
  {clip: 'k2-skyblue-red', from: 0.5, start: BAR * 2, len: BAR},
  {clip: 'k3-sage-taupe', from: 0.5, start: BAR * 3, len: BEAT * 3},
  {clip: 'k4-silver-brownie', from: 1.0, start: BAR * 3 + BEAT * 3, len: BEAT * 2},
  {clip: 'k1-white-skyblue', from: 2.5, start: BAR * 3 + BEAT * 5, len: BEAT},
  {clip: 'k5-red-skyblue', from: 2.6, start: BAR * 3 + BEAT * 6, len: BEAT * 2},
];

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, f(1.2)], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {INTRO_CUTS.map((c, i) => (
        <Sequence key={i} from={f(c.start)} durationInFrames={f(c.len)} layout="none">
          <AbsoluteFill style={{opacity: i === 0 ? fadeIn : 1}}>
            <FullKain clip={c.clip} from={c.from} dur={c.len} zoom={i === 0 ? [1.0, 1.12] : [1.08, 1.0]} />
          </AbsoluteFill>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// ---------- Klimaks: 5 jalur serong, masuk selang-seli atas/bawah ----------
const CLIMAX_SHOTS: CellShot[] = [
  {at: 0, clip: 'C4619', t: 14, fy: 0.3},
  {at: 0, clip: 'C4607', t: 2, fy: 0.3},
  {at: 0, clip: 'C4612', t: 14, fy: 0.3},
  {at: 0, clip: 'C4616', t: 12, fy: 0.3},
  {at: 0, clip: 'C4625', t: 14, fy: 0.3},
];
const H_S = 220;
const H_STEP = (W + H_S) / 5;

const Climax: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill>
      {CLIMAX_SHOTS.map((shot, i) => {
        const x0 = i * H_STEP - H_S;
        const x1 = (i + 1) * H_STEP - H_S;
        const l = i === 0 ? -400 : G2;
        const r = i === 4 ? -400 : G2;
        const pts: Pt[] = [[x0 + H_S + l, 0], [x1 + H_S - r, 0], [x1 - r, H], [x0 + l, H]];
        const ol = i === 0 ? -400 : -G2;
        const or = i === 4 ? -400 : -G2;
        const outer: Pt[] = [[x0 + H_S + ol, 0], [x1 + H_S - or, 0], [x1 - or, H], [x0 + ol, H]];
        const p = spring({frame: frame - f((BEAT / 2) * i), fps, config: {damping: 18, stiffness: 140}});
        const y = interpolate(p, [0, 1], [i % 2 === 0 ? -H : H, 0]);
        return (
          <AbsoluteFill key={i} style={{transform: `translateY(${y}px)`}}>
            {/* lapisan cream penuh supaya gutter kekal cream */}
            <AbsoluteFill style={{clipPath: polyCss(outer), background: CREAM}} />
            <AbsoluteFill style={{clipPath: polyCss(pts)}}>
              <ShotView shot={shot} box={{x: x0 - 20, y: 0, w: H_STEP + H_S + 40, h: H}} life={JOY - CLIMAX} />
            </AbsoluteFill>
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- JOY CLUB + NAFESA ----------
const JOY_LEAD = 1.5;
const JOY_SHAPES: Shape[] = [
  {pts: para(1180, 0, 380, H, H_S).pts, at: -1.5},
  {pts: para(120, 0, 420, H, H_S).pts, at: -1},
  {pts: para(640, 0, 440, H, H_S).pts, at: -0.5},
];

const JoyClubCard: React.FC<{delay: number}> = ({delay}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const letters = 'JOY CLUB'.split('');
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{filter: 'blur(8px)', transform: 'scale(1.08)'}}>
        <Vid src={kain('k5-red-skyblue')} from={2.0} fy={0.5} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'rgba(0,0,0,0.22)'}} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{display: 'flex', fontFamily: 'JoyPlaceholder', fontWeight: 900, fontSize: 210, color: '#fff', letterSpacing: '0.22em', marginRight: '-0.22em'}}>
          {letters.map((ch, i) => {
            const p = spring({frame: frame - f(delay + BEAT * 0.5) - i * 2, fps, config: {damping: 14, stiffness: 160}});
            return (
              <span key={i} style={{display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 60}px) scale(${0.8 + 0.2 * p})`, whiteSpace: 'pre'}}>
                {ch}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const NafesaCard: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [f(0.15), f(0.9)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s = interpolate(frame, [0, f(END - NAFESA)], [0.94, 1.0], {easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{background: '#000', justifyContent: 'center', alignItems: 'center'}}>
      <Img src={staticFile('logo-nafesa-putih.png')} style={{height: 470, opacity: o, transform: `scale(${s})`}} />
    </AbsoluteFill>
  );
};

// ---------- Komposisi ----------
export const JoyClubLaunch: React.FC = () => {
  const frame = useCurrentFrame();
  const vol = interpolate(frame, [0, f(0.6), f(END - 1.4), f(END)], [0, 1, 1, 0], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <style>{fontFace}</style>
      <Audio src={staticFile('lagu-dari-031.m4a')} volume={vol} />

      <Sequence durationInFrames={f(INTRO_END)}>
        <Intro />
      </Sequence>

      {/* Setiap colorway muncul dalam shape cutout di atas yang sebelumnya */}
      {PLANS.map((p, i) => {
        const start = cwStart(i) - p.lead * BEAT;
        const end = i < PLANS.length - 1 ? cwStart(i + 1) : CLIMAX + BAR;
        return (
          <Sequence key={p.name} from={f(start)} durationInFrames={f(end) - f(start) + 1}>
            <Cutout lead={p.lead} shapes={p.shapes}>
              <Layout cells={p.cells} lead={p.lead} />
            </Cutout>
          </Sequence>
        );
      })}

      <Sequence from={f(CLIMAX)} durationInFrames={f(JOY) - f(CLIMAX) + 1}>
        <Climax />
      </Sequence>

      <Sequence from={f(JOY - JOY_LEAD * BEAT)} durationInFrames={f(NAFESA) - f(JOY - JOY_LEAD * BEAT)}>
        <Cutout lead={JOY_LEAD} shapes={JOY_SHAPES}>
          <JoyClubCard delay={JOY_LEAD * BEAT} />
        </Cutout>
      </Sequence>

      <Sequence from={f(NAFESA)}>
        <NafesaCard />
      </Sequence>
    </AbsoluteFill>
  );
};

