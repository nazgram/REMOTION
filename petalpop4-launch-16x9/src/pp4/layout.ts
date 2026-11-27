// Bentuk panel penuh skrin (garis putih 4px), dari Joy Club v3. Bucu poligon ikut susunan TL, TR, BR, BL.
export const W = 1920;
export const H = 1080;
export type Pt = [number, number];
export type ShapePanel = {poly: Pt[]; box: {x: number; y: number; w: number; h: number}};
import type {ShapeId} from './shots';

const rect = (x0: number, x1: number): Pt[] => [[x0, 0], [x1, 0], [x1, H], [x0, H]];
const bbox = (poly: Pt[]) => {
  const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
  const x = Math.min(...xs), y = Math.min(...ys);
  return {x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y};
};
const auto = (polys: Pt[][]): ShapePanel[] => polys.map((poly) => ({poly, box: bbox(poly)}));

export const SHAPES: Record<ShapeId, ShapePanel[]> = {
  A: auto([rect(0, 638), rect(642, 1278), rect(1282, W)]),
  B: auto([rect(0, 478), rect(482, 1438), rect(1442, W)]),
  C: auto([
    [[0, 0], [760, 0], [560, H], [0, H]],
    [[764, 0], [1356, 0], [1156, H], [564, H]],
    [[1360, 0], [W, 0], [W, H], [1160, H]],
  ]),
  H: auto([
    [[0, 0], [760, 0], [540, H], [0, H]],
    [[764, 0], [1156, 0], [1380, H], [544, H]],
    [[1160, 0], [W, 0], [W, H], [1384, H]],
  ]),
  I: auto([
    [[0, 0], [540, 0], [760, H], [0, H]],
    [[544, 0], [1376, 0], [1156, H], [764, H]],
    [[1380, 0], [W, 0], [W, H], [1160, H]],
  ]),
  // K = C dicermin (serong ke arah lain)
  K: auto([
    [[0, 0], [560, 0], [760, H], [0, H]],
    [[564, 0], [1156, 0], [1356, H], [764, H]],
    [[1160, 0], [W, 0], [W, H], [1360, H]],
  ]),
};

// Garis putih antara panel bersebelahan.
export const dividers = (panels: ShapePanel[]): Pt[][] =>
  panels.slice(0, -1).map((p, i) => {
    const q = panels[i + 1].poly;
    return [p.poly[1], q[0], q[3], p.poly[2]];
  });

export const stripPanels = (n: number, gap = 4): ShapePanel[] => {
  const pw = (W - gap * (n - 1)) / n;
  return Array.from({length: n}, (_, i) => {
    const x0 = Math.round(i * (pw + gap));
    const x1 = i === n - 1 ? W : Math.round(i * (pw + gap) + pw);
    return {poly: rect(x0, x1), box: {x: x0, y: 0, w: x1 - x0, h: H}};
  });
};

export const polyCss = (poly: Pt[]) => `polygon(${poly.map(([x, y]) => `${x}px ${y}px`).join(',')})`;
