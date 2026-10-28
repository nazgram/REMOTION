import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame } from 'remotion';
import { loadFont } from '@remotion/fonts';
import L from './timeline.json';

// "How we made it" for the Drop 1 editor reel: a macOS desktop where the brief goes to Claude, the Remotion code
// types itself, Studio previews it and the terminal renders it. No brand logos; Clawd (Claude's mascot) helps out.

const sans = 'Montserrat';
const mono = 'JetBrains Mono';
loadFont({ family: sans, url: staticFile('intro/fonts/Montserrat.ttf'), weight: '100 900' });
loadFont({ family: mono, url: staticFile('bts/fonts/JetBrainsMono-Medium.ttf'), weight: '500' });

const C = { berry: '#971D59', blush: '#F2A3BC', peach: '#FFC7B8', leaf: '#B3AE64', lavender: '#ADB4D6', ivory: '#F8EAD9', ink: '#2B1A22', clawd: '#D97757' };
const DARK = '#1E1A20';
const { W, H, FPS, S } = L;

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.45, 0, 0.2, 1);
const lerp = (t: number, a: number, b: number, v0: number, v1: number, e = ease) => interpolate(t, [a, b], [v0, v1], { ...clamp, easing: e });
const pop = (t: number, at: number, damping = 11) =>
  t < at ? 0 : spring({ frame: (t - at) * FPS, fps: FPS, config: { damping, mass: 0.55, stiffness: 170 } });
const typed = (s: string, t: number, a: number, b: number) => s.slice(0, Math.round(lerp(t, a, b, 0, s.length, (x) => x)));
const inScene = (t: number, k: keyof typeof S) => t >= S[k][0] && t < S[k][1];

// ---------- Clawd: pixel mascot ----------
const CLAWD_PX = [
  '..##########..',
  '..##########..',
  '..#..####..#..',
  '..#..####..#..',
  '##############',
  '##############',
  '..##########..',
  '..##########..',
  '...#.#..#.#...',
  '...#.#..#.#...',
];
const Clawd: React.FC<{ x: number; y: number; size: number; t: number; mood?: 'idle' | 'type' | 'jump' | 'wave'; s?: number; flip?: boolean }> = ({
  x, y, size, t, mood = 'idle', s = 1, flip,
}) => {
  if (s <= 0.001) return null;
  const u = size / 14;
  const bob = mood === 'type' ? Math.abs(Math.sin(t * 18)) * -u * 0.6 : mood === 'jump' ? -Math.abs(Math.sin(t * 7)) * u * 5 : Math.sin(t * 4) * u * 0.4;
  const blink = (t * 10) % 31 < 1;
  const tilt = mood === 'wave' ? Math.sin(t * 9) * 6 : 0;
  return (
    <div style={{ position: 'absolute', left: x - size / 2, top: y - u * 10 + bob, width: size, height: u * 10, transform: `scale(${flip ? -s : s},${s}) rotate(${tilt}deg)`, transformOrigin: '50% 100%' }}>
      <svg width={size} height={u * 10} viewBox="0 0 14 10" shapeRendering="crispEdges" style={{ overflow: 'visible', filter: 'drop-shadow(0 6px 8px rgba(80,20,40,.25))' }}>
        {CLAWD_PX.flatMap((row, r) =>
          [...row].map((ch, c) => {
            const eye = (r === 2 || r === 3) && (c === 3 || c === 4 || c === 9 || c === 10);
            if (eye) return blink && r === 2 ? <rect key={`${r}-${c}`} x={c} y={r} width={1.02} height={1.02} fill={C.clawd} /> : <rect key={`${r}-${c}`} x={c} y={r} width={1.02} height={1.02} fill="#111" />;
            return ch === '#' ? <rect key={`${r}-${c}`} x={c} y={r} width={1.02} height={1.02} fill={C.clawd} /> : null;
          }),
        )}
      </svg>
    </div>
  );
};

// ---------- desktop pieces ----------
const Desktop: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill style={{ background: `linear-gradient(170deg, ${C.ivory} 0%, #F6DCD6 55%, ${C.blush} 130%)` }}>
    {[...Array(6)].map((_, i) => (
      <div key={i} style={{ position: 'absolute', left: (i * 397) % W - 120, top: 240 + ((i * 523) % 1300), width: 360, height: 360, borderRadius: '50%', background: [C.peach, C.lavender, C.blush][i % 3], opacity: 0.28, filter: 'blur(60px)', transform: `translateY(${Math.sin(t * 0.8 + i) * 20}px)` }} />
    ))}
    <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: 54, background: 'rgba(255,255,255,.7)', display: 'flex', alignItems: 'center', padding: '0 30px', gap: 34, fontFamily: sans, fontSize: 24, fontWeight: 600, color: C.ink }}>
      <span style={{ fontWeight: 800 }}>Remotion</span>
      <span style={{ fontWeight: 500 }}>File</span>
      <span style={{ fontWeight: 500 }}>Edit</span>
      <span style={{ fontWeight: 500 }}>View</span>
      <span style={{ marginLeft: 'auto', fontWeight: 500 }}>Sel 28 Okt  3:17</span>
    </div>
  </AbsoluteFill>
);

const Win: React.FC<{ x: number; y: number; w: number; h: number; title: string; dark?: boolean; s: number; children?: React.ReactNode }> = ({ x, y, w, h, title, dark, s, children }) => {
  if (s <= 0.001) return null;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, transform: `scale(${0.82 + 0.18 * s})`, opacity: Math.min(1, s * 1.6), borderRadius: 26, overflow: 'hidden', background: dark ? DARK : '#fff', boxShadow: '0 40px 80px rgba(90,20,50,.28), 0 0 0 1px rgba(0,0,0,.06)' }}>
      <div style={{ height: 62, background: dark ? '#2E2830' : '#F1ECEE', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 14, position: 'relative' }}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{ width: 22, height: 22, borderRadius: 11, background: c }} />)}
        <div style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', fontFamily: sans, fontSize: 24, fontWeight: 600, color: dark ? '#C9BEC6' : '#6B5C66' }}>{title}</div>
      </div>
      <div style={{ position: 'relative', width: w, height: h - 62 }}>{children}</div>
    </div>
  );
};

const Caption: React.FC<{ t: number; at: number; n: string; text: string }> = ({ t, at, n, text }) => {
  const s = pop(t, at, 13);
  if (s <= 0.001) return null;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 1360, display: 'flex', justifyContent: 'center', transform: `translateY(${(1 - s) * 60}px) scale(${0.7 + 0.3 * s})`, opacity: Math.min(1, s * 2) }}>
      <div style={{ background: C.berry, color: C.ivory, fontFamily: sans, fontWeight: 800, fontSize: 52, padding: '22px 46px', borderRadius: 60, display: 'flex', gap: 22, alignItems: 'center', boxShadow: '0 16px 30px rgba(151,29,89,.35)' }}>
        <span style={{ background: C.blush, color: C.berry, width: 62, height: 62, borderRadius: 31, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38 }}>{n}</span>
        {text}
      </div>
    </div>
  );
};

const Flower: React.FC<{ x: number; y: number; size: number; s: number; n: number; rot?: number }> = ({ x, y, size, s, n, rot = 0 }) =>
  s <= 0.001 ? null : (
    <Img src={staticFile(`intro/flowers/peony/0${n}.png`)} style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, transform: `scale(${s}) rotate(${rot + (1 - s) * 60}deg)` }} />
  );

// ---------- code text with simple colouring ----------
type Tok = [string, string];
const KW = '#FF8FC4', FN = '#8EC8FF', STR = '#F7C98B', NUM = '#C7E59A', TXT = '#E9E2E7', DIM = '#8D8089';
const CODE: Tok[][] = [
  [['const ', KW], ['pop', TXT], [' = (t, at) =>', DIM]],
  [['  spring', FN], ['({ frame: (t - at) * fps,', TXT]],
  [['    config: { ', TXT], ['damping', TXT], [': ', DIM], ['11', NUM], [',', DIM]],
  [['      mass: ', TXT], ['0.55', NUM], [', stiffness: ', TXT], ['170', NUM], [' } });', TXT]],
  [['', TXT]],
  [['const ', KW], ['x', TXT], [' = ', DIM], ['interpolate', FN], ['(t, [a, b],', TXT]],
  [['  [', TXT], ['-400', NUM], [', ', DIM], ['0', NUM], ['], { easing: ease });', TXT]],
  [['', TXT]],
  [['<', DIM], ['Page', FN], [' src=', TXT], ['"bluebell.png"', STR]],
  [['  scale={', TXT], ['pop', TXT], ['(t, ', TXT], ['4.2', NUM], [')} />', TXT]],
  [['<', DIM], ['Eyedropper', FN], [' hex=', TXT], ['"#153D4F"', STR], [' />', DIM]],
];
const CodeLines: React.FC<{ t: number; a: number; b: number; size: number; lh: number; nums?: boolean; caret?: boolean }> = ({ t, a, b, size, lh, nums = true, caret = true }) => {
  const total = CODE.reduce((n, l) => n + l.reduce((m, [s]) => m + s.length, 0) + 1, 0);
  let budget = Math.round(lerp(t, a, b, 0, total, (x) => x));
  let caretAt: [number, number] | null = null;
  const rows = CODE.map((line, i) => {
    const out: React.ReactNode[] = [];
    let col = 0;
    for (const [s, c] of line) {
      const k = Math.max(0, Math.min(s.length, budget));
      if (k > 0) out.push(<span key={out.length} style={{ color: c }}>{s.slice(0, k)}</span>);
      budget -= k;
      col += k;
      if (k < s.length && !caretAt) caretAt = [i, col];
    }
    if (budget > 0) budget -= 1;
    else if (!caretAt) caretAt = [i, col];
    return out;
  });
  const blinkOn = Math.floor(t * 2.4) % 2 === 0 || (caretAt && t < b);
  return (
    <div style={{ fontFamily: mono, fontSize: size, lineHeight: `${lh}px`, whiteSpace: 'pre' }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', height: lh }}>
          {nums && <span style={{ color: '#5E5560', width: size * 1.9 }}>{String(i + 1).padStart(2, ' ')}</span>}
          <span>
            {r}
            {caret && caretAt && caretAt[0] === i && blinkOn && <span style={{ display: 'inline-block', width: size * 0.55, height: size * 1.15, background: '#fff', verticalAlign: 'middle', marginLeft: 2 }} />}
          </span>
        </div>
      ))}
    </div>
  );
};

// ---------- scenes ----------
const Hook: React.FC<{ t: number }> = ({ t }) => {
  const [a, b] = S.hook;
  const tear = lerp(t, 0.85, 1.35, 0, 1, Easing.out(Easing.back(1.4)));
  const topX = W - (W - 690) * tear, botX = W - (W - 250) * tear;
  const out = lerp(t, b - 0.25, b, 1, 0);
  const shake = t > 0.5 && t < 0.75 ? Math.sin(t * 120) * 8 : 0;
  return (
    <AbsoluteFill style={{ opacity: out, transform: `scale(${1 + (1 - out) * 0.08})` }}>
      <Sequence from={0} durationInFrames={Math.round(b * FPS)} layout="none">
        <OffthreadVideo src={staticFile('bts/reel.mp4')} startFrom={Math.round(3.9 * FPS)} muted style={{ width: W, height: H }} />
      </Sequence>
      <AbsoluteFill style={{ background: DARK, clipPath: `polygon(${topX}px 0, ${W}px 0, ${W}px ${H}px, ${botX}px ${H}px)` }}>
        <div style={{ position: 'absolute', left: 300, top: 640 }}>
          <CodeLines t={t} a={0.95} b={2.4} size={30} lh={56} nums={false} />
        </div>
      </AbsoluteFill>
      {tear > 0.01 && (
        <svg width={W} height={H} style={{ position: 'absolute' }}>
          <line x1={topX} y1={0} x2={botX} y2={H} stroke={C.blush} strokeWidth={12} />
        </svg>
      )}
      <Clawd x={botX + (topX - botX) * 0.22 + 70} y={1500} size={170} t={t} s={pop(t, 1.7)} mood="wave" />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 170, padding: '40px 0 44px', background: 'rgba(25,8,16,.78)', textAlign: 'center', fontFamily: sans, transform: `translateX(${shake}px)`, opacity: lerp(t, 0, 0.12, 0, 1) }}>
        <div style={{ fontSize: 78, fontWeight: 800, color: C.ivory, lineHeight: 1.1 }}>Video ni takde</div>
        <div style={{ fontSize: 80, fontWeight: 900, color: C.blush, lineHeight: 1.15, transform: `scale(${pop(t, 0.45, 9)})` }}>SATU keyframe pun.</div>
        <div style={{ fontSize: 40, fontWeight: 600, color: C.ivory, marginTop: 14, opacity: lerp(t, 1.45, 1.7, 0, 1) }}>Semua code. Ni cara dia ↓</div>
      </div>
    </AbsoluteFill>
  );
};

const BRIEF = 'Animate 8 page catalog Drop 1, gaya editor moves, warna Petal Pop. 9:16.';
const REPLY = 'Jom! Aku buat dalam Remotion: free transform, marquee, eyedropper, select all.';
const Chat: React.FC<{ t: number }> = ({ t }) => {
  const [a] = S.chat;
  const s = pop(t, a, 13);
  const dots = t > a + 1.75 && t < a + 2.25;
  return (
    <Win x={70} y={170} w={940} h={1120} title="Claude" s={s}>
      <div style={{ position: 'absolute', right: 40, top: 50, maxWidth: 680, background: C.blush, color: '#4A1530', borderRadius: '34px 34px 8px 34px', padding: '30px 36px', fontFamily: sans, fontSize: 40, fontWeight: 600, lineHeight: 1.35, opacity: t > a + 0.3 ? 1 : 0 }}>
        {typed(BRIEF, t, a + 0.3, a + 1.6)}
      </div>
      <Clawd x={95} y={540} size={100} t={t} s={pop(t, a + 1.65)} mood={dots ? 'type' : 'idle'} />
      {dots && (
        <div style={{ position: 'absolute', left: 160, top: 450, background: '#F3EEF1', borderRadius: 30, padding: '24px 30px', display: 'flex', gap: 12 }}>
          {[0, 1, 2].map((i) => <div key={i} style={{ width: 18, height: 18, borderRadius: 9, background: '#9C8C96', transform: `translateY(${Math.sin(t * 14 - i) * 6}px)` }} />)}
        </div>
      )}
      {t >= a + 2.25 && (
        <div style={{ position: 'absolute', left: 160, top: 420, maxWidth: 700, background: '#F3EEF1', color: C.ink, borderRadius: '34px 34px 34px 8px', padding: '30px 36px', fontFamily: sans, fontSize: 40, fontWeight: 500, lineHeight: 1.35 }}>
          {typed(REPLY, t, a + 2.25, a + 3.3)}
        </div>
      )}
      <div style={{ position: 'absolute', left: 40, right: 40, bottom: 40, height: 96, borderRadius: 48, border: '3px solid #E6D9E0', display: 'flex', alignItems: 'center', padding: '0 36px', fontFamily: sans, fontSize: 34, color: '#B3A5AE' }}>Reply to Claude...</div>
    </Win>
  );
};

const Code: React.FC<{ t: number }> = ({ t }) => {
  const [a] = S.code;
  const s = pop(t, a, 13);
  const CH = 31 * 0.6, X0 = 30 + 31 * 1.9;
  const hl = (at: number, row: number, col: number, len: number, label: string, flowerN: number) => {
    const k = pop(t, a + at, 12);
    const left = X0 + col * CH - 10, top = 40 + row * 66 + 2, w = len * CH + 20;
    return (
      <>
        {k > 0 && <div style={{ position: 'absolute', left, top, width: w, height: 62, border: `4px solid ${C.blush}`, borderRadius: 12, opacity: Math.min(1, k), transform: `scale(${0.9 + 0.1 * k})` }} />}
        {k > 0 && (
          <div style={{ position: 'absolute', left: left + w - 20, top: top - 40, background: C.blush, color: C.berry, fontFamily: sans, fontWeight: 800, fontSize: 30, padding: '4px 18px', borderRadius: 30, transform: `scale(${k})` }}>{label}</div>
        )}
        <Flower x={880} y={top + 40} size={140} s={pop(t, a + at + 0.1, 9)} n={flowerN} />
      </>
    );
  };
  return (
    <>
      <Win x={50} y={250} w={980} h={960} title="PetalPopDrop1.tsx" dark s={s}>
        <div style={{ position: 'absolute', left: 30, top: 40 }}>
          <CodeLines t={t} a={a + 0.35} b={a + 4.6} size={31} lh={66} />
        </div>
        {hl(1.3, 1, 2, 7, 'pop!', 1)}
        {hl(3.0, 5, 10, 12, 'gerak', 3)}
        <div style={{ position: 'absolute', right: 30, bottom: 26, fontFamily: mono, fontSize: 24, color: '#6F6470' }}>0 keyframe · 100% code</div>
      </Win>
      <Clawd x={850} y={272} size={150} t={t} s={pop(t, a + 0.3)} mood="type" />
    </>
  );
};

const Preview: React.FC<{ t: number }> = ({ t }) => {
  const [a] = S.prev;
  const s = pop(t, a, 13);
  const ph = lerp(t, a + 0.3, a + 4.4, 0, 1, (x) => x);
  const sb = pop(t, a + 2.5, 14);
  return (
    <>
      <Win x={50} y={170} w={980} h={1120} title="Remotion Studio" dark s={s}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 760, background: '#141114', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: 396, height: 704, overflow: 'hidden', borderRadius: 8, boxShadow: '0 0 0 2px #333' }}>
            <Sequence from={Math.round(a * FPS)} durationInFrames={Math.round(5 * FPS)} layout="none">
              <OffthreadVideo src={staticFile('bts/reel.mp4')} startFrom={Math.round(0.6 * FPS)} playbackRate={2.6} muted style={{ width: 396, height: 704 }} />
            </Sequence>
          </div>
        </div>
        <div style={{ position: 'absolute', left: 30, right: 30, top: 790, height: 240 }}>
          {[C.blush, C.lavender, C.leaf, C.peach, C.blush].map((c, i) => (
            <div key={i} style={{ position: 'absolute', left: `${[2, 14, 30, 52, 70][i]}%`, width: `${[34, 28, 36, 26, 28][i]}%`, top: i * 46, height: 34, borderRadius: 8, background: c, opacity: 0.9 }} />
          ))}
          <div style={{ position: 'absolute', left: `${ph * 100}%`, top: -16, bottom: -6, width: 4, background: '#FF5A5A' }} />
          <div style={{ position: 'absolute', left: `calc(${ph * 100}% - 12px)`, top: -24, width: 28, height: 22, background: '#FF5A5A', clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
        </div>
      </Win>
      {sb > 0.001 && (
        <div style={{ position: 'absolute', left: 150, top: 380, width: 780, transform: `translateY(${(1 - sb) * 500}px) rotate(${-4 * sb}deg)`, opacity: Math.min(1, sb * 2), boxShadow: '0 30px 60px rgba(0,0,0,.35)', borderRadius: 14, overflow: 'hidden', background: '#fff' }}>
          <Img src={staticFile('bts/storyboard.jpg')} style={{ width: 780, display: 'block' }} />
          <div style={{ position: 'absolute', right: 26, top: 22, background: C.leaf, color: '#fff', fontFamily: sans, fontWeight: 800, fontSize: 34, padding: '8px 22px', borderRadius: 30, transform: `scale(${pop(t, a + 3.2, 9)}) rotate(6deg)` }}>Storyboard ✓</div>
        </div>
      )}
    </>
  );
};

const Render: React.FC<{ t: number }> = ({ t }) => {
  const [a] = S.rend;
  const s = pop(t, a, 13);
  const p = lerp(t, a + 1.35, a + 2.95, 0, 1, Easing.inOut(Easing.quad));
  const done = t > a + 3.05;
  const line = (txt: React.ReactNode, at: number, top: number, color = TXT) =>
    t >= a + at && <div style={{ position: 'absolute', left: 40, top, fontFamily: mono, fontSize: 34, color }}>{txt}</div>;
  return (
    <>
      <Win x={50} y={360} w={980} h={760} title="Terminal — zsh" dark s={s}>
        <div style={{ position: 'absolute', left: 40, top: 40, fontFamily: mono, fontSize: 36, color: NUM }}>
          $ <span style={{ color: TXT }}>{typed('npx remotion render PetalPopDrop1', t, a + 0.3, a + 1.0)}</span>
        </div>
        {line('Bundling... ✓', 1.1, 120, DIM)}
        {line(`Rendering frames ${Math.round(p * 540)}/540`, 1.3, 190)}
        {t >= a + 1.3 && (
          <div style={{ position: 'absolute', left: 40, top: 270, width: 900, height: 40, borderRadius: 20, background: '#3A333C', overflow: 'hidden' }}>
            <div style={{ width: `${p * 100}%`, height: '100%', background: `linear-gradient(90deg, ${C.blush}, ${C.peach})`, borderRadius: 20 }} />
          </div>
        )}
        {line(`Encoding... ${Math.round(lerp(t, a + 2.2, a + 3.0, 0, 100, (x) => x))}%`, 2.2, 350, DIM)}
        {done && <div style={{ position: 'absolute', left: 40, top: 430, fontFamily: mono, fontSize: 38, color: '#8BE39A', transform: `scale(${0.8 + 0.2 * pop(t, a + 3.05, 9)})`, transformOrigin: 'left center' }}>✓ out/PetalPop_Drop1.mp4</div>}
      </Win>
      <Clawd x={820} y={1140} size={170} t={t} s={pop(t, a + 0.2)} mood={done ? 'jump' : 'type'} />
      {[0, 1, 2].map((i) => <Flower key={i} x={[150, 520, 900][i]} y={[330, 300, 360][i]} size={150} s={pop(t, a + 3.1 + i * 0.08, 8)} n={[2, 5, 7][i]} rot={i * 40} />)}
    </>
  );
};

const Payoff: React.FC<{ t: number }> = ({ t }) => {
  const [a] = S.pay;
  const k = lerp(t, a, a + 0.5, 0, 1, Easing.out(Easing.cubic));
  const stats: [string, string][] = [['18s', 'durasi'], ['540', 'frame'], ['0', 'keyframe']];
  return (
    <AbsoluteFill style={{ opacity: k, transform: `scale(${0.8 + 0.2 * k})`, borderRadius: (1 - k) * 60, overflow: 'hidden' }}>
      <Sequence from={Math.round(a * FPS)} layout="none">
        <OffthreadVideo src={staticFile('bts/reel.mp4')} startFrom={Math.round(8.6 * FPS)} muted style={{ width: W, height: H }} />
      </Sequence>
      <div style={{ position: 'absolute', left: 60, right: 60, top: 1130, height: 300, borderRadius: 40, background: 'rgba(25,8,16,.82)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', opacity: lerp(t, a + 0.6, a + 0.8, 0, 1) }}>
        {stats.map(([n, l], i) => {
          const s = pop(t, a + 0.75 + i * 0.35, 9);
          return (
            <div key={l} style={{ textAlign: 'center', fontFamily: sans, transform: `scale(${s})` }}>
              <div style={{ fontSize: 120, fontWeight: 900, color: i === 2 ? C.blush : C.ivory, lineHeight: 1 }}>{n}</div>
              <div style={{ fontSize: 38, fontWeight: 600, color: C.ivory, marginTop: 10 }}>{l}</div>
            </div>
          );
        })}
      </div>
      <Clawd x={W - 170} y={1150} size={160} t={t} s={pop(t, a + 1.9)} mood="wave" />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1460, display: 'flex', justifyContent: 'center', opacity: lerp(t, a + 2.1, a + 2.4, 0, 1) }}>
        <div style={{ background: C.berry, color: C.ivory, fontFamily: sans, fontSize: 38, fontWeight: 800, padding: '14px 36px', borderRadius: 40 }}>Made with Claude × Remotion</div>
      </div>
    </AbsoluteFill>
  );
};

export const PetalPopBTS: React.FC<{ withAudio?: boolean }> = ({ withAudio }) => {
  const t = useCurrentFrame() / FPS;
  const desk = t >= S.chat[0] - 0.3 && t < S.pay[0] + 0.6;
  const fadeOut = (k: keyof typeof S) => lerp(t, S[k][1] - 0.2, S[k][1], 1, 0);
  return (
    <AbsoluteFill style={{ background: C.ivory }}>
      {desk && <Desktop t={t} />}
      {inScene(t, 'chat') && <AbsoluteFill style={{ opacity: fadeOut('chat') }}><Chat t={t} /><Caption t={t} at={S.chat[0] + 0.4} n="1" text="Brief kat Claude" /></AbsoluteFill>}
      {inScene(t, 'code') && <AbsoluteFill style={{ opacity: fadeOut('code') }}><Code t={t} /><Caption t={t} at={S.code[0] + 0.4} n="2" text="Code, bukan keyframe" /></AbsoluteFill>}
      {inScene(t, 'prev') && <AbsoluteFill style={{ opacity: fadeOut('prev') }}><Preview t={t} /><Caption t={t} at={S.prev[0] + 0.4} n="3" text="Preview & storyboard" /></AbsoluteFill>}
      {inScene(t, 'rend') && <AbsoluteFill><Render t={t} /><Caption t={t} at={S.rend[0] + 0.4} n="4" text="Render!" /></AbsoluteFill>}
      {t >= S.pay[0] && <Payoff t={t} />}
      {t < S.hook[1] && <Hook t={t} />}
      {withAudio && <Audio src={staticFile('bts/sfx.wav')} />}
      {withAudio &&
        L.VO.map((v) => (
          <Sequence key={v.file} from={Math.round(v.at * FPS)} layout="none">
            <Audio src={staticFile(`bts/vo/${v.file}`)} />
          </Sequence>
        ))}
    </AbsoluteFill>
  );
};
