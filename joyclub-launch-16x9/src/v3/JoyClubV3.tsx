import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, useCurrentFrame} from 'remotion';
import beatsData from '../../public/v3/beats.json';
import {beatAt} from './beats';
import {Circles, CircleItem} from './components/Circles';
import {Cutout} from './components/Cutout';
import {DotSweep, SWEEP_COLOR} from './components/DotSweep';
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
    {x: 1830, y: 1030, d: 260, color: b, inAt: t(1), outAt: out},
    {x: 1900, y: 780, d: 120, color: a, inAt: t(2), outAt: out},
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
          <DotSweep color={SWEEP_COLOR[ORDER[ORDER.indexOf(d) + 1]]} mode="cover" dur={SWEEP_COVER} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

const rectOf = (n: 2 | 3, i: number, y0: number, hFrac: number) => {
  const r = panelRects(n)[i];
  return {x: r.x, y: Math.round(1080 * y0), w: r.w, h: Math.round(1080 * hFrac)};
};

// Intro punch: bar 1 = satu bulatan besar setiap beat menghentak skrin (warna berganti).
// Bar 2 = bulatan kecil pecah di tepi setiap separuh beat, kemudian sweep PEARL.
const PUNCH = [
  {x: 960, y: 540, d: 1300, c: '#b11f24'},
  {x: 300, y: 300, d: 1500, c: '#a0c4e1'},
  {x: 1650, y: 820, d: 1600, c: '#738476'},
  {x: 960, y: 540, d: 2300, c: '#5c484d'},
];
const BURST: [number, number, number, string][] = [
  [180, 180, 320, '#a0c4e1'], [1760, 900, 380, '#b11f24'], [1740, 150, 240, '#d1bdc1'], [220, 920, 300, '#738476'],
  [980, 110, 180, '#d8d8d8'], [1120, 990, 220, '#a0c4e1'], [600, 560, 160, '#b11f24'], [1400, 500, 200, '#5c484d'],
];

const Intro: React.FC<{end: number}> = ({end}) => {
  const punch: CircleItem[] = PUNCH.map((p, i) => ({x: p.x, y: p.y, d: p.d, color: p.c, inAt: B(i), outAt: i < 3 ? B(i + 1) + 0.12 : B(4) - 0.05}));
  const burst: CircleItem[] = BURST.map(([x, y, d, c], i) => ({x, y, d, color: c, inAt: B(4) + (i * BEAT) / 2, outAt: end - SWEEP_COVER - 0.1}));
  return (
    <AbsoluteFill style={{background: CREAM}}>
      <Circles items={punch} beat={BEAT} />
      <Circles items={burst} beat={BEAT} />
    </AbsoluteFill>
  );
};

const climaxCircles = (t: (k: number) => number): CircleItem[] => [
  {x: 80, y: 1040, d: 300, color: '#a0c4e1', inAt: t(1)},
  {x: 1850, y: 1010, d: 340, color: '#b11f24', inAt: t(1.5)},
  {x: 760, y: 1110, d: 200, color: '#738476', inAt: t(2)},
  {x: 1260, y: 1100, d: 240, color: '#5c484d', inAt: t(2.5)},
];

export const JoyClubV3: React.FC = () => {
  const frame = useCurrentFrame();
  // Lagu = 45s terakhir Snap Back, tamat sendiri di hujung. Tiada fade panjang, cuma 0.1s masuk & 0.3s keluar elak klik.
  const vol = interpolate(frame, [0, f(0.1), f(END - 0.3), f(END)], [0, 1, 1, 0], {extrapolateRight: 'clamp'});
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
        <DotSweep color={SWEEP_COLOR.pearl} mode="cover" dur={SWEEP_COVER} />
      </Sequence>
      {designs.map((seg, i) => (
        <React.Fragment key={seg.design}>
          <Sequence from={f(seg.start)} durationInFrames={f(seg.end) - f(seg.start)}>
            <DesignBlock d={seg.design!} k0={8 + i * 12} start={seg.start} last={i === designs.length - 1} />
          </Sequence>
          {/* corak design ini terbuka dari tengah, dedahkan grid 3 */}
          <Sequence from={f(seg.start)} durationInFrames={f(SWEEP_REVEAL)}>
            <DotSweep color={SWEEP_COLOR[seg.design!]} mode="reveal" dur={SWEEP_REVEAL} />
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
