// Petal Pop Drop 2 catalog as an "editor moves" reel (9:16). Upgrade of PetalPopDrop1: the move cursor carries every
// page in and drops it onto a pile, the eyedropper picks each scarf and a swatch filled with that scarf's real print
// (Nas's vector, src/teaser1/pattern.json) flies to the palette strip while a few scarf flowers pop around the page.
// Ends: select all -> scaled into the DROP 2 pill, the logo alone, then the NAFESA back cover last.
import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, interpolate, spring, staticFile, useCurrentFrame } from 'remotion';
import { loadFont } from '@remotion/fonts';
import L from './timeline.json';
import P from '../teaser1/pattern.json';
import LG from '../teaser1/logo.json';

const font = 'Montserrat';
loadFont({ family: font, url: staticFile('intro/fonts/Montserrat.ttf'), weight: '100 900' });

const INK = '#042215';
const UI = '#4f8f5a'; // editor overlays in the logo's green
const ACTIVE = '#f8a5cb'; // grabbed handle / pressed ring: the logo's tulip pink
const IVORY = '#fbf5ea';
const { W, H, CARD, PAGE, HEAD, LOGO, CARRY, COVER, CW, PACK, END } = L;
const PS = CARD.w / PAGE.w;

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.45, 0, 0.2, 1);
const lerp = (t: number, a: number, b: number, v0: number, v1: number, e = ease) => interpolate(t, [a, b], [v0, v1], { ...clamp, easing: e });
const pop = (t: number, at: number, damping = 11) =>
  t < at ? 0 : spring({ frame: (t - at) * L.FPS, fps: L.FPS, config: { damping, mass: 0.55, stiffness: 170 } });
const mix = (a: string, b: string, k: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, '0')).join('');
};

// ---------- cursor + editor overlays ----------
type Kind = 'arrow' | 'move' | 'dropper' | 'resize';
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
      {down && <circle r={30} fill="none" stroke={ACTIVE} strokeWidth={5} opacity={0.95} />}
      <g transform={`scale(${s})`} style={{ filter: 'drop-shadow(0 3px 4px rgba(0,0,0,.35))' }}>
        {kind === 'arrow' && <path d="M0 0 L0 22 L6 16.5 L10 25 L13.5 23.5 L9.6 15.2 L17 15.2 Z" fill={INK} {...stroke} />}
        {kind === 'move' && (
          <path d="M0 -14 L5 -8 H2 V-2 H8 V-5 L14 0 L8 5 V2 H2 V8 H5 L0 14 L-5 8 H-2 V2 H-8 V5 L-14 0 L-8 -5 V-2 H-2 V-8 H-5 Z" fill={INK} {...stroke} />
        )}
        {kind === 'resize' && <path d="M-12 -12 H-3 L-6 -9 L9 6 L12 3 V12 H3 L6 9 L-9 -6 L-12 -3 Z" fill={INK} {...stroke} />}
        {kind === 'dropper' && (
          <g transform="rotate(45)">
            <path d="M-2.2 0 L-3 -16 H3 L2.2 0 Z" fill="#fff" stroke={INK} strokeWidth={1.4} />
            <rect x={-5} y={-24} width={10} height={8} rx={2} fill={INK} stroke="#fff" strokeWidth={1.2} />
            <path d="M-1 0 L0 2 L1 0 Z" fill={INK} />
          </g>
        )}
      </g>
    </g>
  );
};
const Tip: React.FC<{ x: number; y: number; text: string; op?: number; anchor?: 'start' | 'end'; swatch?: string }> = ({ x, y, text, op = 1, anchor = 'start', swatch }) => {
  const w = text.length * 15.5 + 28 + (swatch ? 38 : 0);
  const x0 = Math.min(W - 20 - w, Math.max(20, anchor === 'end' ? x - w : x));
  return (
    <g opacity={op}>
      <rect x={x0} y={y - 24} width={w} height={44} rx={10} fill={INK} opacity={0.9} />
      {swatch && <rect x={x0 + 12} y={y - 12} width={24} height={24} rx={6} fill={swatch} stroke="#fff" strokeWidth={2} />}
      <text x={x0 + 14 + (swatch ? 36 : 0)} y={y + 6} fill="#fff" fontFamily={font} fontWeight={600} fontSize={24} letterSpacing={1}>
        {text}
      </text>
    </g>
  );
};
const TransformBox: React.FC<{ cx: number; cy: number; w: number; h: number; op: number; active?: number; label?: string }> = ({ cx, cy, w, h, op, active = -1, label }) => {
  if (op <= 0) return null;
  const pts = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]].map(([a, b]) => [cx + (a * w) / 2, cy + (b * h) / 2]);
  return (
    <g opacity={op}>
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} fill="none" stroke={UI} strokeWidth={2.5} />
      <path d={`M${cx - 12} ${cy} H${cx + 12} M${cx} ${cy - 12} V${cy + 12}`} stroke={UI} strokeWidth={2.5} />
      {pts.map(([x, y], i) => (
        <rect key={i} x={x - 11} y={y - 11} width={22} height={22} rx={3} fill={i === active ? ACTIVE : '#fff'} stroke={UI} strokeWidth={2.5} />
      ))}
      {label && <Tip x={cx + w / 2 + 18} y={cy + h / 2 + 34} text={label} anchor="end" />}
    </g>
  );
};
const Marquee: React.FC<{ x0: number; y0: number; x1: number; y1: number; t: number; op: number; label?: string }> = ({ x0, y0, x1, y1, t, op, label }) => {
  if (op <= 0) return null;
  const x = Math.min(x0, x1), y = Math.min(y0, y1), w = Math.abs(x1 - x0), h = Math.abs(y1 - y0);
  return (
    <g opacity={op}>
      <rect x={x} y={y} width={w} height={h} fill={UI} fillOpacity={0.07} />
      <rect x={x} y={y} width={w} height={h} stroke="#fff" strokeWidth={3} fill="none" />
      <rect x={x} y={y} width={w} height={h} stroke={INK} strokeWidth={3} fill="none" strokeDasharray="14 10" strokeDashoffset={-t * 60} />
      {label && <Tip x={x1 + 16} y={y1 + 36} text={label} anchor="end" />}
    </g>
  );
};

// ---------- scarf print (Nas's vector) ----------
type Unit = { k: string; x: number; y: number; r: number; p: [string, number][] };
type Way = keyof typeof P.palettes;
const UNITS = P.units as unknown as Unit[];
const UnitG: React.FC<{ u: Unit; way: Way }> = ({ u, way }) => (
  <>
    {u.p.map(([d, c], i) => (
      <path key={i} d={d} fill={P.palettes[way].colors[c]} />
    ))}
  </>
);
// a round swatch filled with a patch of the real print
const PATCH = UNITS.filter((u) => Math.abs(u.x - 1620) < 330 && Math.abs(u.y - 1620) < 330);
const PrintSwatch: React.FC<{ way: Way; size: number; id: string }> = ({ way, size, id }) => (
  <svg width={size} height={size} viewBox={`${1620 - 300} ${1620 - 300} 600 600`} style={{ display: 'block' }}>
    <defs>
      <clipPath id={id}>
        <circle cx={1620} cy={1620} r={300} />
      </clipPath>
    </defs>
    <g clipPath={`url(#${id})`}>
      <rect x={1300} y={1300} width={640} height={640} fill={P.palettes[way].bg} />
      {PATCH.map((u, i) => (
        <UnitG key={i} u={u} way={way} />
      ))}
    </g>
  </svg>
);
// a few big scarf flowers that pop around the page when its colour is picked
const FLOWERS = UNITS.filter((u) => u.k === 'f' && u.p.length >= 5);
const SPOTS = [[95, 470], [985, 420], [70, 830], [1010, 900], [110, 1230], [975, 1290], [300, 300], [800, 1380]];

// ---------- logo (Nas's vector) ----------
const Logo: React.FC<{ cx: number; cy: number; w: number; s?: number; op?: number }> = ({ cx, cy, w, s = 1, op = 1 }) => (
  <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, opacity: op }}>
    <g transform={`translate(${cx} ${cy}) scale(${(w / LG.w) * s}) translate(${-LG.w / 2} ${-LG.h / 2})`}>
      {LG.paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.fill} />
      ))}
    </g>
  </svg>
);
const PILL_IN_LOGO = { x: 454.5 - LG.w / 2, y: 615.4 - LG.h / 2 }; // DROP 2 pill centre, relative to the logo centre

// ---------- pages ----------
const Card: React.FC<{ src: string; x: number; y: number; rot: number; s: number; op?: number; shadow?: number }> = ({ src, x, y, rot, s, op = 1, shadow = 1 }) => (
  <div
    style={{
      position: 'absolute', left: x - CARD.w / 2, top: y - CARD.h / 2, width: CARD.w, height: CARD.h, opacity: op, borderRadius: 16, overflow: 'hidden',
      transform: `rotate(${rot}deg) scale(${s})`, boxShadow: `0 ${20 * shadow}px ${50 * shadow}px rgba(30,40,25,${0.28 * shadow})`, background: '#fff',
    }}
  >
    <Img src={staticFile(`drop2/${src}.jpg`)} style={{ width: '100%', height: '100%' }} />
  </div>
);
// carried in by the cursor from the lower right, dropped with a little squash
const carry = (t: number, tin: number, tilt: number) => {
  const k = lerp(t, tin, tin + CARRY, 0, 1, Easing.out(Easing.cubic));
  const land = pop(t, tin + CARRY, 9);
  const squash = t < tin + CARRY ? 1.04 : 1 + 0.04 * (1 - land);
  return { x: interpolate(k, [0, 1], [540 + 860, 540]), y: interpolate(k, [0, 1], [CARD.cy + 320, CARD.cy]), rot: interpolate(k, [0, 1], [14, tilt]), s: squash, k };
};
const GRAB = { dx: 150, dy: -260 }; // where the move cursor holds the page, from its centre
const cardPt = (p: number[]) => [CARD.x + p[0] * PS, CARD.y + p[1] * PS];
const SLOT = (j: number) => ({ x: 540 + (j - 2) * 198, y: 1735 });
const PAGES = [{ page: 'page01', in: COVER.in, tilt: 0 }, ...CW.map((c) => ({ page: c.page, in: c.in, tilt: c.tilt }))];

export const PetalPopDrop2: React.FC<{ withAudio?: boolean }> = ({ withAudio }) => {
  const t = useCurrentFrame() / L.FPS;

  // ---- logo: appears too big, the cursor drags its corner down to size, then it rides up into the header
  const logoIn = pop(t, LOGO.in, 12);
  const dragK = lerp(t, LOGO.grab, LOGO.dragEnd, 0, 1);
  const stageW = 780;
  const stageScale = interpolate(dragK, [0, 1], [LOGO.startScale, 1]);
  const hk = lerp(t, LOGO.toHeader[0], LOGO.toHeader[1], 0, 1);
  const ek = lerp(t, END.toCenter[0], END.toCenter[1], 0, 1);
  const outK = lerp(t, END.logoOut[0], END.logoOut[1], 0, 1, Easing.in(Easing.back(1.6)));
  const headerW = HEAD.w, endW = 760;
  const logoW = stageW * stageScale * interpolate(hk, [0, 1], [1, headerW / stageW]) * interpolate(ek, [0, 1], [1, endW / headerW]);
  const logoCy = interpolate(hk, [0, 1], [860, HEAD.cy]) + interpolate(ek, [0, 1], [0, 900 - HEAD.cy]);
  const AR = LG.h / LG.w;
  const box = { cx: 540, cy: 860, w: stageW * stageScale + 40, h: stageW * stageScale * AR + 40 };
  const boxOp = interpolate(t, [LOGO.in + 0.1, LOGO.in + 0.2, LOGO.release + 0.05, LOGO.release + 0.25], [0, 1, 1, 0], clamp);
  const pulseT = t - PACK.pulse;
  const pulse = pulseT > 0 ? 1 + 0.12 * Math.sin(pulseT * 14) * Math.exp(-pulseT * 6) : 1;
  const pillHead = { x: 540 + PILL_IN_LOGO.x * (headerW / LG.w), y: HEAD.cy + PILL_IN_LOGO.y * (headerW / LG.w) };

  // ---- background: ivory, tinted toward the picked scarf's colour
  const picked = CW.filter((c) => t >= c.click + 0.05);
  const last = picked[picked.length - 1];
  const prev = picked.length > 1 ? picked[picked.length - 2].hex : IVORY;
  const tk = last ? lerp(t, last.click + 0.05, last.click + 0.5, 0, 1) : 0;
  const tintOut = lerp(t, PACK.drag[1], END.toCenter[1], 1, 0);
  const amt = 0.16 * tintOut;
  const bg = last ? mix(mix(IVORY, prev, prev === IVORY ? 0 : amt), mix(IVORY, last.hex, amt), tk) : IVORY;
  const toWhite = lerp(t, END.back - 0.1, END.back + 0.35, 0, 1);

  // ---- pack: the pile turns into a row of thumbnails, select all, scaled into the DROP 2 pill
  const packK = lerp(t, PACK.drag[0], PACK.drag[1], 0, 1, Easing.in(Easing.quad));
  const groupS = interpolate(packK, [0, 1], [1, 0.05]);
  const rowCy = CARD.cy;
  const groupCy = interpolate(packK, [0, 1], [rowCy, pillHead.y]);
  const TW = 186, TH = (TW * PAGE.h) / PAGE.w;
  const rowW = 5 * 196;
  const mq = { x0: 540 - rowW / 2 - 30, y0: rowCy - TH / 2 - 40, x1: 540 + rowW / 2 + 30, y1: rowCy + TH / 2 + 40 };
  const groupBox = { w: (mq.x1 - mq.x0) * groupS, h: (mq.y1 - mq.y0) * groupS };

  // ---- cursor path
  const keys: Key[] = [];
  const bigBox = { w: stageW * LOGO.startScale + 40, h: stageW * LOGO.startScale * AR + 40 };
  const smallBox = { w: stageW + 40, h: stageW * AR + 40 };
  keys.push({ t: 0, x: 1150, y: 1500, hide: true }, { t: LOGO.in + 0.1, x: 1000, y: 1450 });
  keys.push({ t: LOGO.grab - 0.08, x: 540 + bigBox.w / 2, y: 860 + bigBox.h / 2, kind: 'resize' });
  keys.push({ t: LOGO.grab, x: 540 + bigBox.w / 2, y: 860 + bigBox.h / 2, kind: 'resize', down: true });
  keys.push({ t: LOGO.dragEnd, x: 540 + smallBox.w / 2, y: 860 + smallBox.h / 2, kind: 'resize', down: true });
  keys.push({ t: LOGO.release, x: 540 + smallBox.w / 2, y: 860 + smallBox.h / 2, kind: 'arrow' });
  PAGES.forEach((p, i) => {
    const c0 = carry(p.in, p.in, p.tilt), c1 = carry(p.in + CARRY, p.in, p.tilt);
    keys.push({ t: p.in - 0.22, x: c0.x + GRAB.dx, y: c0.y + GRAB.dy, kind: 'move' });
    keys.push({ t: p.in, x: c0.x + GRAB.dx, y: c0.y + GRAB.dy, kind: 'move', down: true });
    keys.push({ t: p.in + CARRY, x: c1.x + GRAB.dx, y: c1.y + GRAB.dy, kind: 'move', down: true });
    keys.push({ t: p.in + CARRY + 0.06, x: c1.x + GRAB.dx + 10, y: c1.y + GRAB.dy + 10, kind: 'arrow' });
    if (i === 0) {
      keys.push({ t: COVER.marquee[0] - 0.14, x: CARD.x - 25, y: CARD.y - 25 });
      keys.push({ t: COVER.marquee[0], x: CARD.x - 25, y: CARD.y - 25, down: true });
      keys.push({ t: COVER.marquee[1], x: CARD.x + CARD.w + 25, y: CARD.y + CARD.h + 25, down: true });
      keys.push({ t: COVER.marquee[1] + 0.06, x: CARD.x + CARD.w + 25, y: CARD.y + CARD.h + 25 });
    } else {
      const c = CW[i - 1];
      const [px, py] = cardPt(c.pick);
      keys.push({ t: c.click - 0.34, x: px + 80, y: py + 90, kind: 'dropper' });
      keys.push({ t: c.click - 0.04, x: px, y: py, kind: 'dropper' });
      keys.push({ t: c.click, x: px, y: py, kind: 'dropper', down: true });
      keys.push({ t: c.click + 0.14, x: px, y: py, kind: 'dropper' });
      keys.push({ t: c.click + 0.6, x: px + 120, y: py + 160, kind: 'arrow' });
    }
  });
  keys.push({ t: PACK.marquee[0] - 0.22, x: mq.x0, y: mq.y0, kind: 'arrow' });
  keys.push({ t: PACK.marquee[0], x: mq.x0, y: mq.y0, down: true });
  keys.push({ t: PACK.marquee[1], x: mq.x1, y: mq.y1, down: true });
  keys.push({ t: PACK.grab - 0.03, x: mq.x1, y: mq.y1, kind: 'resize' });
  keys.push({ t: PACK.grab, x: mq.x1, y: mq.y1, kind: 'resize', down: true });
  keys.push({ t: PACK.drag[1], x: 540 + ((mq.x1 - mq.x0) * 0.05) / 2, y: pillHead.y + ((mq.y1 - mq.y0) * 0.05) / 2, kind: 'resize', down: true });
  keys.push({ t: PACK.drag[1] + 0.1, x: 600, y: 330, kind: 'arrow' });
  keys.push({ t: END.toCenter[0], x: 1150, y: 1300, hide: true });
  const cur = cursorAt(t, keys);
  if (t >= LOGO.grab && t <= LOGO.dragEnd) Object.assign(cur, { x: 540 + box.w / 2, y: 860 + box.h / 2 });
  PAGES.forEach((p) => {
    if (t >= p.in && t <= p.in + CARRY) {
      const c = carry(t, p.in, p.tilt);
      Object.assign(cur, { x: c.x + GRAB.dx, y: c.y + GRAB.dy });
    }
  });
  if (t >= PACK.drag[0] && t <= PACK.drag[1]) Object.assign(cur, { x: 540 + groupBox.w / 2, y: groupCy + groupBox.h / 2 });
  const curOp = interpolate(t, [LOGO.in, LOGO.in + 0.15, END.toCenter[0] - 0.1, END.toCenter[0]], [0, 1, 1, 0], clamp);

  // ---- pile: the newest page on top, the two below it stay visible
  const onPile = PAGES.filter((p) => t >= p.in);
  const pileOut = lerp(t, PACK.fan[0], PACK.fan[0] + 0.35, 1, 0);
  const back = pop(t, END.back, 14);

  return (
    <AbsoluteFill style={{ background: mix(bg, '#ffffff', toWhite), overflow: 'hidden' }}>
      <AbsoluteFill style={{ backgroundImage: `radial-gradient(rgba(79,143,90,.16) 2px, transparent 2.5px)`, backgroundSize: '44px 44px', opacity: 1 - toWhite }} />

      {/* scarf flowers popping around the page on each pick */}
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
        {CW.map((c, ci) => {
          const out = lerp(t, c.click + 1.35, c.click + 1.75, 1, 0);
          if (t < c.click || out <= 0) return null;
          return SPOTS.map(([x, y], j) => {
            const u = FLOWERS[(ci * 13 + j * 7) % FLOWERS.length];
            const k = pop(t, c.click + 0.1 + j * 0.06, 9) * out;
            if (k <= 0.01) return null;
            const s = (58 / u.r) * k;
            const drift = (t - c.click) * 18;
            return (
              <g key={`${ci}-${j}`} transform={`translate(${x} ${y - drift}) rotate(${(j % 2 ? 1 : -1) * (20 + drift)}) scale(${s}) translate(${-u.x} ${-u.y})`}>
                <UnitG u={u} way={c.way as Way} />
              </g>
            );
          });
        })}
      </svg>

      {/* page pile */}
      {pileOut > 0 &&
        onPile.slice(-3).map((p, i, arr) => {
          const c = carry(t, p.in, p.tilt);
          const top = i === arr.length - 1;
          const s = c.s * (top ? 1 : 0.985) * (0.4 + 0.6 * pileOut);
          return <Card key={p.page} src={p.page} x={c.x} y={c.y} rot={c.rot} s={s} op={pileOut} shadow={top ? 1 : 0.5} />;
        })}

      {/* pack row */}
      {t >= PACK.fan[0] && t < PACK.drag[1] + 0.02 && (
        <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: `540px ${rowCy}px`, transform: `translateY(${groupCy - rowCy}px) scale(${groupS})` }}>
          {CW.map((c, j) => {
            const a = pop(t, PACK.fan[0] + 0.08 + j * 0.07, 12);
            return (
              <div key={c.name} style={{ position: 'absolute', left: 540 + (j - 2) * 196 - TW / 2, top: rowCy - TH / 2, width: TW, height: TH, borderRadius: 10, overflow: 'hidden',
                transform: `scale(${a}) rotate(${(j - 2) * 1.5}deg)`, boxShadow: '0 10px 24px rgba(30,40,25,.25)' }}>
                <Img src={staticFile(`drop2/${c.page}.jpg`)} style={{ width: '100%', height: '100%' }} />
              </div>
            );
          })}
        </div>
      )}

      {/* palette strip: one real-print swatch per picked colourway */}
      {CW.map((c, j) => {
        if (t < c.click + 0.02) return null;
        const fly = lerp(t, c.click + 0.05, c.click + 0.55, 0, 1);
        const [px, py] = cardPt(c.pick);
        const sl = SLOT(j);
        const x = interpolate(fly, [0, 1], [px, sl.x]), y = interpolate(fly, [0, 1], [py, sl.y]) - Math.sin(fly * Math.PI) * 160;
        const land = pop(t, c.click + 0.55, 9);
        const s = fly < 1 ? interpolate(fly, [0, 0.15, 1], [0.2, 1.25, 0.85]) : 0.85 + 0.15 * land;
        const out = lerp(t, END.toCenter[0], END.toCenter[1], 1, 0);
        const chars = Math.floor(lerp(t, c.click + 0.55, c.click + 0.95, 0, c.name.length, Easing.linear));
        return (
          <div key={c.name} style={{ position: 'absolute', left: x - 60, top: y - 60, width: 120, opacity: out, transform: `scale(${s * (0.6 + 0.4 * out)})` }}>
            <div style={{ width: 120, height: 120, borderRadius: 60, border: '6px solid #fff', boxSizing: 'border-box', overflow: 'hidden', boxShadow: '0 8px 18px rgba(0,0,0,.25)', background: c.hex }}>
              <PrintSwatch way={c.way as Way} size={108} id={`sw${j}`} />
            </div>
            <div style={{ marginTop: 10, marginLeft: -40, width: 200, textAlign: 'center', fontFamily: font, fontWeight: 700, fontSize: 18, letterSpacing: 1.5, color: INK, whiteSpace: 'nowrap' }}>
              {c.name.toUpperCase().slice(0, chars)}
            </div>
          </div>
        );
      })}

      {/* Petal Pop Drop 2 logo */}
      {t >= LOGO.in && outK < 1 && <Logo cx={540} cy={logoCy} w={logoW} s={logoIn * (1 - outK) * (t > PACK.pulse && ek === 0 ? pulse : 1)} />}

      {/* NAFESA back cover last */}
      {t >= END.back && (
        <div style={{ position: 'absolute', left: 0, top: 900 - 0.458 * 1532, width: W, height: 1532, opacity: Math.min(1, back * 1.4), transform: `scale(${1.06 - 0.06 * back})` }}>
          <Img src={staticFile('drop2/page13.jpg')} style={{ width: '100%', height: '100%' }} />
        </div>
      )}

      {/* editor overlays */}
      <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <TransformBox cx={box.cx} cy={box.cy} w={box.w} h={box.h} op={boxOp} active={t >= LOGO.grab && t < LOGO.release ? 4 : -1}
          label={t >= LOGO.grab - 0.1 ? `W ${Math.round(box.w - 40)}  H ${Math.round(box.h - 40)}  ${Math.round(stageScale * 100)}%` : undefined} />
        {PAGES.map((p, i) => {
          const op = interpolate(t, [p.in, p.in + 0.05, p.in + CARRY, p.in + CARRY + 0.15], [0, 1, 1, 0], clamp);
          if (op <= 0) return null;
          const c = carry(t, p.in, p.tilt);
          return (
            <g key={p.page} opacity={op} transform={`translate(${c.x} ${c.y}) rotate(${c.rot}) translate(${-c.x} ${-c.y})`}>
              <rect x={c.x - CARD.w / 2 - 6} y={c.y - CARD.h / 2 - 6} width={CARD.w + 12} height={CARD.h + 12} fill="none" stroke={UI} strokeWidth={3} />
              {i > 0 && <Tip x={c.x - CARD.w / 2} y={c.y - CARD.h / 2 - 40} text={`LAYER ${i + 1} · ${CW[i - 1].name.toUpperCase()}`} />}
            </g>
          );
        })}
        <Marquee x0={CARD.x - 25} y0={CARD.y - 25}
          x1={lerp(t, COVER.marquee[0], COVER.marquee[1], CARD.x - 25, CARD.x + CARD.w + 25)} y1={lerp(t, COVER.marquee[0], COVER.marquee[1], CARD.y - 25, CARD.y + CARD.h + 25)}
          t={t} op={interpolate(t, [COVER.marquee[0], COVER.marquee[0] + 0.02, COVER.end - 0.1, COVER.end], [0, 1, 1, 0], clamp)}
          label={t > COVER.marquee[1] ? 'COVER · DROP 2' : undefined} />
        {CW.map((c) => {
          const [px, py] = cardPt(c.pick);
          const op = interpolate(t, [c.click, c.click + 0.05, c.click + 0.7, c.click + 0.85], [0, 1, 1, 0], clamp);
          return op > 0 ? <Tip key={c.name} x={px + 40} y={py - 64} text={c.hex} op={op} swatch={c.hex} /> : null;
        })}
        <Marquee x0={mq.x0} y0={mq.y0} x1={lerp(t, PACK.marquee[0], PACK.marquee[1], mq.x0, mq.x1)} y1={lerp(t, PACK.marquee[0], PACK.marquee[1], mq.y0, mq.y1)}
          t={t} op={interpolate(t, [PACK.marquee[0], PACK.marquee[0] + 0.02, PACK.grab, PACK.grab + 0.05], [0, 1, 1, 0], clamp)} label={t > PACK.marquee[1] ? 'SELECT ALL · 5' : undefined} />
        <TransformBox cx={540} cy={groupCy} w={groupBox.w} h={groupBox.h} active={4}
          op={interpolate(t, [PACK.grab, PACK.grab + 0.03, PACK.drag[1], PACK.drag[1] + 0.1], [0, 1, 1, 0], clamp)}
          label={t < PACK.drag[1] ? `SCALE ${Math.round(groupS * 100)}%` : undefined} />
        {!cur.hide && <g opacity={curOp}><Cursor x={cur.x} y={cur.y} kind={cur.kind} down={cur.down} /></g>}
      </svg>

      {withAudio && <Audio src={staticFile('drop2/sfx.wav')} />}
    </AbsoluteFill>
  );
};
