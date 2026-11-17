import React from 'react';
import { AbsoluteFill, Audio, Easing, interpolate, interpolateColors, spring, staticFile, useCurrentFrame } from 'remotion';
import V from './v2.json';
import S from './shapes.json';

// Joy Club teaser V2, "playful luxury 2.5D": Nas's hand-drawn SVG dots in three depth layers (soft tiny bg, sharp
// mixed-size mid, blurred oversized fg) with parallax, rack focus, spring bounce, squash & stretch and motion stretch
// on fast moves. Five colourways, each with its own choreography and transition. No text, no logo, SFX only.

const { FPS, W, H } = V;
const CX = W / 2, CY = H / 2;
const COVER = Math.hypot(W, H) * 0.62;
const DIAG = Math.hypot(CX, CY);
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const eIn = Easing.in(Easing.cubic), eOut = Easing.out(Easing.cubic), eInOut = Easing.inOut(Easing.cubic);
const bounce = Easing.bounce;
const sp = (t: number, t0: number, damping = 10, stiffness = 140, mass = 0.7) =>
  t < t0 ? 0 : spring({ frame: (t - t0) * FPS, fps: FPS, config: { damping, stiffness, mass } });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Scene = any;
type Dot = any;
type Pose = { x: number; y: number; size: number; rot: number; op?: number; squash?: number };
const PARALLAX = { bg: 0.45, mid: 1, fg: 1.8 } as const;

// ---------- camera: screen = (p - anchor) * s + anchor + shift (parallax scales shift and zoom per layer)
function camera(sc: Scene & Record<string, any>, i: number, t: number) {
  if (i === 0) return { s: interpolate(t, [0, 3.3], [1.05, 1]), ax: CX, ay: CY, dx: 0, dy: 0 };
  if (i === 1) return { s: 1, ax: CX, ay: CY, dx: interpolate(t, [sc.start, sc.end], [-45, 45]), dy: 0 };
  if (i === 2) return { s: interpolate(t, [sc.start, sc.end], [1, 1.04]), ax: CX, ay: CY, dx: 0, dy: 0 };
  if (i === 3) {
    const push = 1 + 0.12 * eInOut(clamp((t - sc.push[0]) / (sc.push[1] - sc.push[0])));
    if (t < sc.trans.t0) return { s: push, ax: CX, ay: CY, dx: 0, dy: 0 };
    const u = clamp((t - sc.trans.t0) / (sc.trans.t1 - sc.trans.t0 - 0.15));
    const a = sc.anchor;
    // exponential zoom into the anchor dot, which slides to the centre
    const s = 1.12 * Math.exp(eIn(u) * 3.6);
    return { s, ax: a.x, ay: a.y, dx: (CX - a.x) * eOut(u), dy: (CY - a.y) * eOut(u) };
  }
  return { s: interpolate(t, [sc.start, sc.start + 2.5], [1.06, 1], { extrapolateRight: 'clamp', easing: eOut }), ax: CX, ay: CY, dx: 0, dy: 0 };
}
const toScreen = (c: ReturnType<typeof camera>, layer: 'bg' | 'mid' | 'fg', x: number, y: number, size: number, zoomAll = false) => {
  const f = zoomAll ? 1 : PARALLAX[layer];
  const s = 1 + (c.s - 1) * f;
  return { x: (x - c.ax) * s + c.ax + c.dx * f, y: (y - c.ay) * s + c.ay + c.dy * f, size: size * s };
};

// ---------- per-scene dot choreography (world space)
function pose(sc: Scene & Record<string, any>, i: number, q: Dot, t: number): Pose | null {
  const idleBob = (amp: number) => amp * Math.sin(t * 2.4 + q.phase);
  if (i === 0) {
    if (t < q.t) return null;
    if (q.layer === 'bg') {
      const s = sp(t, q.t, 12, 120);
      return { x: q.x + 8 * Math.sin(t * 0.8 + q.phase), y: q.y + idleBob(6), size: q.size * s, rot: q.rot };
    }
    const p = sp(t, q.t, 9, 110, 0.75); // overshoots past the target, then settles
    const u = clamp((t - q.t) / q.dur);
    const landed = clamp((t - q.t - q.dur) / 0.3);
    return { x: lerp(q.fx, q.x, p), y: lerp(q.fy, q.y, p) + landed * idleBob(5), size: q.size * clamp(u * 3), rot: q.rot + (1 - p) * 140 };
  }
  if (i === 1) {
    if (t < q.t) return null;
    const u = clamp((t - q.t) / q.dur);
    if (q.mode === 'fall') {
      const b = bounce(u);
      const contact = u > 0.3 && u < 0.97 && 1 - b < 0.012;
      return { x: q.x, y: lerp(q.fy, q.y, b) + (u >= 1 ? idleBob(4) : 0), size: q.size, rot: q.rot + u * 30, squash: contact ? 1 : 0 };
    }
    const e = Easing.out(Easing.back(1.4))(u);
    return { x: q.x + 14 * Math.sin(t * 1.6 + q.phase) * (1 - u * 0.6), y: lerp(q.fy, q.y, e), size: q.size, rot: q.rot - u * 40 };
  }
  if (i === 2) {
    if (t < q.t) return null;
    const s = sp(t, q.t, 9, 160, 0.6);
    let x = q.x, y = q.y, size = q.size * s, rot = q.rot;
    if (q.layer === 'bg') { size *= 1 + 0.12 * Math.sin(t * 2 + q.phase); x += 16 * Math.sin(t * 0.7 + q.phase); y += 12 * Math.cos(t * 0.6 + q.phase); }
    else y += idleBob(4);
    if (q.layer === 'mid' && q.g !== undefined && t > q.g) {
      const g = clamp((t - q.g) / 0.4), e = eIn(g);
      x = lerp(x, CX, e); y = lerp(y, CY, e); size *= g > 0.97 ? 0 : 1 - 0.8 * e; rot += 120 * e;
    }
    return { x, y, size, rot };
  }
  if (i === 3) {
    if (t < q.t) return null;
    const u = clamp((t - q.t) / 0.6);
    const b = bounce(u);
    const contact = u > 0.33 && u < 0.97 && 1 - b < 0.015;
    let y = q.y - 90 * (1 - b), squash = contact ? 1 : 0;
    const w = clamp((t - q.w) / 0.42);
    if (w > 0 && w < 1) { y -= (q.layer === 'mid' ? 38 : 18) * Math.sin(Math.PI * w); if (w > 0.85) squash = 0.6; }
    return { x: q.x, y, size: q.size * clamp(u * 4), rot: q.rot + (1 - b) * 40, squash };
  }
  // i === 4: spiral in with a spin, then sizes even out, bg fades, very soft breathing, clean hold
  if (t < q.t) return null;
  const u = clamp((t - q.t) / q.dur), e = eOut(u);
  const a0 = Math.atan2(q.fy - CY, q.fx - CX), d0 = Math.hypot(q.fx - CX, q.fy - CY);
  let a1 = Math.atan2(q.y - CY, q.x - CX); const d1 = Math.hypot(q.x - CX, q.y - CY);
  while (a1 < a0) a1 += Math.PI * 2;
  if (a1 - a0 > Math.PI * 1.5) a1 -= Math.PI * 2;
  const a = lerp(a0, a1, e), d = lerp(d0, d1, e);
  const fl = eInOut(clamp((t - sc.flatten[0]) / (sc.flatten[1] - sc.flatten[0])));
  const tb = Math.min(t, sc.hold);
  const breathe = 1 + 0.025 * fl * Math.sin(tb * 2.2 + q.phase) * clamp((sc.hold - t) / 0.4);
  const size = (q.layer === 'bg' ? q.size : lerp(q.size, q.flat, fl)) * clamp(u * 3) * breathe;
  const drift = (1 - fl) * 6;
  return { x: CX + Math.cos(a) * d + drift * Math.sin(tb + q.phase), y: CY + Math.sin(a) * d + drift * Math.cos(tb * 0.8 + q.phase), size, rot: q.rot + (1 - e) * 220, op: q.layer === 'bg' ? 1 - fl : 1 };
}

// ---------- focus: blur (px) per layer over time; mid stays sharp at every colourway reveal
function focus(sc: Scene & Record<string, any>, i: number, t: number) {
  if (i === 2) {
    const r = eInOut(clamp((t - sc.rack[0]) / (sc.rack[1] - sc.rack[0])));
    return { bg: lerp(0, 2.6, r), mid: lerp(3.6, 0, r), fg: 12 };
  }
  if (i === 4) return { bg: lerp(2.2, 0, clamp((t - sc.flatten[0]) / 1.0)), mid: 0, fg: 11 };
  return { bg: 2.2, mid: 0, fg: i === 0 ? 10 : 9 };
}

// ---------- drawing helpers
const Defs: React.FC = () => (
  <defs>
    {S.shapes.map((s, k) => (
      <g id={`j2s${k}`} key={k} transform={`scale(${1 / s.size}) translate(${-s.cx} ${-s.cy})`}>
        <path d={s.d} />
      </g>
    ))}
  </defs>
);
function dotTransform(x: number, y: number, size: number, rot: number, vx: number, vy: number, squash = 0, stretchK = 45) {
  let pre = '';
  const speed = Math.hypot(vx, vy);
  if (squash > 0) pre = `translate(0 ${(size * 0.12 * squash).toFixed(2)}) scale(${1 + 0.24 * squash} ${1 - 0.22 * squash})`;
  else if (speed > 9) {
    const k = 1 + Math.min(speed / stretchK, 0.4), ang = (Math.atan2(vy, vx) * 180) / Math.PI;
    pre = `rotate(${ang.toFixed(1)}) scale(${k.toFixed(3)} ${(1 / Math.sqrt(k)).toFixed(3)}) rotate(${(-ang).toFixed(1)})`;
  }
  return `translate(${x.toFixed(1)} ${y.toFixed(1)}) ${pre} rotate(${rot.toFixed(1)}) scale(${size.toFixed(2)})`;
}
const Layer: React.FC<{ blur: number; children: React.ReactNode; opacity?: number }> = ({ blur, children, opacity = 1 }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0, filter: blur > 0.15 ? `blur(${blur.toFixed(2)}px)` : undefined, opacity }}>
    <Defs />
    {children}
  </svg>
);

export const JoyClubDotsV2: React.FC<{ withAudio: boolean }> = ({ withAudio }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS, tp = (frame - 1) / FPS;
  const i = Math.max(0, V.scenes.findIndex((s) => t >= s.start && t < s.end));
  const sc = (V.scenes[i] ?? V.scenes[V.scenes.length - 1]) as Scene & Record<string, any>;
  const cam = camera(sc, i, t), camP = camera(sc, i, tp);
  const zoomAll = i === 3 && t >= sc.trans.t0;
  const fc = focus(sc, i, t);

  const draw = (layer: 'bg' | 'mid') =>
    (sc.dots as Dot[]).filter((q) => q.layer === layer).map((q, k) => {
      const p = pose(sc, i, q, t);
      if (!p || p.size < 0.3) return null;
      const pp = pose(sc, i, q, tp) ?? p;
      const a = toScreen(cam, layer, p.x, p.y, p.size, zoomAll), b = toScreen(camP, layer, pp.x, pp.y, pp.size, zoomAll);
      const moving = !zoomAll; // the zoom itself is a camera move; no smear on it
      return (
        <use key={k} href={`#j2s${q.shape}`} fill={sc.dot} opacity={p.op ?? 1}
          transform={dotTransform(a.x, a.y, a.size, p.rot, moving ? a.x - b.x : 0, moving ? a.y - b.y : 0, p.squash, layer === 'bg' ? 30 : 45)} />
      );
    });

  // fg passers: oversized, blurred, quick across the lens
  const fgEls = sc.fg.map((f: any, k: number) => {
    if (t < f.t0 || t > f.t1) return null;
    const u = eInOut(clamp((t - f.t0) / (f.t1 - f.t0))), u0 = eInOut(clamp((tp - f.t0) / (f.t1 - f.t0)));
    const x = lerp(f.x0, f.x1, u), y = lerp(f.y0, f.y1, u);
    const a = toScreen(cam, 'fg', x, y, f.size), b = toScreen(camP, 'fg', lerp(f.x0, f.x1, u0), lerp(f.y0, f.y1, u0), f.size);
    return <use key={k} href={`#j2s${f.shape}`} fill={sc.dot} transform={dotTransform(a.x, a.y, a.size, f.rot + u * 60, a.x - b.x, a.y - b.y, 0, 90)} />;
  });

  // hero dot (scene 1): huge and soft against the lens, rack-focuses sharp as it settles into the pattern
  let hero: React.ReactNode = null, heroBlur = 0;
  if (i === 0 && sc.hero) {
    const h = sc.hero, u = clamp((t - h.t0) / (h.t1 - h.t0));
    const settle = sp(t, h.t1 - 0.15, 8, 150);
    const size = lerp(h.size0, h.size1, Easing.out(Easing.quad)(u)) * (u < 1 ? 1 : 0.92 + 0.08 * settle);
    heroBlur = lerp(24, 0, eInOut(clamp((t - 0.2) / 1.0)));
    const a = toScreen(cam, 'mid', h.x, h.y + (u >= 1 ? 5 * Math.sin(t * 2.4) : 0), size);
    hero = <use href={`#j2s${h.shape}`} fill={sc.dot} transform={dotTransform(a.x, a.y, a.size, h.rot + u * 25, 0, 0)} />;
  }

  // transitions, each different
  let trans: React.ReactNode = null, transBlur = 0;
  const tr = sc.trans as any;
  if (tr && t >= tr.t0) {
    if (tr.kind === 'fly') {
      const u = clamp((t - tr.t0) / (tr.t1 - tr.t0));
      const x = lerp(tr.from[0], CX, eOut(u)), y = lerp(tr.from[1], CY, eOut(u));
      transBlur = lerp(7, 0, u);
      trans = <use href="#j2s5" fill={tr.color} transform={dotTransform(x, y, lerp(70, COVER * 2.2, eIn(u)), 30 + u * 90, 0, 0)} />;
    } else if (tr.kind === 'wipe') {
      const u = clamp((t - tr.t0) / (tr.t1 - tr.t0));
      trans = <use href="#j2s9" fill={tr.color} transform={dotTransform(CX + 60 * Math.sin(u * 3), lerp(H + 900, CY, eInOut(u)), lerp(1300, COVER * 2.3, eIn(u)), -20 + u * 50, 0, 0)} />;
    } else if (tr.kind === 'gather') {
      const g = clamp((t - tr.t0 - 0.12) / (tr.t1 - tr.t0 - 0.05));
      let r = 180 * eOut(g) * (1 + 0.05 * Math.sin(t * 24) * g * (1 - g) * 4), fill = sc.dot;
      if (t > tr.t1) { const v = clamp((t - tr.t1) / (tr.t2 - tr.t1)); r = lerp(180, COVER, eIn(v)); fill = interpolateColors(v, [0, 0.6], [sc.dot, tr.color]); }
      trans = r > 1 ? <use href="#j2s0" fill={fill} transform={dotTransform(CX, CY, r * 2, (t * 30) % 360, 0, 0)} /> : null;
    } else if (tr.kind === 'zoom') {
      const a = sc.anchor, s = toScreen(cam, 'mid', a.x, a.y, a.size, true);
      if (s.size / 2 > COVER * 1.02) {
        const v = clamp((t - (tr.t1 - 0.22)) / 0.2);
        trans = <rect width={W} height={H} fill={interpolateColors(v, [0, 1], [sc.dot, tr.color])} />;
      }
    }
  }

  return (
    <AbsoluteFill style={{ backgroundColor: sc.bg }}>
      <Layer blur={fc.bg}>{draw('bg')}</Layer>
      <Layer blur={fc.mid}>{draw('mid')}</Layer>
      {hero && <Layer blur={heroBlur}>{hero}</Layer>}
      <Layer blur={fc.fg}>{fgEls}</Layer>
      {trans && <Layer blur={transBlur}>{trans}</Layer>}
      {withAudio && <Audio src={staticFile('joyclub/sfx_v2.wav')} />}
    </AbsoluteFill>
  );
};
