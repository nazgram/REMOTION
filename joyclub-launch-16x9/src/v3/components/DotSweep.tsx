import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {DesignId} from '../designs';
import {asset, FPS, rand} from '../util';

// Titik benih sweep: kebanyakan di tepi frame, beberapa di dalam. Dot membesar berperingkat dari tepi ke tengah.
const SEEDS = Array.from({length: 46}, (_, i) => {
  const edge = i < 34;
  const side = i % 4;
  const u = rand(i + 1);
  const x = edge ? (side === 0 ? -40 : side === 1 ? 1960 : u * 1920) : 260 + rand(i + 50) * 1400;
  const y = edge ? (side === 2 ? -40 : side === 3 ? 1120 : u * 1080) : 160 + rand(i + 90) * 760;
  const dist = Math.min(x, 1920 - x, y, 1080 - y) / 540; // 0 di tepi
  return {x, y, delay: Math.max(0, dist) * 0.55 + rand(i + 7) * 0.12};
});

const circlePath = (x: number, y: number, r: number) => `M${x - r} ${y} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`;

// mode cover: corak menutup skrin (0->1). mode reveal: corak terbuka dari tengah (1->0), dedahkan layer di bawah.
export const DotSweep: React.FC<{design: DesignId; mode: 'cover' | 'reveal'; dur: number}> = ({design, mode, dur}) => {
  const frame = useCurrentFrame();
  const p0 = Math.min(1, frame / FPS / dur);
  const p = mode === 'cover' ? p0 : 1 - p0;
  const d = SEEDS.map((s) => {
    const k = interpolate(p, [s.delay, s.delay + 0.45], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
    return k > 0 ? circlePath(s.x, s.y, k * 620) : '';
  }).join(' ');
  if (!d.trim()) return null;
  return (
    <AbsoluteFill style={{clipPath: `path('${d}')`}}>
      <AbsoluteFill style={{backgroundImage: `url(${asset(`pattern-${design}.png`)})`, backgroundSize: '1280px 1280px', transform: `scale(${1 + 0.04 * p0})`}} />
    </AbsoluteFill>
  );
};
