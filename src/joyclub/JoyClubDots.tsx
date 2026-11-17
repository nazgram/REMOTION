import React from 'react';
import { AbsoluteFill, Audio, Easing, interpolate, interpolateColors, spring, staticFile, useCurrentFrame } from 'remotion';
import T from './timeline.json';
import S from './shapes.json';

// Joy Club polka dot teaser: Nas's hand-drawn dots pop on, breathe and bounce, gather into one giant dot that
// swells over the screen and becomes the next colourway. Five colourways, no text, no logo, SFX only.

const { FPS, W, H } = T;
const CX = W / 2, CY = H / 2;
const COVER = Math.hypot(W, H) * 0.62; // giant dot radius that covers the frame (wobbly edge included)
const GIANT_R0 = 170;
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const easeIn = Easing.in(Easing.cubic);
const easeOut = Easing.out(Easing.cubic);

type Dot = (typeof T.segments)[number]['dots'][number];
type Seg = (typeof T.segments)[number];

const Defs: React.FC = () => (
  <defs>
    {S.shapes.map((s, i) => (
      <g id={`jc${i}`} key={i} transform={`scale(${1 / s.size}) translate(${-s.cx} ${-s.cy})`}>
        <path d={s.d} />
      </g>
    ))}
  </defs>
);

const DotUse: React.FC<{ x: number; y: number; d: number; rot: number; shape: number; fill: string }> = ({ x, y, d, rot, shape, fill }) =>
  d <= 0.01 ? null : <use href={`#jc${shape}`} fill={fill} transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot}) scale(${d.toFixed(3)})`} />;

function dotState(q: Dot, seg: Seg, frame: number) {
  const t = frame / FPS;
  let s = spring({ frame: frame - q.pop * FPS, fps: FPS, config: { damping: 8, stiffness: 170, mass: 0.6 } });
  let x = q.x, y = q.y, rot = q.rot;
  // play: breathe + little bounces (or a slow float on the last colourway)
  const [p0, p1] = seg.play;
  if (t > p0) {
    if (seg.last) {
      const env = clamp((t - p0) / 0.8);
      s *= 1 + env * 0.05 * Math.sin(t * 2.2 + q.phase);
      x += env * 7 * Math.cos(t * 0.9 + q.phase);
      y += env * 10 * Math.sin(t * 1.15 + q.phase);
      rot += env * 6 * Math.sin(t * 0.7 + q.phase);
    } else {
      const env = clamp((t - p0) / 0.25) * clamp((p1 + 0.25 - t) / 0.3);
      s *= 1 + env * 0.09 * Math.sin(t * 7 + q.phase);
      y -= env * 16 * Math.abs(Math.sin(t * 5.2 + q.phase));
    }
  }
  // gather into the centre
  if (seg.gather && t > q.gather) {
    const u = clamp((t - q.gather) / 0.42);
    const e = easeIn(u);
    x += (CX - x) * e;
    y += (CY - y) * e;
    s *= u >= 0.97 ? 0 : 1 - 0.75 * e;
    rot += 90 * e;
  }
  return { x, y, d: q.d * s, rot };
}

const Giant: React.FC<{ seg: Seg; frame: number }> = ({ seg, frame }) => {
  if (!seg.gather || !seg.expand || !seg.nextBg) return null;
  const t = frame / FPS;
  if (t < seg.gather[0] + 0.12) return null;
  const g = clamp((t - seg.gather[0] - 0.12) / (seg.gather[1] - seg.gather[0] - 0.05));
  let r = GIANT_R0 * easeOut(g);
  // the dots landing make it wobble a little
  r *= 1 + 0.04 * Math.sin(t * 22) * (1 - g) * g * 4;
  let fill = seg.dot;
  if (t > seg.expand[0]) {
    const v = clamp((t - seg.expand[0]) / (seg.expand[1] - seg.expand[0]));
    r = interpolate(easeIn(v), [0, 1], [GIANT_R0, COVER]);
    fill = interpolateColors(v, [0, 0.55], [seg.dot, seg.nextBg]);
  }
  return <DotUse x={CX} y={CY} d={r * 2} rot={(t * 25) % 360} shape={0} fill={fill} />;
};

export const JoyClubDots: React.FC<{ withAudio: boolean }> = ({ withAudio }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const seg = T.segments.find((s) => t >= s.start && t < s.end) ?? T.segments[T.segments.length - 1];
  return (
    <AbsoluteFill style={{ backgroundColor: seg.bg }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs />
        {seg.dots.map((q, i) => {
          const st = dotState(q, seg, frame);
          return <DotUse key={i} {...st} shape={q.shape} fill={seg.dot} />;
        })}
        <Giant seg={seg} frame={frame} />
      </svg>
      {withAudio && <Audio src={staticFile('joyclub/sfx.wav')} />}
    </AbsoluteFill>
  );
};
