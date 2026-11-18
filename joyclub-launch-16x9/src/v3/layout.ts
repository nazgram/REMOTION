export const W = 1920;
export const H = 1080;

export const panelRects = (n: 2 | 3 | 5, gap = 4): {x: number; w: number}[] => {
  const pw = (W - gap * (n - 1)) / n;
  return Array.from({length: n}, (_, i) => {
    const x0 = Math.round(i * (pw + gap));
    const x1 = i === n - 1 ? W : Math.round(i * (pw + gap) + pw);
    return {x: x0, w: x1 - x0};
  });
};

// Bentuk panel penuh skrin (garis putih 4px). poly = poligon klip; box = kotak tempat video diletak (cover).
export type Pt = [number, number];
export type ShapePanel = {poly: Pt[]; box: {x: number; y: number; w: number; h: number}};
export type ShapeId = 'A' | 'B' | 'C' | 'H' | 'I' | 'E' | 'G' | 'G2' | 'G3';

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
  E: auto([rect(0, 958), rect(962, W)]),
  G: auto([
    [[0, 0], [1060, 0], [860, H], [0, H]],
    [[1064, 0], [W, 0], [W, H], [864, H]],
  ]),
  G2: auto([
    [[0, 0], [1300, 0], [620, H], [0, H]],
    [[1304, 0], [W, 0], [W, H], [624, H]],
  ]),
  // Bucu ke bucu: kotak video diletak di bahagian segi tiga yang luas supaya kepala model masuk.
  G3: [
    // Segitiga bucu ke bucu: guna klip landscape dalam kotak 16:9 yang besar dan diganjak supaya muka jatuh di bahagian lebar segitiga.
    {poly: [[0, 0], [1916, 0], [0, 1077]], box: {x: -703, y: -345, w: 2620, h: 1474}},
    {poly: [[W, 3], [W, H], [4, H]], box: {x: -73, y: 0, w: 2496, h: 1404}},
  ],
};
