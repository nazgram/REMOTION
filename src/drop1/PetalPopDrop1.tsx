import { AbsoluteFill, Audio, Easing, Img, interpolate, spring, staticFile, useCurrentFrame } from 'remotion';
import { loadFont } from '@remotion/fonts';
import L from './timeline.json';

// Petal Pop Drop 1 catalog (Nas's PetalPop_Drop1_PNG pages) cut as an "editor moves" reel: the pages are visibly
// edited by a cursor (free transform, marquee, eyedropper) in the Petal Pop palette instead of the blueprint look.

const font = 'Montserrat';
loadFont({ family: font, url: staticFile('intro/fonts/Montserrat.ttf'), weight: '100 900' });

const C = { berry: '#971D59', blush: '#F2A3BC', peach: '#FFC7B8', leaf: '#B3AE64', lavender: '#ADB4D6', ivory: '#F8EAD9', ink: '#2B1A22' };
const UI = C.berry; // editor overlays (transform box, ants, tooltips)
const ACTIVE = '#FF8A6B'; // grabbed handle / pressed ring

const { W, H, CARD, PAGE, LOGO, COVER, CW, PACK, END } = L;
const PS = CARD.w / PAGE.w; // page px -> screen px

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.45, 0, 0.2, 1);
const lerp = (t: number, a: number, b: number, v0: number, v1: number, e = ease) =>
  interpolate(t, [a, b], [v0, v1], { ...clamp, easing: e });
const pop = (t: number, at: number, damping = 11) =>
  t < at ? 0 : spring({ frame: (t - at) * L.FPS, fps: L.FPS, config: { damping, mass: 0.55, stiffness: 170 } });
const mix = (a: string, b: string, k: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(',')})`;
};

// ---------- cursor ----------
type Kind = 'arrow' | 'move' | 'dropper' | 'zoom' | 'resize';
type Key = { t: number; x: number; y: number; kind?: Kind; down?: boolean; hide?: boolean };
const cursorAt = (t: number, keys: Key[]) => {
  let i = keys.findIndex((k) => k.t > t);
  if (i === -1) i = keys.length;
  const a = keys[Math.max(0, i - 1)], b = keys[Math.min(keys.length - 1, i)];
  const k = b.t === a.t ? 1 : ease(Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t))));
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, kind: a.kind ?? 'arrow', down: !!a.down, hide: !!a.hide };
};
const Cursor: React.FC<{ x: number; y: number; kind: Kind; down: boolean }> = ({ x, y, kind, down }) => {
  const s = down ? 1.55 : 1.75;
  const stroke = { stroke: '#fff', strokeWidth: 1.6, strokeLinejoin: 'round' as const };
  return (
    <g transform={`translate(${x} ${y})`}>
      {down && <circle r={30} fill="none" stroke={ACTIVE} strokeWidth={5} opacity={0.9} />}
      <g transform={`scale(${s})`} style={{ filter: 'drop-shadow(0 3px 4px rgba(0,0,0,.35))' }}>
        {kind === 'arrow' && <path d="M0 0 L0 22 L6 16.5 L10 25 L13.5 23.5 L9.6 15.2 L17 15.2 Z" fill={C.ink} {...stroke} />}
        {kind === 'move' && (
          <path d="M0 -14 L5 -8 H2 V-2 H8 V-5 L14 0 L8 5 V2 H2 V8 H5 L0 14 L-5 8 H-2 V2 H-8 V5 L-14 0 L-8 -5 V-2 H-2 V-8 H-5 Z" fill={C.ink} {...stroke} />
        )}
        {kind === 'resize' && <path d="M-12 -12 H-3 L-6 -9 L9 6 L12 3 V12 H3 L6 9 L-9 -6 L-12 -3 Z" fill={C.ink} {...stroke} />}
        {kind === 'dropper' && (
          <g transform="rotate(45)">
            <path d="M-2.2 0 L-3 -16 H3 L2.2 0 Z" fill="#fff" stroke={C.ink} strokeWidth={1.4} />
            <rect x={-5} y={-24} width={10} height={8} rx={2} fill={C.ink} stroke="#fff" strokeWidth={1.2} />
            <path d="M-1 0 L0 2 L1 0 Z" fill={C.ink} />
          </g>
        )}
        {kind === 'zoom' && (
          <g transform="translate(-7 -7)">
            <circle r={7.5} fill="rgba(255,255,255,.85)" stroke={C.ink} strokeWidth={2.6} />
            <path d="M-3.5 0 H3.5 M0 -3.5 V3.5" stroke={C.ink} strokeWidth={2} />
            <path d="M5.5 5.5 L12 12" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
          </g>
        )}
      </g>
    </g>
  );
};

// ---------- editor overlays ----------
const TransformBox: React.FC<{ cx: number; cy: number; w: number; h: number; op: number; active?: number; label?: string }> = ({
  cx, cy, w, h, op, active = -1, label,
}) => {
  if (op <= 0) return null;
  const pts = [
    [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0],
  ].map(([a, b]) => [cx + (a * w) / 2, cy + (b * h) / 2]);
  return (
    <g opacity={op}>
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} fill="none" stroke={UI} strokeWidth={2.5} />
      <path d={`M${cx - 12} ${cy} H${cx + 12} M${cx} ${cy - 12} V${cy + 12}`} stroke={UI} strokeWidth={2.5} />
      {pts.map(([x, y], i) => (
        <rect key={i} x={x - 11} y={y - 11} width={22} height={22} fill={i === active ? ACTIVE : '#fff'} stroke={UI} strokeWidth={2.5} />
      ))}
      {label && <Tip x={cx + w / 2 + 18} y={cy + h / 2 + 30} text={label} />}
    </g>
  );
};
const Tip: React.FC<{ x: number; y: number; text: string; op?: number; anchor?: 'start' | 'end' }> = ({ x, y, text, op = 1, anchor = 'start' }) => {
  const w = text.length * 15.5 + 28;
  const x0 = Math.min(W - 20 - w, Math.max(20, anchor === 'end' ? x - w : x));
  return (
    <g opacity={op}>
      <rect x={x0} y={y - 24} width={w} height={44} rx={10} fill={C.ink} opacity={0.88} />
      <text x={x0 + 14} y={y + 6} fill="#fff" fontFamily={font} fontWeight={600} fontSize={24} letterSpacing={1}>
        {text}
      </text>
    </g>
  );
};
const Marquee: React.FC<{ x0: number; y0: number; x1: number; y1: number; t: number; op: number; label?: string }> = ({ x0, y0, x1, y1, t, op, label }) => {
  if (op <= 0) return null;
  const x = Math.min(x0, x1), y = Math.min(y0, y1), w = Math.abs(x1 - x0), h = Math.abs(y1 - y0);
  const dash = { strokeDasharray: '14 10', strokeDashoffset: -t * 60, strokeWidth: 3, fill: 'none' };
  return (
    <g opacity={op}>
      <rect x={x} y={y} width={w} height={h} fill={UI} fillOpacity={0.06} />
      <rect x={x} y={y} width={w} height={h} stroke="#fff" {...dash} strokeDasharray="0" />
      <rect x={x} y={y} width={w} height={h} stroke={C.ink} {...dash} />
      {label && <Tip x={x1 + 16} y={y1 + 34} text={label} anchor="end" />}
    </g>
  );
};

// ---------- pieces ----------
// header lockup while the pages play (kept small; everything sits inside the top 1521 px)
const HEAD = { w: 280, cy: 150, pill: 262, pillS: 0.5 };
const LOGO_W0 = 880; // centre stage logo width; header logo is narrower
const LOGO_AR = 325 / 555;
const PILL = (t: number) => {
  // centre-stage pill under the big logo, rides up with the logo to the header
  const k = lerp(t, LOGO.toHeader[0], LOGO.toHeader[1], 0, 1);
  return { x: 540, y: interpolate(k, [0, 1], [1215, HEAD.pill]), s: interpolate(k, [0, 1], [1, HEAD.pillS]) };
};
const Pill: React.FC<{ x: number; y: number; s: number; op?: number }> = ({ x, y, s, op = 1 }) => (
  <div
    style={{
      position: 'absolute', left: x - 170, top: y - 38, width: 340, height: 76, borderRadius: 38, background: '#F79A7E',
      transform: `scale(${s})`, opacity: op, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: font, fontWeight: 700, fontSize: 40, letterSpacing: 3, color: '#fff', boxShadow: '0 6px 18px rgba(151,29,89,.18)',
    }}
  >
    DROP 1
  </div>
);
const Card: React.FC<{ src: string; dx: number; rot: number; s: number; op?: number; zoom?: { k: number; x: number; y: number } }> = ({
  src, dx, rot, s, op = 1, zoom,
}) => (
  <div
    style={{
      position: 'absolute', left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, opacity: op, borderRadius: 18, overflow: 'hidden',
      transform: `translateX(${dx}px) rotate(${rot}deg) scale(${s})`, boxShadow: '0 24px 60px rgba(60,20,40,.28)', background: '#fff',
    }}
  >
    <Img
      src={staticFile(`drop1/${src}.png`)}
      style={{
        width: '100%', height: '100%',
        transformOrigin: zoom ? `${zoom.x}px ${zoom.y}px` : 'center', transform: zoom ? `scale(${zoom.k})` : undefined,
      }}
    />
  </div>
);
// card slide: in from the right with a little spin, out to the left
const slide = (t: number, tin: number, tout: number) => {
  const a = pop(t, tin, 15), b = lerp(t, tout, tout + 0.35, 0, 1, Easing.in(Easing.cubic));
  return { dx: (1 - a) * 1150 - b * 1250, rot: (1 - a) * 9 - b * 7, vis: t >= tin && t < tout + 0.36 };
};
const cardPt = (p: number[]) => [CARD.x + p[0] * PS, CARD.y + p[1] * PS];
const SLOT = (j: number) => ({ x: 540 + (j - 2) * 182, y: 1420 });

export const PetalPopDrop1: React.FC<{ withAudio?: boolean }> = ({ withAudio }) => {
  const t = useCurrentFrame() / L.FPS;

  // ---- logo: appears too big, cursor drags the corner (alt = from centre) down to size, then it moves to the header
  const logoIn = pop(t, LOGO.in, 12);
  const dragK = lerp(t, LOGO.grab, LOGO.dragEnd, 0, 1);
  const stageScale = interpolate(dragK, [0, 1], [LOGO.startScale, 1]);
  const hk = lerp(t, LOGO.toHeader[0], LOGO.toHeader[1], 0, 1);
  const ek = lerp(t, END.toCenter[0], END.toCenter[1], 0, 1);
  const outK = lerp(t, END.logoOut[0], END.logoOut[1], 0, 1, Easing.in(Easing.back(1.6)));
  const logoW = LOGO_W0 * stageScale * interpolate(hk, [0, 1], [1, HEAD.w / LOGO_W0]) * interpolate(ek, [0, 1], [1, 860 / HEAD.w]);
  const logoCy = interpolate(hk, [0, 1], [830, HEAD.cy]) + interpolate(ek, [0, 1], [0, 760 - HEAD.cy]);
  const logoH = logoW * LOGO_AR;
  const box = { cx: 540, cy: 830, w: LOGO_W0 * stageScale + 40, h: LOGO_W0 * stageScale * LOGO_AR + 40 };
  const boxOp = interpolate(t, [LOGO.in + 0.1, LOGO.in + 0.2, LOGO.release + 0.05, LOGO.release + 0.25], [0, 1, 1, 0], clamp);
  const pill = PILL(t);
  const pillPulse = 1 + 0.25 * Math.sin(Math.max(0, t - PACK.pulse) * 14) * Math.exp(-Math.max(0, t - PACK.pulse) * 6) * (t > PACK.pulse ? 1 : 0);
  const pillY = pill.y + interpolate(ek, [0, 1], [0, 1080 - HEAD.pill]);
  const pillS = pill.s * pillPulse * interpolate(ek, [0, 1], [1, 1 / HEAD.pillS]);

  // ---- current colorway (for the background tint)
  const picked = CW.filter((c) => t >= c.click + 0.05);
  const last = picked[picked.length - 1];
  const tintK = last ? lerp(t, last.click + 0.05, last.click + 0.45, 0, 1) : 0;
  const prevTint = picked.length > 1 ? picked[picked.length - 2].hex : C.ivory;
  const tintOut = lerp(t, PACK.drag[1], END.toCenter[1], 1, 0);
  const tint = last ? mix(C.ivory, last.hex, (interpolate(tintK, [0, 1], [prevTint === C.ivory ? 0 : 0.14, 0.14])) * tintOut) : C.ivory;

  // ---- pack: thumbnails pop into a row, get marquee-selected, then the cursor scales them all into the DROP 1 pill
  const packK = lerp(t, PACK.drag[0], PACK.drag[1], 0, 1, Easing.in(Easing.quad));
  const groupS = interpolate(packK, [0, 1], [1, 0.06]);
  const groupCy = interpolate(packK, [0, 1], [CARD.y + CARD.h / 2, HEAD.pill]);
  const thumbs = CW.map((c, j) => {
    const a = pop(t, PACK.fan[0] + 0.05 + j * 0.05, 12);
    return { c, x: 540 + (j - 2) * 196, s: a };
  });
  const rowW = 5 * 196, rowH = (182 * PAGE.h) / PAGE.w;

  // ---- cursor path
  const keys: Key[] = [];
  const handle0 = { x: 540 + box.w / 2, y: 830 + box.h / 2 };
  const bigBox = { w: LOGO_W0 * LOGO.startScale + 40, h: LOGO_W0 * LOGO.startScale * LOGO_AR + 40 };
  const smallBox = { w: LOGO_W0 + 40, h: LOGO_W0 * LOGO_AR + 40 };
  keys.push({ t: 0, x: 1150, y: 1500, hide: true }, { t: LOGO.in + 0.1, x: 1000, y: 1500 });
  keys.push({ t: LOGO.grab - 0.08, x: 540 + bigBox.w / 2, y: 830 + bigBox.h / 2, kind: 'resize' });
  keys.push({ t: LOGO.grab, x: 540 + bigBox.w / 2, y: 830 + bigBox.h / 2, kind: 'resize', down: true });
  keys.push({ t: LOGO.dragEnd, x: 540 + smallBox.w / 2, y: 830 + smallBox.h / 2, kind: 'resize', down: true });
  keys.push({ t: LOGO.release, x: 540 + smallBox.w / 2, y: 830 + smallBox.h / 2, kind: 'arrow' });
  keys.push({ t: COVER.marquee[0] - 0.12, x: CARD.x - 25, y: CARD.y - 25 });
  keys.push({ t: COVER.marquee[0], x: CARD.x - 25, y: CARD.y - 25, down: true });
  keys.push({ t: COVER.marquee[1], x: CARD.x + CARD.w + 25, y: CARD.y + CARD.h + 25, down: true });
  keys.push({ t: COVER.marquee[1] + 0.06, x: CARD.x + CARD.w + 25, y: CARD.y + CARD.h + 25 });
  CW.forEach((c) => {
    const [px, py] = cardPt(c.pick);
    keys.push({ t: c.click - 0.32, x: px + 70, y: py + 90, kind: 'dropper' });
    keys.push({ t: c.click - 0.04, x: px, y: py, kind: 'dropper' });
    keys.push({ t: c.click, x: px, y: py, kind: 'dropper', down: true });
    keys.push({ t: c.click + 0.12, x: px, y: py, kind: 'dropper' });
  });
  const mq = { x0: 540 - rowW / 2 - 30, y0: CARD.y + CARD.h / 2 - rowH / 2 - 40, x1: 540 + rowW / 2 + 30, y1: CARD.y + CARD.h / 2 + rowH / 2 + 40 };
  keys.push({ t: PACK.marquee[0] - 0.2, x: mq.x0, y: mq.y0, kind: 'arrow' });
  keys.push({ t: PACK.marquee[0], x: mq.x0, y: mq.y0, down: true });
  keys.push({ t: PACK.marquee[1], x: mq.x1, y: mq.y1, down: true });
  keys.push({ t: PACK.grab - 0.03, x: mq.x1, y: mq.y1, kind: 'resize' });
  keys.push({ t: PACK.grab, x: mq.x1, y: mq.y1, kind: 'resize', down: true });
  const g1 = { w: (mq.x1 - mq.x0) * 0.06, h: (mq.y1 - mq.y0) * 0.06 };
  keys.push({ t: PACK.drag[1], x: 540 + g1.w / 2, y: HEAD.pill + g1.h / 2, kind: 'resize', down: true });
  keys.push({ t: PACK.drag[1] + 0.08, x: 540 + g1.w / 2 + 6, y: HEAD.pill + g1.h / 2 + 6, kind: 'arrow' });
  keys.push({ t: END.toCenter[0], x: 1150, y: 1300, hide: true });
  const cur = cursorAt(t, keys);
  // cursor follows the grabbed handle exactly while dragging the logo / the pack group
  if (t >= LOGO.grab && t <= LOGO.dragEnd) Object.assign(cur, { x: 540 + box.w / 2, y: 830 + box.h / 2 });
  const groupBox = { w: (mq.x1 - mq.x0) * groupS, h: (mq.y1 - mq.y0) * groupS };
  if (t >= PACK.drag[0] && t <= PACK.drag[1]) Object.assign(cur, { x: 540 + groupBox.w / 2, y: groupCy + groupBox.h / 2 });
  const curOp = interpolate(t, [LOGO.in, LOGO.in + 0.15, END.toCenter[0] - 0.1, END.toCenter[0]], [0, 1, 1, 0], clamp);

  const nafesa = pop(t, END.nafesa, 14);

  return (
    <AbsoluteFill style={{ background: tint, overflow: 'hidden' }}>
      {/* soft paper dots */}
      <AbsoluteFill style={{ backgroundImage: `radial-gradient(${mix(C.berry, C.ivory, 0.88)} 2px, transparent 2.5px)`, backgroundSize: '44px 44px', opacity: 0.6 }} />

      {/* cover */}
      {(() => {
        const s = slide(t, COVER.in, COVER.out);
        return s.vis ? <Card src="page01" dx={s.dx} rot={s.rot} s={1} /> : null;
      })()}

      {/* colorway pages */}
      {CW.map((c, i) => {
        const tout = i === CW.length - 1 ? 1e9 : c.out;
        const s = slide(t, c.in, tout);
        if (!s.vis || t >= PACK.fan[0] + 0.3) return null;
        // last page shrinks into its thumbnail slot as the row pops in
        const shrink = i === CW.length - 1 ? lerp(t, PACK.fan[0], PACK.fan[0] + 0.3, 1, 0) : 1;
        return <Card key={c.name} src={c.page} dx={s.dx} rot={s.rot} s={shrink} op={shrink < 1 ? shrink : 1} />;
      })}

      {/* pack row */}
      {t >= PACK.fan[0] && t < PACK.drag[1] + 0.02 && (
        <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: `540px ${CARD.y + CARD.h / 2}px`,
          transform: `translateY(${groupCy - (CARD.y + CARD.h / 2)}px) scale(${groupS})` }}>
          {thumbs.map(({ c, x, s }) => (
            <div key={c.name} style={{ position: 'absolute', left: x - 91, top: CARD.y + CARD.h / 2 - rowH / 2, width: 182, height: rowH, borderRadius: 10, overflow: 'hidden',
              transform: `scale(${s})`, boxShadow: '0 10px 24px rgba(60,20,40,.25)' }}>
              <Img src={staticFile(`drop1/${c.page}.png`)} style={{ width: '100%', height: '100%' }} />
            </div>
          ))}
        </div>
      )}

      {/* palette strip: one swatch per picked colorway */}
      {CW.map((c, j) => {
        const fly = lerp(t, c.click + 0.05, c.click + 0.45, 0, 1);
        if (t < c.click + 0.02) return null;
        const [px, py] = cardPt(c.pick);
        const sl = SLOT(j);
        const x = interpolate(fly, [0, 1], [px, sl.x]), y = interpolate(fly, [0, 1], [py, sl.y]) - Math.sin(fly * Math.PI) * 140;
        const land = pop(t, c.click + 0.45, 9);
        const s = fly < 1 ? interpolate(fly, [0, 0.15, 1], [0.2, 1.2, 0.85]) : 0.85 + 0.15 * land;
        const out = lerp(t, END.toCenter[0], END.toCenter[1], 1, 0);
        return (
          <div key={c.name} style={{ position: 'absolute', left: x - 50, top: y - 50, width: 100, opacity: out, transform: `scale(${s * (0.6 + 0.4 * out)})` }}>
            <div style={{ width: 100, height: 100, borderRadius: 50, background: c.hex, border: '6px solid #fff', boxSizing: 'border-box', boxShadow: '0 6px 16px rgba(0,0,0,.25)' }} />
            <div style={{ marginTop: 8, marginLeft: -30, width: 160, textAlign: 'center', fontFamily: font, fontWeight: 600, fontSize: 19, letterSpacing: 1.5, color: C.ink,
              opacity: lerp(t, c.click + 0.45, c.click + 0.7, 0, 1) }}>
              {c.name.toUpperCase()}
            </div>
          </div>
        );
      })}

      {/* Petal Pop logo + DROP 1 pill */}
      {t >= LOGO.in && outK < 1 && (
        <Img src={staticFile('drop1/logo.png')} style={{ position: 'absolute', left: 540 - logoW / 2, top: logoCy - logoH / 2, width: logoW, height: logoH, transform: `scale(${logoIn * (1 - outK)})` }} />
      )}
      {t >= LOGO.pill && outK < 1 && <Pill x={pill.x} y={pillY} s={pillS * pop(t, LOGO.pill, 9) * (1 - outK)} />}

      {/* NAFESA last, on its own */}
      {t >= END.nafesa && (
        <Img src={staticFile('drop1/nafesa.png')} style={{ position: 'absolute', left: 540 - 250, top: 960 - (500 * 262) / 315 / 2, width: 500, height: (500 * 262) / 315,
          opacity: Math.min(1, nafesa), transform: `scale(${0.7 + 0.3 * nafesa})` }} />
      )}

      {/* editor overlay layer */}
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <TransformBox cx={box.cx} cy={box.cy} w={box.w} h={box.h} op={boxOp} active={t >= LOGO.grab && t < LOGO.release ? 4 : -1}
          label={t >= LOGO.grab - 0.1 ? `W ${Math.round(box.w - 40)}  H ${Math.round(box.h - 40)}  ${Math.round(stageScale * 100)}%` : undefined} />
        <Marquee x0={CARD.x - 25} y0={CARD.y - 25}
          x1={lerp(t, COVER.marquee[0], COVER.marquee[1], CARD.x - 25, CARD.x + CARD.w + 25)} y1={lerp(t, COVER.marquee[0], COVER.marquee[1], CARD.y - 25, CARD.y + CARD.h + 25)}
          t={t} op={interpolate(t, [COVER.marquee[0], COVER.marquee[0] + 0.02, COVER.out - 0.1, COVER.out], [0, 1, 1, 0], clamp)}
          label={t > COVER.marquee[1] ? 'COVER · DROP 1' : undefined} />
        {CW.map((c) => {
          const [px, py] = cardPt(c.pick);
          const op = interpolate(t, [c.click, c.click + 0.05, c.click + 0.5, c.click + 0.65], [0, 1, 1, 0], clamp);
          return op > 0 ? <Tip key={c.name} x={px + 40} y={py - 60} text={c.hex} op={op} /> : null;
        })}
        <Marquee x0={mq.x0} y0={mq.y0} x1={lerp(t, PACK.marquee[0], PACK.marquee[1], mq.x0, mq.x1)} y1={lerp(t, PACK.marquee[0], PACK.marquee[1], mq.y0, mq.y1)}
          t={t} op={interpolate(t, [PACK.marquee[0], PACK.marquee[0] + 0.02, PACK.grab, PACK.grab + 0.05], [0, 1, 1, 0], clamp)} label={t > PACK.marquee[1] ? 'SELECT ALL · 5' : undefined} />
        <TransformBox cx={540} cy={groupCy} w={groupBox.w} h={groupBox.h} active={4}
          op={interpolate(t, [PACK.grab, PACK.grab + 0.03, PACK.drag[1], PACK.drag[1] + 0.1], [0, 1, 1, 0], clamp)}
          label={t < PACK.drag[1] ? `SCALE ${Math.round(groupS * 100)}%` : undefined} />
        {!cur.hide && <g opacity={curOp}><Cursor x={cur.x} y={cur.y} kind={cur.kind} down={cur.down} /></g>}
      </svg>

      {withAudio && <Audio src={staticFile('drop1/sfx.wav')} />}
    </AbsoluteFill>
  );
};
