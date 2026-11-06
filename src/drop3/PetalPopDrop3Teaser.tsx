import { AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame } from 'remotion';
import T from './timeline.json';

// Petal Pop Drop 3 Teaser 1, after Nas's "video contoh teaser 1": big Abstract Floral motifs grow in and hold
// in a breeze, a watercolor bleed paints each next colourway over the last, then the last garden washes out to
// a soft blur and the Drop 3 logo writes itself in from the left. NAFESA closes.
type Scene = (typeof T.scenes)[number];
type El = Scene['els'][number];
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const easeInOut = (x: number) => x * x * (3 - 2 * x);
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const outBack = (x: number) => {
  const c = 1.2;
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};

const Motif: React.FC<{ e: El; way: string; t: number }> = ({ e, way, t }) => {
  const local = t - e.at;
  if (local < 0) return null;
  const f = local * T.FPS;
  let scale = 1, dy = 0, drot = 0, opacity = 1;
  if (e.entrance === 'grow') {
    const g = outBack(Math.min(1, local / 1.2));
    scale = Math.max(0, g);
    drot = (1 - Math.min(1, local / 1.2)) * -12;
  } else if (e.entrance === 'drop') {
    const s = spring({ frame: f, fps: T.FPS, config: { damping: 13, mass: 0.9, stiffness: 60 } });
    dy = (1 - s) * -340;
    drot = (1 - s) * 50;
    scale = 0.7 + 0.3 * s;
    opacity = Math.min(1, local / 0.35);
  } else if (e.entrance === 'pop') {
    scale = spring({ frame: f, fps: T.FPS, config: { damping: 9, mass: 0.55, stiffness: 150 } });
    drot = (1 - scale) * -30;
  } else {
    // paint: arrives with the wash, settling from slightly large
    scale = 1.07 - 0.07 * easeOut(Math.min(1, local / (T.WASH_DUR + 0.4)));
  }
  const settle = Math.min(1, local / 1.4);
  const sway = Math.sin(t * Math.PI * 2 * 0.3 + e.phase) * 2.2 * settle;
  const bob = Math.sin(t * Math.PI * 2 * 0.22 + e.phase * 1.7) * 6 * settle;
  return (
    <Img
      src={staticFile(`drop3/${way}/${e.m}.png`)}
      style={{
        position: 'absolute',
        left: e.x - e.w / 2,
        top: e.y - e.h / 2 + dy + bob,
        width: e.w,
        height: e.h,
        opacity,
        transformOrigin: e.entrance === 'grow' ? `50% ${e.oy}%` : '50% 50%',
        transform: `rotate(${e.rot + drot + sway}deg) scale(${scale * (e.flip ? -1 : 1)}, ${scale})`,
      }}
    />
  );
};

const washSrc = (name: string, p: number) =>
  `url(${staticFile(`drop3/${name}/${String(Math.round(p * (T.WASH_FRAMES - 1))).padStart(2, '0')}.png`)})`;

const SceneLayer: React.FC<{ s: Scene; t: number; mask?: string; filter?: string; opacity?: number }> = ({
  s,
  t,
  mask,
  filter,
  opacity = 1,
}) => {
  // a slow push-in while the scene holds
  const zoom = 1 + 0.06 * interpolate(t, [s.start, s.start + 6], [0, 1], clamp);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: s.bg,
        WebkitMaskImage: mask,
        maskImage: mask,
        WebkitMaskSize: '100% 100%',
        maskSize: '100% 100%',
        filter,
        opacity,
      }}
    >
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        {s.els.map((e) => (
          <Motif key={e.id} e={e} way={s.way} t={t} />
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
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
  const t = useCurrentFrame() / T.FPS;
  const S = T.scenes;
  const i = S.filter((s) => t >= s.start).length - 1;
  const cur = S[i];
  const p = i > 0 ? (t - cur.start) / T.WASH_DUR : 1;
  const E = T.END;
  // the end: the last garden softens, pales and blurs into a watercolor ground for the logo
  const g = interpolate(t, [E.washAt, E.washAt + E.washDur], [0, 1], { ...clamp, easing: easeInOut });
  const endFilter = g > 0 ? `blur(${g * 26}px) saturate(${1 - g * 0.35}) brightness(${1 + g * 0.06})` : undefined;
  return (
    <AbsoluteFill style={{ backgroundColor: S[S.length - 1].bg, overflow: 'hidden' }}>
      {p < 1 && (
        <SceneLayer
          s={S[i - 1]}
          t={t}
          filter={`blur(${easeInOut(Math.min(1, p)) * 6}px) brightness(${1 + 0.05 * p})`}
        />
      )}
      <SceneLayer
        s={cur}
        t={t}
        mask={p < 1 ? washSrc(cur.wash as string, Math.max(0, p)) : undefined}
        filter={endFilter}
        opacity={1 - g * 0.62}
      />
      <Logo t={t} />
      <Nafesa t={t} />
      {withAudio && <Audio src={staticFile('drop3/music.wav')} />}
    </AbsoluteFill>
  );
};
