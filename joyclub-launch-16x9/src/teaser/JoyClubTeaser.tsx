import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import beatsData from '../../public/teaser/beats.json';
import {LOGO_ELS, LOGO_LETTERS, LOGO_VIEWBOX, LogoEl} from '../v3/logoSvg';

// JOY CLUB teaser 9:16 — 31s, lagu Bouncy Electronic (123 BPM). Cut ikut beat, tiada zoom denyut.
export const FPS = 30;
export const W = 1080;
export const H = 1920;
export const TOTAL_FRAMES = 31 * FPS;
const BEATS: number[] = beatsData.beats;
const BEAT = 60 / beatsData.bpm;
const B = (k: number) => (k < 0 ? 0 : BEATS[k]);
const fr = (s: number) => Math.round(s * FPS);
const a = (p: string) => staticFile(`teaser/${p}`);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const C = {pearl: '#dce9f4', sky: '#a0c4e1', blush: '#d1bdc1', ruby: '#b11f24', silver: '#d8d8d8', brown: '#5c484d', red: '#b11f24', blue: '#a0c4e1', cream: '#f5f0e6', olive: '#545e3a', tan: '#c9a27a'};

type Tr = {type: 'cut' | 'whipL' | 'whipR' | 'slideUp' | 'dots' | 'flash'; color?: string};
// clip = proxy 3s; off = saat mula dalam proxy; k0..k1 = indeks beat; z = crop (teaser: tunjuk sikit-sikit); ox/oy = titik fokus (%).
type Shot = {clip: string; off: number; k0: number; k1: number; z: number; ox?: number; oy?: number; tr?: Tr};

export const SHOTS: Shot[] = [
  // INTRO (SKY → BLUSH), setiap 2 beat
  {clip: 'b3', off: 0.2, k0: -1, k1: 2, z: 1.35, ox: 45, oy: 55},
  {clip: 'b1', off: 0.5, k0: 2, k1: 4, z: 1.3, ox: 50, oy: 35, tr: {type: 'whipL'}},
  {clip: 'b4', off: 0.6, k0: 4, k1: 6, z: 1.25, ox: 50, oy: 30},
  {clip: 'b2', off: 0.4, k0: 6, k1: 8, z: 1.4, ox: 55, oy: 30, tr: {type: 'whipR'}},
  {clip: 'l4', off: 0.3, k0: 8, k1: 10, z: 1.3, ox: 45, oy: 55, tr: {type: 'dots', color: C.blush}},
  {clip: 'l1', off: 0.5, k0: 10, k1: 12, z: 1.2, ox: 50, oy: 40},
  {clip: 'l2', off: 0.6, k0: 12, k1: 14, z: 1.35, ox: 50, oy: 30, tr: {type: 'slideUp'}},
  {clip: 'l3', off: 0.4, k0: 14, k1: 16, z: 1.25, ox: 40, oy: 35},
  // BUILD (BLUSH → SILVER → PEARL), 2 beat kemudian stutter 1 beat
  {clip: 'l5', off: 0.5, k0: 16, k1: 18, z: 1.3, ox: 50, oy: 35, tr: {type: 'whipL'}},
  {clip: 's1', off: 0.6, k0: 18, k1: 20, z: 1.3, ox: 50, oy: 40, tr: {type: 'dots', color: C.silver}},
  {clip: 's2', off: 0.4, k0: 20, k1: 22, z: 1.35, ox: 50, oy: 30},
  {clip: 's3', off: 0.5, k0: 22, k1: 24, z: 1.3, ox: 50, oy: 30, tr: {type: 'whipR'}},
  {clip: 'w1', off: 0.4, k0: 24, k1: 26, z: 1.25, ox: 50, oy: 35, tr: {type: 'slideUp'}},
  {clip: 'w3', off: 0.6, k0: 26, k1: 28, z: 1.3, ox: 50, oy: 35},
  {clip: 'r3', off: 0.0, k0: 28, k1: 29, z: 1.3, ox: 50, oy: 50},
  {clip: 'w5', off: 0.2, k0: 29, k1: 30, z: 1.3, ox: 50, oy: 40},
  {clip: 'r2', off: 1.6, k0: 30, k1: 31, z: 1.4, ox: 50, oy: 45},
  {clip: 'w4', off: 0.2, k0: 31, k1: 32, z: 1.35, ox: 50, oy: 30},
  // DROP (RUBY), 4 cut 1 beat kemudian 2 beat
  {clip: 'r1', off: 0.3, k0: 32, k1: 33, z: 1.2, ox: 50, oy: 35, tr: {type: 'flash'}},
  {clip: 'r2', off: 0.1, k0: 33, k1: 34, z: 1.25, ox: 50, oy: 35},
  {clip: 'r4', off: 0.3, k0: 34, k1: 35, z: 1.25, ox: 50, oy: 35},
  {clip: 'r5', off: 0.2, k0: 35, k1: 36, z: 1.2, ox: 50, oy: 35},
  {clip: 'r3', off: 1.0, k0: 36, k1: 38, z: 1.25, ox: 50, oy: 45, tr: {type: 'whipL'}},
  {clip: 'r5', off: 1.4, k0: 38, k1: 40, z: 1.3, ox: 50, oy: 30},
  {clip: 'c_pearl', off: 0.3, k0: 44, k1: 46, z: 1.0, ox: 50, oy: 40, tr: {type: 'dots', color: C.pearl}},
  {clip: 'c_blush', off: 0.4, k0: 46, k1: 48, z: 1.0, ox: 30, oy: 35, tr: {type: 'whipL'}},
  {clip: 'c_ruby', off: 0.4, k0: 48, k1: 50, z: 1.0, ox: 65, oy: 35, tr: {type: 'whipR'}},
];
export const END1 = B(50); // JOY CLUB endcard
export const END2 = B(58); // NAFESA

const WHIP = 0.5; // tempoh whip/slide (saat), berpusat pada cut
const ease = Easing.inOut(Easing.cubic);

// Kedudukan satu shot pada masa t: {x,y,blur} atau null jika tak nampak.
const shotPose = (i: number, t: number) => {
  const s = SHOTS[i];
  const t0 = B(s.k0), t1 = B(s.k1);
  const next = SHOTS[i + 1];
  const inTr = s.tr && ['whipL', 'whipR', 'slideUp'].includes(s.tr.type) ? s.tr.type : null;
  const outTr = next?.tr && ['whipL', 'whipR', 'slideUp'].includes(next.tr.type) ? next.tr.type : null;
  const lo = inTr ? t0 - WHIP / 2 : t0;
  const hi = outTr ? t1 + WHIP / 2 : t1;
  if (t < lo || t >= hi) return null;
  const vec = (type: string) => (type === 'whipL' ? [-W, 0] : type === 'whipR' ? [W, 0] : [0, -H]);
  let x = 0, y = 0, blur = 0;
  if (inTr && t < t0 + WHIP / 2) {
    const p = ease((t - (t0 - WHIP / 2)) / WHIP);
    const [vx, vy] = vec(inTr);
    x = -vx * (1 - p); y = -vy * (1 - p); blur = 26 * Math.sin(Math.PI * p);
  }
  if (outTr && t > t1 - WHIP / 2) {
    const p = ease((t - (t1 - WHIP / 2)) / WHIP);
    const [vx, vy] = vec(outTr);
    x = vx * p; y = vy * p; blur = 26 * Math.sin(Math.PI * p);
  }
  return {x, y, blur, t0, t1, lo};
};

const ShotLayer: React.FC<{i: number; from: number; startFrame: number}> = ({i, from, startFrame}) => {
  const t = (useCurrentFrame() + from) / FPS;
  const s = SHOTS[i];
  const pose = shotPose(i, t);
  if (!pose) return null;
  // drift perlahan & sekata (bukan denyut): scale naik sedikit sepanjang shot
  const drift = interpolate(t, [pose.t0, pose.t1], [0, 0.035], clamp);
  return (
    <AbsoluteFill style={{transform: `translate(${pose.x}px, ${pose.y}px)`, filter: pose.blur > 0.5 ? `blur(${pose.blur}px)` : undefined, overflow: 'hidden', background: '#000'}}>
      <AbsoluteFill style={{transform: `scale(${s.z + drift})`, transformOrigin: `${s.ox ?? 50}% ${s.oy ?? 50}%`}}>
        <OffthreadVideo src={a(`clips/${s.clip}.mp4`)} startFrom={startFrame} muted style={{width: W, height: H, objectFit: 'cover'}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Dot sweep menegak: dot dari 4 bucu membesar tutup skrin (cover), kemudian mengecil (reveal).
const DOTS = [
  {u: 80, v: 90, d: 130, at: 0}, {u: 280, v: 100, d: 170, at: 0.07}, {u: 100, v: 320, d: 200, at: 0.11},
  {u: 360, v: 360, d: 300, at: 0.18}, {u: 620, v: 180, d: 340, at: 0.24}, {u: 200, v: 680, d: 380, at: 0.28},
  {u: 560, v: 640, d: 640, at: 0.36}, {u: 0, v: 0, d: 4600, at: 0.48},
];
const CORNERS = [{x: 0, y: 0, sx: 1, sy: 1, lag: 0}, {x: W, y: H, sx: -1, sy: -1, lag: 0.03}, {x: W, y: 0, sx: -1, sy: 1, lag: 0.06}, {x: 0, y: H, sx: 1, sy: -1, lag: 0.09}];
const GROW = 0.36;
const DotField: React.FC<{color: string; p: number; second?: string}> = ({color, p, second}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    {CORNERS.map((c, ci) =>
      DOTS.map((d, di) => {
        const st = Math.min(d.at + c.lag, 1 - GROW);
        const k = interpolate(p, [st, st + GROW], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
        if (k <= 0.001) return null;
        const x = c.x + c.sx * d.u, y = c.y + c.sy * d.v;
        const col = second && di % 2 === 1 && di < DOTS.length - 1 ? second : color;
        return <div key={`${ci}-${di}`} style={{position: 'absolute', left: x - d.d / 2, top: y - d.d / 2, width: d.d, height: d.d, borderRadius: '50%', background: col, transform: `scale(${k})`}} />;
      }),
    )}
  </AbsoluteFill>
);
const COVER = BEAT * 1.5, REVEAL = BEAT * 1.1;
const Sweep: React.FC<{at: number; color: string; second?: string; cover?: number; reveal?: number}> = ({at, color, second, cover = COVER, reveal = REVEAL}) => {
  const t = useCurrentFrame() / FPS;
  if (t < at - cover || t > at + reveal + 2 / FPS) return null;
  const hold = 2 / FPS;
  const p = t < at ? (t - (at - cover)) / cover : 1 - Math.max(0, t - at - hold) / reveal;
  return <DotField color={color} second={second} p={Math.max(0, Math.min(1, p))} />;
};
const Flash: React.FC<{at: number}> = ({at}) => {
  const t = useCurrentFrame() / FPS;
  const o = interpolate(t, [at, at + 0.25], [0.85, 0], clamp);
  return t < at || o <= 0 ? null : <AbsoluteFill style={{background: '#fff', opacity: o}} />;
};


// ---------- NAMA DESIGN (gaya launch: plate bulat dari sudut bawah kiri, teks dalam zon selamat 1521px) ----------
type DesignId = 'sky' | 'blush' | 'silver' | 'pearl' | 'ruby';
const PLATE: Record<DesignId, {bg: string; fg: string; acc: [string, string]}> = {
  pearl: {bg: '#a0c4e1', fg: '#ffffff', acc: ['#a0c4e1', '#dce9f4']},
  sky: {bg: '#b11f24', fg: '#ffffff', acc: ['#a0c4e1', '#b11f24']},
  blush: {bg: '#738476', fg: '#ffffff', acc: ['#d1bdc1', '#738476']},
  ruby: {bg: '#a0c4e1', fg: '#b11f24', acc: ['#b11f24', '#a0c4e1']},
  silver: {bg: '#5c484d', fg: '#ffffff', acc: ['#d8d8d8', '#5c484d']},
};
export const NAMES: {d: DesignId; inAt: number; outAt: number}[] = [
  {d: 'sky', inAt: B(0) + 0.15, outAt: B(8) - 0.75},
  {d: 'blush', inAt: B(9), outAt: B(18) - 0.75},
  {d: 'silver', inAt: B(19), outAt: B(24) - 0.45},
  {d: 'pearl', inAt: B(24) + 0.3, outAt: B(28) - 0.3},
  {d: 'ruby', inAt: B(32) + 0.15, outAt: B(40) - 0.75},
];
const scl = (t: number, a0: number, d0: number) => interpolate(t, [a0, a0 + d0], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.4))});
const NameCard: React.FC<{d: DesignId; inAt: number; outAt: number}> = ({d, inAt, outAt}) => {
  const t = useCurrentFrame() / FPS;
  if (t < inAt || t > outAt + 0.4) return null;
  const p = PLATE[d];
  const out = interpolate(t, [outAt, outAt + 0.3], [1, 0], {...clamp, easing: Easing.in(Easing.cubic)});
  const plate = scl(t, inAt, 0.45) * out;
  const txt = interpolate(t, [inAt + 0.18, inAt + 0.5], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)}) * out;
  const D = 440;
  const c1 = scl(t, inAt + BEAT, 0.4) * out, c2 = scl(t, inAt + BEAT * 1.5, 0.4) * out;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 1040 - 110, top: 230 - 110, width: 220, height: 220, borderRadius: '50%', background: p.acc[0], transform: `scale(${c1})`, boxShadow: '0 0 0 6px rgba(255,255,255,0.0)'}} />
      <div style={{position: 'absolute', left: 950 - 45, top: 380 - 45, width: 90, height: 90, borderRadius: '50%', background: p.acc[1], transform: `scale(${c2})`}} />
      <div style={{position: 'absolute', left: 110 - D / 2, top: 1460 - D / 2, width: D, height: D, borderRadius: '50%', background: p.bg, transform: `scale(${plate})`}} />
      <div style={{position: 'absolute', left: 52, top: 1380, opacity: txt, transform: `translateY(${(1 - txt) * 30}px)`}}>
        <div style={{fontFamily: 'Poppins', fontWeight: 700, fontSize: 70, color: p.fg, letterSpacing: '0.03em', lineHeight: 1}}>{d.toUpperCase()}</div>
        <div style={{fontFamily: 'Poppins', fontWeight: 500, fontSize: 16, color: p.fg, letterSpacing: '0.3em', marginTop: 8}}>JOY CLUB COLLECTION</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- 3 PANEL (B40-B44) & 5 STRIP SEMUA DESIGN (B44-B50), ambil dari video launch ----------
type Pane = {clip: string; off: number; fy: number; fx?: number; z?: number};
const PANE_START = B(40), STRIP_START = B(44);
const BANDS: Pane[] = [{clip: 'p_sky', off: 0.2, fy: 0.4, fx: 0.62, z: 1.15}, {clip: 'p_silver', off: 0.2, fy: 0.38, fx: 0.62, z: 1.15}, {clip: 'p_ruby', off: 0.2, fy: 0.42, fx: 0.67, z: 1.6}];
const STRIPS: Pane[] = [{clip: 'c_sky', off: 0.2, fy: 0.3, fx: 0.34}, {clip: 'c_blush', off: 0.2, fy: 0.33, fx: 0.3}, {clip: 'c_silver', off: 0.2, fy: 0.3, fx: 0.5}, {clip: 'c_ruby', off: 0.2, fy: 0.32, fx: 0.67}, {clip: 'c_pearl', off: 0.2, fy: 0.36, fx: 0.48, z: 1.6}];
const GAP = 8;
const PaneVideo: React.FC<{p: Pane; x: number; y: number; w: number; h: number; z: number; startSec: number; seqFrom: number}> = ({p, x, y, w, h, z, startSec, seqFrom}) => {
  const vw = W * z, vh = H * z;
  const cl = (v: number, lo: number) => Math.min(0, Math.max(lo, v));
  const left = w / 2 - vw * (p.fx ?? 0.5), top = h / 2 - vh * p.fy;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, overflow: 'hidden'}}>
      <Sequence from={seqFrom} layout="none">
        <OffthreadVideo src={a(`clips/${p.clip}.mp4`)} startFrom={Math.round(startSec * FPS)} muted style={{position: 'absolute', left: cl(left, w - vw), top: cl(top, h - vh), width: vw, height: vh}} />
      </Sequence>
    </div>
  );
};
const Panes: React.FC = () => {
  const t = useCurrentFrame() / FPS; // global (Sequence from 0)
  if (t < PANE_START - 0.05 || t >= STRIP_START) return null;
  const inStrips = false;
  const bandH = (H - GAP * 2) / 3;
  const stripW = (W - GAP * 4) / 5;
  return (
    <AbsoluteFill style={{background: '#fff'}}>
      {!inStrips && BANDS.map((p, i) => {
        const at = PANE_START + i * BEAT;
        const k = interpolate(t, [at, at + 0.45], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
        const y = i * (bandH + GAP);
        const dir = i % 2 ? 1 : -1;
        return (
          <div key={i} style={{position: 'absolute', left: 0, top: y, width: W, height: bandH, background: C.pearl, overflow: 'hidden'}}>
            <div style={{position: 'absolute', inset: 0, transform: `translateX(${dir * (1 - k) * W}px)`}}>
              <PaneVideo p={p} x={0} y={0} w={W} h={bandH} z={p.z ?? 1} startSec={p.off} seqFrom={fr(at - 0.05)} />
            </div>
          </div>
        );
      })}
      {inStrips && STRIPS.map((p, i) => {
        const at = STRIP_START + i * (BEAT / 2);
        const k = interpolate(t, [at, at + 0.45], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
        const x = i * (stripW + GAP);
        const dir = i % 2 ? 1 : -1;
        const col = [C.sky, C.blush, C.silver, C.ruby, C.pearl][i];
        return (
          <div key={i} style={{position: 'absolute', left: x, top: 0, width: stripW, height: H, background: col, overflow: 'hidden'}}>
            <div style={{position: 'absolute', inset: 0, transform: `translateY(${dir * (1 - k) * H}px)`}}>
              <PaneVideo p={p} x={0} y={0} w={stripW} h={H} z={p.z ?? 1} startSec={p.off} seqFrom={fr(at - 0.05)} />
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- ENDCARD (sama gaya video launch JOY CLUB, tanpa kain) ----------
const LOGO_W = 980;
const LOGO_H = (LOGO_W * LOGO_VIEWBOX.h) / LOGO_VIEWBOX.w;
const firstXY = (e: LogoEl): [number, number] => {
  if (e.cx !== undefined) return [e.cx, e.cy!];
  const m = /M\s*([-\d.]+)[ ,]([-\d.]+)/.exec(e.d!)!;
  return [+m[1], +m[2]];
};
const DOT_ORDER = new Map<LogoEl, number>();
for (const L of ['O', 'U']) {
  LOGO_ELS.filter((e) => e.letter === L && e.dot).sort((p, q) => firstXY(p)[1] - firstXY(q)[1] || firstXY(p)[0] - firstXY(q)[0]).forEach((e, j) => DOT_ORDER.set(e, j));
}
const LogoShape: React.FC<{e: LogoEl; style?: React.CSSProperties}> = ({e, style}) =>
  e.d ? <path d={e.d} fill={e.fill} style={style} /> : <circle cx={e.cx} cy={e.cy} r={e.r} fill={e.fill} style={style} />;

const rand = (seed: number) => { const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
// corak polka di tepi (ganti pattern-silver): grid titik offset
const POLKA = (() => {
  const out: {x: number; y: number}[] = [];
  const g = 96;
  for (let r = 0; r < H / g + 1; r++) for (let c = 0; c < W / g + 1; c++) out.push({x: c * g + (r % 2 ? g / 2 : 0), y: r * g});
  return out;
})();

const LINE1 = 'AVAILABLE ON';
const LINE2 = '21 NOVEMBER 2026';
const JoyClubEnd: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const pop = (t0: number, dur: number, over = 1.7) => interpolate(t, [t0, t0 + dur], [0, 1], {...clamp, easing: Easing.out(Easing.back(over))});
  const step = BEAT / 3;
  const txtAt = BEAT * 3;
  const cy = 820;
  const Line: React.FC<{s: string; at: number; top: number; size: number; weight: number; color: string; ls: number}> = ({s, at, top, size, weight, color, ls}) => (
    <div style={{position: 'absolute', top, width: '100%', textAlign: 'center', fontFamily: 'Poppins', fontWeight: weight, fontSize: size, letterSpacing: `${ls}em`, marginLeft: `${ls / 2}em`, color, whiteSpace: 'pre'}}>
      {s.split('').map((ch, i) => {
        const k = interpolate(t, [at + i * 0.025, at + i * 0.025 + 0.28], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
        return <span key={i} style={{display: 'inline-block', opacity: k, transform: `translateY(${(1 - k) * 20}px)`}}>{ch}</span>;
      })}
    </div>
  );
  return (
    <AbsoluteFill style={{background: C.silver}}>
      {POLKA.map((p, i) => {
        const k = interpolate(t, [0.05 + rand(i) * 0.5, 0.35 + rand(i) * 0.5], [0, 1], {...clamp, easing: Easing.out(Easing.back(2))});
        return <div key={i} style={{position: 'absolute', left: p.x - 13, top: p.y - 13, width: 26, height: 26, borderRadius: '50%', background: C.brown, opacity: 0.85, transform: `scale(${k})`}} />;
      })}
      {/* kawasan logo bersih: corak cuma nampak di tepi */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse 78% 46% at 50% 47%, ${C.silver} 70%, rgba(216,216,216,0) 100%)`}} />
      <svg viewBox={`0 0 ${LOGO_VIEWBOX.w} ${LOGO_VIEWBOX.h}`} style={{position: 'absolute', width: LOGO_W * 1.0, height: LOGO_H, left: W / 2 - LOGO_W / 2 + 0, top: cy - LOGO_H / 2, overflow: 'visible', transform: 'scale(1.32)'}}>
        {LOGO_LETTERS.map((L, i) => {
          const t0 = 0.25 + i * step;
          const k = pop(t0, 0.4);
          const o = interpolate(t, [t0, t0 + 0.1], [0, 1], clamp);
          const els = LOGO_ELS.filter((e) => e.letter === L);
          return (
            <g key={L}>
              <g style={{opacity: o, transform: `translateY(${(1 - k) * 34}px) scale(${0.35 + 0.65 * k})`, transformBox: 'fill-box', transformOrigin: '50% 100%'}}>
                {els.filter((e) => !e.dot).map((e, j) => <LogoShape key={j} e={e} />)}
              </g>
              {els.filter((e) => e.dot).map((e, j) => {
                const d = pop(t0 + 0.12 + DOT_ORDER.get(e)! * 0.014, 0.22, 2.2);
                return d <= 0 ? null : <LogoShape key={`d${j}`} e={e} style={{transform: `scale(${d})`, transformBox: 'fill-box', transformOrigin: 'center'}} />;
              })}
            </g>
          );
        })}
      </svg>
      <Line s={LINE1} at={txtAt} top={1080} size={54} weight={600} color={C.brown} ls={0.42} />
      <Line s={LINE2} at={txtAt + 0.3} top={1160} size={82} weight={700} color={C.red} ls={0.12} />
    </AbsoluteFill>
  );
};

const FINE = Array.from({length: 150}, (_, i) => ({x: rand(i + 300) * W, y: rand(i + 700) * H, d: 10 + rand(i + 900) * 8}));
const NAF_CIRCLES = [
  {x: 60, y: 220, d: 420, color: C.olive, inAt: 0.0},
  {x: 1030, y: 1720, d: 480, color: C.tan, inAt: 0.15},
  {x: 960, y: 170, d: 200, color: C.tan, inAt: 0.3},
  {x: 160, y: 1760, d: 240, color: C.olive, inAt: 0.45},
];
const NafesaEnd: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const o = interpolate(t, [0.2, 0.8], [0, 1], clamp);
  return (
    <AbsoluteFill style={{background: C.cream}}>
      {FINE.map((p, i) => {
        const s = interpolate(t - i * 0.004, [0, 0.4], [0, 1], clamp);
        return <div key={i} style={{position: 'absolute', left: p.x, top: p.y, width: p.d, height: p.d, borderRadius: '50%', background: C.olive, opacity: 0.16, transform: `scale(${s})`}} />;
      })}
      {NAF_CIRCLES.map((c, i) => {
        const tt = t - c.inAt;
        const s = tt <= 0 ? 0 : tt < 0.22 ? interpolate(tt, [0, 0.22], [0, 1.1], {easing: Easing.out(Easing.cubic)}) : interpolate(tt, [0.22, 0.38], [1.1, 1], clamp);
        return s <= 0 ? null : <div key={i} style={{position: 'absolute', left: c.x - c.d / 2, top: c.y - c.d / 2, width: c.d, height: c.d, borderRadius: '50%', background: c.color, transform: `scale(${s})`}} />;
      })}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', paddingBottom: 200}}>
        <Img src={a('nafesa-olive.png')} style={{width: 1300, opacity: o}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const fontCss = `
@font-face{font-family:'Poppins';src:url('${a('Poppins-Bold.ttf')}') format('truetype');font-weight:700;}
@font-face{font-family:'Poppins';src:url('${a('Poppins-SemiBold.ttf')}') format('truetype');font-weight:600;}
@font-face{font-family:'Poppins';src:url('${a('Poppins-Medium.ttf')}') format('truetype');font-weight:500;}`;

export const JoyClubTeaser: React.FC = () => {
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <style>{fontCss}</style>
      {SHOTS.map((s, i) => {
        const pad = 0.3;
        const from = Math.max(0, fr(B(s.k0) - pad));
        const startFrame = Math.max(0, Math.round((s.off - (B(s.k0) - from / FPS)) * FPS));
        const endT = B(s.k1) + pad;
        return (
          <Sequence key={i} from={from} durationInFrames={fr(endT) - from}>
            <ShotLayer i={i} from={from} startFrame={startFrame} />
          </Sequence>
        );
      })}
      {SHOTS.map((s, i) => (s.tr?.type === 'dots' ? <Sweep key={`sw${i}`} at={B(s.k0)} color={s.tr.color!} second={C.red} /> : null))}
      {SHOTS.map((s, i) => (s.tr?.type === 'flash' ? <Flash key={`fl${i}`} at={B(s.k0)} /> : null))}
      <Panes />
      <Sweep at={PANE_START} color={C.pearl} second={C.blue} />
      {NAMES.map((n) => <NameCard key={n.d} {...n} />)}
      <Sequence from={fr(END1)} durationInFrames={fr(END2 - END1) + 2}>
        <JoyClubEnd />
      </Sequence>
      <Sweep at={END1} color={C.silver} second={C.blue} />
      <Sequence from={fr(END2)}>
        <NafesaEnd />
      </Sequence>
      <Sweep at={END2} color={C.cream} second={C.olive} />
      <Audio src={a('song31.m4a')} />
    </AbsoluteFill>
  );
};

