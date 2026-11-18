import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, useCurrentFrame} from 'remotion';
import beatsData from '../../public/v3/beats.json';
import {beatAt} from './beats';
import {Circles, CircleItem} from './components/Circles';
import {Cutout} from './components/Cutout';
import {DotSweep} from './components/DotSweep';
import {JoyClubEnd, NafesaEnd} from './components/EndCards';
import {NameCard} from './components/NameCard';
import {FullLandscape, Panels} from './components/Panels';
import {CREAM, DESIGNS, DesignId, ORDER} from './designs';
import {panelRects} from './layout';
import {CLIMAX, SHOTS} from './shots';
import {buildTimeline, END} from './timeline';
import {asset, f, fontCss} from './util';

const BEATS: number[] = beatsData.beats;
export const TL = buildTimeline(BEATS);
export const BEAT = 60 / beatsData.bpm;
const B = (k: number) => beatAt(k, BEATS);
export const TOTAL_FRAMES = f(END);
const SWEEP_COVER = BEAT * 1.5;
const SWEEP_REVEAL = BEAT;

// Bulatan aksen untuk momen nama: pop satu setiap beat dari tepi.
const nameCircles = (d: DesignId, t: (k: number) => number, out: number): CircleItem[] => {
  const [a, b] = DESIGNS[d].accents;
  return [
    {x: 110, y: 150, d: 360, color: b, inAt: t(1), outAt: out},
    {x: 1830, y: 230, d: 260, color: a, inAt: t(2), outAt: out},
    {x: 1700, y: 980, d: 420, color: b, inAt: t(3), outAt: out},
  ];
};

const DesignBlock: React.FC<{d: DesignId; k0: number; start: number; last: boolean}> = ({d, k0, start, last}) => {
  const t = (k: number) => B(k0 + k) - start; // saat tempatan untuk beat ke-k dalam blok
  const s = SHOTS[d];
  const g3end = t(5);
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={f(g3end)}>
        <Panels n={3} shots={s.grid3} switchAt={[t(1), t(2), t(3)]} dur={g3end} />
      </Sequence>
      <Sequence from={f(t(1))} durationInFrames={f(t(4) - t(1))}>
        <NameCard design={d} outAt={t(4) - t(1) - 0.32} />
      </Sequence>
      <Sequence durationInFrames={f(t(4))}>
        <Circles items={nameCircles(d, t, t(4) - 0.32)} beat={BEAT} />
      </Sequence>
      {/* C: shape cutout sejajar panel, 2 bentuk ikut beat, penuh pada beat 5 */}
      <Sequence from={f(t(4))} durationInFrames={f(t(8) - t(4))}>
        <Cutout
          fullAt={t(5) - t(4)}
          shapes={[
            {...rectOf(2, 1, 0, 0.55), at: 0},
            {...rectOf(2, 0, 0.4, 0.6), at: (t(5) - t(4)) / 2},
          ]}
        >
          <Panels n={2} shots={s.grid2} switchAt={[t(6) - t(4), t(7) - t(4)]} dur={t(8) - t(4)} />
        </Cutout>
      </Sequence>
      {/* B: match cut ke landscape close-up, slow motion */}
      <Sequence from={f(t(8))}>
        <FullLandscape shot={s.detail} dur={t(12) - t(8)} />
      </Sequence>
      {!last && (
        <Sequence from={f(t(12) - SWEEP_COVER)} durationInFrames={f(SWEEP_COVER)}>
          <DotSweep design={ORDER[ORDER.indexOf(d) + 1]} mode="cover" dur={SWEEP_COVER} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

const rectOf = (n: 2 | 3, i: number, y0: number, hFrac: number) => {
  const r = panelRects(n)[i];
  return {x: r.x, y: Math.round(1080 * y0), w: r.w, h: Math.round(1080 * hFrac)};
};

const INTRO_COLORS = ['#a0c4e1', '#b11f24', '#d1bdc1', '#738476', '#5c484d', '#d8d8d8', '#a0c4e1', '#b11f24'];
const INTRO_POS = [
  [180, 200, 340], [1760, 860, 420], [1720, 160, 220], [260, 900, 300], [960, 120, 160], [1100, 980, 200], [620, 540, 140], [1380, 520, 180],
];

const Intro: React.FC<{end: number}> = ({end}) => {
  const items: CircleItem[] = INTRO_POS.map(([x, y, d], i) => ({x, y, d, color: INTRO_COLORS[i], inAt: B(i) , outAt: end - SWEEP_COVER - 0.1}));
  return (
    <AbsoluteFill style={{background: CREAM}}>
      <Circles items={items} beat={BEAT} />
    </AbsoluteFill>
  );
};

const climaxCircles = (t: (k: number) => number): CircleItem[] => [
  {x: 60, y: 80, d: 300, color: '#a0c4e1', inAt: t(1)},
  {x: 1860, y: 1000, d: 340, color: '#b11f24', inAt: t(1.5)},
  {x: 1880, y: 60, d: 200, color: '#738476', inAt: t(2)},
  {x: 40, y: 1020, d: 240, color: '#5c484d', inAt: t(2.5)},
];

export const JoyClubV3: React.FC = () => {
  const frame = useCurrentFrame();
  const vol = interpolate(frame, [0, f(0.3), f(TL[TL.length - 1].start), f(END)], [0, 1, 1, 0], {extrapolateRight: 'clamp'});
  const intro = TL[0];
  const climax = TL.find((s) => s.kind === 'climax')!;
  const joy = TL.find((s) => s.kind === 'joyclub')!;
  const naf = TL.find((s) => s.kind === 'nafesa')!;
  const designs = TL.filter((s) => s.kind === 'design');
  return (
    <AbsoluteFill style={{background: '#fff'}}>
      <style>{fontCss}</style>
      <Audio src={asset('song.m4a')} volume={vol} />
      <Sequence durationInFrames={f(intro.end)}>
        <Intro end={intro.end} />
      </Sequence>
      <Sequence from={f(intro.end - SWEEP_COVER)} durationInFrames={f(SWEEP_COVER)}>
        <DotSweep design="pearl" mode="cover" dur={SWEEP_COVER} />
      </Sequence>
      {designs.map((seg, i) => (
        <React.Fragment key={seg.design}>
          <Sequence from={f(seg.start)} durationInFrames={f(seg.end) - f(seg.start)}>
            <DesignBlock d={seg.design!} k0={8 + i * 12} start={seg.start} last={i === designs.length - 1} />
          </Sequence>
          {/* corak design ini terbuka dari tengah, dedahkan grid 3 */}
          <Sequence from={f(seg.start)} durationInFrames={f(SWEEP_REVEAL)}>
            <DotSweep design={seg.design!} mode="reveal" dur={SWEEP_REVEAL} />
          </Sequence>
        </React.Fragment>
      ))}
      <Sequence from={f(climax.start)} durationInFrames={f(climax.end) - f(climax.start)}>
        <Panels n={5} shots={CLIMAX} dur={climax.end - climax.start} />
        <Circles items={climaxCircles((k) => B(68) + k * BEAT - climax.start)} beat={BEAT} />
      </Sequence>
      <Sequence from={f(joy.start)} durationInFrames={f(joy.end) - f(joy.start)}>
        <JoyClubEnd beat={BEAT} />
      </Sequence>
      <Sequence from={f(naf.start)}>
        <NafesaEnd beat={BEAT} />
      </Sequence>
    </AbsoluteFill>
  );
};
