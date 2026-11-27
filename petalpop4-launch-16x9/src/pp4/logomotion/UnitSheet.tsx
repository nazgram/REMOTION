import React from 'react';
import {AbsoluteFill} from 'remotion';
import {colorsOf, UNITS} from '../designs';
import {UnitG} from '../components/Bloom';
// Alat dev: grid calon bunga dengan indeks (untuk pilih bunga logo motion).
export const CANDS = UNITS.map((u, i) => ({u, i})).filter(({u}) => u.r >= 45 && u.r <= 120 && u.p.length >= 6);
export const UnitSheet: React.FC<{page: number}> = ({page}) => {
  const list = CANDS.slice(page * 60, page * 60 + 60);
  return (
    <AbsoluteFill style={{background: '#efe6e1'}}>
      <svg width={1080} height={1920}>
        {list.map(({u, i}, k) => {
          const cx = (k % 6) * 180 + 90, cy = Math.floor(k / 6) * 190 + 100;
          return (
            <g key={i}>
              <g transform={`translate(${cx} ${cy}) scale(${80 / u.r}) translate(${-u.x} ${-u.y})`}><UnitG u={u} colors={colorsOf('dusty')} k={1} /></g>
              <text x={cx - 85} y={cy - 75} fontSize={22} fill="#000">{i}</text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
