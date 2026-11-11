// Petal Pop Drop 3, photo collage (9:16, 16.1 s) in the style of the two TikTok references, on the song of reference 1.
//   A  the camera pans along five white-framed pages (one per colourway); the model is cut out with a torn white
//      border, polaroids, pink stickers and the print's own flowers pop in as they come into view
//   B  2 x 5 grid of face crops, cut-outs lift out of their cells, stickers slapped on in stop motion
//   C  the grid zooms away: cream end card, Pétal Pop logo, 15 November, corner flowers, NAFESA last
// Timeline: timeline.json (scripts/drop3p_layout.js), assets: public/drop3p (scripts/drop3p_assets.py).
import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, interpolate, spring, staticFile, useCurrentFrame } from 'remotion';
import { loadFont } from '@remotion/fonts';
import P from '../drop3t/pattern.json';
import L from '../drop3t/logo.json';
import V from '../drop3t/views.json';
import TL from './timeline.json';

const SERIF = 'DM Serif Display';
loadFont({ family: SERIF, url: staticFile('fonts/dm-serif-display-latin-400-normal.woff2') });

type Unit = { x: number; y: number; r: number; p: [string, number][] };
type Way = keyof typeof P.palettes;
const UNITS = P.units as unknown as Unit[];
const { W, H, FPS, BEAT, T0, PAGE, SPACING, PAGE_BEATS, HOLD_FROM, HOLD_TO, U_HOLD } = TL;
const INK = '#042215';
const CREAM = P.palettes.Buttercup.bg;
const DARK = '#0b0709';
const ACCENT = V.accent as Record<string, string>;
const bt = (b: number) => T0 + b * BEAT;
const B0T = bt(TL.B0), C0 = bt(TL.B1);

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = (t: number, a: number, b: number, fn = Easing.inOut(Easing.cubic)) => interpolate(t, [a, b], [0, 1], { ...clamp, easing: fn });
const pop = (t: number, at: number, damping = 11) => (t < at ? 0 : spring({ frame: (t - at) * FPS, fps: FPS, config: { damping, mass: 0.6, stiffness: 170 } }));
const bounce = (t: number, at: number, dur: number) => (t < at ? 0 : Easing.bounce(Math.min(1, (t - at) / dur)));

// ---------- camera (same curve as the layout script) ----------
function u(b: number) {
  const lin = (x: number) => x / PAGE_BEATS;
  if (b <= HOLD_FROM) return lin(b) - (0.16 * Math.sin(2 * Math.PI * lin(b))) / (2 * Math.PI);
  if (b >= HOLD_TO) return 4;
  const T = HOLD_TO - HOLD_FROM, tau = (b - HOLD_FROM) / T;
  const h00 = 2 * tau ** 3 - 3 * tau ** 2 + 1, h10 = tau ** 3 - 2 * tau ** 2 + tau, h01 = -2 * tau ** 3 + 3 * tau ** 2;
  const m0 = (1 - 0.16 * Math.cos(2 * Math.PI * lin(HOLD_FROM))) / PAGE_BEATS;
  return h00 * (U_HOLD - (0.16 * Math.sin(2 * Math.PI * U_HOLD)) / (2 * Math.PI)) + h10 * T * m0 + h01 * 4;
}
const camX = (t: number) => u((t - T0) / BEAT) * SPACING;

// ---------- vectors ----------
const Flower: React.FC<{ unit: number; way: Way; size: number; stroke?: number }> = ({ unit, way, size, stroke = 11 }) => {
  const un = UNITS[unit];
  const pal = P.palettes[way].colors;
  const vb = un.r * 2.5, px = size / vb, sw = stroke / px;
  return (
    <svg width={size} height={size} viewBox={`${un.x - vb / 2} ${un.y - vb / 2} ${vb} ${vb}`} style={{ overflow: 'visible', filter: 'drop-shadow(0 5px 7px rgba(0,0,0,0.3))' }}>
      <g stroke="#fff" strokeWidth={sw * 2} strokeLinejoin="round" fill="#fff">
        {un.p.map(([d], i) => <path key={i} d={d} />)}
      </g>
      {un.p.map(([d, c], i) => <path key={i} d={d} fill={pal[c]} />)}
    </svg>
  );
};

// sticker position (centre) + pop with a wobble; `quant` makes it stop motion
type El = { k: string; name?: string; u?: number; way?: string; x: number; y: number; w?: number; h?: number; size?: number; rot: number; at: number; ph?: number };
const Sticker: React.FC<{ e: El; t: number; way: Way; stop?: boolean; dx?: number; dy?: number }> = ({ e, t, way, stop, dx = 0, dy = 0 }) => {
  const q = stop ? Math.floor(t * 9) / 9 : t;
  const k = pop(q, e.at, stop ? 14 : 9);
  if (k <= 0.001) return null;
  const wig = stop ? (Math.floor(t * 6) % 2 ? 5 : -5) : Math.sin(t * 3 + (e.ph ?? 0)) * 3.5;
  const rot = e.rot + (1 - Math.min(1, k)) * -28 + wig * Math.min(1, k);
  const isF = e.k === 'flower';
  const w = isF ? e.size! : e.w!, h = isF ? e.size! : e.h!;
  return (
    <div style={{ position: 'absolute', left: e.x + dx - w / 2, top: e.y + dy - h / 2, width: w, height: h, transform: `rotate(${rot}deg) scale(${k})`, opacity: Math.min(1, k * 4) }}>
      {isF ? (
        <Flower unit={e.u!} way={(e.way as Way) ?? way} size={w} />
      ) : (
        <Img src={staticFile(`drop3p/stk/${e.name}.png`)} style={{ width: w, height: h, filter: 'drop-shadow(0 5px 7px rgba(0,0,0,0.32))' }} />
      )}
    </div>
  );
};

// ---------- A: the strip ----------
const Heart: React.FC<{ c: string; s: number }> = ({ c, s }) => (
  <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 21C5 15.5 2 12.5 2 8.8 2 6 4.1 4 6.7 4c1.9 0 3.5 1 5.3 3 1.8-2 3.4-3 5.3-3C19.9 4 22 6 22 8.8 22 12.5 19 15.5 12 21z" fill={c} /></svg>
);
const Card: React.FC<{ e: El; t: number; way: Way; src: string }> = ({ e, t, way, src }) => {
  const k = pop(t, e.at, 10);
  if (k <= 0.001) return null;
  const pad = 13, strip = 52;
  return (
    <div style={{ position: 'absolute', left: e.x, top: e.y, width: e.w, height: e.h, background: '#fffdfb', borderRadius: 8, padding: `${pad}px ${pad}px 0`, boxSizing: 'border-box', boxShadow: '0 12px 24px rgba(0,0,0,0.38)', transform: `rotate(${e.rot + (1 - Math.min(1, k)) * (e.rot > 0 ? 20 : -20)}deg) scale(${k})`, opacity: Math.min(1, k * 4) }}>
      <Img src={staticFile(src)} style={{ width: e.w! - pad * 2, height: e.h! - pad - strip, objectFit: 'cover', display: 'block' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: strip, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Heart c={ACCENT[way]} s={26} />
      </div>
    </div>
  );
};
const Tag: React.FC<{ e: El; t: number; way: Way }> = ({ e, t, way }) => {
  const k = pop(t, e.at, 10);
  if (k <= 0.001) return null;
  return (
    <div style={{ position: 'absolute', left: e.x, top: e.y, width: e.w, height: 84, borderRadius: 42, background: '#fffdfb', boxShadow: '0 10px 20px rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, transform: `rotate(${e.rot}deg) scale(${k})`, opacity: Math.min(1, k * 4) }}>
      <div style={{ width: 26, height: 26, borderRadius: 13, background: ACCENT[way] }} />
      <span style={{ fontFamily: SERIF, fontSize: 50, color: INK, lineHeight: 1 }}>{way}</span>
    </div>
  );
};

const Strip: React.FC<{ t: number }> = ({ t }) => {
  const cx = camX(t);
  const vis = (xs: number, pad = 520) => { const s = xs - cx + W / 2; return s > -pad && s < W + pad; };
  const pages = TL.pages as unknown as { way: Way; i: number; X: number; els: El[] }[];
  return (
    <>
      {pages.map((pg) =>
        vis(pg.X + PAGE.x + PAGE.w / 2, 700) ? (
          <div key={pg.i} style={{ position: 'absolute', left: pg.X + PAGE.x, top: PAGE.y, width: PAGE.w, height: PAGE.h, borderRadius: 14, boxShadow: '0 0 0 14px #fffdfb, 0 24px 48px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
            <Img src={staticFile(`drop3p/page_${pg.way}.jpg`)} style={{ width: PAGE.w, height: PAGE.h }} />
          </div>
        ) : null,
      )}
      {pages.map((pg) => {
        if (!vis(pg.X + PAGE.x + PAGE.w / 2, 700)) return null;
        const ox = pg.X + PAGE.x, oy = PAGE.y;
        return (
          <div key={pg.i} style={{ position: 'absolute', left: ox, top: oy, width: PAGE.w, height: PAGE.h }}>
            {pg.els.map((e, j) => {
              if (t < e.at) return null;
              if (e.k === 'cut') {
                const k = pop(t, e.at, 12);
                return <Img key={j} src={staticFile(`drop3p/cut_${pg.way}.png`)} style={{ position: 'absolute', left: 0, top: 0, width: PAGE.w, height: PAGE.h, opacity: Math.min(1, k * 3), transform: `scale(${1 + 0.035 * Math.min(1.2, k)})`, filter: 'drop-shadow(0 12px 18px rgba(0,0,0,0.42))' }} />;
              }
              if (e.k === 'cardA') return <Card key={j} e={e} t={t} way={pg.way} src={`drop3p/cardA_${pg.way}.jpg`} />;
              if (e.k === 'cardB') return <Card key={j} e={e} t={t} way={pg.way} src={`drop3p/cardB_${pg.way}.jpg`} />;
              if (e.k === 'tag') return <Tag key={j} e={e} t={t} way={pg.way} />;
              return <Sticker key={j} e={e} t={t} way={pg.way} />;
            })}
          </div>
        );
      })}
    </>
  );
};

// ---------- B: the grid ----------
const CELL_W = W / 2, CELL_H = H / 5;
const Grid: React.FC<{ t: number }> = ({ t }) => {
  const cells = TL.cells as unknown as { k: number; way: Way; row: number; col: number; at: number; lift: number }[];
  return (
    <>
      {cells.map((c) => {
        const k = pop(t, c.at, 13);
        return (
          <div key={c.k} style={{ position: 'absolute', left: c.col * CELL_W, top: c.row * CELL_H, width: CELL_W, height: CELL_H, overflow: 'hidden', background: P.palettes[c.way].bg }}>
            {k > 0.001 && <Img src={staticFile(`drop3p/cell_${c.k}.jpg`)} style={{ position: 'absolute', left: 0, top: 0, width: CELL_W, height: CELL_H, transform: `scale(${1 + 0.22 * (1 - Math.min(1, k))})`, opacity: Math.min(1, k * 3) }} />}
          </div>
        );
      })}
      {cells.map((c) => {
        const k = pop(t, c.lift, 11);
        if (k <= 0.001) return null;
        return (
          <Img key={'c' + c.k} src={staticFile(`drop3p/cellcut_${c.k}.png`)} style={{ position: 'absolute', left: c.col * CELL_W, top: c.row * CELL_H, width: CELL_W, height: CELL_H, opacity: Math.min(1, k * 4), transform: `scale(${1 + 0.085 * Math.min(1.15, k)}) rotate(${(c.col ? 1 : -1) * 1.4 * Math.min(1, k)}deg)`, filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.4))' }} />
        );
      })}
      {(TL.gridFlowers as unknown as El[]).map((e, i) => <Sticker key={'f' + i} e={e} t={t} way={(e.way as Way) ?? 'Buttercup'} stop />)}
      {(TL.gridStk as unknown as El[]).map((e, i) => <Sticker key={'s' + i} e={e} t={t} way="Buttercup" stop />)}
    </>
  );
};

// ---------- C: the end card ----------
type LogoPath = { d: string; fill: string; role: string; box: number[] };
const LOGO = L.paths as LogoPath[];
const centre = (b: number[]) => [b[0] + b[2] / 2, b[1] + b[3] / 2];
const LOGO_Y = 750, LOGO_S = 0.68;
const Logo: React.FC<{ t: number }> = ({ t }) => {
  const a = TL.logo.at;
  const op = ease(t, a - 0.05, a + 0.2);
  if (op <= 0) return null;
  const s = interpolate(ease(t, a, a + 1.2, Easing.out(Easing.cubic)), [0, 1], [0.92, 1]);
  const parts = TL.logo.parts as Record<string, number>;
  const pill = LOGO.find((p) => p.role === 'pill')!;
  let li = 0;
  return (
    <g opacity={op} transform={`translate(${W / 2} ${LOGO_Y}) scale(${LOGO_S * s}) translate(${-L.w / 2} ${-L.h / 2})`}>
      {LOGO.map((p, i) => {
        const [cx, cy] = centre(p.box);
        if (p.role.startsWith('letter')) {
          const at = a + li++ * 0.06;
          if (t < at) return null;
          const b = bounce(t, at, 0.55);
          return <path key={i} d={p.d} fill={p.fill} opacity={Math.min(1, (t - at) * 7)} transform={`translate(0 ${(1 - b) * -160})`} />;
        }
        const at = parts[p.role];
        const k = pop(t, at, 9);
        if (k <= 0.001) return null;
        const [ox, oy] = p.role === 'drop' ? centre(pill.box) : [cx, cy];
        const spin = p.role === 'flower' ? (1 - Math.min(1, k)) * -120 : 0;
        return <path key={i} d={p.d} fill={p.fill} transform={`translate(${ox} ${oy}) rotate(${spin}) scale(${k}) translate(${-ox} ${-oy})`} />;
      })}
    </g>
  );
};
const Sparkle: React.FC<{ x: number; y: number; t: number; at: number; size: number; color: string }> = ({ x, y, t, at, size, color }) => {
  const k = t < at ? 0 : Math.sin(Math.min(1, (t - at) / 0.7) * Math.PI);
  if (k <= 0) return null;
  return <path transform={`translate(${x} ${y}) rotate(${(t - at) * 90}) scale(${(size * k) / 10})`} d="M0,-10 C1.2,-2.4 2.4,-1.2 10,0 C2.4,1.2 1.2,2.4 0,10 C-1.2,2.4 -2.4,1.2 -10,0 C-2.4,-1.2 -1.2,-2.4 0,-10Z" fill={color} />;
};
const sparkles = (t: number, at: number, box: number[], colors: string[], n = 7, seed = 1) =>
  Array.from({ length: n }, (_, i) => {
    const a = Math.sin(seed * 91 + i * 12.9898) * 43758.5453;
    const f = a - Math.floor(a);
    const ang = (i / n) * Math.PI * 2 + f;
    return <Sparkle key={i} x={box[0] + Math.cos(ang) * box[2] * (0.95 + f * 0.25)} y={box[1] + Math.sin(ang) * box[3] * (0.95 + f * 0.25)} t={t} at={at + i * 0.06} size={18 + f * 22} color={colors[i % colors.length]} />;
  });
const DateText: React.FC<{ t: number }> = ({ t }) => {
  const at = TL.END.date, size = 104, y = 1075;
  const k = ease(t, at, at + 0.55, Easing.out(Easing.back(1.6)));
  if (k <= 0) return null;
  return (
    <svg width={W} height={H} style={{ position: 'absolute' }}>
      <defs><clipPath id="dateclip"><rect x={0} y={y - size * 0.75} width={W} height={size * 1.25} /></clipPath></defs>
      <g clipPath="url(#dateclip)">
        <text x={W / 2} y={y + (1 - k) * size * 1.1} textAnchor="middle" dominantBaseline="central" fontFamily={SERIF} fontSize={size} letterSpacing={(1 - Math.min(1, k)) * 30} fill={INK}>15 November</text>
      </g>
    </svg>
  );
};

// ---------- composition ----------
export const PetalPopDrop3Photo: React.FC<{ withAudio: boolean }> = ({ withAudio }) => {
  const t = useCurrentFrame() / FPS;
  const inA = t < B0T;
  const inC = t >= C0;
  const naf = pop(t, TL.END.nafesa, 12);
  // beat pulse + a little hand-held sway in A
  const bph = ((t - T0) / BEAT) % 1;
  const pulse = 1 + 0.014 * Math.exp(-bph * 7) * (t > T0 ? 1 : 0);
  const sway = Math.sin(t * 1.4) * 9;

  // zoom away at C0
  const z = ease(t, C0, C0 + 0.8, Easing.inOut(Easing.cubic));
  const gridOp = 1 - ease(t, C0 + 0.45, C0 + 0.85, Easing.linear);

  const flash = t >= B0T ? 0.9 * Math.exp(-(t - B0T) * 11) : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: inA ? DARK : CREAM }}>
      {inA && (
        <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: DARK }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: `${W / 2}px ${H / 2}px`, transform: `scale(${pulse}) translate(0 ${sway}px)` }}>
            <div style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0, transform: `translate(${W / 2 - camX(t)}px, 0)` }}>
              <Strip t={t} />
            </div>
          </div>
        </div>
      )}
      {!inA && t < C0 + 0.9 && (
        <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, opacity: gridOp, transformOrigin: `${W / 2}px ${H / 2}px`, transform: `scale(${1 - 0.8 * z}) rotate(${-7 * z}deg) scale(${t < C0 ? pulse : 1})`, boxShadow: z > 0 ? '0 0 50px rgba(0,0,0,0.25)' : undefined, background: DARK }}>
          <Grid t={t} />
        </div>
      )}
      {inC && (
        <>
          <svg width={W} height={H} style={{ position: 'absolute' }}>
            {(TL.corners as unknown as number[][]).map(([i, x, y, s, at, rot], j) => {
              const k = pop(t, at, 12);
              if (k <= 0.001) return null;
              const un = UNITS[i];
              const swayR = Math.sin(t * 1.6 + j) * 3;
              return (
                <g key={j} transform={`translate(${x} ${y}) rotate(${rot * (1 - Math.min(1, k)) + swayR}) scale(${s * k}) translate(${-un.x} ${-un.y})`}>
                  <g>{un.p.map(([d, c], q) => <path key={q} d={d} fill={P.palettes.Buttercup.colors[c]} />)}</g>
                </g>
              );
            })}
          </svg>
          <svg width={W} height={H} style={{ position: 'absolute' }}>
            <Logo t={t} />
            {sparkles(t, TL.logo.parts.heart, [W / 2, LOGO_Y, 380, 270], ['#f8a5cb', '#98d4f1', '#77b27e'], 8, 9)}
          </svg>
          <DateText t={t} />
          {naf > 0 && (
            <svg width={W} height={H} style={{ position: 'absolute' }}>
              {sparkles(t, TL.END.nafesa + 0.2, [W / 2, 1360, 250, 170], ['#f3b12f', '#c53c74'], 6, 11)}
            </svg>
          )}
          {naf > 0.001 && <Img src={staticFile('drop3p/nafesa_ink.png')} style={{ position: 'absolute', width: 380, left: W / 2 - 190, top: 1225, opacity: Math.min(1, naf * 1.4), transform: `scale(${0.85 + 0.15 * naf})` }} />}
        </>
      )}
      {/* the cream behind the zooming grid fades in from underneath: the grid sits above, cream is the root colour */}
      {flash > 0.01 && <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: flash }} />}
      {withAudio && <Audio src={staticFile('drop3p/mix.wav')} />}
    </AbsoluteFill>
  );
};
