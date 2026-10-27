import { AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/fonts';
import layout from './layout.json';
// "Petal Pop" set in Fabulosa (Adobe Fonts) and outlined in Illustrator, one path per letter
import title from './title.json';

const taglineFont = 'Montserrat';
loadFont({ family: taglineFont, url: staticFile('intro/fonts/Montserrat.ttf'), weight: '100 900' });

// NAFESA Petal Pop color sheet
export const COLORS = { berry: '#971D59', blush: '#F2A3BC', peach: '#FFC7B8', ivory: '#F8EAD9' };

// colorway: a straight cut to the latest one that has started
type Layer = { name: string; bg: string; opacity: number };
const colorways = (t: number): Layer[] => {
  const c = [...layout.COLORWAYS].reverse().find((k) => t >= k.at) ?? layout.COLORWAYS[0];
  return [{ name: c.name, bg: c.bg, opacity: 1 }];
};
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const [DISSOLVE_IN, DISSOLVE_OUT] = layout.DISSOLVE;
const WASH_FRAMES = Math.round((DISSOLVE_OUT - DISSOLVE_IN) * layout.FPS) + 1;
type Flower = (typeof layout.flowers)[number];

const Motif: React.FC<{ f: Flower; t: number }> = ({ f, t }) => {
  const { fps } = useVideoConfig();
  const local = (t - f.popAt) * fps;
  if (local < 0) return null;
  // pop: from a dot to ~112% and back, a little spin as it lands
  const s = spring({ frame: local, fps, config: { damping: 9, mass: 0.55, stiffness: 170 } });
  const settle = Math.min(1, local / (fps * 0.7));
  // breeze: each motif sways around its centre at its own phase
  const sway = Math.sin(t * Math.PI * 2 * 0.4 + f.swayPhase) * 2.6 * settle;
  const bob = Math.sin(t * Math.PI * 2 * 0.28 + f.swayPhase * 1.7) * 6 * settle;
  const fadeIn = Math.min(1, local / 2);
  return (
    <>
      {colorways(t).map((c) => (
        <Img
          key={c.name}
          src={staticFile(`intro/flowers/${c.name}/${String(f.motif).padStart(2, '0')}.png`)}
          style={{
            position: 'absolute',
            left: f.x,
            top: f.y + bob,
            height: f.height,
            transform: `translate(-50%, -50%) rotate(${f.rotate + (1 - s) * -28 + sway}deg) scale(${s * (f.flip ? -1 : 1)}, ${s})`,
            opacity: fadeIn * c.opacity,
          }}
        />
      ))}
    </>
  );
};

const Garden: React.FC<{ t: number }> = ({ t }) => (
  <>
    {[...layout.flowers]
      .sort((a, b) => a.z - b.z || a.popAt - b.popAt)
      .map((f) => (
        <Motif key={f.id} f={f} t={t} />
      ))}
  </>
);

const TITLE_W = 860;

// thin tagline typed out above the title before the letters pop; untyped characters keep their space so
// the centred lines never shift, and a thin caret blinks after the last typed one
const Tagline: React.FC<{ t: number }> = ({ t }) => {
  const { fps } = useVideoConfig();
  const typed = Math.floor((t - layout.TAGLINE.at) / layout.TAGLINE.perChar) + 1;
  const total = layout.TAGLINE.text.join('').length;
  const done = typed >= total;
  const caretOn = !done || Math.floor((t * fps) / 12) % 2 === 0;
  let n = 0;
  return (
    <div
      style={{
        fontFamily: taglineFont,
        fontWeight: 200,
        fontSize: 64,
        lineHeight: 1.3,
        letterSpacing: 3,
        textAlign: 'center',
        color: COLORS.ivory,
        whiteSpace: 'pre',
      }}
    >
      {layout.TAGLINE.text.map((line) => (
        <div key={line}>
          {[...line].map((ch, i) => {
            const k = n++;
            const caret = k === Math.min(typed, total) - 1 && caretOn;
            return (
              <span key={i} style={{ position: 'relative', opacity: k < typed ? 1 : 0 }}>
                {ch}
                {caret && (
                  <span
                    style={{
                      position: 'absolute',
                      left: '100%',
                      top: '12%',
                      bottom: '8%',
                      width: 3,
                      marginLeft: 4,
                      backgroundColor: COLORS.ivory,
                    }}
                  />
                )}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const Title: React.FC<{ t: number }> = ({ t }) => {
  const { fps } = useVideoConfig();
  const [OUT_IN, OUT_END] = layout.TITLE_OUT;
  const out = interpolate(t, [OUT_IN, OUT_END], [0, 1], clamp);
  if (out >= 1) return null;
  // exit: letters drift apart and float up while they blur away, like a breath out
  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 1 - out,
        filter: out > 0 ? `blur(${out * 14}px)` : undefined,
        transform: `translateY(${-out * 40}px)`,
        flexDirection: 'column',
        gap: 70,
      }}
    >
      <Tagline t={t} />
      <svg width={TITLE_W} viewBox={`0 0 ${title.width} ${title.height}`} style={{ overflow: 'visible' }}>
        {title.letters.map((d, k) => {
          const l = layout.letters[k];
          const local = (t - l.at) * fps;
          const s = local < 0 ? 0 : spring({ frame: local, fps, config: { damping: 8, mass: 0.5, stiffness: 190 } });
          // letters spread from the centre as they leave
          const spread = (k - (title.letters.length - 1) / 2) * out * 30;
          return (
            <path
              key={k}
              d={d}
              fill={COLORS.ivory}
              style={{
                transformBox: 'fill-box',
                transformOrigin: '50% 100%',
                transform: `translate(${spread}px, ${(1 - s) * 30}px) rotate(${(1 - s) * -14}deg) scale(${s})`,
                opacity: local < 0 ? 0 : Math.min(1, local / 2),
              }}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

// the white logo PNG is used as a mask so it can be painted in the ivory of the color sheet
const LogoPart: React.FC<{ src: string; width: number; aspect: number; at: number; t: number }> = ({
  src,
  width,
  aspect,
  at,
  t,
}) => {
  const p = interpolate(t, [at, at + 0.7], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
  const mask = `url(${staticFile(src)})`;
  return (
    <div
      style={{
        width,
        height: width / aspect,
        backgroundColor: COLORS.ivory,
        WebkitMaskImage: mask,
        maskImage: mask,
        WebkitMaskSize: '100% 100%',
        maskSize: '100% 100%',
        opacity: p,
        transform: `translateY(${(1 - p) * 18}px) scale(${0.96 + p * 0.04})`,
        filter: p < 1 ? `blur(${(1 - p) * 6}px)` : undefined,
      }}
    />
  );
};

const Logo: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 70 }}>
    <LogoPart src="intro/logo_mark.png" width={280} aspect={1038 / 1116} at={layout.LOGO_AT} t={t} />
    <LogoPart src="intro/logo_word.png" width={560} aspect={1400 / 303} at={layout.LOGO_AT + 0.35} t={t} />
  </AbsoluteFill>
);

export const PetalPopIntro: React.FC<{ withAudio: boolean }> = ({ withAudio }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // watercolor wash: a blotchy mask eats the flowers from the centre out while they soften and pale,
  // and a blurred ghost of the garden bleeds into the background like wet paint
  const p = interpolate(t, [DISSOLVE_IN, DISSOLVE_OUT], [0, 1], clamp);
  const washing = t >= DISSOLVE_IN;
  const washFrame = Math.round(p * (WASH_FRAMES - 1));
  const mask = washing ? `url(${staticFile(`intro/wash/${String(washFrame).padStart(2, '0')}.png`)})` : undefined;
  const ghost = interpolate(
    t,
    [DISSOLVE_IN, DISSOLVE_IN + 0.6, DISSOLVE_OUT, DISSOLVE_OUT + 0.5],
    [0, 0.4, 0.22, 0],
    clamp,
  );

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {colorways(t).map((c) => (
        <AbsoluteFill key={c.name} style={{ backgroundColor: c.bg, opacity: c.opacity }} />
      ))}
      {ghost > 0 && (
        <AbsoluteFill style={{ opacity: ghost, filter: `blur(${10 + p * 16}px) saturate(0.6) brightness(1.15)` }}>
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
            filter: washing ? `blur(${p * 3}px) saturate(${1 - p * 0.4}) brightness(${1 + p * 0.1})` : undefined,
          }}
        >
          <Garden t={t} />
        </AbsoluteFill>
      )}
      {layout.border.map((f) => (
        <Motif key={f.id} f={f} t={t} />
      ))}
      {t >= layout.TAGLINE.at && <Title t={t} />}
      {t >= layout.LOGO_AT && <Logo t={t} />}
      {withAudio && <Audio src={staticFile('intro/sfx.wav')} />}
    </AbsoluteFill>
  );
};
