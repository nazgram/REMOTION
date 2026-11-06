import { AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import T from './timeline.json';

// Petal Pop Drop 3 Teaser 1 (v3): one slow flight forward through the five Abstract Floral colourways. The camera
// always pushes in and sways left and right; a few motifs hang in depth, drifting left to right on the wind, each
// growing in from small far away, swelling as the camera reaches it and slipping past the frame edge behind the
// camera. The flight slows, the garden blurs into a wash, the Drop 3 logo writes in, NAFESA closes. SFX only.
type El = (typeof T.els)[number];
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const easeInOut = (x: number) => x * x * (3 - 2 * x);
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const outBack = (x: number) => {
  const c = 1.4;
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};
const mix = (c1: string, c2: string, k: number) => {
  const h = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const [a, b] = [h(c1), h(c2)];
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`;
};

type Cam = { z: number; x: number; y: number };
const Motif: React.FC<{ e: El; t: number; cam: Cam }> = ({ e, t, cam }) => {
  const life = t - e.born;
  if (life < 0) return null;
  const d = e.z - cam.z;
  if (d < T.NEAR || d > T.FAR + 200) return null;
  const k = T.F / d; // perspective scale
  // the wind: drifting left to right, with a slow sway and lift
  const wx = e.x + e.vx * life + Math.sin(t * 0.9 + e.phase) * 40;
  const wy = e.y + Math.sin(t * 0.7 + e.phase * 1.3) * 50 - life * 12;
  const sx = T.W / 2 + (wx - cam.x) * k;
  const sy = T.H / 2 + (wy - cam.y) * k;
  // grows in from small when it first appears, then perspective does the rest
  const grow = Math.max(0, outBack(Math.min(1, life / 1.6)));
  const w = e.w * k * grow, h = e.h * k * grow;
  if (sx + w < -200 || sx - w > T.W + 200 || sy + h < -200 || sy - h > T.H + 200) return null;
  // fades up out of the distance; softly out of focus when very close or very far
  const opacity = interpolate(d, [T.NEAR, T.NEAR + 120, T.FAR - 900, T.FAR], [0, 1, 1, 0], clamp) * Math.min(1, life / 0.5);
  const blur = interpolate(d, [T.NEAR, 520, 900, 3200, T.FAR], [7, 1.5, 0, 0, 1.2], clamp);
  const rot = e.rot + e.spin * t + Math.sin(t * 1.1 + e.phase) * 6;
  return (
    <Img
      src={staticFile(`drop3/${e.way}/${e.m}.png`)}
      style={{
        position: 'absolute',
        left: sx - w / 2,
        top: sy - h / 2,
        width: w,
        height: h,
        opacity,
        filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
        transform: `rotate(${rot}deg) scaleX(${e.flip ? -1 : 1})`,
      }}
    />
  );
};

const Logo: React.FC<{ t: number }> = ({ t }) => {
  const E = T.END;
  if (t < E.logoAt) return null;
  // writes in from the left behind a soft feathered edge, rising out of a blur, like the reference's script word
  const p = interpolate(t, [E.logoAt, E.logoAt + E.logoDur], [0, 1], { ...clamp, easing: easeInOut });
  const out = interpolate(t, [E.logoOut, E.logoOut + 0.45], [0, 1], { ...clamp, easing: easeInOut });
  const edge = -20 + p * 140;
  const mask = `linear-gradient(90deg, #000 ${edge - 20}%, transparent ${edge}%)`;
  const W = 820;
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Img
        src={staticFile('drop3/logo.png')}
        style={{
          width: W,
          WebkitMaskImage: mask,
          maskImage: mask,
          opacity: 1 - out,
          filter: `blur(${(1 - easeOut(p)) * 6 + out * 10}px)`,
          transform: `translateY(${(1 - easeOut(p)) * 24 - out * 10}px) scale(${0.97 + 0.03 * easeOut(p) + out * 0.04})`,
        }}
      />
    </AbsoluteFill>
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
  // the ground drifts from one colourway's tint to the next as the camera flies through its zone
  const u = (cz - T.Z0) / T.ZONE;
  const zi = Math.min(T.bg.length - 1, Math.floor(u));
  const ground = mix(T.bg[zi], T.bg[Math.min(T.bg.length - 1, zi + 1)], easeInOut(Math.min(1, Math.max(0, (u - zi - 0.55) / 0.45))));
  const E = T.END;
  const g = interpolate(t, [E.washAt, E.washAt + E.washDur], [0, 1], { ...clamp, easing: easeInOut });
  const els = [...T.els].sort((a, b) => b.z - a.z); // far first
  return (
    <AbsoluteFill style={{ backgroundColor: ground, overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          transform: `rotate(${roll}deg) scale(1.04)`,
          filter: g > 0 ? `blur(${g * 26}px) saturate(${1 - g * 0.35}) brightness(${1 + g * 0.06})` : undefined,
          opacity: 1 - g * 0.6,
        }}
      >
        {els.map((e) => (
          <Motif key={e.id} e={e} t={t} cam={cam} />
        ))}
      </AbsoluteFill>
      <Logo t={t} />
      <Nafesa t={t} />
      {withAudio && <Audio src={staticFile('drop3/sfx.wav')} />}
    </AbsoluteFill>
  );
};
