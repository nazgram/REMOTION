import React from 'react';
import {AbsoluteFill, interpolate, OffthreadVideo, Sequence, useCurrentFrame} from 'remotion';
import {CAMERA_OFFSET} from '../designs';
import {H, panelRects} from '../layout';
import {Shot} from '../shots';
import {asset, f} from '../util';

const src = (s: Shot) => asset(s.cam === 'v' ? 'vertical.mp4' : 'landscape.mp4');

// Satu klip dalam kotak; cover + drift perlahan (<=3%), tiada zoom pulse.
export const Clip: React.FC<{shot: Shot; x: number; y?: number; w: number; h?: number; life: number}> = ({shot, x, y = 0, w, h = H, life}) => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, Math.max(1, f(life))], [1, 1.03], {extrapolateRight: 'clamp'});
  const t = shot.t + (shot.cam === 'l' ? CAMERA_OFFSET : 0);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, overflow: 'hidden', background: '#fff'}}>
      <OffthreadVideo
        src={src(shot)}
        muted
        startFrom={f(t)}
        playbackRate={shot.speed ?? 1}
        style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: `50% ${(shot.focusY ?? 0.4) * 100}%`, transform: `scale(${drift})`}}
      />
    </div>
  );
};

// Grid panel penuh skrin. shots[i] = set A panel i; shots[n+i] = set B panel i, masuk pada switchAt[i] (saat tempatan).
export const Panels: React.FC<{n: 2 | 3 | 5; shots: Shot[]; switchAt?: number[]; dur: number}> = ({n, shots, switchAt = [], dur}) => {
  const rects = panelRects(n);
  return (
    <AbsoluteFill style={{background: '#fff'}}>
      {rects.map((r, i) => {
        const sw = switchAt[i];
        const b = shots[n + i];
        if (sw === undefined || !b) return <Clip key={i} shot={shots[i]} x={r.x} w={r.w} life={dur} />;
        return (
          <React.Fragment key={i}>
            <Sequence durationInFrames={f(sw)} layout="none">
              <Clip shot={shots[i]} x={r.x} w={r.w} life={sw} />
            </Sequence>
            <Sequence from={f(sw)} layout="none">
              <Clip shot={b} x={r.x} w={r.w} life={dur - sw} />
            </Sequence>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

export const FullLandscape: React.FC<{shot: Shot; dur: number}> = ({shot, dur}) => <Clip shot={shot} x={0} w={1920} life={dur} />;
