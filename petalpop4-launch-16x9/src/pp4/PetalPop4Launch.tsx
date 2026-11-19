import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence} from 'remotion';
import beatsData from '../../public/pp4/beats.json';
import {beatAt} from './beats';
import {DESIGN_SWEEP, Origin, SweepTiming} from './components/Bloom';
import {ComingSoon, ComingTimes, NafesaFade} from './components/EndCards';
import {EnterPanel} from './components/Panels';
import {DesignBlock, BlockTimes} from './DesignBlock';
import {DESIGNS, ORDER} from './designs';
import {stripPanels} from './layout';
import {CLIMAX, CLIMAX_ENTER, ENTER} from './shots';
import {buildTimeline, END} from './timeline';
import {asset, f} from './util';

export const TOTAL_FRAMES = f(END);
const BEATS = beatsData.beats as number[];
const at = (k: number) => (k === 0 ? 0 : beatAt(k, BEATS));
const TL = buildTimeline(BEATS);
const seg = (kind: string) => TL.find((s) => s.kind === kind)!;
const BLOCKS = TL.filter((s) => s.kind === 'design');
const CLIMAX_SEG = seg('climax');
const COMING = seg('coming');
const NAF = seg('nafesa');

// Intro = sweep pertama: bunga Pearl Grey mekar dari tengah atas latar warnanya (beat 0-2), terus jadi blok Pearl Grey.
const INTRO_SWEEP: SweepTiming = {pre: BLOCKS[0].start, maskLag: 0.3, spread: 0.55, grow: 0.5, settle: 0.5};
const ORIGINS: Origin[] = ['center', 'bottom', 'bl', 'tr', 'center', 'bottom'];
const HOLD = 3 / 60; // blok lama kekal 3 frame lepas blok baru mula (tiada jurang 1 frame)

const blocks = BLOCKS.map((s, i) => {
  const timing = i === 0 ? INTRO_SWEEP : DESIGN_SWEEP;
  // Black Dahlia kekal sampai semua jalur klimaks masuk.
  const endAbs = i < BLOCKS.length - 1 ? BLOCKS[i + 1].start + HOLD : at(CLIMAX_SEG.beat0 + 3.5);
  const b = (k: number) => at(s.beat0 + k) - s.start;
  const times: BlockTimes = {enter: ENTER.map(b), card: b(0.5), accent: b(1.5), accentOut: b(3.4), end: endAbs - s.start};
  return {s, design: s.design!, timing, from: s.start - timing.pre, endAbs, times, origin: ORIGINS[i]};
});

const climaxAt = CLIMAX_ENTER.map((k) => at(CLIMAX_SEG.beat0 + k));
const climaxEnd = COMING.start + 0.75; // jalur kekal sampai print Black Dahlia penuh
const cb = (k: number) => at(COMING.beat0 + k) - COMING.start;
const COMING_T: ComingTimes = {
  letters: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => cb(0.75 + i * 0.25)),
  shrink: cb(3.5),
  ring: cb(3.5),
  logoLetters: Array.from({length: 8}, (_, i) => cb(3.75 + i * 0.25)),
  motifs: cb(5.25),
  pill: cb(5.5),
  drops: Array.from({length: 5}, (_, i) => cb(5.6) + i * 0.07),
};

// SFX buatan sendiri (scripts/sfx.py), -18 dB di bawah lagu.
const SFX_VOL = Math.pow(10, -18 / 20);
type Hit = {t: number; file: 'pop' | 'pop-kecil' | 'whoosh'; gain?: number};
export const HITS: Hit[] = [
  {t: 0, file: 'whoosh', gain: 0.7},
  ...blocks.slice(1).map((b) => ({t: b.from, file: 'whoosh' as const})),
  ...blocks.flatMap((b) => b.times.enter.map((e) => ({t: b.s.start + e, file: 'pop-kecil' as const}))),
  ...blocks.map((b) => ({t: b.s.start + b.times.card, file: 'pop' as const})),
  ...climaxAt.map((t) => ({t, file: 'pop-kecil' as const})),
  {t: COMING.start, file: 'whoosh'},
  ...COMING_T.letters.map((t) => ({t: COMING.start + t, file: 'pop-kecil' as const, gain: 0.8})),
  {t: COMING.start + COMING_T.ring, file: 'pop'},
  ...COMING_T.logoLetters.map((t) => ({t: COMING.start + t, file: 'pop-kecil' as const, gain: 0.8})),
  {t: COMING.start + COMING_T.pill, file: 'pop'},
];

export const SEGMENT_TIMES = {blocks: blocks.map((b) => ({design: b.design, from: b.from, start: b.s.start, end: b.endAbs})), climaxAt, climaxEnd, coming: COMING.start, nafesa: NAF.start};

export const PetalPop4Launch: React.FC = () => {
  const strips = stripPanels(6);
  return (
    <AbsoluteFill style={{background: DESIGNS.pearl.bg}}>
      {blocks.map((b) => (
        <Sequence key={b.design} from={f(b.from)} durationInFrames={f(b.endAbs) - f(b.from)}>
          <DesignBlock design={b.design} origin={b.origin} timing={b.timing} times={b.times} />
        </Sequence>
      ))}
      {/* Klimaks: 6 jalur (satu setiap design) masuk setiap separuh beat atas blok Black Dahlia */}
      {strips.map((p, k) => (
        <Sequence key={`c${k}`} from={f(climaxAt[k])} durationInFrames={f(climaxEnd) - f(climaxAt[k])} premountFor={30}>
          <EnterPanel panel={p} shot={CLIMAX[k]} life={climaxEnd - climaxAt[k]} dir={k % 2 === 0 ? -1 : 1} leftGap={k > 0 ? 4 : 0} />
        </Sequence>
      ))}
      <Sequence from={f(COMING.start)} premountFor={30}>
        <ComingSoon times={COMING_T} />
      </Sequence>
      <Sequence from={f(NAF.start)}>
        <NafesaFade />
      </Sequence>
      <Audio src={asset('song.m4a')} volume={(fr) => interpolate(fr, [0, f(0.1), f(END - 0.5), f(END)], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
      {HITS.map((h, i) => (
        <Sequence key={`h${i}`} from={f(h.t)} durationInFrames={f(1)} layout="none">
          <Audio src={asset(`sfx-${h.file}.wav`)} volume={SFX_VOL * (h.gain ?? 1)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
