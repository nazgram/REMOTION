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
import {BAR, BEAT, CLIMAX, cwStart, CW_LEN, END, f, FPS, INTRO_END, JOY, NAFESA} from './timing';

export {FPS};
export const TOTAL_FRAMES = f(END);

const W = 1920;
const H = 1080;
const GAP = 8;
const CREAM = '#f5f0e6';

const fontFace = `@font-face{font-family:'JoyPlaceholder';src:url('${staticFile('InterDisplay-Black.otf')}') format('opentype');font-weight:900;}`;

type Shot = {clip: string; t: number};
type Colorway = {name: string; kain: string; a: Shot[]; b: Shot[]};

// Urutan: lembut -> garang (Red Sky blue sebelum klimaks)
const COLORWAYS: Colorway[] = [
  {
    name: 'White Sky blue',
    kain: 'k1-white-skyblue',
    a: [{clip: 'C4619', t: 1}, {clip: 'C4619', t: 13}, {clip: 'C4619', t: 21}],
    b: [{clip: 'C4618', t: 12}, {clip: 'C4619', t: 27}, {clip: 'C4618', t: 3}],
  },
  {
    name: 'Sky blue Red',
    kain: 'k2-skyblue-red',
    a: [{clip: 'C4606', t: 32}, {clip: 'C4607', t: 4}, {clip: 'C4606', t: 15}],
    b: [{clip: 'C4607', t: 16}, {clip: 'C4606', t: 21}, {clip: 'C4606', t: 25}],
  },
  {
    name: 'Sage Taupe',
    kain: 'k3-sage-taupe',
    a: [{clip: 'C4612', t: 2}, {clip: 'C4612', t: 14}, {clip: 'C4612', t: 30}],
    b: [{clip: 'C4612', t: 24}, {clip: 'C4612', t: 33}, {clip: 'C4612', t: 46}],
  },
  {
    name: 'Silver Brownie',
    kain: 'k4-silver-brownie',
    a: [{clip: 'C4617', t: 2}, {clip: 'C4616', t: 10}, {clip: 'C4617', t: 14}],
    b: [{clip: 'C4616', t: 24}, {clip: 'C4617', t: 11}, {clip: 'C4616', t: 30}],
  },
  {
    name: 'Red Sky blue',
    kain: 'k5-red-skyblue',
    a: [{clip: 'C4625', t: 40}, {clip: 'C4625', t: 10}, {clip: 'C4625', t: 26}],
    b: [{clip: 'C4625', t: 18}, {clip: 'C4625', t: 32}, {clip: 'C4625', t: 46}],
  },
];

const CLIMAX_SHOTS: Shot[] = [
  {clip: 'C4619', t: 14},
  {clip: 'C4607', t: 2},
  {clip: 'C4612', t: 14},
  {clip: 'C4616', t: 12},
  {clip: 'C4625', t: 14},
];

const raw = (c: string) => staticFile(`raw/${c}.mp4`);
const kain = (c: string) => staticFile(`kain/${c}.mp4`);

const Vid: React.FC<{src: string; from: number; style?: React.CSSProperties}> = ({src, from, style}) => (
  <OffthreadVideo
    src={src}
    muted
    startFrom={f(from)}
    style={{width: '100%', height: '100%', objectFit: 'cover', ...style}}
  />
);

// Klip kain penuh skrin
const FullKain: React.FC<{clip: string; from: number; zoom?: [number, number]; dur: number}> = ({clip, from, zoom = [1.04, 1.1], dur}) => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, f(dur)], zoom, {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{transform: `scale(${s})`}}>
      <Vid src={kain(clip)} from={from} />
    </AbsoluteFill>
  );
};

// Satu panel potret dalam grid. Masuk dengan sedikit zoom-out.
const Panel: React.FC<{shot: Shot; x: number; w: number}> = ({shot, x, w}) => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, f(BEAT * 2)], [1.12, 1.0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const drift = interpolate(frame, [0, f(CW_LEN)], [1, 1.04]);
  return (
    <div style={{position: 'absolute', left: x, top: 0, width: w, height: H, overflow: 'hidden', background: CREAM}}>
      <div style={{width: '100%', height: '100%', transform: `scale(${s * drift})`}}>
        <Vid src={raw(shot.clip)} from={shot.t} />
      </div>
    </div>
  );
};

const panelRects = (n: number) => {
  const pw = (W - GAP * (n - 1)) / n;
  return Array.from({length: n}, (_, i) => {
    const x0 = Math.round(i * (pw + GAP));
    const x1 = Math.round(i * (pw + GAP) + pw);
    return {x: x0, w: x1 - x0};
  });
};

// Grid 3 panel untuk satu colorway. Set B masuk panel demi panel, ikut beat.
const ColorwayGrid: React.FC<{cw: Colorway}> = ({cw}) => {
  const rects = panelRects(3);
  const swapAt = BAR * 1.5;
  return (
    <AbsoluteFill style={{background: CREAM}}>
      {rects.map((r, i) => {
        const swap = swapAt + i * (BEAT / 2);
        return (
          <React.Fragment key={i}>
            <Sequence durationInFrames={f(swap)} layout="none">
              <Panel shot={cw.a[i]} x={r.x} w={r.w} />
            </Sequence>
            <Sequence from={f(swap)} layout="none">
              <Panel shot={{clip: cw.b[i].clip, t: cw.b[i].t}} x={r.x} w={r.w} />
            </Sequence>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

// Transisi dot: bulatan kain colorway seterusnya membesar tutup skrin, kemudian kecut dedahkan grid baru.
const DotBloom: React.FC<{kainClip: string; half: number; holdOpen?: boolean}> = ({kainClip, half, holdOpen}) => {
  const frame = useCurrentFrame();
  const R = Math.hypot(W, H) / 2 + 20;
  const grow = interpolate(frame, [0, f(half)], [0, R], {
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });
  const shrink = holdOpen
    ? R
    : interpolate(frame, [f(half), f(half * 2)], [R, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.cubic),
      });
  const r = frame < f(half) ? grow : shrink;
  return (
    <AbsoluteFill style={{clipPath: `circle(${r}px at 50% 50%)`}}>
      <FullKain clip={kainClip} from={1.5} dur={half * 2} zoom={[1.15, 1.05]} />
    </AbsoluteFill>
  );
};

// Intro: kain gelap -> macro -> potongan makin laju ikut beat
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
        <Sequence key={i} from={f(c.start)} durationInFrames={f(c.len) + (i === INTRO_CUTS.length - 1 ? f(0.7) : 0)} layout="none">
          <AbsoluteFill style={{opacity: i === 0 ? fadeIn : 1}}>
            <FullKain clip={c.clip} from={c.from} dur={c.len} zoom={i === 0 ? [1.0, 1.12] : [1.08, 1.0]} />
          </AbsoluteFill>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// Reveal: kain merah terakhir diselak ke kanan macam langsir
const CurtainReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, f(0.7)], [0, W * 1.05], {
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const last = INTRO_CUTS[INTRO_CUTS.length - 1];
  return (
    <AbsoluteFill style={{transform: `translateX(${x}px)`, boxShadow: '-30px 0 60px rgba(0,0,0,0.35)'}}>
      <Vid src={kain(last.clip)} from={last.from + last.len} />
    </AbsoluteFill>
  );
};

const Climax: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const rects = panelRects(5);
  return (
    <AbsoluteFill>
      {rects.map((r, i) => {
        const delay = f((BEAT / 2) * i);
        const p = spring({frame: frame - delay, fps, config: {damping: 16, stiffness: 120}});
        const y = interpolate(p, [0, 1], [H, 0]);
        return (
          <div key={i} style={{position: 'absolute', left: r.x, top: 0, width: r.w, height: H, overflow: 'hidden', transform: `translateY(${y}px)`}}>
            <Vid src={raw(CLIMAX_SHOTS[i].clip)} from={CLIMAX_SHOTS[i].t} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const JoyClubCard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const letters = 'JOY CLUB'.split('');
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{filter: 'blur(8px)', transform: 'scale(1.08)'}}>
        <Vid src={kain('k5-red-skyblue')} from={2.0} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'rgba(0,0,0,0.22)'}} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div style={{display: 'flex', fontFamily: 'JoyPlaceholder', fontWeight: 900, fontSize: 210, color: '#fff', letterSpacing: '0.22em', marginRight: '-0.22em'}}>
          {letters.map((ch, i) => {
            const p = spring({frame: frame - f(BEAT * 0.5) - i * 2, fps, config: {damping: 14, stiffness: 160}});
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

export const JoyClubLaunch: React.FC = () => {
  const frame = useCurrentFrame();
  const vol = interpolate(frame, [0, f(0.6), f(END - 1.4), f(END)], [0, 1, 1, 0], {extrapolateRight: 'clamp'});
  const half = BEAT; // separuh transisi dot
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <style>{fontFace}</style>
      <Audio src={staticFile('lagu-dari-031.m4a')} volume={vol} />

      {/* Grid colorway */}
      {COLORWAYS.map((cw, i) => (
        <Sequence key={cw.name} from={f(cwStart(i))} durationInFrames={f(CW_LEN) + (i === COLORWAYS.length - 1 ? f(BAR) : 1)}>
          <ColorwayGrid cw={cw} />
        </Sequence>
      ))}

      {/* Intro kain + reveal */}
      <Sequence durationInFrames={f(INTRO_END)}>
        <Intro />
      </Sequence>
      <Sequence from={f(INTRO_END)} durationInFrames={f(0.8)}>
        <CurtainReveal />
      </Sequence>

      {/* Transisi dot antara colorway */}
      {COLORWAYS.slice(1).map((cw, i) => (
        <Sequence key={`dot-${cw.name}`} from={f(cwStart(i + 1) - half)} durationInFrames={f(half * 2)}>
          <DotBloom kainClip={cw.kain} half={half} />
        </Sequence>
      ))}

      {/* Klimaks 5 jalur */}
      <Sequence from={f(CLIMAX)} durationInFrames={f(JOY - CLIMAX)}>
        <Climax />
      </Sequence>

      {/* JOY CLUB: bloom kain merah, kekal sebagai latar */}
      <Sequence from={f(JOY - half)} durationInFrames={f(half)}>
        <DotBloom kainClip="k5-red-skyblue" half={half} holdOpen />
      </Sequence>
      <Sequence from={f(JOY)} durationInFrames={f(NAFESA - JOY)}>
        <JoyClubCard />
      </Sequence>

      <Sequence from={f(NAFESA)}>
        <NafesaCard />
      </Sequence>
    </AbsoluteFill>
  );
};
