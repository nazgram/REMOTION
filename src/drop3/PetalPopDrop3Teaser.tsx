import { AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame } from 'remotion';
import T from './timeline.json';

// Petal Pop Drop 3 Teaser 1, after Nas's "video contoh teaser 1": big Abstract Floral motifs grow in and hold
// in a breeze, a watercolor bleed paints each next colourway over the last, then the last garden washes out to
// a soft blur and the Drop 3 logo writes itself in from the left. NAFESA closes.
type Scene = (typeof T.scenes)[number];
type El = Scene['els'][number] & { out: number | null };
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const easeInOut = (x: number) => x * x * (3 - 2 * x);
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const outBack = (x: number) => {
  const c = 1.2;
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};

// the dry-brush mask (opaque left, streaky edge, transparent right) slid across a motif in its own frame:
// k = 0 nothing shown, k = 1 all shown; dir -1 paints right to left
const brush = (k: number): React.CSSProperties => {
  const pos = (1 - Math.min(1, Math.max(0, k))) * 100;
  const url = `url(${staticFile('drop3/brush.png')})`;
  return {
    WebkitMaskImage: url,
    maskImage: url,
    WebkitMaskSize: '300% 100%',
    maskSize: '300% 100%',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: `${pos}% 0%`,
    maskPosition: `${pos}% 0%`,
  };
};
// a masked wrapper; for dir -1 the mask is mirrored and the content mirrored back, so it reads the right way
const Brushed: React.FC<{ k: number; dir: number; children: React.ReactNode }> = ({ k, dir, children }) =>
  k >= 1 ? (
    <>{children}</>
  ) : (
    <div style={{ position: 'absolute', inset: 0, transform: dir < 0 ? 'scaleX(-1)' : undefined, ...brush(k) }}>
      <div style={{ position: 'absolute', inset: 0, transform: dir < 0 ? 'scaleX(-1)' : undefined }}>{children}</div>
    </div>
  );

const Motif: React.FC<{ e: El; way: string; t: number }> = ({ e, way, t }) => {
  const local = t - e.at;
  if (local < 0) return null;
  const sinceOut = e.out === null ? -1 : t - e.out;
  if (sinceOut > T.OUT_DUR + 1.6) return null;
  const f = local * T.FPS;
  let scale = 1, dy = 0, drot = 0, opacity = 1, paint = 1;
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
    // paint: brushed in across the motif, growing a touch as the stroke passes
    paint = easeOut(Math.min(1, local / T.IN_DUR));
    scale = 0.94 + 0.06 * paint;
  }
  // going: brushed away the other way, leaving a pale wet stain that fades
  const gone = sinceOut < 0 ? 0 : Math.min(1, sinceOut / T.OUT_DUR);
  const stain = sinceOut < 0 ? 0 : interpolate(sinceOut, [0, 0.3, T.OUT_DUR + 1.6], [0, 0.3, 0], clamp);
  const settle = Math.min(1, local / 1.4);
  const sway = Math.sin(t * Math.PI * 2 * 0.3 + e.phase) * 2.2 * settle;
  const bob = Math.sin(t * Math.PI * 2 * 0.22 + e.phase * 1.7) * 6 * settle;
  const src = staticFile(`drop3/${way}/${e.m}.png`);
  return (
    <div
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
    >
      {stain > 0 && (
        <Img
          src={src}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: stain, filter: 'blur(14px) saturate(0.7)' }}
        />
      )}
      {gone < 1 && (
        <Brushed k={1 - gone} dir={-e.dir}>
          <Brushed k={paint} dir={e.dir}>
            <Img src={src} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
          </Brushed>
        </Brushed>
      )}
    </div>
  );
};

const mix = (c1: string, c2: string, k: number) => {
  const h = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const [a, b] = [h(c1), h(c2)];
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`;
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
  // one ground the whole way: it only drifts in tint as the colourways change
  const p = i > 0 ? easeInOut(Math.min(1, (t - cur.start) / T.WASH_DUR)) : 1;
  const ground = i > 0 ? mix(S[i - 1].bg, cur.bg, p) : cur.bg;
  const E = T.END;
  // the end: the last garden softens, pales and blurs into a watercolor ground for the logo
  const g = interpolate(t, [E.washAt, E.washAt + E.washDur], [0, 1], { ...clamp, easing: easeInOut });
  // one continuous camera: a slow push-in with a hand-held float that never resets at a change
  const zoom = 1 + 0.1 * interpolate(t, [0, E.washAt + E.washDur], [0, 1], clamp);
  const camX = Math.sin(t * 0.33) * 14 + Math.sin(t * 0.71 + 1) * 5;
  const camY = Math.sin(t * 0.27 + 2) * 12 - t * 1.2;
  const live = S.filter((s, k) => k === i || k === i - 1);
  return (
    <AbsoluteFill style={{ backgroundColor: ground, overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          transform: `translate(${camX}px, ${camY}px) scale(${zoom})`,
          filter: g > 0 ? `blur(${g * 26}px) saturate(${1 - g * 0.35}) brightness(${1 + g * 0.06})` : undefined,
          opacity: 1 - g * 0.62,
        }}
      >
        {live.map((s) => s.els.map((e) => <Motif key={e.id} e={e as El} way={s.way} t={t} />))}
      </AbsoluteFill>
      <Logo t={t} />
      <Nafesa t={t} />
      {withAudio && <Audio src={staticFile('drop3/music.wav')} />}
    </AbsoluteFill>
  );
};
