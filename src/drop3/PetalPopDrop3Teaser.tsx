import { AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame } from 'remotion';
import T from './timeline.json';

// Petal Pop Drop 3 Teaser 1 (v4): one slow flight forward through the five Abstract Floral colourways.
// Far to near: the colourway's ground and its whole print as a soft far wall · big sprays and a hero flower in
// depth (the next ones always fading in behind) · small flowers fluttering across on the wind, some right by the
// lens. Each hero flower flies through the camera and is the wipe to the next colourway. The last one flies
// into the wash, petals spiral in round the Drop 3 logo, NAFESA closes. Watercolor paper over all. SFX only.
type El = (typeof T.els)[number];
type Float = (typeof T.floats)[number];
type Ring = (typeof T.ring)[number];
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const easeInOut = (x: number) => x * x * (3 - 2 * x);
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const outBack = (x: number) => {
  const c = 1.5;
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};
const mix = (c1: string, c2: string, k: number) => {
  const h = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const [a, b] = [h(c1), h(c2)];
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`;
};
const img = (way: string, m: string) => staticFile(`drop3/${way}/${m}.png`);
type Cam = { z: number; x: number; y: number };

// which colourway is showing, and how far the change into it has got: the next ground opens out from the
// centre behind the hero flower as it flies through the lens (a soft-edged bloom, no muddy cross-fade)
const wayState = (t: number) => {
  const i = T.changes.filter((c) => t >= c - 0.3).length;
  const k = i === 0 ? 1 : easeOut(Math.min(1, (t - (T.changes[i - 1] - 0.3)) / 0.6));
  return { i, prev: Math.max(0, i - 1), k };
};

const WallLayer: React.FC<{ n: number; t: number; cam: Cam; mask?: string }> = ({ n, t, cam, mask }) => {
  const way = T.ways[n];
  const zoom = 1.05 + (cam.z - T.Z0) / 60000; // the far wall creeps in too: the push never stops
  return (
    <AbsoluteFill style={{ backgroundColor: T.bg[n], WebkitMaskImage: mask, maskImage: mask }}>
      <Img
        src={img(way, 'pattern')}
        style={{
          position: 'absolute',
          width: 2300,
          height: 2300,
          left: T.W / 2 - 1150 - cam.x * 0.12,
          top: T.H / 2 - 1150 - cam.y * 0.12,
          transform: `scale(${zoom}) rotate(${t * 0.6}deg)`,
          opacity: way === 'Petunia' ? 0.32 : 0.2,
          filter: 'blur(3px)',
        }}
      />
    </AbsoluteFill>
  );
};

const Wall: React.FC<{ t: number; cam: Cam }> = ({ t, cam }) => {
  const { i, prev, k } = wayState(t);
  if (k >= 1) return <WallLayer n={i} t={t} cam={cam} />;
  const r = k * 1250;
  const mask = `radial-gradient(circle at 50% 48%, #000 ${r}px, transparent ${r + 160}px)`;
  return (
    <>
      <WallLayer n={prev} t={t} cam={cam} />
      <WallLayer n={i} t={t} cam={cam} mask={mask} />
    </>
  );
};

const Motif: React.FC<{ e: El; t: number; cam: Cam }> = ({ e, t, cam }) => {
  const life = t - e.born;
  if (life < 0 && !(e as { opener?: boolean }).opener) return null;
  const d = e.z - cam.z;
  if (d < T.NEAR || d > T.FAR + 100) return null;
  const k = T.F / d;
  const lt = Math.max(0, life);
  const wx = e.x + e.vx * lt + Math.sin(t * 0.9 + e.phase) * 40;
  const wy = e.y + Math.sin(t * 0.7 + e.phase * 1.3) * 50 - lt * 10;
  const sx = T.W / 2 + (wx - cam.x) * k;
  const sy = T.H / 2 + (wy - cam.y) * k;
  // grows from a bud far away (and the opener blooms open right in front of the lens)
  const opener = (e as { opener?: boolean }).opener;
  const grow = opener ? outBack(Math.min(1, t / 0.9)) : Math.max(0, outBack(Math.min(1, lt / 1.8)));
  const w = e.w * k * grow, h = e.h * k * grow;
  if (sx + w < -300 || sx - w > T.W + 300 || sy + h < -300 || sy - h > T.H + 300) return null;
  const opacity = interpolate(d, [T.NEAR, T.NEAR + 90, T.FAR - 1400, T.FAR], [0, 1, 1, 0], clamp);
  const blur = interpolate(d, [T.NEAR, 420, 800, 3600, T.FAR], [9, 2, 0, 0, 1.8], clamp);
  const rot = e.rot + e.spin * t + Math.sin(t * 1.1 + e.phase) * 6;
  const shadow = 'drop-shadow(0px 24px 26px rgba(70, 35, 25, 0.16))';
  return (
    <Img
      src={img(e.way, e.m)}
      style={{
        position: 'absolute',
        left: sx - w / 2,
        top: sy - h / 2,
        width: w,
        height: h,
        opacity,
        filter: `${blur > 0.2 ? `blur(${blur}px) ` : ''}${d < 2600 ? shadow : ''}` || undefined,
        transform: `rotate(${rot}deg) scaleX(${e.flip ? -1 : 1})`,
      }}
    />
  );
};

// a small flower on the wind: crosses left to right, bobbing and turning over in 3D like a real petal
const Floater: React.FC<{ f: Float; t: number; cam: Cam }> = ({ f, t, cam }) => {
  const life = t - f.born;
  if (life < 0) return null;
  const d = f.d - 110 * life;
  if (d < 120) return null;
  const k = T.F / d;
  const x = -260 + f.sp * life - (cam.x * k) * 0.5;
  if (x > T.W + 300) return null;
  const y = T.H / 2 + (f.y - cam.y) * k + Math.sin(life * 1.7 + f.phase) * 60 + life * 14;
  const h = f.h * k * 0.9;
  const w = h;
  const flip = Math.sin(life * Math.PI * 2 * f.fl * 0.5 + f.phase);
  return (
    <div style={{ position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, perspective: 600, opacity: Math.min(1, life / 0.4) * (f.near ? 0.92 : 1) }}>
      <Img
        src={img(f.way, f.m)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          filter: f.near ? 'blur(7px)' : undefined,
          transform: `rotateY(${flip * 65}deg) rotateX(${Math.cos(life * 2.1 + f.phase) * 35}deg) rotateZ(${f.spin * life + f.phase * 40}deg)`,
        }}
      />
    </div>
  );
};

const Logo: React.FC<{ t: number }> = ({ t }) => {
  const E = T.END;
  if (t < E.logoAt) return null;
  // writes in from the left behind a feathered edge while it springs up to size
  const p = interpolate(t, [E.logoAt, E.logoAt + E.logoDur], [0, 1], { ...clamp, easing: easeInOut });
  const pop = spring({ frame: (t - E.logoAt) * T.FPS, fps: T.FPS, config: { damping: 11, mass: 0.7, stiffness: 120 } });
  const out = interpolate(t, [E.logoOut, E.logoOut + 0.45], [0, 1], { ...clamp, easing: easeInOut });
  const edge = -20 + p * 140;
  const mask = `linear-gradient(90deg, #000 ${edge - 20}%, transparent ${edge}%)`;
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Img
        src={staticFile('drop3/logo.png')}
        style={{
          width: 800,
          WebkitMaskImage: mask,
          maskImage: mask,
          opacity: 1 - out,
          filter: `blur(${(1 - easeOut(p)) * 5 + out * 10}px)`,
          transform: `translateY(${(1 - pop) * 40 - out * 10}px) scale(${0.85 + 0.15 * pop + out * 0.05})`,
        }}
      />
    </AbsoluteFill>
  );
};

// twelve small flowers, one from every colourway in turn, spiral in and settle in a ring round the logo
const RingFlower: React.FC<{ r: Ring; t: number }> = ({ r, t }) => {
  const E = T.END;
  const life = t - r.at;
  if (life < 0) return null;
  const s = spring({ frame: life * T.FPS, fps: T.FPS, config: { damping: 14, mass: 0.8, stiffness: 70 } });
  const out = interpolate(t, [E.logoOut - 0.1, E.logoOut + 0.6], [0, 1], { ...clamp, easing: easeInOut });
  const a = r.a - (1 - s) * 2.6 + Math.sin(t * 0.8 + r.phase) * 0.03 + out * 0.6;
  const rad = r.r * (1 + (1 - s) * 1.4) * (1 + out * 0.8) * (0.82 + 0.18) ;
  const x = T.W / 2 + Math.cos(a) * rad;
  const y = T.H / 2 + Math.sin(a) * rad * 1.15;
  const h = r.h * (0.4 + 0.6 * s);
  return (
    <Img
      src={img(r.way, r.m)}
      style={{
        position: 'absolute',
        left: x - h / 2,
        top: y - h / 2,
        width: h,
        height: h,
        objectFit: 'contain',
        opacity: Math.min(1, life / 0.3) * (1 - out),
        transform: `rotate(${r.spin * (1 - s) * 4 + Math.sin(t * 1.3 + r.phase) * 12}deg)`,
      }}
    />
  );
};

const Nafesa: React.FC<{ t: number }> = ({ t }) => {
  const at = T.END.nafAt;
  if (t < at) return null;
  const p = interpolate(t, [at, at + 0.9], [0, 1], { ...clamp, easing: easeOut });
  const mask = `url(${staticFile('drop3/nafesa.png')})`;
  const W = 480;
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          width: W,
          height: (W * 975) / 1400,
          backgroundColor: '#5a2c3f',
          WebkitMaskImage: mask,
          maskImage: mask,
          WebkitMaskSize: '100% 100%',
          maskSize: '100% 100%',
          opacity: p,
          filter: `blur(${(1 - p) * 8}px)`,
          transform: `translateY(${(1 - p) * 16}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

export const PetalPopDrop3Teaser: React.FC<{ withAudio: boolean }> = ({ withAudio }) => {
  const frame = useCurrentFrame();
  const t = frame / T.FPS;
  const [cz, cx, cy, roll] = T.cam[Math.min(T.cam.length - 1, frame)];
  const cam = { z: cz, x: cx, y: cy };
  const E = T.END;
  const g = interpolate(t, [E.washAt, E.washAt + E.washDur], [0, 1], { ...clamp, easing: easeInOut });
  const els = [...T.els].sort((a, b) => b.z - a.z); // far first
  const floats = [...T.floats].sort((a, b) => b.d - a.d);
  return (
    <AbsoluteFill style={{ backgroundColor: T.bg[0], overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          transform: `rotate(${roll}deg) scale(1.05)`,
          filter: g > 0 ? `blur(${g * 26}px) saturate(${1 - g * 0.3}) brightness(${1 + g * 0.05})` : undefined,
          opacity: 1 - g * 0.55,
        }}
      >
        <Wall t={t} cam={cam} />
        {els.map((e) => (
          <Motif key={e.id} e={e} t={t} cam={cam} />
        ))}
        {floats.map((f) => (
          <Floater key={f.id} f={f} t={t} cam={cam} />
        ))}
      </AbsoluteFill>
      {T.ring.map((r) => (
        <RingFlower key={r.id} r={r} t={t} />
      ))}
      <Logo t={t} />
      <Nafesa t={t} />
      <Img src={staticFile('drop3/paper.png')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'overlay', opacity: 0.55 }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(60, 30, 20, 0.12) 100%)' }} />
      {withAudio && <Audio src={staticFile('drop3/sfx.wav')} />}
    </AbsoluteFill>
  );
};
