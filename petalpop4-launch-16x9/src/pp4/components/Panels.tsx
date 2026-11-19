import React from 'react';
import {AbsoluteFill, Easing, interpolate, OffthreadVideo, Sequence, useCurrentFrame} from 'remotion';
import {dividers, H, polyCss, ShapePanel} from '../layout';
import {CLIP_PAD, clipFile, Shot} from '../shots';
import {asset, f} from '../util';

// Satu klip graded (potongan dari raw, mula di t - CLIP_PAD) dalam kotak; cover + zoom tetap + drift perlahan (<=3%).
export const Clip: React.FC<{shot: Shot; x: number; y?: number; w: number; h?: number; life: number}> = ({shot, x, y = 0, w, h = H, life}) => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, Math.max(1, f(life))], [1, 1.03], {extrapolateRight: 'clamp'});
  const fx = (shot.focusX ?? 0.5) * 100, fy = (shot.focusY ?? 0.4) * 100;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, overflow: 'hidden'}}>
      <OffthreadVideo
        src={asset(clipFile(shot))}
        muted
        startFrom={f(CLIP_PAD)}
        playbackRate={shot.speed}
        style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${fx}% ${fy}%`, transform: `scale(${(shot.zoom ?? 1) * drift})`, transformOrigin: `${fx}% ${fy}%`}}
      />
    </div>
  );
};

// Panel masuk dengan slide pendek (atas/bawah berselang) di dalam bentuknya. Klip mula main bila panel masuk.
export const EnterPanel: React.FC<{panel: ShapePanel; shot: Shot; life: number; dir: 1 | -1; leftGap?: number}> = ({panel, shot, life, dir, leftGap = 0}) => {
  const frame = useCurrentFrame();
  const k = interpolate(frame, [0, f(0.32)], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const {x, w} = panel.box;
  return (
    <AbsoluteFill style={{transform: `translateY(${(1 - k) * dir * H}px)`}}>
      {leftGap > 0 && <div style={{position: 'absolute', left: x - leftGap, top: 0, width: leftGap, height: H, background: '#fff'}} />}
      <AbsoluteFill style={{clipPath: polyCss(panel.poly)}}>
        <Clip shot={shot} x={x} y={panel.box.y} w={w} h={panel.box.h} life={life} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Panel berbentuk atas latar print (slot kosong tunjuk print design). Garis putih turun dari atas pada beat 0.
// enterAt/endAt dalam saat tempatan blok.
export const ShapePanels: React.FC<{panels: ShapePanel[]; shots: Shot[]; enterAt: number[]; endAt: number}> = ({panels, shots, enterAt, endAt}) => {
  const frame = useCurrentFrame();
  const g = interpolate(frame, [0, f(0.3)], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill>
      {g > 0 &&
        dividers(panels).map((d, i) => (
          <AbsoluteFill key={`d${i}`} style={{clipPath: polyCss(d), background: '#fff', transform: `scaleY(${g})`, transformOrigin: i % 2 ? '50% 100%' : '50% 0%'}} />
        ))}
      {panels.map((p, i) => (
        <Sequence key={i} from={f(enterAt[i])} durationInFrames={Math.max(1, f(endAt) - f(enterAt[i]))} premountFor={30}>
          <EnterPanel panel={p} shot={shots[i]} life={endAt - enterAt[i]} dir={i % 2 === 0 ? 1 : -1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
