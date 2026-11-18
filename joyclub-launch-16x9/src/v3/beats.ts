const median = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export const nearestBeat = (t: number, beats: number[]): number =>
  beats.reduce((best, b) => (Math.abs(b - t) < Math.abs(best - t) ? b : best), beats[0]);

// Masa beat ke-i; di luar senarai, sambung dengan jarak median.
export const beatAt = (i: number, beats: number[]): number => {
  if (i >= 0 && i < beats.length) return beats[i];
  const gap = median(beats.slice(1).map((b, k) => b - beats[k]));
  return i < 0 ? beats[0] + i * gap : beats[beats.length - 1] + (i - beats.length + 1) * gap;
};
