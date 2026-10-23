import { AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/fonts';
import layout from './layout.json';

const fontFamily = 'DM Serif Display';
loadFont({ family: fontFamily, url: staticFile('fonts/dm-serif-display-latin-400-normal.woff2') });

export const COLORS = { ivory: '#E9E1CA', burgundy: '#8E1F3A' };
const [DISSOLVE_IN, DISSOLVE_OUT] = layout.DISSOLVE;
const WASH_FRAMES = Math.round((DISSOLVE_OUT - DISSOLVE_IN) * layout.FPS) + 1;

type Flower = (typeof layout.flowers)[number];

const FlowerSprig: React.FC<{ f: Flower; t: number }> = ({ f, t }) => {
  const { fps } = useVideoConfig();
  const local = (t - f.popAt) * fps;
  if (local < 0) return null;
  // pop: from a dot to ~112% and back, a little spin as it lands
  const s = spring({ frame: local, fps, config: { damping: 9, mass: 0.55, stiffness: 170 } });
  const settle = Math.min(1, local / (fps * 0.7));
  // breeze: each sprig sways from its stem at its own phase
  const sway = Math.sin(t * Math.PI * 2 * 0.42 + f.swayPhase) * 2.4 * settle;
  const bob = Math.sin(t * Math.PI * 2 * 0.3 + f.swayPhase * 1.7) * 6 * settle;
  const rotate = f.rotate + (1 - s) * -28 + sway;
  return (
    <Img
      src={staticFile(`flowers/${String(f.sprig).padStart(2, '0')}.png`)}
      style={{
        position: 'absolute',
        left: f.x,
        top: f.y + bob,
        height: f.height,
        transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${s * (f.flip ? -1 : 1)}, ${s})`,
        transformOrigin: '50% 62%',
        opacity: Math.min(1, local / 2),
      }}
    />
  );
};

const Garden: React.FC<{ t: number }> = ({ t }) => (
  <>
    {[...layout.flowers]
      .sort((a, b) => a.z - b.z || a.popAt - b.popAt)
      .map((f) => (
        <FlowerSprig key={f.id} f={f} t={t} />
      ))}
  </>
);

const Title: React.FC<{ t: number }> = ({ t }) => {
  const { fps } = useVideoConfig();
  const lines = [0, 1].map((line) => layout.letters.filter((l) => l.line === line));
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 0 }}>
      {lines.map((ls, li) => (
        <div key={li} style={{ display: 'flex', lineHeight: 0.92 }}>
          {ls.map((l) => {
            const local = (t - l.at) * fps;
            const s = local < 0 ? 0 : spring({ frame: local, fps, config: { damping: 8, mass: 0.5, stiffness: 190 } });
            return (
              <span
                key={l.i}
                style={{
                  fontFamily,
                  fontSize: li === 0 ? 250 : 270,
                  color: COLORS.burgundy,
                  letterSpacing: li === 0 ? 6 : 14,
                  display: 'inline-block',
                  transform: `translateY(${(1 - s) * 40}px) rotate(${(1 - s) * -14}deg) scale(${s})`,
                  opacity: local < 0 ? 0 : Math.min(1, local / 2),
                }}
              >
                {l.ch}
              </span>
            );
          })}
        </div>
      ))}
    </AbsoluteFill>
  );
};

export const PetalPop: React.FC<{ withAudio: boolean }> = ({ withAudio }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // watercolor wash: a blotchy mask eats the flowers from the centre out, while they soften and pale
  const p = interpolate(t, [DISSOLVE_IN, DISSOLVE_OUT], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const washing = t >= DISSOLVE_IN;
  const washFrame = Math.round(p * (WASH_FRAMES - 1));
  const mask = washing ? `url(${staticFile(`wash/${String(washFrame).padStart(2, '0')}.png`)})` : undefined;
  const ghost = interpolate(t, [DISSOLVE_IN, DISSOLVE_OUT, DISSOLVE_OUT + 0.4], [0, 0.28, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ivory, overflow: 'hidden' }}>
      {ghost > 0 && (
        <AbsoluteFill style={{ opacity: ghost, filter: 'blur(6px) saturate(0.7)' }}>
          <Garden t={t} />
        </AbsoluteFill>
      )}
      {(!washing || p < 1) && (
        <AbsoluteFill
          style={{
            WebkitMaskImage: mask,
            WebkitMaskSize: '100% 100%',
            maskImage: mask,
            maskSize: '100% 100%',
            filter: washing ? `blur(${p * 2.5}px) saturate(${1 - p * 0.35}) brightness(${1 + p * 0.08})` : undefined,
          }}
        >
          <Garden t={t} />
        </AbsoluteFill>
      )}
      {t >= layout.TITLE_AT - 0.1 && <Title t={t} />}
      <AbsoluteFill>
        <Img src={staticFile('paper.png')} style={{ width: '100%', height: '100%' }} />
      </AbsoluteFill>
      {withAudio && <Audio src={staticFile('music.wav')} />}
    </AbsoluteFill>
  );
};
