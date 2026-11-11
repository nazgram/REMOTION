// Petal Pop Drop 3, photo collage v2 (9:16, 16.1 s), laid out like TikTok reference 1, on its song.
// The camera pans without stopping along tall white-framed pages (one per colourway) on a background in that
// colourway's colour. Big tilted polaroids / a feed card overlap each page edge; the model is cut out with a thin
// torn white border + a coloured line and lifts off the page as it centres while the photo behind dims, with a
// glint. Big four-petal flower heads from the print (no stems, no outline) sit behind and in front; two pink
// stickers per page. The strip ends on a cream page that grows to fill the screen: logo, 15 November, flower
// corners, NAFESA last.
// Timeline: timeline.json (scripts/drop3p_layout.js), assets: public/drop3p (scripts/drop3p_assets.py).
import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, interpolate, interpolateColors, spring, staticFile, useCurrentFrame } from 'remotion';
import { loadFont } from '@remotion/fonts';
import P from '../drop3t/pattern.json';
import L from '../drop3t/logo.json';
import META from '../../public/drop3p/meta.json';
import TL from './timeline.json';
import T7 from '../drop3t/timeline.json';
import V from '../drop3t/views.json';

const SERIF = 'DM Serif Display';
loadFont({ family: SERIF, url: staticFile('fonts/dm-serif-display-latin-400-normal.woff2') });

type Unit = { x: number; y: number; r: number; p: [string, number][] };
type Way = keyof typeof P.palettes;
const UNITS = P.units as unknown as Unit[];
const { W, H, FPS, BEAT, T0, PAGE, SEG, SB, HOLD_FROM, HOLD_TO, WOB, CS, KS, END } = TL;
const BG = TL.BG as Record<string, string>;
const INK = '#042215';
const CREAM = BG.End;
const OUTLINE: Record<string, string> = { Buttercup: '#e889b3', Camellia: '#c53b73', Petunia: '#ad8a76', Lavender: '#b0688f', Marigold: '#eeb1c9' };
const WAYINFO = META.ways as unknown as Record<string, { head: number[] }>;

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = (t: number, a: number, b: number, fn = Easing.inOut(Easing.cubic)) => interpolate(t, [a, b], [0, 1], { ...clamp, easing: fn });
const pop = (t: number, at: number, damping = 11) => (t < at ? 0 : spring({ frame: (t - at) * FPS, fps: FPS, config: { damping, mass: 0.6, stiffness: 170 } }));
const bounce = (t: number, at: number, dur: number) => (t < at ? 0 : Easing.bounce(Math.min(1, (t - at) / dur)));

// ---------- camera (same curve as the layout script) ----------
const ulin = (b: number) => b / SB - (WOB * Math.sin((2 * Math.PI * b) / SB)) / (2 * Math.PI);
function u(b: number) {
  if (b <= HOLD_FROM) return ulin(b);
  if (b >= HOLD_TO) return 5;
  const T = HOLD_TO - HOLD_FROM, tau = (b - HOLD_FROM) / T;
  const h00 = 2 * tau ** 3 - 3 * tau ** 2 + 1, h10 = tau ** 3 - 2 * tau ** 2 + tau, h01 = -2 * tau ** 3 + 3 * tau ** 2;
  const m0 = (1 - WOB * Math.cos((2 * Math.PI * HOLD_FROM) / SB)) / SB;
  return h00 * ulin(HOLD_FROM) + h10 * T * m0 + h01 * 5;
}
const smooth = (a: number, b: number, x: number) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
const camX = (t: number) => { const b = (t - T0) / BEAT; return u(b) * SEG + PAGE.w / 2 + 70 * (1 - smooth(19, HOLD_TO, b)); };

// background colour follows the page under the screen centre, blending across the gaps
const bgAt = (t: number) => {
  const x = (camX(t) - PAGE.w / 2) / SEG; // 0 = first page centred-ish, 5 = end page
  const keys = [...TL.WAYS, 'End'];
  const stops = keys.map((_, i) => i);
  return interpolateColors(Math.max(0, Math.min(5, x)), stops, keys.map((k) => BG[k]));
};

// ---------- pieces ----------
const UnitG: React.FC<{ u: Unit; way: Way }> = ({ u, way }) => {
  const pal = P.palettes[way].colors;
  return <>{u.p.map(([d, c], i) => <path key={i} d={d} fill={pal[c]} />)}</>;
};
// a cluster of the print (units at their print positions, scaled), popping in one by one and swaying
const Cluster: React.FC<{ units: number[][]; way: Way; t: number }> = ({ units, way, t }) => (
  <svg width={PAGE.w} height={PAGE.h} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.18))' }}>
    {units.map(([i, x, y, at, rot, ph]) => {
      const k = pop(t, at, 10);
      if (k <= 0.001) return null;
      const un = UNITS[i];
      const sway = Math.sin(t * 1.6 + ph) * 5 + rot * (1 - Math.min(1, k));
      return (
        <g key={i} transform={`translate(${x} ${y}) rotate(${sway}) scale(${CS * KS * k}) translate(${-un.x} ${-un.y})`}>
          <UnitG u={un} way={way} />
        </g>
      );
    })}
  </svg>
);

type Stk = { name: string; x: number; y: number; w: number; h: number; rot: number; at: number; ph: number };
const Sticker: React.FC<{ s: Stk; t: number }> = ({ s, t }) => {
  const k = pop(t, s.at, 9);
  if (k <= 0.001) return null;
  const rot = s.rot + (1 - Math.min(1, k)) * -30 + Math.sin(t * 3 + s.ph) * 3 * Math.min(1, k);
  return (
    <Img src={staticFile(`drop3p/stk/${s.name}.png`)} style={{ position: 'absolute', left: s.x - s.w / 2, top: s.y - s.h / 2, width: s.w, height: s.h, transform: `rotate(${rot}deg) scale(${k})`, opacity: Math.min(1, k * 4), filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.3))' }} />
  );
};

const Heart: React.FC<{ c: string; s: number }> = ({ c, s }) => (
  <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 21C5 15.5 2 12.5 2 8.8 2 6 4.1 4 6.7 4c1.9 0 3.5 1 5.3 3 1.8-2 3.4-3 5.3-3C19.9 4 22 6 22 8.8 22 12.5 19 15.5 12 21z" fill={c} /></svg>
);
type Cd = { k: string; img: string; x: number; y: number; w: number; h: number; rot: number; at: number; cell: number };
const Card: React.FC<{ c: Cd; t: number; way: string }> = ({ c, t, way }) => {
  const k = pop(t, c.at, 12);
  if (k <= 0.001) return null;
  const ig = c.k === 'ig';
  const pad = ig ? 12 : 16, strip = ig ? 56 : 70;
  const src = c.img === 'cell' ? `drop3p/cell_${c.cell}.jpg` : `drop3p/${c.img}_${way}.jpg`;
  const slide = (1 - Math.min(1, k)) * 260;
  return (
    <div style={{ position: 'absolute', left: c.x + slide, top: c.y, width: c.w, height: c.h, background: '#fffdf9', borderRadius: ig ? 14 : 4, padding: `${pad}px ${pad}px 0`, boxSizing: 'border-box', boxShadow: '0 16px 30px rgba(0,0,0,0.35)', transform: `rotate(${c.rot + (1 - Math.min(1, k)) * 14}deg)`, opacity: Math.min(1, k * 3) }}>
      <Img src={staticFile(src)} style={{ width: c.w - pad * 2, height: c.h - pad - strip, objectFit: 'cover', display: 'block', borderRadius: ig ? 6 : 0, filter: 'contrast(1.04) saturate(1.05)' }} />
      {ig && (
        <div style={{ position: 'absolute', left: 18, right: 18, bottom: 0, height: strip, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Heart c="#e0245e" s={30} />
          <div style={{ display: 'flex', gap: 6 }}>{[0, 1, 2].map((i) => <div key={i} style={{ width: 8, height: 8, borderRadius: 4, background: '#222' }} />)}</div>
        </div>
      )}
    </div>
  );
};

// a four-point glint
const Glint: React.FC<{ x: number; y: number; t: number; at: number; size: number; color: string }> = ({ x, y, t, at, size, color }) => {
  const k = t < at ? 0 : Math.sin(Math.min(1, (t - at) / 0.6) * Math.PI);
  if (k <= 0) return null;
  return (
    <svg width={size * 2} height={size * 2} viewBox="-10 -10 20 20" style={{ position: 'absolute', left: x - size, top: y - size, transform: `rotate(${(t - at) * 90}deg) scale(${k})` }}>
      <path d="M0,-10 C1.2,-2.4 2.4,-1.2 10,0 C2.4,1.2 1.2,2.4 0,10 C-1.2,2.4 -2.4,1.2 -10,0 C-2.4,-1.2 -1.2,-2.4 0,-10Z" fill={color} />
    </svg>
  );
};

// page photo sits 926 x 1640 (cover of the 960 x 1700 asset), centred in the 900-wide page
const PH_W = Math.round((960 * PAGE.h) / 1700), PH_X = -(PH_W - PAGE.w) / 2, PH_S = PAGE.h / 1700;
type Pg = { way: string; i: number; X: number; pop: number; cards: Cd[]; stk: Stk[]; clusters: number[][][]; tag: { x: number; y: number; w: number; at: number } };
const PAGES = TL.pages as unknown as Pg[];
const FRAME = '0 0 0 16px #fffdf9, 0 26px 50px rgba(0,0,0,0.38)';

const Strip: React.FC<{ t: number; cx: number }> = ({ t, cx }) => {
  const vis = (x0: number, x1: number) => x1 - cx + W / 2 > -200 && x0 - cx + W / 2 < W + 200;
  const shown = PAGES.filter((p) => vis(p.X - 300, p.X + PAGE.w + 600));
  return (
    <>
      {/* pages */}
      {shown.map((p) => {
        const dim = ease(t, p.pop, p.pop + 0.35);
        return (
          <div key={p.i} style={{ position: 'absolute', left: p.X, top: PAGE.y, width: PAGE.w, height: PAGE.h, boxShadow: FRAME, overflow: 'hidden', background: '#fff' }}>
            <Img src={staticFile(`drop3p/page_${p.way}.jpg`)} style={{ position: 'absolute', left: PH_X, top: 0, width: PH_W, height: PAGE.h, filter: `brightness(${1 - 0.32 * dim}) saturate(${1 - 0.35 * dim}) blur(${dim * 3.5}px)` }} />
          </div>
        );
      })}
      {/* the model lifts off its page */}
      {shown.map((p) => {
        const k = pop(t, p.pop, 10);
        if (k <= 0.001) return null;
        const glow = Math.exp(-(t - p.pop) * 5);
        const head = WAYINFO[p.way].head;
        const hx = PH_X + head[0] * PH_S, hy = head[1] * PH_S;
        return (
          <div key={'c' + p.i} style={{ position: 'absolute', left: p.X, top: PAGE.y, width: PAGE.w, height: PAGE.h }}>
            <Img
              src={staticFile(`drop3p/cut_${p.way}.png`)}
              style={{ position: 'absolute', left: PH_X, top: 0, width: PH_W, height: PAGE.h, opacity: Math.min(1, k * 4), transformOrigin: '50% 100%', transform: `scale(${1 + 0.03 * Math.min(1.25, k)}) translateY(${-8 * k}px)`, filter: `drop-shadow(0 16px 22px rgba(0,0,0,0.45)) drop-shadow(0 0 ${10 + 30 * glow}px rgba(255,255,255,${0.9 * glow}))` }}
            />
            <Glint x={hx + 150} y={hy - 30} t={t} at={p.pop + 0.1} size={34} color="#fffdf9" />
            <Glint x={hx - 170} y={hy + 90} t={t} at={p.pop + 0.22} size={24} color={OUTLINE[p.way]} />
            <Glint x={hx + 210} y={hy + 160} t={t} at={p.pop + 0.32} size={18} color="#fffdf9" />
          </div>
        );
      })}
      {/* cards, tags, stickers, flowers */}
      {shown.map((p) => {
        const tk = pop(t, p.tag.at, 11);
        return (
          <div key={'d' + p.i} style={{ position: 'absolute', left: p.X, top: PAGE.y, width: PAGE.w, height: PAGE.h }}>
            {p.clusters.map((c, j) => <Cluster key={'cl' + j} units={c} way={p.way as Way} t={t} />)}
            {p.cards.map((c, j) => <Card key={j} c={c} t={t} way={p.way} />)}
            {tk > 0.001 && (
              <div style={{ position: 'absolute', left: p.tag.x, top: p.tag.y, width: p.tag.w, height: 72, borderRadius: 36, background: '#fffdf9', boxShadow: '0 10px 18px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, transform: `rotate(-3deg) scale(${tk})`, transformOrigin: '0 50%' }}>
                <div style={{ width: 22, height: 22, borderRadius: 11, background: OUTLINE[p.way] }} />
                <span style={{ fontFamily: SERIF, fontSize: 44, color: INK, lineHeight: 1 }}>{p.way}</span>
              </div>
            )}
            {p.stk.map((s, j) => <Sticker key={j} s={s} t={t} />)}
          </div>
        );
      })}
    </>
  );
};

// ---------- end card ----------
type LogoPath = { d: string; fill: string; role: string; box: number[] };
const LOGO = L.paths as LogoPath[];
const centre = (b: number[]) => [b[0] + b[2] / 2, b[1] + b[3] / 2];
const LOGO_Y = 900, LOGO_S = 0.8; // as in the v7 teaser
const Logo: React.FC<{ t: number }> = ({ t }) => {
  const a = TL.logo.at;
  const op = ease(t, a - 0.05, a + 0.2) * (1 - ease(t, TL.logo.out, TL.logo.out + 0.3));
  if (op <= 0) return null;
  const s = interpolate(ease(t, a, a + 1.2, Easing.out(Easing.cubic)), [0, 1], [0.92, 1]);
  const parts = TL.logo.parts as Record<string, number>;
  const pill = LOGO.find((p) => p.role === 'pill')!;
  let li = 0;
  return (
    <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
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
    </svg>
  );
};
const DateText: React.FC<{ t: number }> = ({ t }) => {
  const at = END.date, size = 104, y = 1235;
  const k = ease(t, at, at + 0.55, Easing.out(Easing.back(1.6)));
  if (k <= 0) return null;
  return (
    <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
      <defs><clipPath id="dateclip"><rect x={0} y={y - size * 0.75} width={W} height={size * 1.25} /></clipPath></defs>
      <g clipPath="url(#dateclip)">
        <text x={W / 2} y={y + (1 - k) * size * 1.1} textAnchor="middle" dominantBaseline="central" fontFamily={SERIF} fontSize={size} letterSpacing={(1 - Math.min(1, k)) * 30} fill={INK}>15 November</text>
      </g>
    </svg>
  );
};
const EndCard: React.FC<{ t: number; cx: number }> = ({ t, cx }) => {
  const z = ease(t, END.z0, END.z1, Easing.inOut(Easing.cubic));
  const x0 = END.x - cx + W / 2;
  const left = interpolate(z, [0, 1], [x0, 0]), top = interpolate(z, [0, 1], [PAGE.y, 0]);
  const w = interpolate(z, [0, 1], [PAGE.w, W]), h = interpolate(z, [0, 1], [PAGE.h, H]);
  const sc = Math.max(w / W, h / H);
  return (
    <div style={{ position: 'absolute', left, top, width: w, height: h, background: CREAM, overflow: 'hidden', boxShadow: `0 0 0 ${16 * (1 - z)}px #fffdf9, 0 26px 50px rgba(0,0,0,${0.38 * (1 - z)})` }}>
      <div style={{ position: 'absolute', left: (w - W * sc) / 2, top: (h - H * sc) / 2, width: W, height: H, transformOrigin: '0 0', transform: `scale(${sc})` }}>
        <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
          {(TL.corners as unknown as number[][]).map(([i, x, y, s, at, rot], j) => {
            const k = pop(t, at, 12);
            if (k <= 0.001) return null;
            const un = UNITS[i];
            const sw = Math.sin(t * 1.6 + j) * 3;
            return (
              <g key={j} transform={`translate(${x} ${y}) rotate(${rot * (1 - Math.min(1, k)) + sw}) scale(${s * k}) translate(${-un.x} ${-un.y})`}>
                <UnitG u={un} way="Buttercup" />
              </g>
            );
          })}
        </svg>
        <Logo t={t} />
        {[[400, -230, '#f8a5cb', 30], [-420, 130, '#98d4f1', 24], [380, 200, '#77b27e', 20], [-330, -260, '#f8a5cb', 18]].map(([dx, dy, c, sz], i) => (
          <Glint key={i} x={W / 2 + (dx as number)} y={LOGO_Y + (dy as number)} t={t} at={TL.logo.parts.heart + i * 0.08} size={sz as number} color={c as string} />
        ))}
        <DateText t={t} />
      </div>
    </div>
  );
};

// ---------- Camellia blooms from the centre and melt the end card into magenta (the v7 teaser's b4) ----------
const MAGENTA = (V.accent as Record<string, string>).Camellia;
const B7 = T7.BLOOM;
const BV = { cx: (V.views as Record<string, number[]>).Camellia[0], cy: (V.views as Record<string, number[]>).Camellia[1], s: V.S * 1.05, y0: H / 2 };
const Bloom: React.FC<{ t: number }> = ({ t }) => {
  const b = T7.blooms.b4, at = END.bloom;
  const way = b.way as Way;
  const pal = P.palettes[way].colors;
  const [ox, oy] = b.origin;
  const R = ease(t, at + B7.maskLag, at + B7.maskLag + B7.spread + 0.15, Easing.inOut(Easing.sin)) * (b.dmax + 260);
  const mask = `radial-gradient(circle at ${ox}px ${oy}px, #000 ${Math.max(0, R - 240)}px, rgba(0,0,0,0) ${R}px)`;
  return (
    <>
      {R > 0 && <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, background: MAGENTA, WebkitMaskImage: mask, maskImage: mask }} />}
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <g transform={`translate(${W / 2} ${BV.y0}) scale(${BV.s}) translate(${-BV.cx} ${-BV.cy})`}>
          {(b.units as number[][]).map(([i, delay, rot]) => {
            const t0 = at + delay;
            if (t < t0) return null;
            const grow = ease(t, t0, t0 + B7.grow, Easing.out(Easing.cubic));
            const st = at + B7.hold + delay * 0.6;
            const settle = ease(t, st, st + B7.settle, Easing.inOut(Easing.sin));
            if (settle >= 1) return null;
            const k = B7.cover * grow + (b.land - B7.cover) * settle;
            if (k <= 0.001) return null;
            const op = Math.min(1, (t - t0) / 0.14) * (b.land === 0 ? 1 - settle : 1);
            const un = UNITS[i];
            const r = rot * (1 - grow) + rot * 0.25 * Math.sin(settle * Math.PI);
            return (
              <g key={i} opacity={op} transform={`translate(${un.x} ${un.y}) rotate(${r}) scale(${k}) translate(${-un.x} ${-un.y})`}>
                {un.p.map(([d, c], q) => <path key={q} d={d} fill={pal[c]} />)}
              </g>
            );
          })}
        </g>
      </svg>
    </>
  );
};
const Nafesa: React.FC<{ t: number }> = ({ t }) => {
  const naf = pop(t, END.nafesa, 12);
  if (naf <= 0.001) return null;
  return (
    <>
      {[[300, -40, '#fde0d3', 26], [-310, 60, '#f3b12f', 22], [240, 150, '#fde0d3', 18], [-250, -120, '#f3b12f', 16]].map(([dx, dy, c, sz], i) => (
        <Glint key={i} x={W / 2 + (dx as number)} y={LOGO_Y + (dy as number)} t={t} at={END.nafesa + 0.2 + i * 0.07} size={sz as number} color={c as string} />
      ))}
      <Img src={staticFile('drop3/nafesa.png')} style={{ position: 'absolute', width: 440, left: W / 2 - 220, top: LOGO_Y - 150, opacity: Math.min(1, naf * 1.4), transform: `scale(${0.85 + 0.15 * naf})` }} />
    </>
  );
};

// ---------- composition ----------
export const PetalPopDrop3Photo: React.FC<{ withAudio: boolean }> = ({ withAudio }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cx = camX(t);
  const bph = ((t - T0) / BEAT) % 1;
  const pulse = t > T0 && t < END.z0 ? 1 + 0.01 * Math.exp(-bph * 7) : 1;
  const sway = Math.sin(t * 1.3) * 7 * (1 - ease(t, END.z0 - 0.8, END.z0));
  const gx = (frame * 37) % 97, gy = (frame * 53) % 89;
  return (
    <AbsoluteFill style={{ backgroundColor: bgAt(t), overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: `${W / 2}px ${H / 2}px`, transform: `scale(${pulse}) translate(0px, ${sway}px)` }}>
        <div style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${W / 2 - cx}px, 0px)` }}>
          <Strip t={t} cx={cx} />
        </div>
      </div>
      {END.x - cx + W / 2 < W + 100 && t < END.magenta + 0.05 && <EndCard t={t} cx={cx} />}
      {t >= END.bloom && t < END.magenta + 0.05 && <Bloom t={t} />}
      {t >= END.magenta && <div style={{ position: 'absolute', inset: 0, background: MAGENTA }} />}
      <Nafesa t={t} />
      <Img src={staticFile('drop3p/grain.png')} style={{ position: 'absolute', left: -gx, top: -gy, width: W + 200, height: H + 200, opacity: 0.07, mixBlendMode: 'overlay' }} />
      {withAudio && <Audio src={staticFile('drop3p/mix.wav')} />}
    </AbsoluteFill>
  );
};
