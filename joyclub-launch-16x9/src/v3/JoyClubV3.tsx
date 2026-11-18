import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, Sequence, useCurrentFrame} from 'remotion';
import beatsData from '../../public/v3/beats.json';
import {beatAt} from './beats';
import {Circles, CircleItem} from './components/Circles';
import {DotSweep, SWEEP_COLOR} from './components/DotSweep';
import {JoyClubEnd, NafesaEnd} from './components/EndCards';
import {NameCard} from './components/NameCard';
import {FullLandscape, shapePanels, ShapePanels, stripPanels} from './components/Panels';
import {CREAM, DESIGNS, DesignId, FABRIC, ORDER} from './designs';
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

// Intro: 5 kain AI penuh frame, satu setiap 3 beat. Kain baru menolak kain lama (slide), kedua-duanya terus beralun.
const FABRIC_STEP = 3;
const SLIDE = 0.42;
const FabricSlide: React.FC<{d: DesignId; first: boolean; life: number; outAt: number | null}> = ({d, first, life, outAt}) => {
  const t = useCurrentFrame() / 60;
  const inK = first ? 1 : interpolate(t, [0, SLIDE], [0, 1], {extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const outK = outAt === null ? 0 : interpolate(t, [outAt, outAt + SLIDE], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const x = (1 - inK) * 1920 - outK * 1920;
  return (
    <AbsoluteFill style={{transform: `translateX(${x}px)`}}>
      <OffthreadVideo src={asset(FABRIC[d])} muted style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.02 + 0.03 * Math.min(1, t / life)})`}} />
    </AbsoluteFill>
  );
};

const Intro: React.FC<{end: number}> = ({end}) => (
  <AbsoluteFill style={{background: CREAM}}>
    {ORDER.map((d, i) => {
      const from = i === 0 ? 0 : B(i * FABRIC_STEP);
      const next = i < ORDER.length - 1 ? B((i + 1) * FABRIC_STEP) : null;
      const until = next === null ? end : next + SLIDE;
      return (
        <Sequence key={d} from={f(from)} durationInFrames={f(until) - f(from)} premountFor={30}>
          <FabricSlide d={d} first={i === 0} life={until - from} outAt={next === null ? null : next - from} />
        </Sequence>
      );
    })}
  </AbsoluteFill>
);

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
  for (let i = 1; i < ORDER.length; i++) hits.push({at: B(i * FABRIC_STEP), file: 'whoosh', gain: 0.55});
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
