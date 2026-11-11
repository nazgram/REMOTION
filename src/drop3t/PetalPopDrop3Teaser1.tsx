// Petal Pop Drop 3, teaser 1 (17 s, 9:16), in the house style of the Drop 1 and Drop 2 teasers (the real print
// full frame, flowers that pop, words in an opening, the logo, NAFESA last) but with its own moves:
// a garden growing up out of the bottom, soft flower-bloom transitions made of the print itself (the incoming
// colourway's flowers bloom over the frame and settle back into the print), a scarf that turns over and folds into a
// triangle, corner clusters round the logo, blooms melting into the NAFESA card.
// Vectors (src/drop3t/pattern.json) for everything that pops; the 1x scarf + a 2x crop per scene (public/drop3t)
// once a scene is built. Timeline and SFX cues: src/drop3t/timeline.json (scripts/drop3t_layout.js).
import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, interpolate, spring, staticFile, useCurrentFrame } from 'remotion';
import { loadFont } from '@remotion/fonts';
import P from './pattern.json';
import L from './logo.json';
import V from './views.json';
import CROPS from './crops.json';
import TL from './timeline.json';

const SERIF = 'DM Serif Display';
loadFont({ family: SERIF, url: staticFile('fonts/dm-serif-display-latin-400-normal.woff2') });

type Unit = { x: number; y: number; r: number; p: [string, number][] };
type Way = keyof typeof P.palettes;
const UNITS = P.units as unknown as Unit[];
const { W, H, FPS, TEXT_Y, T, WIN } = TL;
const INK = '#042215';
const CREAM = P.palettes.Buttercup.bg;
const MAGENTA = (V.accent as Record<string, string>).Camellia;
const TILE = P.TILE;

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = (t: number, a: number, b: number, fn = Easing.inOut(Easing.cubic)) => interpolate(t, [a, b], [0, 1], { ...clamp, easing: fn });
const pop = (t: number, at: number, damping = 11) =>
  t < at ? 0 : spring({ frame: (t - at) * FPS, fps: FPS, config: { damping, mass: 0.6, stiffness: 170 } });
const bounce = (t: number, at: number, dur: number) => (t < at ? 0 : Easing.bounce(Math.min(1, (t - at) / dur)));

// ---------- vectors ----------
const UnitG: React.FC<{ u: Unit; way: Way; k: number; rot?: number; ox?: number; oy?: number }> = ({ u, way, k, rot = 0, ox = u.x, oy = u.y }) => {
  const pal = P.palettes[way].colors;
  return (
    <g transform={`translate(${ox} ${oy}) rotate(${rot}) scale(${k}) translate(${-ox} ${-oy})`}>
      {u.p.map(([d, c], i) => (
        <path key={i} d={d} fill={pal[c]} />
      ))}
    </g>
  );
};

// ---------- raster scenes ----------
type View = { cx: number; cy: number; s: number; y0: number; rot?: number };
const viewOf = (way: string, s: number): View => {
  const c = (V.views as Record<string, number[]>)[way];
  return { cx: c[0], cy: c[1], s, y0: H / 2 };
};
const Scarf: React.FC<{ way: string; v: View }> = ({ way, v }) => {
  const crop = (CROPS as Record<string, number[]>)[way];
  return (
    <div
      style={{
        position: 'absolute', left: 0, top: 0, width: TILE, height: TILE, transformOrigin: '0 0',
        transform: `translate(${W / 2}px, ${v.y0}px) rotate(${v.rot ?? 0}deg) scale(${v.s}) translate(${-v.cx}px, ${-v.cy}px)`,
      }}
    >
      <Img src={staticFile(`drop3t/${way}.jpg`)} style={{ position: 'absolute', left: 0, top: 0, width: TILE, height: TILE }} />
      {crop && v.s > 0.55 && <Img src={staticFile(`drop3t/${way}_crop.jpg`)} style={{ position: 'absolute', left: crop[0], top: crop[1], width: crop[2], height: crop[3] }} />}
    </div>
  );
};
const Layer: React.FC<{ clip?: string; transform?: string; origin?: string; children: React.ReactNode }> = ({ clip, transform, origin, children }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', clipPath: clip, transform, transformOrigin: origin }}>{children}</div>
);

// slow push while a scene holds, so it never sits still
const sceneS = (t: number, a: number, b: number) => V.S * (1 + 0.05 * ease(t, a, b, Easing.inOut(Easing.sin)));
const camV = (t: number) => viewOf('Camellia', sceneS(t, T.b1, T.b2 + 1.6));
const petV = (t: number) => viewOf('Petunia', sceneS(t, T.b2, T.b3 + 1.6));
const lavV = (t: number) => viewOf('Lavender', V.S * (1 + 0.03 * ease(t, T.b3, T.zoom[0], Easing.inOut(Easing.sin))));

// ---------- the four-petal opening ----------
const quatrefoil = (cx: number, cy: number, R: number, rot: number) => {
  const a = R * 0.5, b = R * 0.52;
  return (
    <>
      <circle cx={cx} cy={cy} r={R * 0.62} />
      {[45, 135, 225, 315].map((d) => {
        const q = ((d + rot) * Math.PI) / 180;
        return <circle key={d} cx={cx + Math.cos(q) * a} cy={cy + Math.sin(q) * a} r={b} />;
      })}
    </>
  );
};

// ---------- words ----------
const leave = (t: number, out?: number) => (out === undefined ? 0 : ease(t, out - 0.35, out, Easing.inOut(Easing.cubic)));
type LogoPath = { d: string; fill: string; role: string; box: number[] };
const LOGO = L.paths as LogoPath[];
const centre = (b: number[]) => [b[0] + b[2] / 2, b[1] + b[3] / 2];
const LETTERS = LOGO.filter((p) => p.role.startsWith('letter'));
const LB = (() => {
  const xs = LETTERS.flatMap((p) => [p.box[0], p.box[0] + p.box[2]]), ys = LETTERS.flatMap((p) => [p.box[1], p.box[1] + p.box[3]]);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
})();

// "Pétal Pop": the logo's letters rise up out of a line, one by one, then lift away
const PetalWord: React.FC<{ t: number }> = ({ t }) => {
  const w = TL.words.petal;
  const x = leave(t, w.out);
  if (x >= 1 || t < w.at) return null;
  return (
    <g opacity={1 - x} transform={`translate(${W / 2} ${TEXT_Y - 60 * x}) scale(0.62) translate(${-LB[0]} ${-LB[1]})`}>
      {LETTERS.map((p, i) => {
        const k = pop(t, w.at + i * w.step, 8);
        if (k <= 0.001) return null;
        const [cx, cy] = centre(p.box);
        return <path key={i} d={p.d} fill={p.fill} opacity={Math.min(1, k * 1.5)} transform={`translate(0 ${(1 - k) * 140}) translate(${cx} ${cy + p.box[3] / 2}) scale(${0.6 + 0.4 * k} ${k}) translate(${-cx} ${-cy - p.box[3] / 2})`} />;
      })}
    </g>
  );
};

// lines that slide up out of a clip, letter spacing closing in
const Lines: React.FC<{ lines: string[]; t: number; at: number; step: number; out?: number; y: number; size: number; color: string; id: string }> = ({ lines, t, at, step, out, y, size, color, id }) => {
  const x = leave(t, out);
  if (x >= 1 || t < at) return null;
  return (
    <g opacity={1 - x}>
      {lines.map((line, i) => {
        const ly = y + (i - (lines.length - 1) / 2) * size * 1.0;
        const k = ease(t, at + i * step, at + i * step + 0.55, Easing.out(Easing.back(1.6)));
        if (k <= 0) return null;
        return (
          <g key={i}>
            <defs>
              <clipPath id={`${id}${i}`}>
                <rect x={0} y={ly - size * 0.75} width={W} height={size * 1.25} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${id}${i})`}>
              <text
                x={W / 2}
                y={ly + (1 - k) * size * 1.1 - x * size * 0.6}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily={SERIF}
                fontSize={size}
                letterSpacing={(1 - Math.min(1, k)) * 30}
                fill={color}
              >
                {line}
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
};

// the DROP 3 pill: stretches open sideways from a dot, the letters drop in, the 3 wiggles on the tile flip
const DropPill: React.FC<{ t: number }> = ({ t }) => {
  const w = TL.words.drop;
  const pill = LOGO.find((p) => p.role === 'pill')!;
  const letters = LOGO.filter((p) => p.role === 'drop');
  const sx = pop(t, w.at, 8);
  const sy = Math.min(1, ease(t, w.at, w.at + 0.18) * 1.0);
  const out = ease(t, w.out - 0.3, w.out, Easing.in(Easing.back(1.5)));
  if (sx <= 0.001 || out >= 1) return null;
  const [cx, cy] = centre(pill.box);
  const float = Math.sin((t - w.at) * 2.2) * 6;
  return (
    <g transform={`translate(${W / 2} ${TEXT_Y + float}) scale(${1.7 * (1 - out)}) translate(${-cx} ${-cy})`}>
      <path d={pill.d} fill={pill.fill} transform={`translate(${cx} ${cy}) scale(${Math.max(0.05, sx)} ${0.4 + 0.6 * sy}) translate(${-cx} ${-cy})`} />
      {letters.map((p, i) => {
        const at = w.at + 0.28 + i * 0.07;
        if (t < at) return null;
        const b = bounce(t, at, 0.5);
        const [lx, ly] = centre(p.box);
        const wig = i === letters.length - 1 && t > w.wiggle ? Math.sin((t - w.wiggle) * 22) * 18 * Math.exp(-(t - w.wiggle) * 4) : 0;
        return <path key={i} d={p.d} fill={p.fill} opacity={Math.min(1, (t - at) * 8)} transform={`translate(0 ${(1 - b) * -70}) translate(${lx} ${ly}) rotate(${wig}) scale(${1 + wig / 90}) translate(${-lx} ${-ly})`} />;
      })}
    </g>
  );
};

// the full logo: the letters fall in with a bounce, the drawn motifs pop after
const Logo: React.FC<{ t: number }> = ({ t }) => {
  const a = TL.logo.at;
  const op = ease(t, a - 0.05, a + 0.2) * (1 - ease(t, TL.logo.out, TL.logo.out + 0.3));
  if (op <= 0) return null;
  const s = interpolate(ease(t, a, a + 1.2, Easing.out(Easing.cubic)), [0, 1], [0.92, 1]);
  const parts = TL.logo.parts as Record<string, number>;
  const pill = LOGO.find((p) => p.role === 'pill')!;
  let li = 0;
  return (
    <g opacity={op} transform={`translate(${W / 2} ${TEXT_Y}) scale(${0.8 * s}) translate(${-L.w / 2} ${-L.h / 2})`}>
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

// a four-point twinkle
const Sparkle: React.FC<{ x: number; y: number; t: number; at: number; size: number; color: string }> = ({ x, y, t, at, size, color }) => {
  const k = t < at ? 0 : Math.sin(Math.min(1, (t - at) / 0.7) * Math.PI);
  if (k <= 0) return null;
  return (
    <path
      transform={`translate(${x} ${y}) rotate(${(t - at) * 90}) scale(${(size * k) / 10})`}
      d="M0,-10 C1.2,-2.4 2.4,-1.2 10,0 C2.4,1.2 1.2,2.4 0,10 C-1.2,2.4 -2.4,1.2 -10,0 C-2.4,-1.2 -1.2,-2.4 0,-10Z"
      fill={color}
    />
  );
};
const sparkles = (t: number, at: number, box: number[], colors: string[], n = 7, seed = 1) =>
  Array.from({ length: n }, (_, i) => {
    const a = Math.sin(seed * 91 + i * 12.9898) * 43758.5453;
    const f = a - Math.floor(a);
    const ang = (i / n) * Math.PI * 2 + f;
    return <Sparkle key={i} x={box[0] + Math.cos(ang) * box[2] * (0.95 + f * 0.25)} y={box[1] + Math.sin(ang) * box[3] * (0.95 + f * 0.25)} t={t} at={at + i * 0.06} size={18 + f * 22} color={colors[i % colors.length]} />;
  });

// ---------- scene pieces ----------
const Garden: React.FC<{ t: number }> = ({ t }) => {
  const g = TL.garden;
  const s = g.s * (1 + 0.04 * ease(t, 0, 3, Easing.inOut(Easing.sin)));
  return (
    <svg width={W} height={H} style={{ position: 'absolute' }}>
      <rect width={W} height={H} fill={P.palettes.Buttercup.bg} />
      <g transform={`translate(${W / 2} ${H / 2}) scale(${s}) translate(${-g.C[0]} ${-g.C[1]})`}>
        {g.units.map(([i, at, rot]) => {
          const k = pop(t, at, 10);
          if (k <= 0.001) return null;
          const u = UNITS[i];
          return <UnitG key={i} u={u} way="Buttercup" k={k} rot={rot * (1 - Math.min(1, k))} oy={u.y + u.r * 0.8} />;
        })}
      </g>
    </svg>
  );
};

// ---------- flower transitions ----------
// The incoming colourway's own units, at their real places in the incoming view, bloom up to BLOOM.cover times
// their size in a wave from an origin and cover the old scene; the new scene fades in behind them through a soft
// round mask; then every bloom shrinks back into its own place in the print (or away, for the NAFESA card).
const B = TL.BLOOM;
const BEND = B.hold + B.spread * 0.6 + 0.06 + B.settle + 0.03; // seconds from a bloom's start until it is gone
type BloomName = keyof typeof TL.blooms;
const Bloom: React.FC<{ name: BloomName; t: number; v: View; children: React.ReactNode }> = ({ name, t, v, children }) => {
  const b = TL.blooms[name];
  const way = b.way as Way;
  const [ox, oy] = b.origin;
  const R = ease(t, b.at + B.maskLag, b.at + B.maskLag + B.spread + 0.15, Easing.inOut(Easing.sin)) * (b.dmax + 260);
  const mask = `radial-gradient(circle at ${ox}px ${oy}px, #000 ${Math.max(0, R - 240)}px, rgba(0,0,0,0) ${R}px)`;
  return (
    <>
      {R > 0 && (
        <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', WebkitMaskImage: mask, maskImage: mask }}>{children}</div>
      )}
      <svg width={W} height={H} style={{ position: 'absolute' }}>
        <g transform={`translate(${W / 2} ${v.y0}) scale(${v.s}) translate(${-v.cx} ${-v.cy})`}>
          {b.units.map(([i, delay, rot]) => {
            const t0 = b.at + delay;
            if (t < t0) return null;
            const grow = ease(t, t0, t0 + B.grow, Easing.out(Easing.cubic));
            const st = b.at + B.hold + delay * 0.6;
            const settle = ease(t, st, st + B.settle, Easing.inOut(Easing.sin));
            if (settle >= 1) return null;
            const k = B.cover * grow + (b.land - B.cover) * settle;
            if (k <= 0.001) return null;
            const op = Math.min(1, (t - t0) / 0.14) * (b.land === 0 ? 1 - settle : 1);
            return (
              <g key={i} opacity={op}>
                <UnitG u={UNITS[i]} way={way} k={k} rot={rot * (1 - grow) + rot * 0.25 * Math.sin(settle * Math.PI)} />
              </g>
            );
          })}
        </g>
      </svg>
    </>
  );
};

// ---------- the scarf: zoom out, flip over, fold into a triangle ----------
const ScarfFold: React.FC<{ t: number }> = ({ t }) => {
  const S = TL.SCARF;
  const z = ease(t, T.zoom[0], T.zoom[1]);
  const lavS = V.S * 1.03;
  const k0 = S.size / TILE;
  const f = ease(t, T.flip[0], T.flip[1], Easing.inOut(Easing.sin));
  const fold = ease(t, T.fold[0], T.fold[1], Easing.inOut(Easing.cubic));
  const away = ease(t, T.logo[0], T.logo[1], Easing.inOut(Easing.sin));
  const lc = (V.views as Record<string, number[]>).Lavender;
  // camera: pull out from the Lavender view to the whole scarf, then the fold lifts and enlarges it
  const s = interpolate(z, [0, 1], [lavS, k0], { easing: (x) => 1 - Math.pow(1 - x, 2.2) }) * (1 - 0.12 * fold) * (1 - 0.75 * away);
  const cx = interpolate(z, [0, 1], [lc[0], TILE / 2]), cy = interpolate(z, [0, 1], [lc[1], TILE / 2]);
  const y0 = interpolate(z, [0, 1], [H / 2, S.cy]) - 230 * fold - 500 * away;
  const flipX = Math.cos(f * Math.PI);
  const way = f < 0.5 ? 'Lavender' : 'Marigold';
  const rot = 45 * fold + 40 * away;
  const c = Math.cos(fold * Math.PI); // the folding half: +1 flat, -1 folded over
  const op = 1 - ease(t, T.logo[0] + 0.1, T.logo[1]);
  const full = `translate(${W / 2}px, ${y0}px) rotate(${rot}deg) scale(${s * Math.abs(flipX) || 0.0001}, ${s}) translate(${-cx}px, ${-cy}px)`;
  const half = (clip: string, extra: string, back: boolean) => (
    <div style={{ position: 'absolute', left: 0, top: 0, width: TILE, height: TILE, clipPath: clip, transform: extra, transformOrigin: `${TILE / 2}px ${TILE / 2}px` }}>
      <Img src={staticFile(`drop3t/${way}.jpg`)} style={{ position: 'absolute', width: TILE, height: TILE }} />
      {way === 'Lavender' && s > 0.55 && <Img src={staticFile('drop3t/Lavender_crop.jpg')} style={{ position: 'absolute', left: CROPS.Lavender[0], top: CROPS.Lavender[1], width: CROPS.Lavender[2], height: CROPS.Lavender[3] }} />}
      {back && <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 0.25 }} />}
      {fold > 0 && fold < 1 && !back && <div style={{ position: 'absolute', inset: 0, background: '#000', opacity: 0.18 * Math.sin(fold * Math.PI) * Math.max(0, c) }} />}
    </div>
  );
  // shadow under the scarf (screen space)
  const corner = (x: number, y: number, mv: boolean) => {
    let px = x - TILE / 2, py = y - TILE / 2;
    if (mv) { // reflect towards the fold line (direction (1,-1)) by c
      const along = (px - py) / Math.SQRT2, perp = (px + py) / Math.SQRT2;
      px = (along + perp * c) / Math.SQRT2; py = (-along + perp * c) / Math.SQRT2;
    }
    const sx = px * s * Math.abs(flipX), sy = py * s, r = (rot * Math.PI) / 180;
    return [W / 2 + sx * Math.cos(r) - sy * Math.sin(r), y0 + sx * Math.sin(r) + sy * Math.cos(r)];
  };
  const shadowPts = z > 0.5 ? [corner(TILE, 0, false), corner(TILE, TILE, false), corner(0, TILE, false), corner(0, 0, true)] : [];
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: op }}>
      {shadowPts.length > 0 && (
        <svg width={W} height={H} style={{ position: 'absolute' }}>
          <filter id="sh" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={28} />
          </filter>
          <polygon points={shadowPts.map((p) => `${p[0]},${p[1] + 34}`).join(' ')} fill="#5b4030" opacity={0.3 * ease(t, T.zoom[0] + 0.4, T.zoom[1])} filter="url(#sh)" />
        </svg>
      )}
      <div style={{ position: 'absolute', left: 0, top: 0, width: TILE, height: TILE, transformOrigin: '0 0', transform: full }}>
        {fold === 0 ? (
          half('none', 'none', false)
        ) : (
          <>
            {half(`polygon(${TILE}px 0px, ${TILE}px ${TILE}px, 0px ${TILE}px)`, 'none', false)}
            {half(`polygon(0px 0px, ${TILE}px 0px, 0px ${TILE}px)`, `rotate(-45deg) scale(1, ${c}) rotate(45deg)`, c < 0)}
          </>
        )}
      </div>
    </div>
  );
};

// ---------- composition ----------
export const PetalPopDrop3Teaser1: React.FC<{ withAudio: boolean }> = ({ withAudio }) => {
  const t = useCurrentFrame() / FPS;
  const layers: React.ReactNode[] = [];
  const over: React.ReactNode[] = []; // SVG on top

  const black = <div style={{ position: 'absolute', inset: 0, background: '#000' }} />;
  if (t < T.b1 + BEND) {
    // 1. garden grows, "Pétal Pop" rises in its opening; Camellia blooms up from the bottom
    layers.push(<Garden key="g" t={t} />);
    over.push(<PetalWord key="pw" t={t} />);
    if (t >= T.b1) layers.push(<Bloom key="b1" name="b1" t={t} v={camV(t)}><Scarf way="Camellia" v={camV(t)} /></Bloom>);
  } else if (t < T.b2 + BEND) {
    // 2. Camellia, the four-petal opening with "Coming Soon"; Petunia blooms open out from the centre
    layers.push(<Layer key="cam"><Scarf way="Camellia" v={camV(t)} /></Layer>);
    const wo = pop(t, T.window[0], 14) * (1 - ease(t, T.window[1] - 0.4, T.window[1], Easing.inOut(Easing.sin)));
    if (wo > 0.001) {
      const R = WIN.R * wo, rot = (1 - Math.min(1, wo)) * -60;
      over.push(
        <g key="win">
          <g fill={(V.accent as Record<string, string>).Camellia}>{quatrefoil(WIN.x, WIN.y, R + 12, rot)}</g>
          <g fill={P.palettes.Camellia.bg}>{quatrefoil(WIN.x, WIN.y, R, rot)}</g>
        </g>,
      );
      over.push(<Lines key="soon" id="soon" lines={TL.words.soon.lines} t={t} at={TL.words.soon.at} step={TL.words.soon.step} out={TL.words.soon.out - 0.05} y={TEXT_Y} size={118} color={INK} />);
      over.push(<g key="sp1">{sparkles(t, TL.words.soon.at + 0.15, [WIN.x, WIN.y, 340, 330], ['#c53b73', '#f3b12f', '#dd7045'], 8, 3)}</g>);
    }
    if (t >= T.b2) layers.push(<Bloom key="b2" name="b2" t={t} v={petV(t)}>{black}<Scarf way="Petunia" v={petV(t)} /></Bloom>);
  } else if (t < T.zoom[0]) {
    // 3. Petunia + DROP 3; Lavender blooms drift in from the top-right corner
    if (t < T.b3 + BEND) {
      layers.push(<Layer key="pet">{black}<Scarf way="Petunia" v={petV(t)} /></Layer>);
      if (t >= T.b3) layers.push(<Bloom key="b3" name="b3" t={t} v={lavV(t)}><Scarf way="Lavender" v={lavV(t)} /></Bloom>);
    } else layers.push(<Layer key="lav"><Scarf way="Lavender" v={lavV(t)} /></Layer>);
  } else if (t < T.logo[1] + 0.05) {
    // 4. the scarf pulls out, flips to Marigold, folds into a triangle; "15 November"
    layers.push(<div key="bg" style={{ position: 'absolute', inset: 0, background: CREAM }} />);
    layers.push(<ScarfFold key="sf" t={t} />);
    over.push(<Lines key="date" id="date" lines={TL.words.date.lines} t={t} at={TL.words.date.at} step={0.2} out={TL.words.date.out} y={1235} size={104} color={INK} />);
  }
  // DROP 3 pill rides over the Petunia hold, the Lavender blooms and the start of the pull-out
  if (t > TL.words.drop.at && t < TL.words.drop.out + 0.05) over.push(<DropPill key="pill" t={t} />);

  if (t >= T.logo[0] && t < T.b4 + BEND) {
    // 5. logo on cream, corner clusters in three sizes; Camellia blooms from the centre melt it into magenta
    if (t >= T.logo[1] + 0.05) layers.push(<div key="bg2" style={{ position: 'absolute', inset: 0, background: CREAM }} />);
    layers.push(
      <svg key="corners" width={W} height={H} style={{ position: 'absolute' }}>
        {TL.corners.units.map(([i, x, y, s, at, rot], j) => {
          const k = pop(t, at, 12);
          if (k <= 0.001) return null;
          const u = UNITS[i];
          const sway = Math.sin(t * 1.6 + j) * 3;
          return (
            <g key={j} transform={`translate(${x} ${y}) rotate(${rot * (1 - Math.min(1, k)) + sway}) scale(${s * k}) translate(${-u.x} ${-u.y})`}>
              <UnitG u={u} way="Buttercup" k={1} />
            </g>
          );
        })}
      </svg>,
    );
    layers.push(
      <svg key="logo" width={W} height={H} style={{ position: 'absolute' }}>
        <Logo t={t} />
        {sparkles(t, TL.logo.parts.heart, [W / 2, TEXT_Y, 400, 300], ['#f8a5cb', '#98d4f1', '#77b27e'], 8, 9)}
      </svg>,
    );
    if (t >= T.b4) layers.push(<Bloom key="b4" name="b4" t={t} v={camV(t)}><div style={{ position: 'absolute', inset: 0, background: MAGENTA }} /></Bloom>);
  }
  const magenta = t >= T.b4 + BEND;

  const naf = pop(t, T.nafesa[0], 12);
  return (
    <AbsoluteFill style={{ backgroundColor: CREAM }}>
      {layers}
      <svg width={W} height={H} style={{ position: 'absolute' }}>
        {over}
      </svg>
      {magenta && (
        <svg width={W} height={H} style={{ position: 'absolute' }}>
          <rect width={W} height={H} fill={MAGENTA} />
        </svg>
      )}
      {naf > 0 && (
        <svg width={W} height={H} style={{ position: 'absolute' }}>
          {sparkles(t, T.nafesa[0] + 0.2, [W / 2, TEXT_Y, 290, 220], ['#fde0d3', '#f3b12f'], 6, 11)}
        </svg>
      )}
      {naf > 0.001 && (
        <Img
          src={staticFile('drop3/nafesa.png')}
          style={{ position: 'absolute', width: 440, left: W / 2 - 220, top: TEXT_Y - 150, opacity: Math.min(1, naf * 1.4), transform: `scale(${0.85 + 0.15 * naf})` }}
        />
      )}
      {withAudio && <Audio src={staticFile('drop3t/sfx.wav')} />}
    </AbsoluteFill>
  );
};
