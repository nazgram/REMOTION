import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence} from 'remotion';
import {BloomAccent, BloomSweep} from '../components/Bloom';
import {ComingSoon, NafesaFade} from '../components/EndCards';
import {NameCard} from '../components/NameCard';
import {DESIGNS} from '../designs';
import {FmtCtx} from '../fmt';
import {COMING_T} from '../PetalPop4Launch';
import {END} from '../timeline';
import {asset, f} from '../util';
import {VClip} from './VClip';
import {at, BLOCKS, COMING, coverAt, NAF, V_BLOCKS, V_CLIMAX, V_INTRO, V_SWEEP0, vOrigin, VUse} from './vplan';

// Petal Pop Drop 4 teaser 9:16 (1080x1920, 60 fps), lagu dan beat sama dengan versi LED 16:9.
export const V_TOTAL_FRAMES = f(END);
const INTRO_END = V_BLOCKS[0].from + coverAt(V_SWEEP0) + 0.05;

const SFX_VOL = Math.pow(10, -18 / 20);
type Hit = {t: number; file: 'pop' | 'pop-kecil' | 'whoosh'; gain?: number};
export const V_HITS: Hit[] = [
  {t: 0, file: 'whoosh', gain: 0.7},
  ...V_BLOCKS.map((b, i) => ({t: b.from, file: 'whoosh' as const, gain: i === 0 ? 0.6 : 1})),
  ...V_BLOCKS.map((b) => ({t: b.card, file: 'pop' as const})),
  ...V_BLOCKS.map((b) => ({t: b.cut, file: 'pop-kecil' as const})),
  ...V_CLIMAX.map((u) => ({t: u.from, file: 'pop-kecil' as const})),
  {t: COMING.start, file: 'whoosh'},
  ...COMING_T.letters.map((t) => ({t: COMING.start + t, file: 'pop-kecil' as const, gain: 0.8})),
  {t: COMING.start + COMING_T.ring, file: 'pop'},
  ...COMING_T.logoLetters.map((t) => ({t: COMING.start + t, file: 'pop-kecil' as const, gain: 0.8})),
  {t: COMING.start + COMING_T.pill, file: 'pop'},
];

const ClipSeq: React.FC<{use: VUse; base: number}> = ({use, base}) => (
  <Sequence from={f(use.from) - f(base)} durationInFrames={f(use.to) - f(use.from) + 1} premountFor={30}>
    <VClip use={use} />
  </Sequence>
);

export const PetalPop4Vertical: React.FC = () => (
  <FmtCtx.Provider value="v">
    <AbsoluteFill style={{background: DESIGNS.pearl.bg}}>
      {/* Intro: bunga Pearl Grey mekar dari tengah, mendarat atas print (beat 0-2) */}
      <Sequence durationInFrames={f(INTRO_END)}>
        <BloomSweep design="pearl" origin="center" timing={V_INTRO} />
      </Sequence>
      {V_BLOCKS.map((b, i) => {
        const beat0 = BLOCKS[i].beat0;
        const acc = at(beat0 + 1.5), accOut = at(beat0 + 2.7);
        return (
          <Sequence key={b.design} from={f(b.from)} durationInFrames={f(b.end) - f(b.from)}>
            <BloomSweep design={b.design} origin={vOrigin(i)} timing={b.timing} land={false} light={b.design === 'dahlia'}>
              {b.uses.map((u) => (
                <ClipSeq key={u.label} use={u} base={b.from} />
              ))}
            </BloomSweep>
            <Sequence from={f(acc) - f(b.from)} durationInFrames={f(accOut - acc + 0.4)} layout="none">
              <BloomAccent design={b.design} corner="tr" outAt={accOut - acc} />
            </Sequence>
            <Sequence from={f(b.card) - f(b.from)} layout="none">
              <NameCard design={b.design} />
            </Sequence>
          </Sequence>
        );
      })}
      {/* Klimaks: 6 muka (satu setiap design) penuh skrin, cut setiap 2/3 beat, laju -> slow-mo */}
      {V_CLIMAX.map((u) => (
        <ClipSeq key={u.label} use={u} base={0} />
      ))}
      <Sequence from={f(COMING.start)} premountFor={30}>
        <ComingSoon times={COMING_T} overlay />
      </Sequence>
      <Sequence from={f(NAF.start)}>
        <NafesaFade />
      </Sequence>
      <Audio src={asset('song.m4a')} volume={(fr) => interpolate(fr, [0, f(0.1), f(END - 0.5), f(END)], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
      {V_HITS.map((h, i) => (
        <Sequence key={`h${i}`} from={f(h.t)} durationInFrames={f(1)} layout="none">
          <Audio src={asset(`sfx-${h.file}.wav`)} volume={SFX_VOL * (h.gain ?? 1)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  </FmtCtx.Provider>
);
