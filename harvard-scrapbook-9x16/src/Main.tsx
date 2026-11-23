import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {COLORS, DoodleDefs, mulberry, popScale, Sticker, StickerType} from './doodles';

export const FPS = 30;
export const DURATION = 630;

const C = COLORS;
type St = {t: StickerType; c: string; dx: number; dy: number; s: number; r?: number; pen?: boolean};
type Card = {
  img: string;
  w: number;
  h: number;
  y: number;
  rot: number;
  zoom: number; // crop zoom (closer crop)
  fy: number; // focus y (0..1)
  frame: 'polaroid' | 'border' | 'tape';
  tape?: string;
  st: St[];
};

// ---------------- gallery cards ----------------
const CARDS: Card[] = [
  {img: 'p01', w: 604, h: 873, y: 905, rot: -3, zoom: 1, fy: 0.45, frame: 'polaroid', st: [
    {t: 'star', c: C.yellow, dx: -0.5, dy: -0.47, s: 130},
    {t: 'sparkle', c: C.white, dx: 0.34, dy: -0.36, s: 70, pen: true},
    {t: 'arrow', c: C.lilac, dx: 0.6, dy: 0.32, s: 150, r: 8},
  ]},
  {img: 'p02', w: 526, h: 694, y: 1330, rot: 4, zoom: 1.18, fy: 0.3, frame: 'border', tape: C.pink, st: [
    {t: 'heart', c: C.pink, dx: 0.5, dy: -0.47, s: 120},
    {t: 'underline', c: C.blue, dx: 0, dy: 0.6, s: 170},
    {t: 'smiley', c: C.yellow, dx: -0.52, dy: 0.36, s: 110},
  ]},
  {img: 'p03', w: 582, h: 851, y: 905, rot: -6, zoom: 1, fy: 0.4, frame: 'tape', tape: C.lilac, st: [
    {t: 'sparkle', c: C.yellow, dx: -0.55, dy: -0.18, s: 95},
    {t: 'heartOutline', c: C.white, dx: 0.32, dy: 0.36, s: 80, pen: true},
    {t: 'swirl', c: C.pink, dx: 0.52, dy: 0.47, s: 105},
    {t: 'plus', c: C.lilac, dx: 0.62, dy: -0.42, s: 46},
  ]},
  {img: 'p04', w: 515, h: 672, y: 1330, rot: -2, zoom: 1.22, fy: 0.3, frame: 'polaroid', st: [
    {t: 'spiky', c: C.yellow, dx: 0.48, dy: -0.45, s: 115},
    {t: 'dots', c: C.blue, dx: -0.1, dy: -0.6, s: 80},
    {t: 'circle', c: C.pink, dx: -0.5, dy: 0.48, s: 150, r: -10},
  ]},
  {img: 'p05', w: 593, h: 851, y: 905, rot: 3, zoom: 1, fy: 0.45, frame: 'border', tape: C.blue, st: [
    {t: 'flower', c: C.pink, dx: -0.5, dy: -0.46, s: 120},
    {t: 'starOutline', c: C.white, dx: 0.34, dy: -0.34, s: 80, pen: true},
    {t: 'scribble', c: C.lilac, dx: 0.42, dy: 0.55, s: 130, r: -8},
  ]},
  {img: 'p06', w: 526, h: 694, y: 1330, rot: 5, zoom: 1.15, fy: 0.3, frame: 'tape', tape: C.yellow, st: [
    {t: 'burst', c: C.yellow, dx: -0.52, dy: -0.5, s: 120},
    {t: 'smiley', c: C.lilac, dx: 0.52, dy: 0.42, s: 115},
    {t: 'sparkle', c: C.white, dx: -0.33, dy: 0.3, s: 66, pen: true},
  ]},
  {img: 'p07', w: 582, h: 851, y: 905, rot: -4, zoom: 1, fy: 0.42, frame: 'polaroid', st: [
    {t: 'heart', c: C.lilac, dx: -0.52, dy: 0.38, s: 120},
    {t: 'cloud', c: C.blue, dx: 0.56, dy: -0.36, s: 110},
    {t: 'underline', c: C.pink, dx: 0, dy: -0.6, s: 160},
  ]},
  {img: 'p08', w: 515, h: 683, y: 1330, rot: 3, zoom: 1.2, fy: 0.3, frame: 'border', tape: C.lilac, st: [
    {t: 'star', c: C.lilac, dx: 0.5, dy: 0.46, s: 120},
    {t: 'swirl', c: C.blue, dx: -0.54, dy: -0.4, s: 100},
    {t: 'sparkle', c: C.white, dx: 0.33, dy: -0.34, s: 66, pen: true},
    {t: 'plus', c: C.yellow, dx: -0.6, dy: 0.2, s: 46},
  ]},
  {img: 'p09', w: 593, h: 862, y: 905, rot: -2, zoom: 1, fy: 0.45, frame: 'tape', tape: C.pink, st: [
    {t: 'spiky', c: C.pink, dx: -0.5, dy: -0.44, s: 110},
    {t: 'arrow', c: C.yellow, dx: 0.6, dy: 0.3, s: 140, r: -6},
    {t: 'heartOutline', c: C.white, dx: -0.3, dy: 0.34, s: 76, pen: true},
  ]},
  {img: 'p10', w: 537, h: 705, y: 1330, rot: -4, zoom: 1.15, fy: 0.3, frame: 'polaroid', st: [
    {t: 'smiley', c: C.yellow, dx: 0.5, dy: -0.46, s: 120},
    {t: 'heart', c: C.pink, dx: -0.52, dy: 0.4, s: 110},
    {t: 'burst', c: C.lilac, dx: 0.5, dy: 0.48, s: 110},
    {t: 'sparkle', c: C.white, dx: -0.33, dy: -0.32, s: 66, pen: true},
  ]},
];

const D = 440; // world spacing between cards
// time at which card k is centred
const DUR = [42, 38, 44, 30, 44, 40, 46, 30, 44];
const T: number[] = [14];
DUR.forEach((d) => T.push(T[T.length - 1] + d));
const B = 0.6;
const WHIP_START = T[9];
const WHIP_END = WHIP_START + 30;

const camX = (f: number): number => {
  if (f <= T[0]) return 540 - (T[0] - f) * ((1 - B) * D) / DUR[0];
  for (let k = 0; k < 9; k++) {
    if (f <= T[k + 1]) {
      const s = (f - T[k]) / (T[k + 1] - T[k]);
      return 540 + D * k + D * (s - (B * Math.sin(2 * Math.PI * s)) / (2 * Math.PI));
    }
  }
  // whip out: start at slow speed and accelerate
  const v0 = ((1 - B) * D) / DUR[8];
  const u = Math.min(f - WHIP_START, 60);
  return 540 + D * 9 + v0 * u + 0.9 * u * u;
};
const CAM = Array.from({length: DURATION + 1}, (_, f) => camX(f));
const startFrame = (k: number) => {
  const cx = -k * D;
  for (let f = 0; f <= DURATION; f++) if (CAM[f] + cx >= 160) return Math.max(f, 2);
  return 0;
};

// ---------------- collage ----------------
type Col = {img: string; w: number; h: number; x: number; y: number; rot: number; zoom: number; fy: number; t0: number; ex: number; ey: number; es: number; frame: Card['frame']; tape?: string; st: St[]};
const COLLAGE: Col[] = [
  {img: 'p01', w: 460, h: 660, x: 300, y: 720, rot: -7, zoom: 1, fy: 0.45, t0: 386, ex: 150, ey: 330, es: 0.78, frame: 'polaroid', st: [
    {t: 'star', c: C.yellow, dx: -0.48, dy: -0.46, s: 110},
    {t: 'swirl', c: C.lilac, dx: 0.52, dy: -0.3, s: 90},
  ]},
  {img: 'p04', w: 420, h: 560, x: 790, y: 690, rot: 6, zoom: 1.22, fy: 0.3, t0: 393, ex: 930, ey: 330, es: 0.78, frame: 'border', tape: C.pink, st: [
    {t: 'heart', c: C.pink, dx: 0.46, dy: -0.48, s: 110},
    {t: 'sparkle', c: C.white, dx: -0.32, dy: 0.34, s: 64, pen: true},
  ]},
  {img: 'p09', w: 420, h: 600, x: 270, y: 1450, rot: 5, zoom: 1, fy: 0.45, t0: 400, ex: 150, ey: 1620, es: 0.78, frame: 'tape', tape: C.blue, st: [
    {t: 'smiley', c: C.lilac, dx: -0.46, dy: 0.42, s: 105},
    {t: 'underline', c: C.yellow, dx: 0.3, dy: 0.6, s: 140},
  ]},
  {img: 'p10', w: 430, h: 570, x: 815, y: 1460, rot: -6, zoom: 1.15, fy: 0.3, t0: 407, ex: 930, ey: 1620, es: 0.78, frame: 'polaroid', st: [
    {t: 'spiky', c: C.yellow, dx: 0.48, dy: 0.44, s: 105},
    {t: 'plus', c: C.blue, dx: -0.56, dy: -0.4, s: 44},
  ]},
  {img: 'p06', w: 500, h: 660, x: 550, y: 1090, rot: -1.5, zoom: 1.15, fy: 0.3, t0: 416, ex: 540, ey: 2350, es: 0.9, frame: 'border', tape: C.lilac, st: [
    {t: 'sparkle', c: C.yellow, dx: -0.54, dy: -0.34, s: 90},
    {t: 'flower', c: C.pink, dx: 0.52, dy: 0.4, s: 110},
    {t: 'arrow', c: C.blue, dx: 0.62, dy: -0.36, s: 120, r: 190},
  ]},
];
const COL_ST0 = 436; // collage stickers start
const BOUNCE = 498;
const EXIT0 = 516;
const EXIT1 = 546;
const LOGO0 = 534;

// ---------------- pieces ----------------
const Photo: React.FC<{img: string; w: number; h: number; zoom: number; fy: number; frame: Card['frame']; tape?: string; idx?: number; seed: number}> = ({img, w, h, zoom, fy, frame, tape, seed}) => {
  const pad = frame === 'tape' ? 0 : 14;
  const bottom = frame === 'polaroid' ? 58 : pad;
  const r = mulberry(seed);
  return (
    <div
      style={{
        position: 'absolute',
        left: -w / 2,
        top: -h / 2,
        width: w,
        height: h,
        background: '#fffdf9',
        borderRadius: 4,
        boxShadow: '0 1px 2px rgba(60,40,90,0.14), 0 8px 16px rgba(60,40,90,0.13), 0 26px 48px rgba(60,40,90,0.13)',
      }}
    >
      <div style={{position: 'absolute', left: pad, top: pad, right: pad, bottom, overflow: 'hidden', borderRadius: frame === 'tape' ? 4 : 2}}>
        <Img
          src={staticFile(`photos/${img}.jpg`)}
          style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: `50% ${fy * 100}%`, transform: `scale(${zoom})`, transformOrigin: `50% ${fy * 100}%`}}
        />
      </div>
      {tape ? (
        <div
          style={{
            position: 'absolute',
            left: w / 2 - 70 + (r() - 0.5) * 60,
            top: -22,
            width: 140,
            height: 44,
            background: tape,
            opacity: 0.78,
            transform: `rotate(${(r() - 0.5) * 16}deg)`,
            clipPath: 'polygon(0 8%,4% 0,8% 10%,12% 0,100% 0,96% 12%,100% 25%,96% 40%,100% 55%,96% 70%,100% 85%,96% 100%,0 100%,4% 85%,0 70%,4% 55%,0 40%,4% 25%)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
          }}
        />
      ) : null}
    </div>
  );
};

const BG_ITEMS = (() => {
  const r = mulberry(99);
  const types: StickerType[] = ['plus', 'sparkle', 'starOutline', 'heartOutline', 'dots', 'swirl'];
  const cols = [C.lilac, C.pink, C.blue, C.yellow];
  return Array.from({length: 34}, (_, i) => ({
    t: types[i % types.length],
    c: cols[Math.floor(r() * cols.length)],
    x: -2200 + r() * 3600,
    y: 470 + r() * 1400,
    s: 34 + r() * 30,
    r: r() * 360,
  }));
})();

export const Main: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = CAM[Math.min(frame, DURATION)];
  const vel = CAM[Math.min(frame + 1, DURATION)] - CAM[Math.max(frame - 1, 0)];
  const blur = Math.min(Math.max((Math.abs(vel) / 2 - 11) * 0.5, 0), 12);
  const galleryOn = frame < WHIP_END + 4;

  // gentle camera breathing zoom (no beat pulse)
  const zoom = 1.02 + 0.02 * Math.sin((frame / DURATION) * Math.PI * 2.2);

  const exitP = interpolate(frame, [EXIT0, EXIT1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});

  return (
    <AbsoluteFill style={{background: '#FBF7F1', overflow: 'hidden'}}>
      <DoodleDefs />
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <filter id="mblur" x="-10%" y="-5%" width="120%" height="110%">
            <feGaussianBlur stdDeviation={`${blur} 0`} />
          </filter>
        </defs>
      </svg>
      <Img src={staticFile('paper.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}} />

      {/* faint parallax doodles on the paper */}
      <AbsoluteFill style={{transform: `translateX(${(cam - 540) * 0.35 - (frame > WHIP_START ? 0 : 0)}px)`, opacity: 0.32}}>
        {BG_ITEMS.map((b, i) => (
          <Sticker key={i} type={b.t} color={b.c} x={b.x + 540} y={b.y} size={b.s} rot={b.r} start={-40} frame={frame} seed={i + 50} />
        ))}
      </AbsoluteFill>

      {/* -------- gallery -------- */}
      {galleryOn ? (
        <AbsoluteFill style={{transform: `scale(${zoom})`, filter: blur > 0.3 ? 'url(#mblur)' : undefined}}>
          {CARDS.map((c, k) => {
            const sx = cam - k * D;
            if (sx < -500 || sx > 1600) return null;
            const near = Math.exp(-(((sx - 540) / 330) ** 2));
            const s = 1 + 0.05 * near;
            const st0 = startFrame(k);
            return (
              <div key={k} style={{position: 'absolute', left: sx, top: c.y, transform: `rotate(${c.rot}deg) scale(${s})`, zIndex: 100 - k}}>
                <Photo img={c.img} w={c.w} h={c.h} zoom={c.zoom} fy={c.fy} frame={c.frame} tape={c.tape} seed={k + 7} />
                {c.st.map((t, j) => (
                  <Sticker key={j} type={t.t} color={t.c} x={t.dx * c.w} y={t.dy * c.h} size={t.s * 1.25} rot={(t.r ?? 0) - c.rot * 0.5} start={st0 + j * 7 + (k % 2) * 3} frame={frame} seed={k * 10 + j} pen={t.pen} />
                ))}
              </div>
            );
          })}
        </AbsoluteFill>
      ) : null}

      {/* -------- final collage -------- */}
      {frame >= COLLAGE[0].t0
        ? COLLAGE.map((c, k) => {
            const l = frame - c.t0;
            if (l < 0) return null;
            const ps = popScale(l);
            const drop = interpolate(l, [0, 9], [1.35, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.6))});
            const op = interpolate(l, [0, 4], [0, 1], {extrapolateRight: 'clamp'});
            const rr = c.rot + interpolate(l, [0, 12], [9 * (k % 2 ? -1 : 1), 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2))});
            const x = c.x + (c.ex - c.x) * exitP;
            const y = c.y + (c.ey - c.y) * exitP;
            const sc = drop * (1 + (c.es - 1) * exitP) * (l < 16 ? Math.max(ps, 0.9) : 1);
            return (
              <div key={'c' + k} style={{position: 'absolute', left: x, top: y, transform: `rotate(${rr}deg) scale(${sc})`, opacity: op, zIndex: 200 + k}}>
                <Photo img={c.img} w={c.w} h={c.h} zoom={c.zoom} fy={c.fy} frame={c.frame} tape={c.tape} seed={k + 30} />
                {c.st.map((t, j) => (
                  <Sticker key={j} type={t.t} color={t.c} x={t.dx * c.w} y={t.dy * c.h} size={t.s * 1.25} rot={t.r ?? 0} start={COL_ST0 + k * 6 + j * 13} frame={frame} seed={200 + k * 10 + j} pen={t.pen} bounceAt={BOUNCE + k * 3 + j * 2} />
                ))}
              </div>
            );
          })
        : null}

      {/* -------- logo end card -------- */}
      {frame >= LOGO0 ? <EndCard frame={frame} /> : null}
    </AbsoluteFill>
  );
};

const TITLE_OUT = 584;
const NAF0 = 594;
const EndCard: React.FC<{frame: number}> = ({frame}) => {
  const l = frame - LOGO0;
  const out = interpolate(frame, [TITLE_OUT, TITLE_OUT + 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
  const n = frame - NAF0;
  const logoS = interpolate(n, [0, 14], [0.82, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.5))});
  const logoO = interpolate(n, [0, 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const title = 'Harvard';
  return (
    <AbsoluteFill style={{zIndex: 400}}>
      {out < 1 ? (
        <AbsoluteFill style={{opacity: 1 - out, transform: `translateY(${-40 * out}px) scale(${1 - 0.08 * out})`}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 790, textAlign: 'center', fontFamily: 'DMSerif', fontStyle: 'italic', fontSize: 190, lineHeight: 1, color: '#1E3A2C'}}>
            {title.split('').map((ch, i) => {
              const li = l - 4 - i * 2.4;
              const o = interpolate(li, [0, 5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              const y = interpolate(li, [0, 11], [50, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2.2))});
              const r = interpolate(li, [0, 11], [i % 2 ? 8 : -8, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2))});
              return (
                <span key={i} style={{display: 'inline-block', opacity: o, transform: `translateY(${y}px) rotate(${r}deg)`}}>
                  {ch}
                </span>
              );
            })}
          </div>
          <Sticker type="underline" color={C.pink} x={560} y={1040} size={330} start={LOGO0 + 20} frame={frame} seed={901} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 1085, textAlign: 'center', fontFamily: 'Caveat', fontSize: 66, color: '#8C76B8', opacity: interpolate(l, [26, 34], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
            the collection
          </div>
          <Sticker type="sparkle" color={C.yellow} x={880} y={800} size={74} start={LOGO0 + 24} frame={frame} seed={905} />
          <Sticker type="heart" color={C.lilac} x={200} y={1110} size={62} start={LOGO0 + 32} frame={frame} seed={906} />
        </AbsoluteFill>
      ) : null}
      <Img
        src={staticFile('nafesa_ink.png')}
        style={{position: 'absolute', left: 540 - 260, top: 760, width: 520, transform: `scale(${logoS})`, opacity: logoO}}
      />
      <Sticker type="sparkle" color={C.yellow} x={845} y={790} size={66} start={NAF0 + 10} frame={frame} seed={902} />
      <Sticker type="star" color={C.blue} x={250} y={1080} size={56} start={NAF0 + 16} frame={frame} seed={904} />
    </AbsoluteFill>
  );
};
