import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, delayRender, continueRender} from 'remotion';

// NAFESA — "Raya Is Your Opportunity" 9:16. Masa ikut VO Nas (43.7 s) + jeda 0.5 s antara babak.
export const FPS = 30;
export const W = 1080;
export const H = 1920;
export const LEAD = 0.8; // muzik dulu sebelum VO
export const GAP = 0.5; // jeda tambahan antara babak
// Titik potong VO (saat dalam VO.mp3), dari VO_timing.md
const VO_CUTS = [0, 3.39, 10.3, 14.6, 20.7, 26.65, 33.05, 38.8, 43.73];
const vStart = (k: number) => LEAD + VO_CUTS[k] + GAP * k; // k = 0..7 (babak 1..8)
export const V = [0, 0, ...[1, 2, 3, 4, 5, 6, 7].map(vStart)]; // V[k] = mula visual babak k (1..8)
export const VO_END = LEAD + VO_CUTS[8] + GAP * 7;
export const END_CARD = 47.9;
export const TOTAL = 51.5;

const C = {olive: '#5E673D', deep: '#42482E', gold: '#B89674', cream: '#F2ECE4', tan: '#BCA893', char: '#473B34', white: '#FFFFFF'};
const fr = (s: number) => Math.round(s * FPS);
const a = (p: string) => staticFile(`raya/${p}`);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const outCubic = Easing.out(Easing.cubic);
const back = Easing.out(Easing.back(1.6));

// ---------- fonts ----------
const FONTS: [string, string, string][] = [
  ['Dream Avenue', 'fonts/DreamAvenue.ttf', '400'],
  ['Poppins', 'fonts/Poppins-Regular.ttf', '400'],
  ['Poppins', 'fonts/Poppins-Medium.ttf', '500'],
  ['Poppins', 'fonts/Poppins-SemiBold.ttf', '600'],
  ['Poppins', 'fonts/Poppins-Bold.ttf', '700'],
  ['Poppins', 'fonts/Poppins-ExtraBold.ttf', '800'],
];
if (typeof document !== 'undefined') {
  const h = delayRender('fonts');
  Promise.all(FONTS.map(([fam, f, wt]) => new FontFace(fam, `url(${a(f)})`, {weight: wt}).load().then((ff) => document.fonts.add(ff))))
    .then(() => continueRender(h))
    .catch(() => continueRender(h));
}
const DREAM = '"Dream Avenue", serif';
const POP = 'Poppins, sans-serif';

// ---------- footage ----------
// AI = klip Higgsfield (Nas simpan dalam Mac "AI clips/"); sementara belum ada, papar placeholder.
const AI_READY: Record<string, boolean> = {A1: true, B1: true, R2: true, V4: true};
const AI_LABEL: Record<string, string> = {A1: 'AI · Jiran A1 (lambai)', B1: 'AI · Jiran B1 (balang kuih)', R2: 'AI · Rumah 2 (taip mesej)', V4: 'AI · Versi 4 (taip mesej)'};
type Shot = {id: string; from: number; to: number; off?: number; z?: number; ox?: number; oy?: number};
export const SHOTS: Shot[] = [
  // Babak 1 — fast cut selepas kad HI NAFESIANS
  {id: 'S1a', from: 2.2, to: 2.85, off: 0.6},
  {id: 'S1b', from: 2.85, to: 3.5, off: 0.6},
  {id: 'S1c', from: 3.5, to: 4.1, off: 0.8},
  {id: 'S1d', from: 4.1, to: V[2], off: 0.6},
  // Babak 2 — permintaan 3 negara
  {id: 'S2a', from: V[2], to: 6.45, off: 0.2},
  {id: 'S2b', from: 6.45, to: 9.6, off: 0.3},
  {id: 'S2c', from: 9.6, to: V[3], off: 0.4},
  // Babak 3 — hero, freeze pada "YOU"
  {id: 'S3a', from: V[3], to: 13.3, off: 0.0},
  // Babak 4 — share / talk / introduce / SELL
  {id: 'S4a', from: V[4], to: 19.53, off: 0.3},
  {id: 'S4b', from: 19.53, to: 20.17, off: 0.6},
  {id: 'S4c', from: 20.17, to: 21.06, off: 0.6},
  {id: 'J4', from: 21.06, to: 22.04, off: 0.5},
  // Babak 5 — pelanggan seterusnya
  {id: 'J5', from: V[5], to: 25.87, off: 0.3},
  {id: 'V1', from: 25.87, to: 26.97, off: 0.5},
  {id: 'V2', from: 26.97, to: 28.32, off: 0.8},
  {id: 'A1', from: 28.32, to: 29.12, off: 0.8},
  {id: 'B1', from: 29.12, to: V[6], off: 0.8},
  // Babak 6 — mula dengan apa yang ada (AI rumah)
  {id: 'R2', from: V[6], to: 33.5, off: 0.3},
  {id: 'V4', from: 33.5, to: V[7], off: 0.3},
  // Babak 7 — peluang, makin laju
  {id: 'S7a', from: V[7], to: 38.09, off: 0.4},
  {id: 'S7c', from: 38.09, to: 39.71, off: 0.3},
  {id: 'J7m', from: 39.71, to: 40.47, off: 0.5},
  {id: 'J7r', from: 40.47, to: 41.45, off: 0.6},
  {id: 'S7e', from: 41.45, to: V[8], off: 0.3},
  // Babak 8 — penutup
  {id: 'S8a', from: V[8], to: 44.6, off: 0.3},
  {id: 'J8', from: 44.6, to: 45.42, off: 0.6},
  {id: 'S8c', from: 45.42, to: 46.41, off: 0.5},
  {id: 'S8d', from: 46.41, to: END_CARD, off: 0.3},
];

const AIPlaceholder: React.FC<{id: string}> = ({id}) => (
  <AbsoluteFill style={{background: `linear-gradient(160deg, #e9e2d6, ${C.cream})`, alignItems: 'center', justifyContent: 'center'}}>
    <Pattern color={C.gold} opacity={0.14} />
    <div style={{border: `3px dashed ${C.tan}`, borderRadius: 36, padding: '40px 56px', textAlign: 'center', marginTop: -260}}>
      <div style={{fontFamily: POP, fontWeight: 700, fontSize: 46, color: C.olive}}>{AI_LABEL[id]}</div>
      <div style={{fontFamily: POP, fontWeight: 500, fontSize: 28, color: C.char, marginTop: 12}}>klip Higgsfield, masuk bila Nas simpan dalam Mac</div>
    </div>
  </AbsoluteFill>
);

const ShotLayer: React.FC<{s: Shot}> = ({s}) => {
  const f = useCurrentFrame();
  const dur = fr(s.to) - fr(s.from);
  const drift = interpolate(f, [0, dur], [0, 0.04], clamp);
  const fadeIn = interpolate(f, [0, 3], [0, 1], clamp);
  const isAI = s.id in AI_READY;
  const src = isAI ? a(`clips/ai_${s.id}.mp4`) : a(`clips/${s.id}.mp4`);
  return (
    <AbsoluteFill style={{opacity: fadeIn, overflow: 'hidden', background: '#000'}}>
      {isAI && !AI_READY[s.id] ? (
        <AIPlaceholder id={s.id} />
      ) : (
        <AbsoluteFill style={{transform: `scale(${(s.z ?? 1) + drift})`, transformOrigin: `${s.ox ?? 50}% ${s.oy ?? 40}%`}}>
          <OffthreadVideo src={src} startFrom={fr(s.off ?? 0)} muted style={{width: W, height: H, objectFit: 'cover', filter: 'saturate(1.03) contrast(1.04) brightness(1.02)'}} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ---------- anyaman / ketupat texture ----------
const Pattern: React.FC<{color: string; opacity: number}> = ({color, opacity}) => (
  <AbsoluteFill style={{opacity}}>
    <svg width={W} height={H}>
      <defs>
        <pattern id={`anyam-${color}`} width="90" height="90" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect x="0" y="0" width="90" height="90" fill="none" />
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

// ---------- helpers ----------
const useT = () => useCurrentFrame() / FPS; // dalam Sequence: saat sejak mula sequence
const pop = (t: number, at: number, d = 0.35) => interpolate(t, [at, at + d], [0, 1], {...clamp, easing: back});
const rise = (t: number, at: number, d = 0.4) => interpolate(t, [at, at + d], [0, 1], {...clamp, easing: outCubic});
const shadow = '0 4px 24px rgba(0,0,0,0.35)';

const Scrim: React.FC = () => <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 48%, rgba(30,26,22,0.42) 78%, rgba(30,26,22,0.55) 100%)'}} />;

// Teks hero atas footage (zon 1000–1400 px, dalam safe zone 1521)
const Hero: React.FC<{small?: string; big: string; gold?: string; bigFont?: 'dream' | 'pop'; y?: number; size?: number}> = ({small, big, gold, bigFont = 'pop', y = 1180, size}) => {
  const t = useT();
  const s1 = rise(t, 0), s2 = pop(t, small ? 0.08 : 0);
  const parts = gold ? big.split(gold) : [big];
  return (
    <AbsoluteFill>
      <Scrim />
      <div style={{position: 'absolute', left: 60, right: 60, top: y, textAlign: 'center'}}>
        {small && <div style={{fontFamily: POP, fontWeight: 700, fontSize: 46, letterSpacing: '0.12em', color: C.cream, opacity: s1, transform: `translateY(${(1 - s1) * 18}px)`, textShadow: shadow}}>{small}</div>}
        <div style={{fontFamily: bigFont === 'dream' ? DREAM : POP, fontWeight: 800, fontSize: size ?? (bigFont === 'dream' ? 132 : 104), lineHeight: 1.02, color: C.white, transform: `scale(${0.6 + 0.4 * s2})`, opacity: Math.min(1, s2 * 1.5), textShadow: shadow, letterSpacing: bigFont === 'pop' ? '0.01em' : '0.02em'}}>
          {parts.length > 1 ? (
            <>
              {parts[0]}
              <span style={{color: '#E3C9A6'}}>{gold}</span>
              {parts[1]}
            </>
          ) : (
            big
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Sari kata (bawah, dalam safe zone 1521)
type Sub = {text: string; from: number; to: number};
const SUBS: Sub[] = [
  {text: 'And do you know that people across', from: 4.78, to: 6.45},
  {text: 'are already asking and looking for Nafesa?', from: 9.6, to: 11.7},
  {text: 'And guess what?', from: 12.4, to: 13.25},
  {text: 'YOU are the authorised agents who can sell it to them!', from: 13.3, to: 16.5},
  {text: "So don't just buy Nafesa for yourself.", from: 17.05, to: 19.45},
  {text: 'You never know, your next customer could be...', from: 23.6, to: 25.82},
  {text: "You don't need a physical shop.", from: 30.1, to: 31.95},
  {text: "You don't need thousands of followers.", from: 31.95, to: 34.05},
  {text: 'You just need to start reaching out.', from: 34.1, to: 36.4},
  {text: 'Raya season is a huge opportunity.', from: 37.0, to: 39.65},
  {text: "Don't just watch others selling.", from: 39.7, to: 41.4},
  {text: 'Come on, Nafesians.', from: 43.2, to: 44.55},
];
const Subtitle: React.FC<{text: string}> = ({text}) => {
  const t = useT();
  const o = rise(t, 0, 0.2);
  return (
    <div style={{position: 'absolute', left: 80, right: 80, top: 1430, textAlign: 'center', opacity: o}}>
      <span style={{fontFamily: POP, fontWeight: 500, fontSize: 36, lineHeight: 1.35, color: C.white, background: 'rgba(40,36,30,0.45)', padding: '6px 18px', borderRadius: 14, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone'}}>{text}</span>
    </div>
  );
};

// ---------- Babak 1: kad HI NAFESIANS ----------
const HiCard: React.FC = () => {
  const t = useT();
  const hi = pop(t, LEAD), name = pop(t, LEAD + 0.33, 0.45), cres = pop(t, 0.15, 0.5);
  const letters = 'NAFESIANS!'.split('');
  return (
    <Card bg={C.cream} pat={C.gold}>
      <div style={{position: 'absolute', top: 470, width: W, textAlign: 'center', transform: `scale(${cres})`}}>
        <Crescent size={110} color={C.gold} />
      </div>
      <div style={{position: 'absolute', top: 640, width: W, textAlign: 'center', fontFamily: POP, fontWeight: 700, fontSize: 120, color: C.olive, letterSpacing: '0.08em', transform: `scale(${hi})`}}>HI</div>
      <div style={{position: 'absolute', top: 800, width: W, textAlign: 'center', fontFamily: DREAM, fontSize: 158, color: C.olive}}>
        {letters.map((ch, i) => {
          const p = pop(t, LEAD + 0.33 + i * 0.035, 0.4);
          return (
            <span key={i} style={{display: 'inline-block', opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 40}px)`}}>{ch}</span>
          );
        })}
      </div>
      <div style={{position: 'absolute', top: 1010, left: 340, width: 400, height: 3, background: C.gold, transform: `scaleX(${name})`}} />
    </Card>
  );
};

// ---------- Babak 2: chat bubble + 3 negara ----------
const Bubble: React.FC<{text: string; at: number; y: number; side: 'in' | 'out'}> = ({text, at, y, side}) => {
  const t = useT();
  const p = pop(t, at, 0.35);
  if (t < at) return null;
  const isIn = side === 'in';
  return (
    <div style={{position: 'absolute', top: y, [isIn ? 'left' : 'right']: 70, maxWidth: 760, transform: `scale(${p})`, transformOrigin: isIn ? '0% 100%' : '100% 100%'}}>
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
        <div key={i} style={{width: 16, height: 16, borderRadius: 8, background: C.cream, opacity: 0.4 + 0.6 * Math.abs(Math.sin((t - at) * 6 - i * 0.7))}} />
      ))}
    </div>
  );
};
const Countries: React.FC = () => {
  const t = useT(); // mula 6.45
  const items = [
    {n: 'MALAYSIA', at: 6.54 - 6.45},
    {n: 'SINGAPORE', at: 7.32 - 6.45},
    {n: 'BRUNEI', at: 8.25 - 6.45},
  ];
  return (
    <AbsoluteFill>
      <Scrim />
      {items.map((it, i) => {
        const p = pop(t, it.at, 0.4);
        return (
          <div key={it.n} style={{position: 'absolute', top: 1000 + i * 130, width: W, textAlign: 'center', transform: `scale(${p})`, opacity: Math.min(1, p * 1.5)}}>
            <span style={{fontFamily: POP, fontWeight: 800, fontSize: 84, letterSpacing: '0.14em', color: C.white, textShadow: shadow}}>{it.n}</span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- Babak 3: freeze + cutout + YOU ----------
const YouFreeze: React.FC = () => {
  const t = useT(); // mula 13.30
  const bg = rise(t, 0, 0.25);
  const you = pop(t, 0.05, 0.45);
  const flash = interpolate(t, [0, 0.18], [0.8, 0], clamp);
  const pill = pop(t, 14.13 - 13.3, 0.4);
  const top = rise(t, 0.15, 0.35);
  return (
    <AbsoluteFill>
      <Img src={a('img/s3a_freeze.png')} style={{width: W, height: H, objectFit: 'cover'}} />
      <AbsoluteFill style={{opacity: bg}}>
        <Card bg={C.cream} pat={C.gold} />
      </AbsoluteFill>
      <div style={{position: 'absolute', top: 170, width: W, textAlign: 'center', fontFamily: DREAM, fontSize: 400, lineHeight: 1, color: C.olive, transform: `scale(${0.7 + 0.3 * you})`, opacity: you}}>YOU</div>
      <Img src={a('img/s3a_cut.png')} style={{position: 'absolute', width: W, height: H, objectFit: 'cover', transform: `scale(${1.0 + 0.03 * t})`, transformOrigin: '50% 100%'}} />
      <div style={{position: 'absolute', top: 70, width: W, textAlign: 'center', fontFamily: POP, fontWeight: 700, fontSize: 52, letterSpacing: '0.1em', color: C.char, opacity: top}}>YES, THAT&apos;S YOU!</div>
      <div style={{position: 'absolute', top: 1235, width: W, textAlign: 'center', transform: `scale(${pill})`}}>
        <span style={{display: 'inline-block', background: C.olive, border: `3px solid ${C.gold}`, borderRadius: 60, padding: '22px 44px', fontFamily: POP, fontWeight: 700, fontSize: 44, letterSpacing: '0.08em', color: C.cream}}>
          AUTHORISED <span style={{color: '#E3C9A6'}}>NAFESA</span> AGENTS
        </span>
      </div>
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
    </AbsoluteFill>
  );
};

// ---------- Babak 4: SELL IT! ----------
const SellCard: React.FC = () => {
  const t = useT();
  const p = pop(t, 0, 0.45);
  const s = rise(t, 0.25, 0.4);
  return (
    <Card bg={C.olive} pat={C.gold} patO={0.12}>
      <div style={{position: 'absolute', top: 640, width: W, textAlign: 'center', fontFamily: POP, fontWeight: 600, fontSize: 38, letterSpacing: '0.3em', color: C.cream, opacity: s}}>SHARE · TALK · INTRODUCE</div>
      <div style={{position: 'absolute', top: 720, width: W, textAlign: 'center', fontFamily: POP, fontWeight: 800, fontSize: 230, lineHeight: 1, color: '#E3C9A6', transform: `scale(${0.5 + 0.5 * p}) rotate(${(1 - p) * -6}deg)`, opacity: Math.min(1, p * 1.6)}}>SELL IT!</div>
    </Card>
  );
};

// ---------- Kad akhir ----------
const EndCard: React.FC = () => {
  const t = useT();
  const bg = rise(t, 0, 0.4);
  const logo = rise(t, 0.3, 0.8);
  const cres = pop(t, 0.9, 0.5);
  const tag = rise(t, 1.2, 0.6);
  return (
    <AbsoluteFill style={{opacity: bg}}>
      <Card bg={C.olive} pat={C.gold} patO={0.1}>
        <div style={{position: 'absolute', top: 560, left: (W - 560) / 2, width: 560, opacity: logo, transform: `scale(${0.92 + 0.08 * logo})`}}>
          <Img src={a('img/logo_gold.png')} style={{width: 560}} />
          <div style={{position: 'absolute', top: -70, right: -40, transform: `scale(${cres}) rotate(-12deg)`}}>
            <Crescent size={84} color={C.gold} />
          </div>
        </div>
        <div style={{position: 'absolute', top: 1010, left: 390, width: 300, height: 2, background: C.gold, transform: `scaleX(${tag})`}} />
        <div style={{position: 'absolute', top: 1050, width: W, textAlign: 'center', fontFamily: POP, fontWeight: 500, fontSize: 34, letterSpacing: '0.55em', marginLeft: '0.27em', color: C.cream, opacity: tag}}>MODEST LUXURY</div>
      </Card>
    </AbsoluteFill>
  );
};

// ---------- susunan ----------
type Ov = {from: number; to: number; el: React.ReactNode};
const OVERLAYS: Ov[] = [
  {from: 2.88, to: V[2], el: <Hero big="RAYA" gold="RAYA" bigFont="dream" size={210} y={1000} small="" />},
  {from: 3.3, to: V[2], el: <div style={{position: 'absolute', top: 1235, width: W, textAlign: 'center', fontFamily: POP, fontWeight: 800, fontSize: 92, color: C.white, textShadow: shadow}}>IS COMING!</div>},
  {from: V[2], to: 6.45, el: (
    <AbsoluteFill>
      <Scrim />
      <Bubble side="in" text="Where can I get Nafesa?" at={0.21} y={900} />
      <Bubble side="in" text="Still available?" at={0.75} y={1050} />
      <Bubble side="in" text="How do I order?" at={1.25} y={1200} />
    </AbsoluteFill>
  )},
  {from: 6.45, to: 11.7, el: <Countries />},
  {from: 19.53, to: 20.17, el: <Hero big="SHARE IT." />},
  {from: 20.17, to: 21.06, el: <Hero big="TALK ABOUT IT." size={96} />},
  {from: 21.06, to: 22.04, el: <Hero big="INTRODUCE IT." size={96} />},
  {from: 25.87, to: 26.97, el: <Hero small="YOUR" big="BEST FRIEND." bigFont="dream" />},
  {from: 26.97, to: 28.32, el: <Hero small="YOUR" big="COLLEAGUE." bigFont="dream" />},
  {from: 28.32, to: V[6], el: <Hero small="YOUR" big="NEIGHBOUR." bigFont="dream" />},
  {from: V[6], to: 33.5, el: (
    <AbsoluteFill>
      <Bubble side="out" text="Hi dear! Nafesa's Raya collection is here!" at={0.3} y={760} />
      <Typing at={1.2} until={2.1} y={930} />
      <Bubble side="out" text="Want me to send you the catalogue?" at={2.1} y={930} />
    </AbsoluteFill>
  )},
  {from: 30.83, to: 33.5, el: <Hero small="NO PHYSICAL" big="SHOP NEEDED." bigFont="dream" y={1150} />},
  {from: 34.99, to: V[7], el: <Hero small="JUST START" big="REACHING OUT." bigFont="dream" />},
  {from: 38.09, to: 39.71, el: <Hero small="THIS IS YOUR" big="OPPORTUNITY." bigFont="dream" />},
  {from: 41.45, to: V[8], el: <Hero big="BE PART OF IT!" />},
  {from: 44.6, to: 45.42, el: <Hero big="LET'S SELL." />},
  {from: 45.42, to: 46.41, el: <Hero big="LET'S GROW." />},
  {from: 46.41, to: END_CARD, el: <Hero small="MAKE THIS" big="RAYA COUNT!" gold="RAYA" bigFont="dream" />},
];

const Seq: React.FC<{from: number; to: number; children: React.ReactNode}> = ({from, to, children}) => (
  <Sequence from={fr(from)} durationInFrames={Math.max(1, fr(to) - fr(from))} layout="none">
    <AbsoluteFill>{children}</AbsoluteFill>
  </Sequence>
);

const VOAudio: React.FC = () => (
  <>
    {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
      <Sequence key={k} from={fr(vStart(k))} durationInFrames={fr(VO_CUTS[k + 1] - VO_CUTS[k]) + 2}>
        <Audio src={a('vo.wav')} startFrom={fr(VO_CUTS[k])} endAt={fr(VO_CUTS[k + 1])} />
      </Sequence>
    ))}
  </>
);
const musicVol = (f: number) => {
  const t = f / FPS;
  const inVO = [0, 1, 2, 3, 4, 5, 6, 7].some((k) => t > vStart(k) - 0.15 && t < vStart(k) + VO_CUTS[k + 1] - VO_CUTS[k] + 0.1);
  const base = inVO ? 0.16 : 0.42;
  const fadeIn = interpolate(t, [0, 0.6], [0, 1], clamp);
  const fadeOut = interpolate(t, [TOTAL - 2.2, TOTAL], [1, 0], clamp);
  return base * fadeIn * fadeOut;
};

export const RayaAgent: React.FC<{withAudio?: boolean}> = ({withAudio}) => (
  <AbsoluteFill style={{background: C.cream}}>
    <Seq from={0} to={2.2}><HiCard /></Seq>
    {SHOTS.map((s) => (
      <Seq key={s.id + s.from} from={s.from} to={s.to}><ShotLayer s={s} /></Seq>
    ))}
    <Seq from={13.3} to={V[4]}><YouFreeze /></Seq>
    <Seq from={22.04} to={V[5]}><SellCard /></Seq>
    {OVERLAYS.map((o, i) => (
      <Seq key={i} from={o.from} to={o.to}>{o.el}</Seq>
    ))}
    {SUBS.map((s, i) => (
      <Seq key={'sub' + i} from={s.from} to={s.to}><Subtitle text={s.text} /></Seq>
    ))}
    <Seq from={END_CARD} to={TOTAL}><EndCard /></Seq>
    {withAudio && (
      <>
        <VOAudio />
        <Audio src={a('music.mp3')} volume={musicVol} />
      </>
    )}
  </AbsoluteFill>
);
