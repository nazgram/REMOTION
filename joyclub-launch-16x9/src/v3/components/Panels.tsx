import React from 'react';
import {AbsoluteFill, Easing, interpolate, OffthreadVideo, Sequence, useCurrentFrame} from 'remotion';
import {CAMERA_OFFSET} from '../designs';
import {H, panelRects, Pt, SHAPES, ShapeId, ShapePanel, W} from '../layout';
import {Shot} from '../shots';
import {asset, f} from '../util';

const src = (s: Shot) => asset(s.cam === 'v' ? 'vertical.mp4' : 'landscape.mp4');

// Satu klip dalam kotak; cover + zoom tetap + drift perlahan (<=3%), tiada zoom pulse.
export const Clip: React.FC<{shot: Shot; x: number; y?: number; w: number; h?: number; life: number}> = ({shot, x, y = 0, w, h = H, life}) => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, Math.max(1, f(life))], [1, 1.03], {extrapolateRight: 'clamp'});
  const t = shot.t + (shot.cam === 'l' ? CAMERA_OFFSET : 0);
  const fx = (shot.focusX ?? 0.5) * 100, fy = (shot.focusY ?? 0.4) * 100;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, overflow: 'hidden'}}>
      <OffthreadVideo
        src={src(shot)}
        muted
        startFrom={f(t)}
        playbackRate={shot.speed ?? 1}
        style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${fx}% ${fy}%`, transform: `scale(${(shot.zoom ?? 1) * drift})`, transformOrigin: `${fx}% ${fy}%`}}
      />
    </div>
  );
};

const polyCss = (poly: Pt[]) => `polygon(${poly.map(([x, y]) => `${x}px ${y}px`).join(',')})`;

// Panel masuk dengan slide pendek (atas/bawah berselang) di dalam bentuknya. Klip mula main bila panel masuk.
const EnterPanel: React.FC<{panel: ShapePanel; shot: Shot; life: number; dir: 1 | -1}> = ({panel, shot, life, dir}) => {
  const frame = useCurrentFrame();
  const k = interpolate(frame, [0, f(0.32)], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{clipPath: polyCss(panel.poly)}}>
      <AbsoluteFill style={{transform: `translateY(${(1 - k) * dir * H}px)`}}>
        <Clip shot={shot} x={panel.box.x} y={panel.box.y} w={panel.box.w} h={panel.box.h} life={life} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Bentuk panel penuh skrin. Ruang panel yang belum masuk = warna design. enterAt/endAt dalam saat tempatan.
export const ShapePanels: React.FC<{panels: ShapePanel[]; shots: Shot[]; enterAt: number[]; endAt: number; bg: string}> = ({panels, shots, enterAt, endAt, bg}) => (
  <AbsoluteFill style={{background: '#fff'}}>
    {panels.map((p, i) => (
      <AbsoluteFill key={`bg${i}`} style={{clipPath: polyCss(p.poly), background: bg}} />
    ))}
    {panels.map((p, i) => (
      <Sequence key={i} from={f(enterAt[i])} durationInFrames={Math.max(1, f(endAt) - f(enterAt[i]))} premountFor={30}>
        <EnterPanel panel={p} shot={shots[i]} life={endAt - enterAt[i]} dir={i % 2 === 0 ? 1 : -1} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

export const shapePanels = (id: ShapeId) => SHAPES[id];

export const stripPanels = (n: 2 | 3 | 5): ShapePanel[] =>
  panelRects(n).map((r) => ({poly: [[r.x, 0], [r.x + r.w, 0], [r.x + r.w, H], [r.x, H]], box: {x: r.x, y: 0, w: r.w, h: H}}));

export const FullLandscape: React.FC<{shot: Shot; dur: number}> = ({shot, dur}) => <Clip shot={shot} x={0} w={W} life={dur} />;
