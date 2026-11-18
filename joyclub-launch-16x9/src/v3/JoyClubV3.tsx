import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, Sequence, useCurrentFrame} from 'remotion';
import beatsData from '../../public/v3/beats.json';
import {beatAt} from './beats';
import {Circles, CircleItem} from './components/Circles';
import {DotSweep, SWEEP_COLOR} from './components/DotSweep';
import {JoyClubEnd, NafesaEnd} from './components/EndCards';
import {NameCard} from './components/NameCard';
import {FullLandscape, shapePanels, ShapePanels, stripPanels} from './components/Panels';
import {CREAM, DESIGNS, DesignId, ORDER} from './designs';
import {CLIMAX, CLIMAX_END, CLIMAX_ENTER, DETAIL, END2, END3, ENTER2, ENTER3, SHOTS} from './shots';
import {buildTimeline, END} from './timeline';
import {asset, f, fontCss} from './util';

const BEATS: number[] = beatsData.beats;
export const TL = buildTimeline(BEATS);
export const BEAT = 60 / beatsData.bpm;
const B = (k: number) => beatAt(k, BEATS);
export const TOTAL_FRAMES = f(END);
const SWEEP_COVER = BEAT * 1.5;
const SWEEP_REVEAL = BEAT;
const HOLD = 3 / 60; // reveal mula 3 frame awal dan kekal penuh (tiada frame terlepas)

// Warna ruang panel kosong sebelum panel masuk.
const SLOT_BG: Record<DesignId, string> = {pearl: '#dce9f4', sky: '#a0c4e1', blush: '#d1bdc1', ruby: '#b11f24', silver: '#d8d8d8'};

const nameCircles = (d: DesignId, at: number, out: number): CircleItem[] => {
  const [a, b] = DESIGNS[d].accents;
  return [
    {x: 1830, y: 1030, d: 260, color: b, inAt: at, outAt: out},
    {x: 1900, y: 780, d: 120, color: a, inAt: at + BEAT, outAt: out},
  ];
};

// Satu design (16 beat): 3 panel masuk satu demi satu -> cut bersih ke 2 panel -> close-up landscape -> dot cover.
const DesignBlock: React.FC<{d: DesignId; k0: number; start: number; last: boolean}> = ({d, k0, start, last}) => {
  const t = (k: number) => B(k0 + k) - start; // saat tempatan untuk beat ke-k
  const s = SHOTS[d];
  const nameIn = t(2.5);
  const nameOut = t(END3) - 0.32;
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={f(t(END3))}>
        <ShapePanels panels={shapePanels(s.shape3)} shots={s.grid3} enterAt={ENTER3.map(t)} endAt={t(END3)} bg={SLOT_BG[d]} />
      </Sequence>
      <Sequence from={f(nameIn)} durationInFrames={f(t(END3)) - f(nameIn)}>
        <NameCard design={d} outAt={nameOut - nameIn} />
      </Sequence>
      <Sequence durationInFrames={f(t(END3))}>
        <Circles items={nameCircles(d, t(3), nameOut)} beat={BEAT} />
      </Sequence>
      <Sequence from={f(t(END3))} durationInFrames={f(t(END2)) - f(t(END3))}>
        <ShapePanels panels={shapePanels(s.shape2)} shots={s.grid2} enterAt={ENTER2.map((k) => t(k) - t(END3))} endAt={t(END2) - t(END3)} bg={SLOT_BG[d]} />
      </Sequence>
      <Sequence from={f(t(DETAIL[0]))}>
        <FullLandscape shot={s.detail} dur={t(DETAIL[1]) - t(DETAIL[0])} />
      </Sequence>
      {!last && (
        <Sequence from={f(t(16) - SWEEP_COVER)}>
          <DotSweep color={SWEEP_COLOR[ORDER[ORDER.indexOf(d) + 1]]} mode="cover" dur={SWEEP_COVER} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

// Intro: video kain dari Nas (Magnific, 1280x720 24fps, 10s): SKY -> BLUSH -> SILVER -> PEARL -> RUBY dengan
// transition sendiri. Main dari awal, dipotong di hujung intro (dot PEARL tutup atas RUBY). Bunyi asal klip
// (kain/whoosh) dikekalkan pada aras SFX. Zoom perlahan sedikit supaya tak kaku.
const INTRO_VIDEO = 'kain/intro-kain.mp4';
const INTRO_AUDIO = 1.5; // darab SFX_VOL; puncak klip -1.4 dBFS, sama aras dengan SFX lain

const Intro: React.FC<{end: number}> = ({end}) => {
  const t = useCurrentFrame() / 60;
  const scale = 1 + 0.04 * Math.min(1, t / end);
  return (
    <AbsoluteFill style={{background: CREAM}}>
      <OffthreadVideo src={asset(INTRO_VIDEO)} volume={SFX_VOL * INTRO_AUDIO} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${scale})`}} />
    </AbsoluteFill>
  );
};

const climaxCircles = (t: (k: number) => number): CircleItem[] => [
  {x: 80, y: 1040, d: 300, color: '#a0c4e1', inAt: t(2.5)},
  {x: 1850, y: 1010, d: 340, color: '#b11f24', inAt: t(3)},
];

// SFX buatan sendiri (scripts/sfx.py), -18 dB di bawah lagu.
const SFX_VOL = Math.pow(10, -18 / 20);
type Hit = {at: number; file: 'pop' | 'pop-kecil' | 'whoosh'; gain?: number};
const sfxHits = (): Hit[] => {
  const hits: Hit[] = [];
  const intro = TL[0];
  hits.push({at: intro.end - SWEEP_COVER, file: 'whoosh'});
  TL.filter((s) => s.kind === 'design').forEach((seg, i, arr) => {
    const k0 = seg.beat0;
    for (const k of [...ENTER3, ...ENTER2]) hits.push({at: B(k0 + k), file: 'pop-kecil', gain: 0.8});
    hits.push({at: B(k0 + 2.5), file: 'pop'}); // nama
    if (i < arr.length - 1) hits.push({at: B(k0 + 16) - SWEEP_COVER, file: 'whoosh'});
  });
  const climax = TL.find((s) => s.kind === 'climax')!;
  for (const k of CLIMAX_ENTER) hits.push({at: B(climax.beat0 + k), file: 'pop-kecil', gain: 0.8});
  const joy = TL.find((s) => s.kind === 'joyclub')!;
  hits.push({at: joy.start, file: 'pop'}, {at: joy.start + 0.1, file: 'pop'}, {at: joy.start + 0.95, file: 'whoosh', gain: 0.7});
  const naf = TL.find((s) => s.kind === 'nafesa')!;
  for (const d of [0, 0.15, 0.3, 0.45]) hits.push({at: naf.start + d, file: 'pop-kecil', gain: 0.8});
  return hits.filter((h) => h.at >= 0 && h.at < END);
};
const HITS = sfxHits();

export const JoyClubV3: React.FC = () => {
  const frame = useCurrentFrame();
  // Lagu tamat sendiri di hujung. Cuma 0.1s masuk & 0.3s keluar untuk elak klik.
  const vol = interpolate(frame, [0, f(0.1), f(END - 0.3), f(END)], [0, 1, 1, 0], {extrapolateRight: 'clamp'});
  const intro = TL[0];
  const climax = TL.find((s) => s.kind === 'climax')!;
  const joy = TL.find((s) => s.kind === 'joyclub')!;
  const naf = TL.find((s) => s.kind === 'nafesa')!;
  const designs = TL.filter((s) => s.kind === 'design');
  const ct = (k: number) => B(climax.beat0 + k) - climax.start;
  return (
    <AbsoluteFill style={{background: '#fff'}}>
      <style>{fontCss}</style>
      <Audio src={asset('song.m4a')} volume={vol} />
      {HITS.map((h, i) => (
        <Sequence key={i} from={f(h.at)} durationInFrames={f(1)}>
          <Audio src={asset(`sfx-${h.file}.wav`)} volume={SFX_VOL * (h.gain ?? 1)} />
        </Sequence>
      ))}
      <Sequence durationInFrames={f(intro.end)}>
        <Intro end={intro.end} />
      </Sequence>
      <Sequence from={f(intro.end - SWEEP_COVER)} durationInFrames={f(intro.end) - f(intro.end - SWEEP_COVER)}>
        <DotSweep color={SWEEP_COLOR.pearl} mode="cover" dur={SWEEP_COVER} />
      </Sequence>
      {designs.map((seg, i) => (
        <React.Fragment key={seg.design}>
          <Sequence from={f(seg.start)} durationInFrames={f(seg.end) - f(seg.start)}>
            <DesignBlock d={seg.design!} k0={seg.beat0} start={seg.start} last={i === designs.length - 1} />
          </Sequence>
          {/* dot mengecil balik ke bucu, buka design ini; mula 3 frame awal supaya tiada frame terlepas */}
          <Sequence from={f(seg.start - HOLD)} durationInFrames={f(SWEEP_REVEAL + HOLD)}>
            <DotSweep color={SWEEP_COLOR[seg.design!]} mode="reveal" dur={SWEEP_REVEAL} hold={HOLD * 2} />
          </Sequence>
        </React.Fragment>
      ))}
      <Sequence from={f(climax.start)} durationInFrames={f(climax.end) - f(climax.start)}>
        <ShapePanels panels={stripPanels(5)} shots={CLIMAX} enterAt={CLIMAX_ENTER.map(ct)} endAt={ct(CLIMAX_END)} bg={CREAM} />
        <Circles items={climaxCircles(ct)} beat={BEAT} />
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
