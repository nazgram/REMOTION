import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, delayRender, continueRender} from 'remotion';
import {FONT64} from './fonts64';
import {VO_MAP} from './voMap';
import {CAPS} from './caps';

// NAFESA — "Raya Is Your Opportunity" 9:16. v2 (Nas 25/11): tiada lagu, jeda VO dipotong, typografi bermotion.
export const FPS = 30;
export const W = 1080;
export const H = 1920;

// ---------- garis masa ----------
// Semua masa "lama" (v1: LEAD 0.8 + jeda 0.5 antara babak) dipetakan ke garis masa baru yang rapat.
const OLD_LEAD = 0.8;
const OLD_GAP = 0.5;
const OLD_END = 47.9;
const VO_CUTS = [0, 3.39, 10.3, 14.6, 20.7, 26.65, 33.05, 38.8, 43.73];
const OV = [0, 0, ...[1, 2, 3, 4, 5, 6, 7].map((k) => OLD_LEAD + VO_CUTS[k] + OLD_GAP * k)]; // OV[k] = mula babak k (v1)
export const LEAD = 0.4;
const mVO = (t: number) => {
  for (const [s, e, n] of VO_MAP) {
    if (t < s) return n;
    if (t <= e) return n + (t - s);
  }
  const l = VO_MAP[VO_MAP.length - 1];
  return l[2] + (t - l[0]);
};
const vt = (tvo: number) => LEAD + mVO(tvo); // masa VO asal -> masa komposisi
const ot = (T: number) => {
  if (T < OLD_LEAD) return (T * LEAD) / OLD_LEAD;
  let k = 1;
  for (let j = 2; j <= 8; j++) if (T >= OV[j] - 1e-6) k = j;
  let tvo = T - OLD_LEAD - OLD_GAP * (k - 1);
  if (k < 8) tvo = Math.min(tvo, VO_CUTS[k]);
  return vt(tvo);
};
export const END_CARD = vt(43.53) + 0.5;
export const TOTAL = END_CARD + 2.8;
const om = (T: number) => (T >= OLD_END - 1e-6 ? END_CARD : ot(T));
const V = OV.map((x, i) => (i < 2 ? 0 : ot(x)));

const C = {olive: '#5E673D', deep: '#42482E', gold: '#B89674', cream: '#F2ECE4', tan: '#BCA893', char: '#473B34', white: '#FFFFFF'};
const GOLD = '#E3C9A6';
const fr = (s: number) => Math.round(s * FPS);
const a = (p: string) => staticFile(`raya/${p}`);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const OUT = Easing.out(Easing.cubic);
const BACK = Easing.out(Easing.back(1.7));
const EXPO = Easing.out(Easing.exp);
const ELASTIC = Easing.out(Easing.elastic(1.1));
const rnd = (n: number) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// ---------- fonts ----------
const FONTS: [string, string, string][] = [
  ['Dream Avenue', 'DreamAvenue', '400'],
  ['Poppins', 'Poppins-Regular', '400'],
  ['Poppins', 'Poppins-Medium', '500'],
  ['Poppins', 'Poppins-SemiBold', '600'],
  ['Poppins', 'Poppins-Bold', '700'],
  ['Poppins', 'Poppins-ExtraBold', '800'],
];
let fontsP: Promise<unknown> | null = null;
const loadFonts = () => {
  if (!fontsP) {
    const all = Promise.all(FONTS.map(([fam, f, wt]) => new FontFace(fam, `url(data:font/ttf;base64,${FONT64[f]})`, {weight: wt}).load().then((ff) => document.fonts.add(ff))));
    fontsP = Promise.race([all, new Promise((r) => setTimeout(r, 15000))]).catch(() => null);
  }
  return fontsP;
};
const useFonts = () => {
  const [h] = React.useState(() => delayRender('fonts', {timeoutInMilliseconds: 60000}));
  React.useEffect(() => {
    loadFonts().then(() => continueRender(h));
  }, [h]);
};
const DREAM = '"Dream Avenue", serif';
const POP = 'Poppins, sans-serif';

// ---------- footage (masa v1, dipetakan di bawah) ----------
type Shot = {id: string; from: number; to: number; off?: number; z?: number; ox?: number; oy?: number};
const SHOTS_OLD: Shot[] = [
  {id: 'S1a', from: 2.2, to: 2.85, off: 0.6},
  {id: 'S1b', from: 2.85, to: 3.5, off: 0.6},
  {id: 'S1c', from: 3.5, to: 4.1, off: 0.8},
  {id: 'S1d', from: 4.1, to: OV[2], off: 0.6},
  {id: 'S2a', from: OV[2], to: 6.45, off: 0.2},
  {id: 'S2b', from: 6.45, to: 9.6, off: 0.3},
  {id: 'S2c', from: 9.6, to: OV[3], off: 0.4},
  {id: 'S3a', from: OV[3], to: 13.3, off: 0.0},
  {id: 'S4a', from: OV[4], to: 19.53, off: 0.3},
  {id: 'S4b', from: 19.53, to: 20.17, off: 0.6},
  {id: 'S4c', from: 20.17, to: 21.06, off: 0.6},
  {id: 'J4', from: 21.06, to: 22.04, off: 0.5},
  {id: 'J5', from: OV[5], to: 25.87, off: 0.3},
  {id: 'V1', from: 25.87, to: 26.97, off: 0.5},
  {id: 'V2', from: 26.97, to: 28.32, off: 0.8},
  {id: 'A1', from: 28.32, to: 29.12, off: 0.8},
  {id: 'B1', from: 29.12, to: OV[6], off: 0.8},
  {id: 'R2', from: OV[6], to: 33.5, off: 0.3},
  {id: 'V4', from: 33.5, to: OV[7], off: 0.3},
  {id: 'S7a', from: OV[7], to: 38.09, off: 0.4},
  {id: 'S7c', from: 38.09, to: 39.71, off: 0.3},
  {id: 'J7m', from: 39.71, to: 40.47, off: 0.5},
  {id: 'J7r', from: 40.47, to: 41.45, off: 0.6},
  {id: 'S7e', from: 41.45, to: OV[8], off: 0.3},
  {id: 'S8a', from: OV[8], to: 44.6, off: 0.3},
  {id: 'J8', from: 44.6, to: 45.42, off: 0.6},
  {id: 'S8c', from: 45.42, to: 46.41, off: 0.5},
  {id: 'S8d', from: 46.41, to: OLD_END, off: 0.3},
];
const AI_IDS = ['A1', 'B1', 'R2', 'V4'];
export const SHOTS: Shot[] = (() => {
  const out: Shot[] = [];
  for (const s of SHOTS_OLD) {
    const n = {...s, from: om(s.from), to: om(s.to)};
    const prev = out[out.length - 1];
    if (n.to - n.from < 0.3 && prev && Math.abs(prev.to - n.from) < 0.01) prev.to = n.to; // terlalu pendek selepas jeda dibuang: sambung shot sebelum
    else out.push(n);
  }
  return out;
})();

const ShotLayer: React.FC<{s: Shot}> = ({s}) => {
  const f = useCurrentFrame();
  const dur = fr(s.to) - fr(s.from);
  const drift = interpolate(f, [0, dur], [0, 0.04], clamp);
  const punch = interpolate(f, [0, 6], [1.07, 1], {...clamp, easing: OUT});
  const src = AI_IDS.includes(s.id) ? a(`clips/ai_${s.id}.mp4`) : a(`clips/${s.id}.mp4`);
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
      <AbsoluteFill style={{transform: `scale(${((s.z ?? 1) + drift) * punch})`, transformOrigin: `${s.ox ?? 50}% ${s.oy ?? 40}%`}}>
        <OffthreadVideo src={src} startFrom={fr(s.off ?? 0)} muted style={{width: W, height: H, objectFit: 'cover', filter: 'saturate(1.03) contrast(1.04) brightness(1.02)'}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- tekstur anyaman ----------
const Pattern: React.FC<{color: string; opacity: number}> = ({color, opacity}) => (
  <AbsoluteFill style={{opacity}}>
    <svg width={W} height={H}>
      <defs>
        <pattern id={`anyam-${color}`} width="90" height="90" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 22 H90 M0 68 H90" stroke={color} strokeWidth="2" />
          <path d="M22 0 V90 M68 0 V90" stroke={color} strokeWidth="2" />
          <path d="M22 22 L45 45 L68 22 M22 68 L45 45 L68 68" stroke={color} strokeWidth="1" fill="none" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={`url(#anyam-${color})`} />
    </svg>
  </AbsoluteFill>
);
const Card: React.FC<{bg: string; pat: string; patO?: number; children?: React.ReactNode}> = ({bg, pat, patO = 0.13, children}) => (
  <AbsoluteFill style={{background: bg}}>
    <Pattern color={pat} opacity={patO} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 42%, rgba(255,255,255,0.0) 40%, rgba(0,0,0,0.10) 100%)'}} />
    {children}
  </AbsoluteFill>
);
const Crescent: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <path d="M62 8 A44 44 0 1 0 92 70 A36 36 0 1 1 62 8 Z" fill={color} />
    <path d="M78 22 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" fill={color} />
  </svg>
);
// berlian kecil terapung (sentuhan ketupat) untuk kad
const Diamonds: React.FC<{n: number; color: string; opacity: number; seed: number}> = ({n, color, opacity, seed}) => {
  const t = useT();
  return (
    <AbsoluteFill style={{opacity}}>
      {Array.from({length: n}).map((_, i) => {
        const x = rnd(seed + i) * W;
        const sp = 40 + rnd(seed + i + 50) * 90;
        const y = ((rnd(seed + i + 100) * (H + 200) - t * sp) % (H + 200) + H + 200) % (H + 200) - 100;
        const s = 12 + rnd(seed + i + 150) * 30;
        const r = 45 + t * (rnd(seed + i + 200) - 0.5) * 120;
        const fill = rnd(seed + i + 250) > 0.5;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, transform: `rotate(${r}deg)`, border: `3px solid ${color}`, background: fill ? color : 'transparent'}} />;
      })}
    </AbsoluteFill>
  );
};

// ---------- pembantu ----------
const useT = () => useCurrentFrame() / FPS; // saat sejak mula Sequence
const prog = (t: number, at: number, d: number, e = OUT) => interpolate(t, [at, at + d], [0, 1], {...clamp, easing: e});
const shadow = '0 4px 24px rgba(0,0,0,0.38)';
const Scrim: React.FC = () => <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(30,26,22,0.45) 76%, rgba(30,26,22,0.58) 100%)'}} />;

// ---------- typografi kinetik ----------
type Anim = 'letterPop' | 'flip' | 'wave' | 'typewriter' | 'decode' | 'drop' | 'cascade' | 'slam' | 'stamp' | 'skewL' | 'skewR' | 'trackIn' | 'maskUp' | 'split' | 'zoomSpin' | 'elastic' | 'outline' | 'grow';
type KP = {text: string; anim: Anim; at?: number; y: number; size: number; font?: 'dream' | 'pop'; color?: string; gold?: string; ls?: number; weight?: number; sh?: boolean; st?: number};
const SCRAMBLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const KText: React.FC<KP> = ({text, anim, at = 0, y, size, font = 'pop', color = C.white, gold, ls = 0.02, weight = 800, sh = true, st = 0.035}) => {
  const t = useT();
  const frame = useCurrentFrame();
  if (t < at - 0.001 && anim !== 'outline') return null;
  const gs = gold ? text.indexOf(gold) : -1;
  const isGold = (i: number) => gs >= 0 && i >= gs && i < gs + (gold?.length ?? 0);
  const chars = text.split('');
  const base: React.CSSProperties = {fontFamily: font === 'dream' ? DREAM : POP, fontWeight: font === 'dream' ? 400 : weight, fontSize: size, lineHeight: 1.08, color, letterSpacing: `${ls}em`, textShadow: sh ? shadow : 'none', whiteSpace: 'pre', display: 'inline-block'};
  const life = 1 + 0.03 * Math.max(0, t - at); // terus bergerak perlahan selepas masuk
  const L = (fn: (i: number) => React.CSSProperties, content?: (ch: string, i: number) => string) =>
    chars.map((ch, i) => (
      <span key={i} style={{display: 'inline-block', color: isGold(i) ? GOLD : undefined, ...fn(i)}}>
        {content ? content(ch, i) : ch === ' ' ? ' ' : ch}
      </span>
    ));
  let inner: React.ReactNode = text;
  let tf = '';
  let extra: React.CSSProperties = {};
  const goldify = () => (gs >= 0 ? L(() => ({})) : text);
  switch (anim) {
    case 'letterPop':
      inner = L((i) => {
        const q = prog(t, at + i * st, 0.3, BACK);
        return {transform: `translateY(${(1 - q) * 70}px) scale(${q})`, opacity: Math.min(1, q * 2)};
      });
      break;
    case 'flip':
      inner = L((i) => {
        const q = prog(t, at + i * st, 0.42, BACK);
        return {transform: `perspective(700px) rotateX(${(1 - q) * -100}deg)`, transformOrigin: '50% 100%', opacity: t >= at + i * st ? 1 : 0};
      });
      break;
    case 'wave':
      inner = L((i) => {
        const q = prog(t, at + i * st, 0.4, BACK);
        return {transform: `translateY(${(1 - q) * 90 + Math.sin((t - at) * 5 - i * 0.55) * 6 * q}px)`, opacity: Math.min(1, q * 2)};
      });
      break;
    case 'typewriter': {
      const n = Math.min(chars.length, Math.floor((t - at) / 0.04) + 1);
      inner = (
        <>
          {L((i) => ({opacity: i < n ? 1 : 0}))}
          <span style={{display: 'inline-block', width: '0.08em', height: '0.9em', marginLeft: '-0.04em', verticalAlign: '-0.08em', background: color, opacity: t - at < chars.length * 0.04 + 0.5 && Math.floor(frame / 6) % 2 === 0 ? 1 : 0}} />
        </>
      );
      break;
    }
    case 'decode':
      inner = L(
        (i) => ({opacity: t >= at + i * 0.03 ? 1 : 0, color: t < at + i * 0.03 + 0.24 ? GOLD : isGold(i) ? GOLD : undefined}),
        (ch, i) => (ch === ' ' ? ' ' : ch === '.' || t >= at + i * 0.03 + 0.24 ? ch : SCRAMBLE[Math.floor(rnd(i * 31 + Math.floor(frame / 2)) * 26)]),
      );
      break;
    case 'drop':
      inner = L((i) => {
        const q = prog(t, at + i * st, 0.55, Easing.bounce);
        return {transform: `translateY(${(1 - q) * -280}px)`, opacity: t >= at + i * st ? 1 : 0};
      });
      break;
    case 'cascade':
      inner = L((i) => {
        const q = prog(t, at + i * st, 0.28, OUT);
        return {transform: `scale(${3 - 2 * q})`, opacity: q, filter: `blur(${(1 - q) * 8}px)`};
      });
      break;
    case 'slam': {
      const q = prog(t, at, 0.2, EXPO);
      tf = `scale(${2.6 - 1.6 * q})`;
      extra = {opacity: Math.min(1, q * 4)};
      inner = goldify();
      break;
    }
    case 'stamp': {
      const q = prog(t, at, 0.26, BACK);
      tf = `scale(${1.9 - 0.9 * q}) rotate(${-16 + 12 * q}deg)`;
      extra = {opacity: Math.min(1, q * 3)};
      inner = goldify();
      break;
    }
    case 'skewL':
    case 'skewR': {
      const q = prog(t, at, 0.38, BACK);
      const d = anim === 'skewL' ? -1 : 1;
      tf = `translateX(${(1 - q) * 900 * d}px) skewX(${(1 - q) * 30 * -d}deg)`;
      inner = goldify();
      break;
    }
    case 'trackIn': {
      const q = prog(t, at, 0.55, OUT);
      extra = {letterSpacing: `${ls + (1 - q) * 0.7}em`, opacity: q, filter: `blur(${(1 - q) * 10}px)`};
      inner = goldify();
      break;
    }
    case 'maskUp':
      inner = text.split(' ').map((w, wi) => {
        const q = prog(t, at + wi * 0.09, 0.36, BACK);
        return (
          <span key={wi} style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', padding: '0 0.04em 0.08em'}}>
            <span style={{display: 'inline-block', transform: `translateY(${(1 - q) * 115}%)`}}>{w}</span>
            {wi < text.split(' ').length - 1 ? ' ' : ''}
          </span>
        );
      });
      break;
    case 'split': {
      const q = prog(t, at, 0.36, OUT);
      inner = (
        <span style={{position: 'relative', display: 'inline-block'}}>
          <span style={{display: 'inline-block', clipPath: 'inset(0 0 50% 0)', transform: `translateX(${(1 - q) * -700}px)`}}>{text}</span>
          <span style={{position: 'absolute', left: 0, top: 0, clipPath: 'inset(50% 0 0 0)', transform: `translateX(${(1 - q) * 700}px)`}}>{text}</span>
        </span>
      );
      break;
    }
    case 'zoomSpin': {
      const q = prog(t, at, 0.45, BACK);
      tf = `scale(${q}) rotate(${(1 - q) * -200}deg)`;
      inner = goldify();
      break;
    }
    case 'elastic': {
      const q = prog(t, at, 0.7, ELASTIC);
      tf = `scaleX(${0.15 + 0.85 * q}) scaleY(${1.7 - 0.7 * q})`;
      inner = goldify();
      break;
    }
    case 'outline': {
      if (t < at) return null;
      const q1 = prog(t, at, 0.3, OUT);
      const q2 = prog(t, at + 0.3, 0.35, OUT);
      extra = {letterSpacing: `${ls + (1 - q1) * 0.4}em`, opacity: q1};
      inner = (
        <span style={{position: 'relative', display: 'inline-block'}}>
          <span style={{color: 'transparent', WebkitTextStroke: `3px ${color}`, textShadow: 'none'}}>{text}</span>
          <span style={{position: 'absolute', left: 0, top: 0, clipPath: `inset(0 ${(1 - q2) * 100}% 0 0)`}}>{text}</span>
        </span>
      );
      break;
    }
    case 'grow': {
      const q = prog(t, at, 0.45, BACK);
      tf = `translateY(${(1 - q) * 120}px) scale(${0.2 + 0.8 * q})`;
      extra = {opacity: Math.min(1, q * 2), transformOrigin: '50% 100%'};
      inner = goldify();
      break;
    }
  }
  return (
    <div style={{position: 'absolute', top: y, left: 0, width: W, textAlign: 'center', transform: `scale(${life})`}}>
      <span style={{...base, transform: tf || undefined, ...extra}}>{inner}</span>
    </div>
  );
};

// letupan berlian emas pada perkataan kuat
const Burst: React.FC<{at: number; x?: number; y: number; color?: string; R?: number}> = ({at, x = W / 2, y, color = GOLD, R = 300}) => {
  const t = useT();
  const q = prog(t, at, 0.6, OUT);
  if (t < at || q >= 1) return null;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: x - R * q, top: y - R * q, width: 2 * R * q, height: 2 * R * q, borderRadius: '50%', border: `${8 * (1 - q)}px solid ${color}`, opacity: 1 - q}} />
      {Array.from({length: 10}).map((_, i) => {
        const ang = (i / 10) * Math.PI * 2 + 0.3;
        const r = R * 1.15 * q;
        const s = 26 * (1 - q * 0.6);
        return <div key={i} style={{position: 'absolute', left: x + Math.cos(ang) * r - s / 2, top: y + Math.sin(ang) * r - s / 2, width: s, height: s, background: color, transform: `rotate(45deg)`, opacity: 1 - q}} />;
      })}
    </AbsoluteFill>
  );
};

// tajuk atas footage: baris kecil + baris besar, setiap satu animasi sendiri
const Hero: React.FC<{small?: string; sAnim?: Anim; big: string; bAnim: Anim; font?: 'dream' | 'pop'; size?: number; y?: number; gold?: string; burst?: boolean}> = ({small, sAnim = 'trackIn', big, bAnim, font = 'pop', size, y = 1180, gold, burst}) => {
  const bs = size ?? (font === 'dream' ? 132 : 104);
  const by = small ? y + 62 : y;
  const bat = small ? 0.12 : 0;
  return (
    <AbsoluteFill>
      <Scrim />
      {small && <KText text={small} anim={sAnim} y={y} size={46} weight={700} ls={0.12} color={C.cream} />}
      <KText text={big} anim={bAnim} at={bat} y={by} size={bs} font={font} gold={gold} />
      {burst && <Burst at={bat + 0.18} y={by + bs * 0.55} />}
    </AbsoluteFill>
  );
};

// ---------- sari kata bergerak (perkataan ikut VO) ----------
const CAP_LINES = CAPS.map((ws, i) => {
  const from = vt(ws[0][1]) - 0.08;
  const nextFrom = i < CAPS.length - 1 ? vt(CAPS[i + 1][0][1]) - 0.08 : 1e9;
  const to = Math.min(nextFrom, vt(ws[ws.length - 1][2]) + 0.2);
  return {from, to, words: ws.map(([w, s, e]) => ({w, s: vt(s), e: vt(e)}))};
});
const CapLine: React.FC<{from: number; words: {w: string; s: number; e: number}[]}> = ({from, words}) => {
  const T = useT() + from;
  return (
    <div style={{position: 'absolute', left: 90, right: 90, top: 1398, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: 18, rowGap: 2}}>
      {words.map((x, i) => {
        const q = prog(T, x.s - 0.03, 0.18, BACK);
        const act = T >= x.s - 0.03 && T <= x.e + 0.05;
        return (
          <span key={i} style={{display: 'inline-block', fontFamily: POP, fontWeight: 700, fontSize: 40, lineHeight: 1.3, color: act ? GOLD : C.white, textShadow: '0 3px 14px rgba(0,0,0,0.55)', opacity: q > 0 ? 1 : 0, transform: `translateY(${(1 - q) * 22}px) scale(${(0.6 + 0.4 * q) * (act ? 1.08 : 1)})`}}>
            {x.w}
          </span>
        );
      })}
    </div>
  );
};

// ---------- Babak 1: HI NAFESIANS ----------
const HiCard: React.FC = () => {
  const t = useT();
  const cres = prog(t, 0.08, 0.5, BACK);
  const line = prog(t, LEAD + 0.5, 0.4, OUT);
  return (
    <Card bg={C.cream} pat={C.gold}>
      <Diamonds n={16} color={C.gold} opacity={0.22} seed={7} />
      <div style={{position: 'absolute', top: 470, width: W, textAlign: 'center', transform: `scale(${cres}) rotate(${(1 - cres) * -90}deg)`}}>
        <Crescent size={110} color={C.gold} />
      </div>
      <KText text="HI" anim="zoomSpin" at={LEAD - 0.05} y={640} size={120} weight={700} ls={0.08} color={C.olive} sh={false} />
      <KText text="NAFESIANS!" anim="flip" at={LEAD + 0.28} y={800} size={158} font="dream" color={C.olive} sh={false} st={0.04} />
      <div style={{position: 'absolute', top: 1010, left: 340, width: 400, height: 4, background: C.gold, transform: `scaleX(${line})`}} />
    </Card>
  );
};

// ---------- Babak 2: chat + negara ----------
const Bubble: React.FC<{text: string; at: number; y: number; side: 'in' | 'out'}> = ({text, at, y, side}) => {
  const t = useT();
  const p = prog(t, at, 0.35, BACK);
  if (t < at) return null;
  const isIn = side === 'in';
  const bob = Math.sin((t - at) * 3) * 4;
  return (
    <div style={{position: 'absolute', top: y + bob, [isIn ? 'left' : 'right']: 70, maxWidth: 760, transform: `scale(${p}) rotate(${(1 - p) * (isIn ? -8 : 8)}deg)`, transformOrigin: isIn ? '0% 100%' : '100% 100%'}}>
      <div style={{fontFamily: POP, fontWeight: 500, fontSize: 40, lineHeight: 1.3, color: isIn ? C.char : C.cream, background: isIn ? 'rgba(255,255,255,0.96)' : C.olive, padding: '22px 30px', borderRadius: 34, [isIn ? 'borderBottomLeftRadius' : 'borderBottomRightRadius']: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.18)'}}>{text}</div>
    </div>
  );
};
const Typing: React.FC<{at: number; until: number; y: number}> = ({at, until, y}) => {
  const t = useT();
  if (t < at || t > until) return null;
  return (
    <div style={{position: 'absolute', top: y, right: 70, background: C.olive, borderRadius: 34, borderBottomRightRadius: 8, padding: '26px 30px', display: 'flex', gap: 12}}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{width: 16, height: 16, borderRadius: 8, background: C.cream, transform: `translateY(${-Math.abs(Math.sin((t - at) * 6 - i * 0.7)) * 8}px)`}} />
      ))}
    </div>
  );
};
const Countries: React.FC<{base: number}> = ({base}) => (
  <AbsoluteFill>
    <Scrim />
    <KText text="MALAYSIA" anim="skewL" at={ot(6.54) - base} y={1000} size={84} ls={0.14} />
    <KText text="SINGAPORE" anim="skewR" at={ot(7.32) - base} y={1130} size={84} ls={0.14} />
    <KText text="BRUNEI" anim="stamp" at={ot(8.25) - base} y={1260} size={84} ls={0.14} />
    <Burst at={ot(8.25) - base + 0.15} y={1305} R={240} />
  </AbsoluteFill>
);

// ---------- Babak 3: freeze + cutout + YOU ----------
const YouFreeze: React.FC<{pillAt: number}> = ({pillAt}) => {
  const t = useT();
  const bg = prog(t, 0, 0.2, OUT);
  const flash = interpolate(t, [0, 0.16], [0.85, 0], clamp);
  const pill = prog(t, pillAt, 0.6, ELASTIC);
  return (
    <AbsoluteFill>
      <Img src={a('img/s3a_freeze.png')} style={{width: W, height: H, objectFit: 'cover'}} />
      <AbsoluteFill style={{opacity: bg}}>
        <Card bg={C.cream} pat={C.gold} />
        <Diamonds n={12} color={C.gold} opacity={0.2} seed={31} />
      </AbsoluteFill>
      <KText text="YOU" anim="slam" at={0.03} y={170} size={400} font="dream" color={C.olive} sh={false} />
      <Burst at={0.2} y={370} R={420} color={C.gold} />
      <Img src={a('img/s3a_cut.png')} style={{position: 'absolute', width: W, height: H, objectFit: 'cover', transform: `scale(${1.0 + 0.03 * t})`, transformOrigin: '50% 100%'}} />
      <KText text="YES, THAT'S YOU!" anim="typewriter" at={0.2} y={70} size={52} weight={700} ls={0.1} color={C.char} sh={false} />
      <div style={{position: 'absolute', top: 1235, width: W, textAlign: 'center', opacity: t >= pillAt ? 1 : 0, transform: `scaleX(${0.2 + 0.8 * pill}) scaleY(${1.5 - 0.5 * pill})`}}>
        <span style={{display: 'inline-block', background: C.olive, border: `3px solid ${C.gold}`, borderRadius: 60, padding: '22px 44px', fontFamily: POP, fontWeight: 700, fontSize: 44, letterSpacing: '0.08em', color: C.cream}}>
          AUTHORISED <span style={{color: GOLD}}>NAFESA</span> AGENTS
        </span>
      </div>
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
    </AbsoluteFill>
  );
};

// ---------- Babak 4: SELL IT! ----------
const Marquee: React.FC<{y: number; dir: 1 | -1}> = ({y, dir}) => {
  const t = useT();
  const x = ((t * 260 * dir) % 820) - 820;
  return (
    <div style={{position: 'absolute', top: y, left: x, whiteSpace: 'nowrap', fontFamily: POP, fontWeight: 800, fontSize: 170, color: 'transparent', WebkitTextStroke: `2px ${GOLD}`, opacity: 0.32}}>
      {'SELL IT! SELL IT! SELL IT! SELL IT! '}
    </div>
  );
};
const SellCard: React.FC = () => {
  const t = useT();
  const flash = interpolate(t, [0, 0.14], [0.6, 0], clamp);
  return (
    <Card bg={C.olive} pat={C.gold} patO={0.12}>
      <Marquee y={300} dir={1} />
      <Marquee y={1100} dir={-1} />
      <KText text="SHARE · TALK · INTRODUCE" anim="trackIn" at={0.15} y={640} size={38} weight={600} ls={0.3} color={C.cream} sh={false} />
      <KText text="SELL IT!" anim="slam" at={0} y={720} size={230} color={GOLD} sh={false} />
      <Burst at={0.18} y={840} R={460} />
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
    </Card>
  );
};

// ---------- Kad akhir: logo NAFESA sahaja ----------
const EndCard: React.FC = () => {
  const t = useT();
  const bg = prog(t, 0, 0.35, OUT);
  const logo = prog(t, 0.25, 0.7, BACK);
  const sweep = interpolate(t, [1.0, 1.8], [-0.4, 1.4], clamp);
  const LW = 560;
  const LH = Math.round((560 * 975) / 1400);
  const box: React.CSSProperties = {position: 'absolute', top: (H - LH) / 2 - 60, left: (W - LW) / 2, width: LW, height: LH};
  return (
    <AbsoluteFill style={{opacity: bg, background: C.olive}}>
      <div style={{...box, opacity: Math.min(1, logo * 1.5), transform: `scale(${0.75 + 0.25 * logo})`}}>
        <Img src={a('img/logo_gold.png')} style={{width: LW}} />
        <div style={{position: 'absolute', inset: 0, WebkitMaskImage: `url(${a('img/logo_gold.png')})`, WebkitMaskSize: '100% 100%', background: `linear-gradient(105deg, transparent ${sweep * 100 - 12}%, rgba(255,255,255,0.75) ${sweep * 100}%, transparent ${sweep * 100 + 12}%)`}} />
      </div>
    </AbsoluteFill>
  );
};

// ---------- susunan tindanan (masa v1, dipetakan) ----------
type Ov = {from: number; to: number; el: (base: number) => React.ReactNode};
const OVERLAYS_OLD: Ov[] = [
  {from: 2.88, to: OV[2], el: () => (
    <AbsoluteFill>
      <Scrim />
      <KText text="RAYA" anim="slam" y={1000} size={210} font="dream" color={GOLD} />
      <Burst at={0.18} y={1115} />
    </AbsoluteFill>
  )},
  {from: 3.3, to: OV[2], el: () => <KText text="IS COMING!" anim="maskUp" y={1235} size={92} />},
  {from: OV[2], to: 6.45, el: (b) => (
    <AbsoluteFill>
      <Scrim />
      <Bubble side="in" text="Where can I get Nafesa?" at={ot(OV[2] + 0.21) - b} y={900} />
      <Bubble side="in" text="Still available?" at={ot(OV[2] + 0.75) - b} y={1050} />
      <Bubble side="in" text="How do I order?" at={ot(OV[2] + 1.25) - b} y={1200} />
    </AbsoluteFill>
  )},
  {from: 6.45, to: 11.7, el: (b) => <Countries base={b} />},
  {from: 19.53, to: 20.17, el: () => <Hero big="SHARE IT." bAnim="flip" />},
  {from: 20.17, to: 21.06, el: () => <Hero big="TALK ABOUT IT." bAnim="split" size={96} />},
  {from: 21.06, to: 22.04, el: () => <Hero big="INTRODUCE IT." bAnim="decode" size={96} />},
  {from: 25.87, to: 26.97, el: () => <Hero small="YOUR" sAnim="trackIn" big="BEST FRIEND." bAnim="letterPop" font="dream" />},
  {from: 26.97, to: 28.32, el: () => <Hero small="YOUR" sAnim="typewriter" big="COLLEAGUE." bAnim="wave" font="dream" />},
  {from: 28.32, to: OV[6], el: () => <Hero small="YOUR" sAnim="skewR" big="NEIGHBOUR." bAnim="drop" font="dream" />},
  {from: OV[6], to: 33.5, el: (b) => (
    <AbsoluteFill>
      <Bubble side="out" text="Hi dear! Nafesa's Raya collection is here!" at={ot(OV[6] + 0.3) - b} y={760} />
      <Typing at={ot(OV[6] + 1.2) - b} until={ot(OV[6] + 2.1) - b} y={930} />
      <Bubble side="out" text="Want me to send you the catalogue?" at={ot(OV[6] + 2.1) - b} y={930} />
    </AbsoluteFill>
  )},
  {from: 30.83, to: 33.5, el: () => <Hero small="NO PHYSICAL" sAnim="typewriter" big="SHOP NEEDED." bAnim="stamp" font="dream" y={1150} />},
  {from: 34.99, to: OV[7], el: () => <Hero small="JUST START" sAnim="skewL" big="REACHING OUT." bAnim="outline" font="dream" />},
  {from: 38.09, to: 39.71, el: () => <Hero small="THIS IS YOUR" sAnim="trackIn" big="OPPORTUNITY." bAnim="elastic" font="dream" burst />},
  {from: 41.45, to: OV[8], el: () => <Hero big="BE PART OF IT!" bAnim="cascade" />},
  {from: 44.6, to: 45.42, el: () => <Hero big="LET'S SELL." bAnim="slam" />},
  {from: 45.42, to: 46.41, el: () => <Hero big="LET'S GROW." bAnim="grow" />},
  {from: 46.41, to: OLD_END, el: () => <Hero small="MAKE THIS" sAnim="letterPop" big="RAYA COUNT!" bAnim="flip" gold="RAYA" font="dream" burst />},
];
const OVERLAYS = OVERLAYS_OLD.map((o) => ({from: om(o.from), to: om(o.to), el: o.el})).filter((o) => o.to - o.from > 0.15);

const Seq: React.FC<{from: number; to: number; children: React.ReactNode}> = ({from, to, children}) => (
  <Sequence from={fr(from)} durationInFrames={Math.max(1, fr(to) - fr(from))} layout="none">
    <AbsoluteFill>{children}</AbsoluteFill>
  </Sequence>
);

// gegaran kamera pada hentakan besar
const HITS = [ot(2.88) + 0.12, ot(13.3) + 0.1, ot(22.04) + 0.12, ot(44.6) + 0.12, ot(46.41) + 0.4];
const useShake = () => {
  const t = useT();
  let x = 0;
  let y = 0;
  for (const h of HITS) {
    const d = t - h;
    if (d > 0 && d < 0.35) {
      const amp = 16 * (1 - d / 0.35);
      x += Math.sin(d * 75) * amp;
      y += Math.cos(d * 61) * amp * 0.6;
    }
  }
  return x || y ? `translate(${x}px, ${y}px) scale(1.03)` : undefined;
};

// ---------- audio: VO rapat + SFX (tiada lagu, Nas 25/11) ----------
type Fx = {at: number; f: 'pop' | 'pop-small' | 'whoosh' | 'notif' | 'thud' | 'tick' | 'swish'; v: number};
const ticks = (at: number, n: number, gap: number, v = 0.07): Fx[] => Array.from({length: n}).map((_, i) => ({at: at + i * gap, f: 'tick' as const, v}));
const FX: Fx[] = [
  {at: 0.08, f: 'pop-small', v: 0.18},
  {at: LEAD, f: 'thud', v: 0.22}, {at: LEAD, f: 'pop', v: 0.14},
  {at: LEAD + 0.28, f: 'swish', v: 0.12},
  {at: ot(2.2) - 0.25, f: 'whoosh', v: 0.12},
  {at: ot(2.88), f: 'thud', v: 0.32}, {at: ot(2.88), f: 'pop', v: 0.12},
  {at: ot(3.3), f: 'swish', v: 0.12},
  ...[0.21, 0.75, 1.25].map((d) => ({at: ot(OV[2] + d), f: 'notif' as const, v: 0.2})),
  {at: ot(6.54), f: 'swish', v: 0.16}, {at: ot(7.32), f: 'swish', v: 0.16}, {at: ot(8.25) + 0.1, f: 'thud', v: 0.24},
  {at: ot(13.3) - 0.28, f: 'whoosh', v: 0.14}, {at: ot(13.3) + 0.05, f: 'thud', v: 0.36},
  ...ticks(ot(13.3) + 0.2, 8, 0.08),
  {at: ot(14.13), f: 'pop', v: 0.16},
  {at: ot(19.53), f: 'pop-small', v: 0.18}, {at: ot(20.17), f: 'swish', v: 0.15}, ...ticks(ot(21.06), 6, 0.05),
  {at: ot(22.04) - 0.28, f: 'whoosh', v: 0.15}, {at: ot(22.04), f: 'thud', v: 0.4}, {at: ot(22.04), f: 'pop', v: 0.16},
  {at: ot(25.87) + 0.12, f: 'pop-small', v: 0.16}, ...ticks(ot(26.97), 4, 0.04),
  {at: ot(28.32) + 0.4, f: 'thud', v: 0.14},
  {at: ot(OV[6] + 0.3), f: 'notif', v: 0.2}, {at: ot(OV[6] + 2.1), f: 'notif', v: 0.2},
  ...ticks(ot(30.83), 5, 0.04), {at: ot(30.83) + 0.2, f: 'thud', v: 0.26},
  {at: ot(34.99), f: 'swish', v: 0.15}, {at: ot(34.99) + 0.42, f: 'swish', v: 0.1},
  {at: ot(38.09) + 0.14, f: 'pop', v: 0.2},
  {at: ot(41.45), f: 'swish', v: 0.14},
  {at: ot(44.6), f: 'thud', v: 0.32}, {at: ot(45.42), f: 'pop', v: 0.2},
  {at: ot(46.41) + 0.15, f: 'swish', v: 0.12}, {at: ot(46.41) + 0.3, f: 'thud', v: 0.3},
  {at: END_CARD - 0.3, f: 'whoosh', v: 0.14}, {at: END_CARD + 0.3, f: 'pop-small', v: 0.14},
];
const AudioTrack: React.FC = () => (
  <>
    <Sequence from={fr(LEAD)}>
      <Audio src={a('vo_tight.wav')} />
    </Sequence>
    {FX.map((x, i) => (
      <Sequence key={i} from={Math.max(0, fr(x.at))} durationInFrames={fr(1.0)}>
        <Audio src={a(`sfx-${x.f}.wav`)} volume={x.v} />
      </Sequence>
    ))}
  </>
);

const Stage: React.FC = () => {
  const shake = useShake();
  return (
    <AbsoluteFill style={{transform: shake}}>
      <Seq from={0} to={ot(2.2)}><HiCard /></Seq>
      {SHOTS.map((s) => (
        <Seq key={s.id + s.from} from={s.from} to={s.to}><ShotLayer s={s} /></Seq>
      ))}
      <Seq from={ot(13.3)} to={V[4]}><YouFreeze pillAt={ot(14.13) - ot(13.3)} /></Seq>
      <Seq from={ot(22.04)} to={V[5]}><SellCard /></Seq>
      {OVERLAYS.map((o, i) => (
        <Seq key={i} from={o.from} to={o.to}>{o.el(o.from)}</Seq>
      ))}
      {CAP_LINES.map((c, i) => (
        <Seq key={'cap' + i} from={c.from} to={c.to}><CapLine from={c.from} words={c.words} /></Seq>
      ))}
      <Seq from={END_CARD} to={TOTAL}><EndCard /></Seq>
    </AbsoluteFill>
  );
};

export const RayaAgent: React.FC<{withAudio?: boolean}> = ({withAudio}) => {
  useFonts();
  return (
    <AbsoluteFill style={{background: C.cream}}>
      <Stage />
      {withAudio && <AudioTrack />}
    </AbsoluteFill>
  );
};
