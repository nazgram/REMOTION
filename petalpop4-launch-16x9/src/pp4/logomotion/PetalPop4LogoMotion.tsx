import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, useCurrentFrame} from 'remotion';
import logo from '../logo.json';
import {colorsOf, DesignId, Unit, UNITS} from '../designs';
import {UnitG} from '../components/Bloom';
import {asset, ease, f, FPS, pop, rand, SERIF} from '../util';

// Logo motion Petal Pop Drop 4 (10 s, 1080x1920, 60 fps). Nas 25 Nov: logo + bunga dari print Drop 4,
// 0:00-0:04 diam (gambar tenang), animasi mula 0:04.
export const LM_FRAMES = f(10);
export const START = 4; // animasi mula
export const SWAP = 7; // Nas 25 Nov: logo tukar jadi COMING SOON pada 0:07
const W = 1080, H = 1920;
const BG = '#efe6e1';
const C: [number, number] = [540, 830]; // pusat logo + bulatan
const LOGO_S = 0.74;
const LOGO_CY = (327 + 1022) / 2;
const RING_R = 465;
const WAYS: DesignId[] = ['dusty', 'lilac', 'sage', 'powder', 'pearl'];

// Bunga dari print Drop 4 (indeks unit pattern.json, dipilih dari grid calon: bunga padat, tangkai pendek).
const BIG = [0, 34, 71, 91, 142, 176, 203, 222, 232, 235, 323, 379, 969, 970, 811, 921, 304, 363, 387, 87];
const MED = [29, 47, 76, 138, 213, 274, 352, 406, 464, 481, 607, 623, 655, 670, 717, 767, 799, 813, 951, 133];
const SPRIG = [10, 82, 117, 35, 143, 470, 565, 5, 72, 249];
const SMALL = UNITS.filter((u) => u.r >= 22 && u.r <= 48 && u.p.length >= 5);

// Bunga rehat (0-4 s): berselerak di sekeliling logo. [x, y, jejari skrin]
const REST: [number, number, number][] = [
  [110, 210, 130], [400, 130, 70], [690, 200, 96], [990, 140, 120], [900, 430, 64],
  [80, 520, 80], [1010, 690, 84], [70, 1000, 104], [1010, 1080, 70], [240, 1320, 92],
  [560, 1420, 72], [880, 1330, 112], [130, 1650, 84], [980, 1660, 100], [420, 1740, 64], [720, 1810, 78],
];
const RING_N = 28;
type Fl = {u: Unit; d: DesignId; rest?: [number, number, number]; slot: number; size: number; seed: number};
// Corak bulatan: besar, ranting, sederhana, besar, sederhana, ranting ... (macam kalungan)
const RING: Fl[] = Array.from({length: RING_N}, (_, i) => {
  const kind = ['b', 's', 'm', 'b', 'm', 's', 'm'][i % 7];
  const pick = kind === 'b' ? BIG[(i * 3) % BIG.length] : kind === 'm' ? MED[(i * 7) % MED.length] : SPRIG[(i * 3) % SPRIG.length];
  return {u: UNITS[pick], d: WAYS[(i * 2) % WAYS.length], slot: i, size: kind === 'b' ? 84 : kind === 'm' ? 62 : 66, seed: i};
});
// 16 bunga pertama datang dari kedudukan rehat (ikut sudut paling dekat), selebihnya pop masuk.
const restFor = new Map<number, [number, number, number]>();
{
  const free = new Set(RING.map((_, i) => i));
  REST.forEach((r) => {
    const a = Math.atan2(r[1] - C[1], r[0] - C[0]);
    let best = -1, bd = 1e9;
    free.forEach((i) => {
      const sa = (i / RING_N) * Math.PI * 2 - Math.PI / 2;
      const dd = Math.abs(Math.atan2(Math.sin(sa - a), Math.cos(sa - a)));
      if (dd < bd) { bd = dd; best = i; }
    });
    free.delete(best);
    restFor.set(best, r);
  });
}

const ringRot = (t: number) => 7 * Math.max(0, t - START - 0.6) * ease(t, START + 0.6, START + 2.2, Easing.inOut(Easing.sin)); // darjah
const GATHER = START + 0.3; // mula berkumpul
const bump = (x: number) => (x <= 0 || x >= 1 ? 0 : Math.sin(Math.PI * x));

const Flower: React.FC<{x: number; y: number; size: number; rot: number; fl: Fl; k?: number; o?: number}> = ({x, y, size, rot, fl, k = 1, o = 1}) =>
  k <= 0.001 ? null : (
    <g opacity={o} transform={`translate(${x} ${y}) rotate(${rot}) scale(${(size / fl.u.r) * k}) translate(${-fl.u.x} ${-fl.u.y})`}>
      <UnitG u={fl.u} colors={colorsOf(fl.d)} k={1} />
    </g>
  );

const RingFlowers: React.FC<{t: number}> = ({t}) => {
  const rr = ringRot(t);
  return (
    <>
      {RING.map((r, i) => {
        const sa = (i / RING_N) * 360 - 90 + rr;
        const sx = C[0] + Math.cos((sa * Math.PI) / 180) * RING_R, sy = C[1] + Math.sin((sa * Math.PI) / 180) * RING_R;
        // gelombang mekar keliling bulatan (6.0-7.4 s) + goyang lembut
        const wave = 1 + 0.32 * bump((t - (START + 2.0) - (i / RING_N) * 0.9) / 0.45);
        const sway = t > START ? Math.sin((t - START) * 2.2 + i) * 6 * ease(t, START + 1.2, START + 2) : 0;
        const rest = restFor.get(i);
        if (rest) {
          const [x0, y0, s0] = rest;
          const st = GATHER + rand(i * 2.3) * 0.25;
          const ant = t < START ? 0 : bump((t - START) / 0.3) * 0.1; // jangkaan: kecut sikit dulu
          const g = ease(t, st, st + 1.05, Easing.inOut(Easing.cubic));
          // laluan lengkung: polar sekeliling pusat
          const a0 = Math.atan2(y0 - C[1], x0 - C[0]);
          const r0 = Math.hypot(x0 - C[0], y0 - C[1]);
          let a1 = (sa * Math.PI) / 180;
          while (a1 < a0) a1 += Math.PI * 2;
          if (a1 - a0 > Math.PI * 1.2) a1 -= Math.PI * 2;
          const a = a0 + (a1 - a0) * g + 0.35 * bump(g); // pusing sikit ikut jam
          const rad = r0 + (RING_R - r0) * g;
          const x = C[0] + Math.cos(a) * rad, y = C[1] + Math.sin(a) * rad;
          const size = (s0 + (r.size - s0) * g) * (1 - ant) * (1 + 0.18 * bump(g));
          const rot = rand(i * 9.1) * 360 + 360 * g + sa * g + sway;
          return <Flower key={i} x={x} y={y} size={size * wave} rot={rot} fl={r} />;
        }
        const at = START + 1.0 + (i % 7) * 0.07 + rand(i) * 0.1;
        const k = pop(t, at, 9);
        return <Flower key={i} x={sx} y={sy} size={r.size * wave} rot={sa + rand(i * 9.1) * 360 + sway + (1 - Math.min(1, k)) * -90} fl={r} k={k} />;
      })}
    </>
  );
};

// Bunga kecil jatuh perlahan di belakang (mula 7.0 s).
const RAIN = Array.from({length: 18}, (_, i) => ({
  u: SMALL[(i * 29 + 3) % SMALL.length], d: WAYS[(i + 2) % WAYS.length], x: 60 + rand(i * 4.7) * 960,
  at: START + 2.8 + i * 0.17 + rand(i * 1.9) * 0.2, sp: 300 + rand(i * 6.1) * 160, size: 22 + rand(i * 3.3) * 18,
}));
const Rain: React.FC<{t: number}> = ({t}) => (
  <>
    {RAIN.map((p, i) => {
      if (t < p.at) return null;
      const dt = t - p.at;
      const y = -60 + dt * p.sp;
      const x = p.x + Math.sin(dt * 1.7 + i) * 40;
      return <Flower key={i} x={x} y={y} size={p.size} rot={dt * 60 * (i % 2 ? 1 : -1)} fl={{u: p.u, d: p.d, slot: 0, size: p.size, seed: i}} o={0.9 * ease(t, p.at, p.at + 0.3, Easing.linear)} />;
    })}
  </>
);

// Logo: bentuk asal (huruf hitam). 0 bunga, 1-8 huruf, 9-15 motif, 16 pil, 17-21 DROP 4.
type LP = {d: string; fill: string; box: number[]};
const LOGO_P = (logo as {paths: LP[]}).paths;
const Logo: React.FC<{t: number}> = ({t}) => {
  const breathe = 1 + 0.012 * Math.sin((t - START) * 2.4) * ease(t, START + 2.5, START + 3.5);
  const ant = t < START ? 1 : 1 - 0.03 * bump((t - START) / 0.3);
  return (
    <g transform={`translate(${C[0]} ${C[1]}) scale(${LOGO_S * breathe * ant}) translate(${-logo.w / 2} ${-LOGO_CY})`}>
      {LOGO_P.map((p, i) => {
        const [bx, by, bw, bh] = p.box;
        const cx = bx + bw / 2, cy = by + bh / 2;
        const out = ease(t, SWAP - 0.2 + (i % 6) * 0.03, SWAP + 0.1 + (i % 6) * 0.03, Easing.in(Easing.back(1.7)));
        if (out >= 1) return null;
        const exitTf = out > 0 ? `translate(${cx} ${cy}) scale(${Math.max(0, 1 - out)}) translate(${-cx} ${-cy}) ` : '';
        let tf = '';
        if (i >= 1 && i <= 8) {
          // huruf melompat ikut gelombang
          const a = START + 0.15 + (i - 1) * 0.06;
          const hp = (t - a) / 0.38;
          const jump = bump(hp) * 46;
          const sq = hp > 0.85 && hp < 1.15 ? 1 - 0.1 * bump((hp - 0.85) / 0.3) : 1;
          tf = `translate(0 ${-jump}) translate(${cx} ${by + bh}) scale(${2 - sq} ${sq}) translate(${-cx} ${-(by + bh)})`;
        } else if (i === 0) {
          const spin = 360 * ease(t, START + 0.1, START + 1.1, Easing.inOut(Easing.back(1.3)));
          const k = 1 + 0.18 * bump((t - START - 0.1) / 1.0) + 0.05 * bump((t - START - 2.0) / 0.5);
          tf = `translate(${cx} ${cy}) rotate(${spin}) scale(${k}) translate(${-cx} ${-cy})`;
        } else if (i >= 9 && i <= 15) {
          const w = Math.sin((t - START - 0.6) * 14) * 12 * Math.max(0, 1 - (t - START - 0.6) / 1.1) * (t > START + 0.6 ? 1 : 0);
          tf = `translate(${cx} ${by + bh}) rotate(${w}) translate(${-cx} ${-(by + bh)})`;
        } else if (i === 16) {
          const k = pop(t, START + 1.5, 7);
          const s = t < START + 1.5 ? 1 : 1 + 0.12 * Math.sin(k * Math.PI);
          tf = `translate(${cx} ${cy}) scale(${s} ${2 - s}) translate(${-cx} ${-cy})`;
        } else {
          const a = START + 1.6 + (i - 17) * 0.06;
          const jump = bump((t - a) / 0.3) * 18;
          tf = `translate(0 ${-jump})`;
        }
        return <path key={i} d={p.d} fill={p.fill} transform={exitTf + tf} />;
      })}
    </g>
  );
};

// COMING SOON (0:07): huruf pop satu-satu dalam kalungan, 2 baris, kemudian bernafas perlahan.
const LINES = ['COMING', 'SOON'];
export const LETTER_AT = Array.from({length: 10}, (_, k) => SWAP + 0.12 + k * 0.07);
const ComingSoon: React.FC<{t: number}> = ({t}) => {
  if (t < SWAP) return null;
  const breathe = 1 + 0.012 * Math.sin((t - SWAP) * 2.4) * ease(t, SWAP + 1, SWAP + 1.8);
  let k = 0;
  return (
    <div style={{position: 'absolute', left: 0, width: W, top: C[1], transform: `translateY(-50%) scale(${breathe})`, textAlign: 'center', fontFamily: SERIF, fontSize: 168, lineHeight: 0.98, color: '#111', letterSpacing: '0.04em'}}>
      {LINES.map((ln) => (
        <div key={ln}>
          {ln.split('').map((ch, j) => {
            const a = LETTER_AT[k++];
            const g = ease(t, a, a + 0.34, Easing.out(Easing.back(1.9)));
            const o = ease(t, a, a + 0.1, Easing.linear);
            return (
              <span key={j} style={{display: 'inline-block', opacity: o, transform: `translateY(${(1 - Math.min(1, g)) * 40}px) scale(${g})`, transformOrigin: '50% 100%'}}>
                {ch}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// SFX sahaja (tiada muzik): fail sama dengan teaser pp4 (scripts/sfx.py).
type Hit = {t: number; file: 'pop' | 'pop-kecil' | 'whoosh'; gain?: number};
export const LM_HITS: Hit[] = [
  {t: START, file: 'pop', gain: 0.7},
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({t: START + 0.15 + (i - 1) * 0.06 + 0.3, file: 'pop-kecil' as const, gain: 0.45})),
  {t: GATHER - 0.1, file: 'whoosh', gain: 0.9},
  ...RING.map((_, i) => i).filter((i) => !restFor.has(i)).map((i) => ({t: START + 1.0 + (i % 7) * 0.07 + rand(i) * 0.1, file: 'pop-kecil' as const, gain: 0.5})),
  {t: START + 1.5, file: 'pop', gain: 0.8},
  {t: START + 2.0, file: 'whoosh', gain: 0.5},
  {t: SWAP - 0.25, file: 'whoosh', gain: 0.8},
  ...LETTER_AT.map((a) => ({t: a + 0.05, file: 'pop-kecil' as const, gain: 0.5})),
];
const VOL = Math.pow(10, -6 / 20);

export const PetalPop4LogoMotion: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 900px 1100px at 50% 43%, #f8f1ec 0%, ${BG} 70%)`}}>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        <Rain t={t} />
        <RingFlowers t={t} />
        <Logo t={t} />
      </svg>
      <ComingSoon t={t} />
      {withAudio &&
        LM_HITS.map((h, i) => (
          <Sequence key={i} from={f(h.t)} durationInFrames={f(1)} layout="none">
            <Audio src={asset(`sfx-${h.file}.wav`)} volume={VOL * (h.gain ?? 1)} />
          </Sequence>
        ))}
    </AbsoluteFill>
  );
};
