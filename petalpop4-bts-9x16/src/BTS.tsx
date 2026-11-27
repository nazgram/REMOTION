import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, Easing, spring, staticFile, useCurrentFrame, useVideoConfig, delayRender, continueRender} from 'remotion';
import plan from '../public/bts/plan.json';

// ---------- fonts ----------
const fontHandle = delayRender('fonts', {timeoutInMilliseconds: 120000});
let fontsDone = false;
const finishFonts = () => { if (!fontsDone) { fontsDone = true; continueRender(fontHandle); } };
const FONT_LIST: [string, string, string][] = [
  ...[300, 400, 500, 600].map((w) => ['Poppins', `bts/fonts/poppins-${w}.woff2`, String(w)] as [string, string, string]),
  ['Transcity', 'bts/fonts/Transcity.otf', '400'],
];
Promise.all(FONT_LIST.map(async ([fam, url, weight]) => {
  const ff = new FontFace(fam, `url(${staticFile(url)})`, {weight});
  await ff.load(); document.fonts.add(ff);
})).catch((e) => console.warn('font', e)).finally(finishFonts);
setTimeout(finishFonts, 20000); // jangan sangkut kalau satu tab lambat

// ---------- data ----------
type Shot = {id: string; src: string; inS: number; from_: number; dur: number; chap: string; cap: string};
const SHOTS = plan.shots as Shot[];
const CHAPTERS: Record<string, {n: string; name: string; img: string; dot: string}> = {
  dahlia: {n: '01', name: 'Black Dahlia', img: 'black_dahlia', dot: '#2a2622'},
  powder: {n: '02', name: 'Powder Blue', img: 'powder_blue', dot: '#9fb1cb'},
  dusty: {n: '03', name: 'Dusty Rose', img: 'dusty_rose', dot: '#d9b7b8'},
  lilac: {n: '04', name: 'Lilac Mist', img: 'lilac_mist', dot: '#d7c9df'},
  sage: {n: '05', name: 'Sage Petal', img: 'sage_petal', dot: '#a1ad9e'},
};
const CH_ORDER = ['dahlia', 'powder', 'dusty', 'lilac', 'sage'];
const chapStart = (c: string) => SHOTS.find((s) => s.chap === c)!.from_;
const PINK = '#f8a5cb';
const OLIVE = '#5E673D';
const CREAM = '#F2ECE4';
const INK = '#473B34';
const GOLD = '#B89674';
const FILM_BG = '#1f2117';
const W = 1080, H = 1920;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const outExpo = Easing.bezier(0.16, 1, 0.3, 1);
const shadow = '0 2px 14px rgba(0,0,0,0.35)';

// ---------- footage ----------
const Clip: React.FC<{s: Shot}> = ({s}) => {
  const f = useCurrentFrame();
  const hook = s.chap === 'hook';
  const sc = hook ? 1.06 : interpolate(f, [0, s.dur], [1.0, 1.045]);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <OffthreadVideo muted src={staticFile(`bts/clips/${s.id}.mp4`)}
        style={{width: W, height: H, objectFit: 'cover', transform: `scale(${sc})`, filter: 'contrast(1.05) saturate(0.93) sepia(0.07) brightness(1.01)'}} />
    </AbsoluteFill>
  );
};

// grain + vignette over footage, ala camera BTS
const Grain: React.FC = () => {
  const f = useCurrentFrame();
  const seed = f % 7;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={W} height={H} style={{position: 'absolute', opacity: 0.11, mixBlendMode: 'overlay'}}>
        <filter id={`g${seed}`}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} /></filter>
        <rect width={W} height={H} filter={`url(#g${seed})`} />
      </svg>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.28) 100%)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(20,18,14,0.38) 0%, rgba(20,18,14,0) 20%, rgba(20,18,14,0) 58%, rgba(20,18,14,0.45) 74%, rgba(20,18,14,0.2) 86%, rgba(20,18,14,0) 100%)'}} />
    </AbsoluteFill>
  );
};

// ---------- chapter print swipe (corak Drop 4 melintas skrin, 8 frame) ----------
const PrintSwipe: React.FC<{img: string}> = ({img}) => {
  const f = useCurrentFrame();
  const y = interpolate(f, [0, 10], [H, -H * 1.15], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return (
    <AbsoluteFill style={{transform: `translateY(${y}px)`}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H * 1.15, overflow: 'hidden', borderRadius: '0 0 50% 50% / 0 0 12% 12%'}}>
        <Img src={staticFile(`bts/${img}.png`)} style={{width: H * 1.15, height: H * 1.15, marginLeft: -(H * 1.15 - W) / 2}} />
      </div>
    </AbsoluteFill>
  );
};

// ---------- top-left label + chapter tag ----------
const TopLabel: React.FC<{showTag: boolean}> = ({showTag}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const g = useCurrentFrame() + chapStart('dahlia');
  const inn = spring({frame: f, fps, config: {damping: 200}, durationInFrames: 14});
  let cur = CH_ORDER[0];
  for (const c of CH_ORDER) if (g >= chapStart(c)) cur = c;
  const local = g - chapStart(cur);
  const t = spring({frame: local - 4, fps, config: {damping: 18, stiffness: 160}});
  const ch = CHAPTERS[cur];
  return (
    <div style={{position: 'absolute', left: 92, top: 140, opacity: inn}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 3, height: interpolate(inn, [0, 1], [0, 92]), background: 'white', boxShadow: shadow}} />
      <div style={{marginLeft: 22, fontFamily: 'Poppins', fontWeight: 500, fontSize: 36, lineHeight: '44px', color: 'white', textShadow: shadow, transform: `translateX(${(1 - inn) * -20}px)`}}>
        Behind The<br />Scene
      </div>
      {showTag && (
        <div style={{marginTop: 22, overflow: 'hidden', height: 60}}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 14, padding: '10px 24px 10px 12px', borderRadius: 40, background: 'rgba(255,255,255,0.92)', transform: `translateY(${(1 - t) * 64}px)`}}>
            <div style={{width: 34, height: 34, borderRadius: 17, overflow: 'hidden', border: '2px solid white', boxShadow: '0 0 0 1px rgba(0,0,0,0.12)'}}>
              <Img src={staticFile(`bts/${ch.img}.png`)} style={{width: 120, height: 120, marginLeft: -20, marginTop: -20}} />
            </div>
            <span style={{fontFamily: 'Poppins', fontWeight: 600, fontSize: 24, color: INK, letterSpacing: 1}}>{ch.n}</span>
            <span style={{fontFamily: 'Poppins', fontWeight: 400, fontSize: 26, color: INK}}>{ch.name}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// REC indicator kanan atas (rasa kamera BTS)
const Rec: React.FC = () => {
  const f = useCurrentFrame();
  const g = f + chapStart('dahlia');
  const on = Math.floor(g / 15) % 2 === 0;
  const secs = 3 * 3600 + 12 * 60 + 40 + g / 30;
  const tc = [Math.floor(secs / 3600), Math.floor(secs / 60) % 60, Math.floor(secs) % 60, Math.floor((secs * 30) % 30)].map((v) => String(v).padStart(2, '0')).join(':');
  return (
    <div style={{position: 'absolute', right: 92, top: 146, textAlign: 'right', fontFamily: 'Poppins', color: 'white', textShadow: shadow, opacity: interpolate(f, [0, 10], [0, 1], clamp)}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, fontWeight: 600, fontSize: 26, letterSpacing: 3}}>
        <div style={{width: 16, height: 16, borderRadius: 8, background: on ? '#ff5a5a' : 'transparent', border: '2px solid #ff5a5a'}} />REC
      </div>
      <div style={{fontWeight: 400, fontSize: 22, letterSpacing: 2, marginTop: 4, fontVariantNumeric: 'tabular-nums'}}>{tc}</div>
    </div>
  );
};

// ---------- captions, setiap satu masuk dengan gaya lain ----------
const CAP_Y = 1300;
const Caption: React.FC<{text: string; style: number; dur: number}> = ({text, style, dur}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const out = interpolate(f, [dur - 5, dur], [1, 0], clamp);
  const base: React.CSSProperties = {fontFamily: 'Poppins', fontWeight: 500, fontSize: 50, color: 'white', textShadow: shadow, whiteSpace: 'pre'};
  const words = text.split(' ');
  const letters = text.split('');
  let body: React.ReactNode;
  switch (style % 8) {
    case 0: { // typewriter + caret
      const n = Math.floor(interpolate(f, [2, 2 + letters.length * 0.9], [0, letters.length], clamp));
      body = <span style={base}>{text.slice(0, n)}<span style={{opacity: Math.floor(f / 6) % 2 ? 0 : 1}}>|</span></span>;
      break;
    }
    case 1: // word rise stagger
      body = <span style={base}>{words.map((w, i) => { const p = spring({frame: f - i * 3, fps, config: {damping: 14, stiffness: 180}}); return <span key={i} style={{display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 40}px)`}}>{w}{i < words.length - 1 ? ' ' : ''}</span>; })}</span>;
      break;
    case 2: { // blur-in + tracking tighten
      const p = interpolate(f, [0, 14], [0, 1], {...clamp, easing: outExpo});
      body = <span style={{...base, filter: `blur(${(1 - p) * 14}px)`, opacity: p, letterSpacing: interpolate(p, [0, 1], [18, 0])}}>{text}</span>;
      break;
    }
    case 3: { // mask slide-up
      const p = interpolate(f, [0, 12], [0, 1], {...clamp, easing: outExpo});
      body = <div style={{overflow: 'hidden', paddingBottom: 6}}><span style={{...base, display: 'inline-block', transform: `translateY(${(1 - p) * 80}px)`}}>{text}</span></div>;
      break;
    }
    case 4: // letter pop scale
      body = <span style={base}>{letters.map((l, i) => { const p = spring({frame: f - i * 0.8, fps, config: {damping: 10, stiffness: 220}}); return <span key={i} style={{display: 'inline-block', transform: `scale(${p})`, whiteSpace: 'pre'}}>{l}</span>; })}</span>;
      break;
    case 5: { // highlight sweep (pill putih di belakang)
      const p = interpolate(f, [0, 10], [0, 1], {...clamp, easing: outExpo});
      const q = interpolate(f, [5, 14], [0, 1], clamp);
      body = <span style={{position: 'relative', display: 'inline-block', padding: '6px 22px'}}>
        <span style={{position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.94)', borderRadius: 14, transform: `scaleX(${p})`, transformOrigin: 'left'}} />
        <span style={{...base, position: 'relative', color: INK, textShadow: 'none', opacity: q}}>{text}</span></span>;
      break;
    }
    case 6: { // skew slide from left
      const p = spring({frame: f, fps, config: {damping: 16, stiffness: 170}});
      body = <span style={{...base, display: 'inline-block', opacity: p, transform: `translateX(${(1 - p) * -160}px) skewX(${(1 - p) * -18}deg)`}}>{text}</span>;
      break;
    }
    default: // letter flip cascade
      body = <span style={{...base, perspective: 600}}>{letters.map((l, i) => { const p = interpolate(f, [i * 0.7, i * 0.7 + 8], [0, 1], {...clamp, easing: outExpo}); return <span key={i} style={{display: 'inline-block', opacity: p, transform: `rotateX(${(1 - p) * 90}deg)`, whiteSpace: 'pre'}}>{l}</span>; })}</span>;
  }
  return <div style={{position: 'absolute', left: 60, right: 60, top: CAP_Y, textAlign: 'center', opacity: out}}>{body}</div>;
};

const Credit: React.FC = () => {
  const f = useCurrentFrame();
  return <div style={{position: 'absolute', left: 0, right: 0, top: 1420, textAlign: 'center', fontFamily: 'Poppins', fontWeight: 400, fontSize: 24, letterSpacing: 1, color: 'white', opacity: 0.88 * interpolate(f, [0, 10], [0, 1], clamp), textShadow: shadow}}>Pétal Pop Drop 4 · Archived by NAFESA</div>;
};

// ---------- title BEHIND the SCENE ----------
const Title: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const big: React.CSSProperties = {fontFamily: 'Poppins', fontWeight: 500, fontSize: 196, lineHeight: '196px', color: 'white', textShadow: '0 4px 30px rgba(0,0,0,0.25)', letterSpacing: 2};
  const small: React.CSSProperties = {fontFamily: 'Poppins', fontWeight: 500, fontSize: 25, lineHeight: '30px', color: 'white', textShadow: shadow, textAlign: 'center'};
  const word = (w: string, d: number) => w.split('').map((l, i) => {
    const p = spring({frame: f - d - i * 2, fps, config: {damping: 13, stiffness: 170}});
    return <span key={i} style={{display: 'inline-block', opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * -90}px)`}}>{l}</span>;
  });
  const sc = word('SCENE', 8).map((el, i) => {
    const p = interpolate(f, [10 + i * 2, 22 + i * 2], [0, 1], {...clamp, easing: outExpo});
    return <span key={i} style={{display: 'inline-block', clipPath: `inset(${(1 - p) * 100}% 0 0 0)`, transform: `translateY(${(1 - p) * 60}px)`}}>{'SCENE'[i]}</span>;
  });
  const the = interpolate(f, [12, 26], [0, 1], {...clamp, easing: outExpo});
  const fade = (d: number) => interpolate(f, [d, d + 10], [0, 1], clamp);
  const pill = spring({frame: f - 22, fps, config: {damping: 9, stiffness: 200}});
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center', ...big}}>{word('BEHIND', 0)}</div>
      <div style={{position: 'absolute', top: 470, left: 0, width: W, height: 160}}>
        <div style={{position: 'absolute', left: 120, top: 26, ...small, opacity: fade(18)}}>Project<br />of the day</div>
        <div style={{position: 'absolute', left: 300, top: -22, fontFamily: 'Transcity', fontSize: 150, color: PINK, transform: 'rotate(-7deg)', clipPath: `inset(0 ${(1 - the) * 100}% 0 0)`, textShadow: '0 3px 14px rgba(0,0,0,0.2)'}}>the</div>
        <div style={{position: 'absolute', left: 585, top: 28, padding: '8px 26px', borderRadius: 30, background: PINK, fontFamily: 'Poppins', fontWeight: 600, fontSize: 30, color: 'white', letterSpacing: 3, transform: `scale(${pill})`}}>DROP 4</div>
        <div style={{position: 'absolute', right: 110, top: 26, ...small, opacity: fade(24)}}>6 colourways<br />1 day shoot</div>
      </div>
      <div style={{position: 'absolute', top: 610, left: 0, right: 0, textAlign: 'center', ...big}}>{sc}</div>
      <div style={{position: 'absolute', top: 834, left: 0, right: 0, ...small, fontSize: 30, lineHeight: '40px', opacity: fade(28), transform: `translateY(${(1 - fade(28)) * 16}px)`}}>Pétal Pop Drop 4 by NAFESA<br />the real shoot, unfiltered</div>
      <div style={{position: 'absolute', top: 1420, left: 0, right: 0, ...small, fontWeight: 400, fontSize: 24, opacity: 0.88 * fade(30)}}>Archived by NAFESA</div>
    </AbsoluteFill>
  );
};

// ---------- B&W film-frame interlude ----------
const FilmFrame: React.FC<{img: string; x: number; y: number; w: number; h: number; t: number; leak?: boolean}> = ({img, x, y, w, h, t, leak}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h, overflow: 'hidden', borderRadius: 6, boxShadow: '0 0 40px 18px rgba(0,0,0,0.65) inset'}}>
    <Img src={staticFile(`bts/clips/${img}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.06) saturate(1.05) sepia(0.08) brightness(1.02)', transform: `scale(${1.04 + t * 0.05})`}} />
    <div style={{position: 'absolute', inset: 0, boxShadow: '0 0 60px 30px rgba(20,20,16,0.85) inset'}} />
    {leak && <div style={{position: 'absolute', inset: 0, background: `linear-gradient(${100 + t * 40}deg, rgba(0,0,0,0) 30%, rgba(232,170,96,${0.75 * Math.sin(t * Math.PI)}) 60%, rgba(248,165,203,${0.5 * Math.sin(t * Math.PI)}) 85%)`, mixBlendMode: 'screen'}} />}
  </div>
);
const Film: React.FC = () => {
  const f = useCurrentFrame();
  const n = plan.filmTo - plan.filmFrom; // 95
  const seg = n / 4;
  const k = Math.min(3, Math.floor(f / seg));
  const t = (f - k * seg) / seg;
  const pop = interpolate(t, [0, 0.12], [0.94, 1], {...clamp, easing: outExpo});
  const flash = interpolate(t * seg, [0, 2, 5], [0.9, 0.5, 0], clamp);
  const film = plan.film.map((x) => x.id);
  let content: React.ReactNode;
  if (k === 0) content = <FilmFrame img={film[0]} x={90} y={420} w={900} h={900} t={t} />;
  else if (k === 1) content = <FilmFrame img={film[1]} x={90} y={420} w={900} h={900} t={t} leak />;
  else if (k === 2) content = <><FilmFrame img={film[2]} x={290} y={300} w={500} h={560} t={t} /><FilmFrame img={film[0]} x={290} y={900} w={500} h={560} t={1 - t} /></>;
  else content = <FilmFrame img={film[3]} x={200} y={300} w={680} h={1120} t={t} />;
  return (
    <AbsoluteFill style={{background: FILM_BG}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${pop})`}}>{content}</div>
      <div style={{position: 'absolute', left: 92, top: 140, width: 3, height: 92, background: 'white', opacity: 0.9}} />
      <div style={{position: 'absolute', left: 116, top: 146, fontFamily: 'Poppins', fontSize: 24, color: 'rgba(255,255,255,0.75)', letterSpacing: 4}}>FRAME {String(k + 21).padStart(2, '0')}A</div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1500, textAlign: 'center', fontFamily: 'Poppins', fontWeight: 400, fontSize: 24, color: 'white', opacity: 0.85}}>BTS Archive · Pétal Pop Drop 4</div>
      <AbsoluteFill style={{background: 'white', opacity: flash}} />
    </AbsoluteFill>
  );
};

// ---------- end card ----------
const SWATCH = ['pearl_grey', 'dusty_rose', 'lilac_mist', 'sage_petal', 'powder_blue', 'black_dahlia'];
const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const nf = plan.nafesaFrom - plan.endFrom; // 105
  const wipe = interpolate(f, [0, 12], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const logo = spring({frame: f - 8, fps, config: {damping: 12, stiffness: 120}});
  const txt = interpolate(f, [40, 54], [0, 1], {...clamp, easing: outExpo});
  const iris = interpolate(f, [nf, nf + 16], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const naf = interpolate(f, [nf + 10, nf + 34], [0, 1], {...clamp, easing: outExpo});
  const shimmer = interpolate(f, [nf + 34, nf + 64], [-0.3, 1.3], clamp);
  const endFade = interpolate(f, [plan.total - plan.endFrom - 12, plan.total - plan.endFrom], [1, 0], clamp);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: CREAM, clipPath: `inset(${(1 - wipe) * 100}% 0 0 0 round 0)`}}>
        {/* bingkai garis halus emas */}
        <div style={{position: 'absolute', left: 60, top: 220, right: 60, bottom: 400, border: `2px solid ${GOLD}`, borderRadius: 30, opacity: wipe * 0.7}} />
        <Img src={staticFile('bts/logo_pp4.png')} style={{position: 'absolute', left: 140, top: 220, width: 800, transform: `scale(${logo})`, transformOrigin: '50% 55%'}} />
        <div style={{position: 'absolute', top: 1110, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 26}}>
          {SWATCH.map((s, i) => { const p = spring({frame: f - 24 - i * 4, fps, config: {damping: 10, stiffness: 200}}); return (
            <div key={s} style={{width: 112, height: 112, borderRadius: 56, overflow: 'hidden', border: '4px solid white', boxShadow: '0 6px 18px rgba(71,59,52,0.18)', transform: `scale(${p}) rotate(${(1 - p) * -60}deg)`}}>
              <Img src={staticFile(`bts/${s}.png`)} style={{width: 340, height: 340, marginLeft: -40, marginTop: -40}} /></div>); })}
        </div>
        <div style={{position: 'absolute', top: 1290, left: 0, right: 0, textAlign: 'center', fontFamily: 'Poppins', color: INK, opacity: txt, transform: `translateY(${(1 - txt) * 24}px)`}}>
          <div style={{fontWeight: 600, fontSize: 64, letterSpacing: interpolate(txt, [0, 1], [40, 10]), color: OLIVE, filter: `blur(${(1 - txt) * 8}px)`}}>COMING SOON</div>
          <div style={{fontWeight: 400, fontSize: 28, marginTop: 10, letterSpacing: 1}}>6 new colourways · only at NAFESA</div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{background: OLIVE, clipPath: `circle(${iris * 120}% at 50% 42%)`}}>
        <div style={{position: 'absolute', left: 240, top: 560, width: 600, height: 418, opacity: naf, transform: `scale(${0.92 + naf * 0.08})`, filter: `blur(${(1 - naf) * 10}px)`}}>
          <Img src={staticFile('bts/logo-nafesa-putih.png')} style={{width: 600}} />
          <div style={{position: 'absolute', top: 470, left: -100, right: -100, textAlign: 'center', fontFamily: 'Poppins', fontWeight: 500, fontSize: 30, letterSpacing: 9, color: GOLD, opacity: interpolate(f, [nf + 30, nf + 46], [0, 1], clamp)}}>PÉTAL POP DROP 4 · COMING SOON</div>
          <div style={{position: 'absolute', inset: 0, background: `linear-gradient(105deg, rgba(255,255,255,0) ${shimmer * 100 - 12}%, rgba(232,214,180,0.55) ${shimmer * 100}%, rgba(255,255,255,0) ${shimmer * 100 + 12}%)`, mixBlendMode: 'overlay', WebkitMaskImage: `url(${staticFile('bts/logo-nafesa-putih.png')})`, WebkitMaskSize: '100% 100%'}} />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#000', opacity: 1 - endFade}} />
    </AbsoluteFill>
  );
};

// ---------- main ----------
export const PetalPop4BTS: React.FC = () => {
  const titleFrom = SHOTS.find((s) => s.chap === 'title')!.from_;
  const mainFrom = chapStart('dahlia');
  const capShots = SHOTS.filter((s) => s.cap);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {SHOTS.map((s) => <Sequence key={s.id} from={s.from_} durationInFrames={s.dur}><Clip s={s} /></Sequence>)}
      <Sequence from={0} durationInFrames={plan.filmFrom}><Grain /></Sequence>
      <Sequence from={plan.filmTo} durationInFrames={plan.endFrom - plan.filmTo}><Grain /></Sequence>
      <Sequence from={titleFrom} durationInFrames={mainFrom - titleFrom}><Title /></Sequence>
      <Sequence from={mainFrom} durationInFrames={plan.filmFrom - mainFrom}><TopLabel showTag /><Rec /></Sequence>
      <Sequence from={plan.filmTo} durationInFrames={plan.endFrom - plan.filmTo}><TopLabelOffset from={plan.filmTo - mainFrom} /><RecOffset from={plan.filmTo - mainFrom} /></Sequence>
      {capShots.map((s, i) => <Sequence key={s.id} from={s.from_} durationInFrames={s.dur}><Caption text={s.cap} style={i} dur={s.dur} /></Sequence>)}
      <Sequence from={mainFrom} durationInFrames={plan.filmFrom - mainFrom}><Credit /></Sequence>
      <Sequence from={plan.filmTo} durationInFrames={plan.endFrom - plan.filmTo}><Credit /></Sequence>
      <Sequence from={plan.filmFrom} durationInFrames={plan.filmTo - plan.filmFrom}><Film /></Sequence>
      {CH_ORDER.slice(1).map((c) => <Sequence key={c} from={chapStart(c) - 5} durationInFrames={11}><PrintSwipe img={CHAPTERS[c].img} /></Sequence>)}
      <Sequence from={mainFrom - 5} durationInFrames={11}><PrintSwipe img={CHAPTERS.dahlia.img} /></Sequence>
      <Sequence from={plan.endFrom}><EndCard /></Sequence>
      <Audio src={staticFile('bts/music.wav')} volume={(f) => interpolate(f, [plan.total - 40, plan.total], [0.9, 0], clamp) } />
      <Audio src={staticFile('bts/sfx.wav')} volume={0.8} />
    </AbsoluteFill>
  );
};

// label & REC yang sambung masa selepas interlude filem
const Shift: React.FC<{from: number; children: React.ReactNode}> = ({from, children}) => <Sequence from={-from}>{children}</Sequence>;
const TopLabelOffset: React.FC<{from: number}> = ({from}) => <Shift from={from}><TopLabel showTag /></Shift>;
const RecOffset: React.FC<{from: number}> = ({from}) => <Shift from={from}><Rec /></Shift>;
