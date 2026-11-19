import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {BloomAccent, BloomSweep, Origin, SweepTiming} from './components/Bloom';
import {NameCard} from './components/NameCard';
import {ShapePanels} from './components/Panels';
import {DesignId} from './designs';
import {SHAPES} from './layout';
import {SHOTS} from './shots';
import {f} from './util';

// Satu blok design. Masa tempatan 0 = mula sweep (pre saat sebelum blok). Semua masa lain dalam saat dari mula blok:
// enter = masuk panel (beat 0, 1, 2), card = kad nama (beat 0.5), accent/accentOut (beat 1.5 / 3.4), end = hujung Sequence.
export type BlockTimes = {enter: number[]; card: number; accent: number; accentOut: number; end: number};
export const DesignBlock: React.FC<{design: DesignId; origin: Origin; timing: SweepTiming; times: BlockTimes}> = ({design, origin, timing, times}) => {
  const {pre} = timing;
  const sh = SHOTS[design];
  const at = (s: number) => f(pre + s);
  return (
    <AbsoluteFill>
      <BloomSweep design={design} origin={origin} timing={timing} />
      <Sequence from={at(0)} durationInFrames={f(times.end) + 1} layout="none">
        <ShapePanels panels={SHAPES[sh.shape]} shots={sh.panels} enterAt={times.enter} endAt={times.end} />
      </Sequence>
      <Sequence from={at(times.accent)} durationInFrames={f(times.accentOut - times.accent + 0.4)} layout="none">
        <BloomAccent design={design} corner="br" outAt={times.accentOut - times.accent} />
      </Sequence>
      <Sequence from={at(times.card)} layout="none">
        <NameCard design={design} />
      </Sequence>
    </AbsoluteFill>
  );
};
