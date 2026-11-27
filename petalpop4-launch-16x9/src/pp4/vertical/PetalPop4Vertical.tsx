import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence} from 'remotion';
import {BloomAccent, BloomSweep} from '../components/Bloom';
import {ComingSoon, NafesaFade} from '../components/EndCards';
import {NameCard} from '../components/NameCard';
import {DESIGNS} from '../designs';
import {FmtCtx} from '../fmt';
import {asset, f} from '../util';
import {VClip} from './VClip';
import {coverAt, LONG, SHORT, V_INTRO, V_SWEEP0, VPlan, VUse} from './vplan';

// Petal Pop Drop 4 teaser 9:16 (1080x1920, 60 fps): versi pendek (26.5 s) dan panjang (~51 s), satu komponen.
const SFX_VOL = Math.pow(10, -18 / 20);
type Hit = {t: number; file: 'pop' | 'pop-kecil' | 'whoosh'; gain?: number};
export const hitsOf = (p: VPlan): Hit[] => [
  {t: 0, file: 'whoosh', gain: 0.7},
  ...p.blocks.map((b, i) => ({t: b.from, file: 'whoosh' as const, gain: i === 0 ? 0.6 : 1})),
  ...p.blocks.map((b) => ({t: b.card, file: 'pop' as const})),
  ...p.blocks.flatMap((b) => b.cuts.map((t) => ({t, file: 'pop-kecil' as const}))),
  ...p.climax.map((u) => ({t: u.from, file: 'pop-kecil' as const})),
  {t: p.coming, file: 'whoosh'},
  ...p.comingT.letters.map((t) => ({t: p.coming + t, file: 'pop-kecil' as const, gain: 0.8})),
  {t: p.coming + p.comingT.ring, file: 'pop'},
  ...p.comingT.logoLetters.map((t) => ({t: p.coming + t, file: 'pop-kecil' as const, gain: 0.8})),
  {t: p.coming + p.comingT.pill, file: 'pop'},
];

const ClipSeq: React.FC<{use: VUse; base: number}> = ({use, base}) => (
  <Sequence from={f(use.from) - f(base)} durationInFrames={f(use.to) - f(use.from) + 1} premountFor={30}>
    <VClip use={use} />
  </Sequence>
);

const VerticalTeaser: React.FC<{plan: VPlan}> = ({plan: p}) => {
  const introEnd = p.blocks[0].from + coverAt(V_SWEEP0) + 0.05;
  return (
    <FmtCtx.Provider value="v">
      <AbsoluteFill style={{background: DESIGNS.pearl.bg}}>
        {/* Intro: bunga Pearl Grey mekar dari tengah, mendarat atas print (beat 0-2) */}
        <Sequence durationInFrames={f(introEnd)}>
          <BloomSweep design="pearl" origin="center" timing={V_INTRO} />
        </Sequence>
        {p.blocks.map((b) => (
          <Sequence key={b.design} from={f(b.from)} durationInFrames={f(b.end) - f(b.from)}>
            <BloomSweep design={b.design} origin={b.origin} timing={b.timing} land={false} light={b.design === 'dahlia'}>
              {b.uses.map((u) => (
                <ClipSeq key={u.label} use={u} base={b.from} />
              ))}
            </BloomSweep>
            <Sequence from={f(b.acc) - f(b.from)} durationInFrames={f(b.accOut - b.acc + 0.4)} layout="none">
              <BloomAccent design={b.design} corner="tr" outAt={b.accOut - b.acc} />
            </Sequence>
            <Sequence from={f(b.card) - f(b.from)} layout="none">
              <NameCard design={b.design} />
            </Sequence>
          </Sequence>
        ))}
        {/* Klimaks: 6 muka (satu setiap design) penuh skrin, laju -> slow-mo */}
        {p.climax.map((u) => (
          <ClipSeq key={u.label} use={u} base={0} />
        ))}
        <Sequence from={f(p.coming)} premountFor={30}>
          <ComingSoon times={p.comingT} overlay />
        </Sequence>
        <Sequence from={f(p.nafesa)}>
          <NafesaFade />
        </Sequence>
        <Audio src={asset(p.song)} volume={(fr) => interpolate(fr, [0, f(0.1), f(p.end - p.songFadeOut), f(p.end)], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
        {hitsOf(p).map((h, i) => (
          <Sequence key={`h${i}`} from={f(h.t)} durationInFrames={f(1)} layout="none">
            <Audio src={asset(`sfx-${h.file}.wav`)} volume={SFX_VOL * (h.gain ?? 1)} />
          </Sequence>
        ))}
      </AbsoluteFill>
    </FmtCtx.Provider>
  );
};

export const V_TOTAL_FRAMES = f(SHORT.end);
export const V_LONG_FRAMES = f(LONG.end);
export const PetalPop4Vertical: React.FC = () => <VerticalTeaser plan={SHORT} />;
export const PetalPop4VerticalLong: React.FC = () => <VerticalTeaser plan={LONG} />;
