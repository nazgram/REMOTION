// Petal Pop Drop 2, teaser 1 (10 s, 9:16). Everything is drawn from Nas's own vectors: the five scarf colourways
// share one artwork (src/teaser1/pattern.json), the Petal Pop Drop 2 logo (logo.json) and the NAFESA logo PNG.
// Timeline and SFX cues: src/teaser1/timeline.json (scripts/teaser1_layout.js).
import React from 'react';
import { AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame } from 'remotion';
import { loadFont } from '@remotion/fonts';
import P from './pattern.json';
import L from './logo.json';
import TL from './timeline.json';

const SERIF = 'DM Serif Display';
loadFont({ family: SERIF, url: staticFile('fonts/dm-serif-display-latin-400-normal.woff2') });

type Unit = { k: string; x: number; y: number; r: number; p: [string, number][] };
type Way = keyof typeof P.palettes;
const UNITS = P.units as unknown as Unit[];
const { W, H, FPS, TEXT_Y, T } = TL;
const INK = '#042215';
const CREAM = P.palettes['Butter Bliss'].bg;

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = (t: number, a: number, b: number, fn = Easing.inOut(Easing.cubic)) => interpolate(t, [a, b], [0, 1], { ...clamp, easing: fn });
const pop = (t: number, at: number, damping = 11) =>
  t < at ? 0 : spring({ frame: (t - at) * FPS, fps: FPS, config: { damping, mass: 0.6, stiffness: 170 } });

// one scarf flower / leaf, drawn in tile coordinates, scaled and turned about its own centre
const UnitG: React.FC<{ u: Unit; way: Way; k: number; rot?: number; dx?: number; dy?: number }> = ({ u, way, k, rot = 0, dx = 0, dy = 0 }) => {
  const pal = P.palettes[way].colors;
  return (
    <g transform={`translate(${u.x + dx} ${u.y + dy}) rotate(${rot}) scale(${k}) translate(${-u.x} ${-u.y})`}>
      {u.p.map(([d, c], i) => (
        <path key={i} d={d} fill={pal[c]} />
      ))}
    </g>
  );
};

type SceneName = keyof typeof TL.scenes;
type View = { cx: number; cy: number; s: number; y0: number; rot?: number };

// a colourway scene: background + its flowers popping on their own schedule
const Scene: React.FC<{ name: SceneName; t: number; view?: View; frame?: boolean }> = ({ name, t, view, frame }) => {
  const sc = TL.scenes[name] as { way: string; C: number[]; s: number; units: number[][] };
  const way = sc.way as Way;
  const v = view ?? { cx: sc.C[0], cy: sc.C[1], s: sc.s, y0: H / 2 };
  const items = sc.units.map(([i, at, dx, dy, rot, out]) => {
    const u = UNITS[i];
    let k = pop(t, at);
    if (out !== undefined && t > out) k *= 1 - ease(t, out, out + 0.32, Easing.in(Easing.cubic));
    if (k <= 0.001) return null;
    const sx = (u.x - v.cx) * v.s + W / 2, sy = (u.y - v.cy) * v.s + v.y0, r = u.r * v.s * 1.4;
    if (sx + r < 0 || sx - r > W || sy + r < 0 || sy - r > H) return null;
    const m = 1 - Math.min(1, k);
    return <UnitG key={i} u={u} way={way} k={k} rot={rot * m} dx={(dx * m) / v.s} dy={(dy * m) / v.s} />;
  });
  const g = `translate(${W / 2} ${v.y0}) rotate(${v.rot ?? 0}) scale(${v.s}) translate(${-v.cx} ${-v.cy})`;
  return (
    <g>
      {frame ? (
        <>
          <rect width={W} height={H} fill={CREAM} />
          <g transform={g}>
            <rect width={P.TILE} height={P.TILE} fill={P.palettes[way].bg} filter="url(#shadow)" />
            <g clipPath="url(#tile)">{items}</g>
          </g>
        </>
      ) : (
        <>
          <rect width={W} height={H} fill={P.palettes[way].bg} />
          <g transform={g}>{items}</g>
        </>
      )}
    </g>
  );
};

// floral wipe: the incoming scene is revealed behind a moving edge of big blooming flowers
const Wipe: React.FC<{ name: 'wipe1' | 'wipe2'; t: number; children: React.ReactNode }> = ({ name, t, children }) => {
  const w = TL.wipes[name];
  const [dx, dy] = w.dir;
  const o = dx > 0 ? [0, H] : [0, 0];
  const len = Math.abs(dx) * W + Math.abs(dy) * H;
  const E = -200 + ease(t, w.at[0], w.at[1], Easing.inOut(Easing.quad)) * (len + 760);
  const px = -dy, py = dx; // perpendicular
  const pt = (a: number, b: number) => `${o[0] + dx * a + px * b},${o[1] + dy * a + py * b}`;
  const poly = [pt(E, -4000), pt(E, 4000), pt(E - 9000, 4000), pt(E - 9000, -4000)].join(' ');
  const id = `wipe-${name}`;
  return (
    <>
      <defs>
        <clipPath id={id}>
          <polygon points={poly} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>{children}</g>
      {w.cells.map((c, i) => {
        const q = (c.x - o[0]) * dx + (c.y - o[1]) * dy;
        const d = E - q;
        const k = d < -130 ? 0 : d < 0 ? Easing.out(Easing.back(2))((d + 130) / 130) : d < 120 ? 1 : d < 400 ? 1 - Easing.in(Easing.cubic)((d - 120) / 280) : 0;
        if (k <= 0.01) return null;
        const u = UNITS[c.unit];
        const sz = (125 / u.r) * k;
        return (
          <g key={i} transform={`translate(${c.x} ${c.y}) rotate(${c.rot + d * 0.15}) translate(${-u.x} ${-u.y})`}>
            <UnitG u={u} way={w.palette as Way} k={sz} />
          </g>
        );
      })}
    </>
  );
};

// flower iris: a scarf flower grows from the middle and the new colourway is inside it, with a petal-coloured rim
const Iris: React.FC<{ at: number[]; t: number; way: Way; id: string; children: React.ReactNode }> = ({ at, t, way, id, children }) => {
  const u = UNITS[TL.IRIS];
  const p = ease(t, at[0], at[1], Easing.in(Easing.cubic));
  const S = 0.2 + p * 62;
  const rot = -40 + p * 110;
  const tf = (k: number) => `translate(${W / 2} ${TEXT_Y}) rotate(${rot}) scale(${S * k}) translate(${-u.x} ${-u.y})`;
  // clipPath children must be bare shapes (no <g>), so the transform goes on each one
  const shape = (k: number) => (
    <>
      {u.p.map(([d], i) => (
        <path key={i} d={d} transform={tf(k)} />
      ))}
      <circle cx={u.x} cy={u.y} r={u.r * 0.45} transform={tf(k)} />
    </>
  );
  const pal = P.palettes[way].colors;
  return (
    <>
      <defs>
        <clipPath id={id}>
          {shape(1)}
        </clipPath>
      </defs>
      {p < 1 && <g fill={pal[2]}>{shape(1.18)}</g>}
      {p < 1 && <g fill={pal[4]}>{shape(1.08)}</g>}
      <g clipPath={`url(#${id})`}>{children}</g>
    </>
  );
};

// a four-point twinkle
const Sparkle: React.FC<{ x: number; y: number; t: number; at: number; size: number; color: string }> = ({ x, y, t, at, size, color }) => {
  const k = t < at ? 0 : Math.sin(Math.min(1, (t - at) / 0.7) * Math.PI);
  if (k <= 0) return null;
  const s = size * k;
  return (
    <path
      transform={`translate(${x} ${y}) rotate(${(t - at) * 90}) scale(${s / 10})`}
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
    const x = box[0] + Math.cos(ang) * box[2] * (0.95 + f * 0.25);
    const y = box[1] + Math.sin(ang) * box[3] * (0.95 + f * 0.25);
    return <Sparkle key={i} x={x} y={y} t={t} at={at + i * 0.06} size={18 + f * 22} color={colors[i % colors.length]} />;
  });

type LogoPath = { d: string; fill: string; role: string; box: number[] };
const LOGO = L.paths as LogoPath[];
const centre = (b: number[]) => [b[0] + b[2] / 2, b[1] + b[3] / 2];
const Shape: React.FC<{ p: LogoPath; k?: number; sx?: number; sy?: number; fill?: string }> = ({ p, k = 1, sx = 1, sy = 1, fill }) => {
  const [cx, cy] = centre(p.box);
  return <path d={p.d} fill={fill ?? p.fill} transform={`translate(${cx} ${cy}) scale(${k * sx} ${k * sy}) translate(${-cx} ${-cy})`} />;
};

// "Pétal Pop": the logo's own letters, popping one by one
const PetalWord: React.FC<{ t: number }> = ({ t }) => {
  const letters = LOGO.filter((p) => p.role.startsWith('letter'));
  const sc = 1.12;
  return (
    <g transform={`translate(${W / 2} ${TEXT_Y}) scale(${sc}) translate(-455 -272)`}>
      {letters.map((p, i) => {
        const k = pop(t, TL.words.petal.at + i * TL.words.petal.step, 9);
        return k > 0.001 ? <Shape key={i} p={p} k={k} /> : null;
      })}
    </g>
  );
};

const Words: React.FC<{ lines: string[]; t: number; at: number; step: number; y: number; size: number; color: string }> = ({ lines, t, at, step, y, size, color }) => (
  <g>
    {lines.map((line, i) => {
      const k = pop(t, at + i * step, 9);
      if (k <= 0.001) return null;
      const ly = y + (i - (lines.length - 1) / 2) * size * 0.95;
      return (
        <text
          key={i}
          x={0}
          y={0}
          transform={`translate(${W / 2} ${ly}) rotate(${(1 - Math.min(1, k)) * -8}) scale(${k})`}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily={SERIF}
          fontSize={size}
          fill={color}
        >
          {line}
        </text>
      );
    })}
  </g>
);

// the logo's DROP 2 pill, big, with a squashy bounce and a pulse on the Forest Bloom cut
const DropPill: React.FC<{ t: number }> = ({ t }) => {
  const parts = LOGO.filter((p) => p.role === 'pill' || p.role === 'drop');
  const k = pop(t, TL.words.drop.at, 7);
  if (k <= 0.001) return null;
  const pulse = 1 + 0.1 * Math.sin(Math.min(1, Math.max(0, (t - TL.words.drop.pulse) / 0.3)) * Math.PI);
  const sq = 1 + (k - 1) * 0.45; // overshoot -> squash and stretch
  const [cx, cy] = centre(parts[0].box);
  return (
    <g transform={`translate(${W / 2} ${TEXT_Y}) scale(${2.3 * k * pulse}) scale(${2 - sq} ${sq}) translate(${-cx} ${-cy})`}>
      {parts.map((p, i) => (
        <path key={i} d={p.d} fill={p.fill} />
      ))}
    </g>
  );
};

// the full Petal Pop Drop 2 logo: soft scale-up, its drawn motifs land just after
const Logo: React.FC<{ t: number }> = ({ t }) => {
  const a = TL.logo.at;
  const s = interpolate(ease(t, a, a + 0.7, Easing.out(Easing.cubic)), [0, 1], [0.8, 1]) * (1 - 0.12 * ease(t, T.outro[0], T.outro[0] + 0.3));
  const op = ease(t, a, a + 0.25) * (1 - ease(t, T.outro[0], T.outro[0] + 0.3));
  if (op <= 0) return null;
  const parts = TL.logo.parts as Record<string, number>;
  const pill = LOGO.find((p) => p.role === 'pill')!;
  return (
    <g opacity={op} transform={`translate(${W / 2} ${TEXT_Y}) scale(${0.98 * s}) translate(${-L.w / 2} ${-L.h / 2})`}>
      {LOGO.map((p, i) => {
        const at = parts[p.role];
        if (at === undefined) return <path key={i} d={p.d} fill={p.fill} />;
        const k = pop(t, at, 9);
        if (k <= 0.001) return null;
        if (p.role === 'drop') {
          const [cx, cy] = centre(pill.box);
          return <path key={i} d={p.d} fill={p.fill} transform={`translate(${cx} ${cy}) scale(${k}) translate(${-cx} ${-cy})`} />;
        }
        return <Shape key={i} p={p} k={k} />;
      })}
    </g>
  );
};

export const PetalPopTeaser1: React.FC<{ withAudio: boolean }> = ({ withAudio }) => {
  const t = useCurrentFrame() / FPS;
  const S = TL.SCARF;

  // Stay Tuned view: full bleed, then zoom out to the whole scarf, then it shrinks away for the logo
  const z = ease(t, T.zoom[0], T.zoom[1]);
  const shrink = ease(t, T.shrink[0], T.shrink[1], Easing.in(Easing.back(1.4)));
  const tunedView: View = {
    cx: P.TILE / 2,
    cy: P.TILE / 2,
    s: interpolate(z, [0, 1], [0.8, S.size / P.TILE]) * Math.max(0.0001, 1 - shrink),
    y0: interpolate(z, [0, 1], [H / 2, S.cy]),
    rot: shrink * 25,
  };

  const brown = P.palettes['Expresso Poppy'].bg;
  const outroBg = ease(t, T.outro[0] + 0.15, T.outro[1] + 0.05);
  const naf = ease(t, 9.4, 9.85, Easing.out(Easing.cubic));

  let body: React.ReactNode;
  if (t < T.wipe1[1]) {
    body = (
      <>
        <Scene name="petal" t={t} />
        <PetalWord t={t} />
        {t > T.wipe1[0] && (
          <Wipe name="wipe1" t={t}>
            <Scene name="bloom" t={t} />
          </Wipe>
        )}
      </>
    );
  } else if (t < T.iris2[1]) {
    const bloomOn = t < T.iris1[1];
    body = (
      <>
        {bloomOn && <Scene name="bloom" t={t} />}
        {bloomOn && <Words lines={TL.words.bloom.lines} t={t} at={TL.words.bloom.at} step={TL.words.bloom.step} y={TEXT_Y} size={200} color={INK} />}
        {bloomOn && sparkles(t, TL.words.bloom.at + 0.1, [W / 2, TEXT_Y, 400, 250], ['#e69596', '#e8a77c', '#efb56f'], 8, 3)}
        {t > T.iris1[0] && (
          <Iris at={T.iris1} t={t} way="Expresso Poppy" id="iris1">
            <Scene name="drop1" t={t} />
          </Iris>
        )}
        {t > T.iris2[0] && (
          <Iris at={T.iris2} t={t} way="Forest Bloom" id="iris2">
            <Scene name="drop2" t={t} />
          </Iris>
        )}
        <DropPill t={t} />
      </>
    );
  } else if (t < T.shrink[1] + 0.05) {
    body = (
      <>
        {t < T.wipe2[1] && <Scene name="drop2" t={t} />}
        {t < T.wipe2[1] && <DropPill t={t} />}
        <Wipe name="wipe2" t={t}>
          <Scene name="tuned" t={t} view={tunedView} frame />
          <Words lines={TL.words.tuned.lines} t={t} at={TL.words.tuned.at} step={TL.words.tuned.step} y={S.cy + S.size / 2 + 150} size={130} color={INK} />
          {sparkles(t, TL.words.tuned.at + 0.1, [W / 2, S.cy + S.size / 2 + 150, 380, 90], ['#dba19d', '#af9cbb', '#efb866'], 7, 5)}
        </Wipe>
        <Logo t={t} />
      </>
    );
  } else {
    body = (
      <>
        <Scene name="logo" t={t} />
        <rect width={W} height={H} fill={brown} opacity={outroBg} />
        <Logo t={t} />
        {sparkles(t, TL.logo.parts.heart, [W / 2, TEXT_Y, 470, 360], ['#f8a5cb', '#98d4f1', '#77b27e'], 8, 9)}
        {sparkles(t, 9.55, [W / 2, TEXT_Y, 330, 300], ['#fed7ab', '#f3dfcb'], 6, 11)}
      </>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: CREAM }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <clipPath id="tile">
            <rect width={P.TILE} height={P.TILE} />
          </clipPath>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="125%">
            <feDropShadow dx="0" dy="40" stdDeviation="45" floodColor="#5b4a2a" floodOpacity="0.28" />
          </filter>
        </defs>
        {body}
      </svg>
      {naf > 0 && (
        <AbsoluteFill style={{ alignItems: 'center' }}>
          <img
            src={staticFile('teaser1/nafesa.png')}
            style={{ position: 'absolute', width: 560, left: W / 2 - 280, top: TEXT_Y - 195, opacity: naf, transform: `scale(${0.92 + 0.08 * naf})` }}
          />
        </AbsoluteFill>
      )}
      {withAudio && <Audio src={staticFile('teaser1/sfx.wav')} />}
    </AbsoluteFill>
  );
};
