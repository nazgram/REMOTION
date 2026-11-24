import React, {useContext} from 'react';
import {AbsoluteFill, Easing, Freeze, interpolate, Internals, OffthreadVideo, useCurrentFrame} from 'remotion';
import {CLIP_PAD, clipFile} from '../shots';
import {asset, FPS} from '../util';
import {srcAt} from './ramp';
import {VUse} from './vplan';

// Klip menegak penuh skrin (VIDEO GRADE asli 1080x1920) dengan speed ramp: setiap frame output dipetakan ke masa
// sumber melalui kunci ramp (Freeze + OffthreadVideo). punch = zoom 1.12 -> 1 semasa laju turun ke slow-mo.
export const VClip: React.FC<{use: VUse}> = ({use}) => {
  const frame = useCurrentFrame();
  // Freeze tambah relativeFrom sahaja tetapi video tolak cumulatedFrom + relativeFrom (diuji): tambah cumulatedFrom.
  const seq = useContext(Internals.SequenceContext);
  const nestOff = seq ? seq.cumulatedFrom : 0;
  const src = CLIP_PAD + srcAt(use.keys, frame, FPS);
  const punch = use.punch ? interpolate(frame, [0, 0.4 * FPS], [1.12, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}) : 1;
  const drift = interpolate(frame, [0, 3 * FPS], [1, 1.03], {extrapolateRight: 'clamp'});
  const fx = (use.shot.focusX ?? 0.5) * 100, fy = (use.shot.focusY ?? 0.4) * 100;
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
      <Freeze frame={Math.round(src * FPS) + nestOff}>
        <OffthreadVideo
          src={asset(clipFile(use.shot))}
          muted
          style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${use.zoom * punch * drift})`, transformOrigin: `${fx}% ${fy}%`}}
        />
      </Freeze>
    </AbsoluteFill>
  );
};
