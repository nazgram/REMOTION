import { AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/fonts';
import layout from './layout.json';
// Nas's "Petal Pop" lockup, cut into letters and drawn motifs by scripts/intro_newlogo.py
import newlogo from './newlogo.json';

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

const LOGO_W = 900;
const LOGO_K = LOGO_W / newlogo.width;
type Part = (typeof newlogo.parts)[number];
const part = (name: string) => newlogo.parts.find((p) => p.name === name) as Part;

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

// one layer of the lockup, placed at its spot and moved around its own origin
const Piece: React.FC<{ p: Part; origin: string; transform: string; opacity: number }> = ({ p, origin, transform, opacity }) => (
  <Img
    src={staticFile(`intro/newlogo/${p.name}.png`)}
    style={{
      position: 'absolute',
      left: p.x * LOGO_K,
      top: p.y * LOGO_K,
      width: p.w * LOGO_K,
      height: p.h * LOGO_K,
      transformOrigin: origin,
      transform,
      opacity,
    }}
  />
);

const NewLogo: React.FC<{ t: number; out: number }> = ({ t, out }) => {
  const { fps } = useVideoConfig();
  const M = layout.LOGO_MOTIFS;
  const since = (at: number) => (t - at) * fps;
  const pop = (at: number, config = { damping: 8, mass: 0.5, stiffness: 190 }) =>
    since(at) < 0 ? 0 : spring({ frame: since(at), fps, config });
  const show = (at: number) => (since(at) < 0 ? 0 : Math.min(1, since(at) / 2));

  // flower: spins open from a dot, then keeps turning very slowly
  const fl = pop(M.flower, { damping: 9, mass: 0.6, stiffness: 150 });
  const flSpin = (1 - fl) * -140 + Math.max(0, t - M.flower) * 5;
  // leaf: drifts down from the upper right onto the e, then flutters
  const lf = pop(M.leaf, { damping: 11, mass: 0.7, stiffness: 120 });
  const lfFlutter = Math.sin((t - M.leaf) * Math.PI * 2 * 0.7) * 4 * lf;
  // tulip: the stem grows up from its foot, the bloom opens at the top, then it sways in the breeze
  const tgrow = interpolate(t, [M.tulip, M.tulip + 0.45], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
  const tbloom = pop(M.tulip + 0.3, { damping: 7, mass: 0.5, stiffness: 200 });
  const tsway = Math.sin((t - M.tulip) * Math.PI * 2 * 0.45) * 3.5 * tgrow;
  // heart: bounces in and floats
  const hr = pop(M.heart, { damping: 6, mass: 0.45, stiffness: 220 });
  const hbob = Math.sin((t - M.heart) * Math.PI * 2 * 0.8) * 5 * hr;

  const nLetters = layout.letters.length;
  return (
    <div style={{ position: 'relative', width: LOGO_W, height: newlogo.height * LOGO_K }}>
      <Piece p={part('flower')} origin="50% 50%" transform={`rotate(${flSpin}deg) scale(${fl})`} opacity={show(M.flower)} />
      <Piece
        p={part('tulip')}
        origin="40% 92%"
        transform={`rotate(${tsway}deg) scale(${0.6 + 0.4 * tbloom}, ${tgrow})`}
        opacity={show(M.tulip)}
      />
      <Piece p={part('heart')} origin="50% 50%" transform={`translateY(${hbob}px) scale(${hr})`} opacity={show(M.heart)} />
      {layout.letters.map((l, k) => {
        const s = pop(l.at);
        // letters spread from the centre as they leave
        const spread = (k - (nLetters - 1) / 2) * out * 30;
        return (
          <Piece
            key={l.name}
            p={part(l.name)}
            origin="50% 100%"
            transform={`translate(${spread}px, ${(1 - s) * 30}px) rotate(${(1 - s) * -14}deg) scale(${s})`}
            opacity={show(l.at)}
          />
        );
      })}
      <Piece
        p={part('leaf')}
        origin="20% 90%"
        transform={`translate(${(1 - lf) * 120}px, ${(1 - lf) * -160}px) rotate(${(1 - lf) * 70 + lfFlutter}deg) scale(${0.5 + 0.5 * lf})`}
        opacity={show(M.leaf)}
      />
    </div>
  );
};

const Title: React.FC<{ t: number }> = ({ t }) => {
  const [OUT_IN, OUT_END] = layout.TITLE_OUT;
  const out = interpolate(t, [OUT_IN, OUT_END], [0, 1], clamp);
  if (out >= 1) return null;
  // exit: the logo drifts apart and floats up while it blurs away, like a breath out
  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 1 - out,
        filter: out > 0 ? `blur(${out * 14}px)` : undefined,
        transform: `translateY(${-out * 40}px)`,
        flexDirection: 'column',
        gap: 60,
      }}
    >
      <Tagline t={t} />
      <NewLogo t={t} out={out} />
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
