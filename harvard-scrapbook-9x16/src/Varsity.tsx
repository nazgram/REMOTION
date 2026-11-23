import React from 'react';
import {AbsoluteFill, Easing, interpolate, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';

// Font roles: G = Apple Garamond Light, GI = Apple Garamond Light Italic, D = Dream Avenue, P = Poppins Light (small, tracked caps)
type Role = 'G' | 'GI' | 'D' | 'P';
type Line = [Role, string];
// Quote text exactly as Nas wrote it, split into lines for the type lockup
export const QUOTES: Line[][] = [
  [['P', 'Lesson I have learned'], ['GI', 'this year.']],
  [['G', 'Do it'], ['D', 'alone.']],
  [['G', 'Do it'], ['GI', 'for yourself.']],
  [['D', 'Love yourself first.'], ['P', 'Always.']],
  [['P', 'Protect your'], ['GI', 'inner peace.']],
  [['G', 'Let go of'], ['GI', 'what hurts.']],
  [['GI', "It's okay to have"], ['D', 'bad days.']],
  [['P', 'Be kind'], ['G', 'to others.']],
  [['G', 'Be humble with yourself'], ['GI', 'and your friends.']],
  [['D', 'Small steps'], ['P', 'matters.']],
  [['P', 'Stay'], ['GI', 'consistent.']],
  [['G', 'Walk away when'], ['GI', 'it feels heavy.']],
  [['D', 'Keep going.']],
];

export const VARSITY_DURATION = 905;
const END = 670; // 22.33s: every quote is gone before the video's own VARSITY title (22.6s)
const SLOT = END / QUOTES.length; // ~51.5 frames (~1.72s)
const IN = 14;
const OUT = 9;

const style = (r: Role): React.CSSProperties => {
  switch (r) {
    case 'G':
      return {fontFamily: 'AGRegular', fontSize: 96, lineHeight: 0.95};
    case 'GI':
      return {fontFamily: 'AGItalic', fontSize: 100, lineHeight: 0.95};
    case 'D':
      return {fontFamily: 'DreamAvenue', fontSize: 100, lineHeight: 1.0};
    case 'P':
      return {fontFamily: 'PoppinsMedium', fontSize: 54, letterSpacing: '0.16em', textTransform: 'uppercase', lineHeight: 1.2, paddingLeft: '0.16em'};
  }
};

const Quote: React.FC<{lines: Line[]; l: number; dur: number}> = ({lines, l, dur}) => {
  const out = interpolate(l, [dur - OUT, dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1130, textAlign: 'center', color: '#000000'}}>
      {lines.map(([r, t], i) => {
        const li = l - i * 5;
        const p = interpolate(li, [0, IN], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
        return (
          <div
            key={i}
            style={{
              ...style(r),
              opacity: p * (1 - out),
              transform: `translateY(${(1 - p) * 22 - out * 8}px)`,
              filter: `blur(${(1 - p) * 8 + out * 6}px)`,
              marginTop: i ? (r === 'P' || lines[i - 1][0] === 'P' ? 6 : -10) : 0,
            }}
          >
            {t}
          </div>
        );
      })}
    </div>
  );
};

export const Varsity: React.FC<{withVideo?: boolean}> = ({withVideo = true}) => {
  const frame = useCurrentFrame();
  const k = Math.floor(frame / SLOT);
  const s0 = Math.round(k * SLOT);
  const s1 = Math.round((k + 1) * SLOT);
  return (
    <AbsoluteFill style={{background: withVideo ? '#000' : 'transparent'}}>
      {withVideo ? <OffthreadVideo src={staticFile('varsity/bg.mp4')} muted /> : null}
      {k < QUOTES.length && frame < END ? <Quote lines={QUOTES[k]} l={frame - s0} dur={s1 - s0} /> : null}
    </AbsoluteFill>
  );
};
