import React from 'react';
import {AbsoluteFill, Easing, Img, useCurrentFrame} from 'remotion';
import views from '../views.json';
import {BLOOM_UNITS, colorsOf, DesignId, Unit, UNITS} from '../designs';
import {H, W} from '../layout';
import {asset, ease, FPS, pop, rand} from '../util';

// Pandangan print 16:9 setiap design (sama dengan public/pp4/view_<id>.jpg): viewBox [vx, vy, VW, VH] dalam koordinat tile.
const V = views as unknown as {w: number; h: number; views: Record<string, [number, number]>};
export const VS = W / V.w; // piksel skrin per unit tile
export const viewOf = (id: DesignId) => V.views[id];
export const toScreen = (id: DesignId, u: Unit): [number, number] => {
  const [vx, vy] = viewOf(id);
  return [(u.x - vx) * VS, (u.y - vy) * VS];
};

// Print penuh skrin (raster), satu frame dengan unit vektor.
export const PrintBg: React.FC<{design: DesignId}> = ({design}) => <Img src={asset(`view_${design}.jpg`)} style={{position: 'absolute', left: 0, top: 0, width: W, height: H}} />;

// Satu unit bunga (vektor), skala k dan putaran rot di sekeliling pusatnya; koordinat tile.
export const UnitG: React.FC<{u: Unit; colors: string[]; k: number; rot?: number}> = ({u, colors, k, rot = 0}) => (
  <g transform={`translate(${u.x} ${u.y}) rotate(${rot}) scale(${k}) translate(${-u.x} ${-u.y})`}>
    {u.p.map(([d, c], i) => (
      <path key={i} d={d} fill={colors[c]} />
    ))}
  </g>
);

const hexL = (hex: string) => {
  const h = hex.length === 4 ? hex.replace(/^#(.)(.)(.)$/, '#$1$1$2$2$3$3') : hex;
  const n = parseInt(h.slice(1), 16);
  const r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
};
// Kecerahan purata unit (Black Dahlia: guna unit cerah sahaja supaya nampak atas latar hitam).
export const unitLightness = (u: Unit, colors: string[]) => u.p.reduce((s, [, c]) => s + hexL(colors[c]), 0) / u.p.length;

export type Origin = 'center' | 'bottom' | 'bl' | 'tr' | 'br';
export const ORIGIN: Record<Origin, [number, number]> = {center: [W / 2, H / 2], bottom: [W / 2, H + 120], bl: [-60, H + 60], tr: [W + 60, -60], br: [W + 60, H + 60]};

export type SweepTiming = {pre: number; maskLag: number; spread: number; grow: number; settle: number};
// Blok design: sweep mula 0.8 s sebelum blok, print penuh 0.1 s sebelum blok, unit mendarat atas print selepas blok mula.
export const DESIGN_SWEEP: SweepTiming = {pre: 0.8, maskLag: 0.2, spread: 0.35, grow: 0.4, settle: 0.5};
export const COVER = 2.1;

type BU = {u: Unit; delay: number; rot: number};
const sweepUnits = (design: DesignId, origin: Origin, spread: number, light: boolean): {list: BU[]; dmax: number} => {
  const [ox, oy] = ORIGIN[origin];
  const dmax = Math.max(...[[0, 0], [W, 0], [0, H], [W, H]].map(([x, y]) => Math.hypot(x - ox, y - oy)));
  const colors = colorsOf(design);
  const list: BU[] = [];
  BLOOM_UNITS.forEach((u) => {
    const [sx, sy] = toScreen(design, u);
    if (sx < -120 || sx > W + 120 || sy < -120 || sy > H + 120) return;
    if (light && unitLightness(u, colors) < 0.35) return;
    const i = UNITS.indexOf(u);
    const d = Math.hypot(sx - ox, sy - oy);
    list.push({u, delay: (d / dmax) * spread + rand(i * 3.1) * 0.06, rot: (rand(i * 7.7) - 0.5) * 50});
  });
  list.sort((a, b) => b.u.r - a.u.r); // besar dulu, kecil dilukis atas
  return {list, dmax};
};
const cache = new Map<string, ReturnType<typeof sweepUnits>>();

// Bloom sweep (gaya Petal Pop Drop 3): unit bunga design SETERUSNYA mekar 0 -> 2.1x dari origin, print design itu
// muncul di belakangnya melalui mask bulat lembut yang ketinggalan; lepas blok mula unit mengecil semula ke 1x dan
// mendarat tepat atas bunga yang sama dalam print. t = 0 pada mula sweep (Sequence).
export const BloomSweep: React.FC<{design: DesignId; origin: Origin; timing: SweepTiming; light?: boolean}> = ({design, origin, timing, light = false}) => {
  const t = useCurrentFrame() / FPS;
  const {maskLag, spread, grow, settle, pre} = timing;
  const key = `${design}-${origin}-${spread}-${light}`;
  if (!cache.has(key)) cache.set(key, sweepUnits(design, origin, spread, light));
  const {list, dmax} = cache.get(key)!;
  const [ox, oy] = ORIGIN[origin];
  const R = ease(t, maskLag, maskLag + spread + 0.15, Easing.inOut(Easing.sin)) * (dmax + 260);
  const mask = `radial-gradient(circle at ${ox}px ${oy}px, #000 ${Math.max(0, R - 240)}px, rgba(0,0,0,0) ${R}px)`;
  const colors = colorsOf(design);
  const [vx, vy] = viewOf(design);
  const hold = pre + 0.05;
  return (
    <AbsoluteFill>
      {R > 0 && (
        <AbsoluteFill style={{WebkitMaskImage: R >= dmax + 250 ? undefined : mask, maskImage: R >= dmax + 250 ? undefined : mask}}>
          <PrintBg design={design} />
        </AbsoluteFill>
      )}
      <svg width={W} height={H} viewBox={`${vx} ${vy} ${V.w} ${V.h}`} style={{position: 'absolute', left: 0, top: 0}}>
        {list.map(({u, delay, rot}, i) => {
          if (t < delay) return null;
          const g = ease(t, delay, delay + grow, Easing.out(Easing.cubic));
          const st = hold + delay * 0.6;
          const s = ease(t, st, st + settle, Easing.inOut(Easing.sin));
          if (s >= 1) return null;
          const k = COVER * g + (1 - COVER) * s;
          return (
            <g key={i} opacity={Math.min(1, (t - delay) / 0.14)}>
              <UnitG u={u} colors={colors} k={k} rot={rot * (1 - g) + rot * 0.25 * Math.sin(s * Math.PI)} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

// Masa selepas mula sweep di mana semua unit sudah mendarat.
export const sweepDone = (tm: SweepTiming) => tm.pre + 0.05 + tm.spread * 0.66 + tm.settle + 0.05;

// Bloom accent: 5 unit bunga design itu pop satu-satu (8 frame) di bucu, bergoyang, kemudian mengecil keluar.
// t = 0 bila accent mula; outAt = saat tempatan mula keluar.
export const BloomAccent: React.FC<{design: DesignId; corner: 'br' | 'tr' | 'bl'; outAt: number}> = ({design, corner, outAt}) => {
  const t = useCurrentFrame() / FPS;
  const colors = colorsOf(design);
  const picks = accentUnits(design);
  const [cx, cy] = corner === 'br' ? [W - 40, H - 30] : corner === 'tr' ? [W - 40, 30] : [40, H - 30];
  const SLOT: [number, number, number][] = [[0, 0, 1.3], [-190, 30, 0.85], [-40, -170, 0.9], [-300, -10, 0.6], [-150, -120, 0.55]];
  const sx = corner === 'bl' ? -1 : 1, sy = corner === 'tr' ? -1 : 1;
  const out = ease(t, outAt, outAt + 0.3, Easing.in(Easing.back(1.4)));
  if (out >= 1) return null;
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {picks.map((u, i) => {
        const k = pop(t, i * (8 / FPS), 10) * (1 - out);
        if (k <= 0.001) return null;
        const [dx, dy, sc] = SLOT[i];
        const scale = (sc * 120) / u.r; // jejari skrin ~ 120 px x sc
        const sway = Math.sin(t * 2.4 + i) * 6;
        return (
          <g key={i} transform={`translate(${cx + dx * sx} ${cy + dy * sy}) rotate(${sway}) scale(${scale * k}) translate(${-u.x} ${-u.y})`}>
            <UnitG u={u} colors={colors} k={1} />
          </g>
        );
      })}
    </svg>
  );
};
// 5 unit besar dan padat (bunga penuh) untuk accent; cerah bila latar gelap (Black Dahlia).
const accentUnits = (design: DesignId): Unit[] => {
  const colors = colorsOf(design);
  const c = UNITS.filter((u) => u.r >= 45 && u.r <= 110 && u.p.length >= 6 && (design !== 'dahlia' || unitLightness(u, colors) > 0.4));
  const off = {pearl: 0, dusty: 7, lilac: 14, sage: 21, powder: 28, dahlia: 35}[design];
  return [0, 1, 2, 3, 4].map((i) => c[(off + i * 11) % c.length]);
};
