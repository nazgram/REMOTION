// Speed ramp: kunci [saat tempatan, kelajuan]; antara kunci kelajuan berubah licin (kosinus), di luar kunci kekal.
export type RampKeys = [number, number][];

export const speedAt = (keys: RampKeys, t: number): number => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i];
    if (t <= t1) {
      const [t0, v0] = keys[i - 1];
      const u = t1 === t0 ? 1 : (t - t0) / (t1 - t0);
      return v0 + (v1 - v0) * (1 - Math.cos(u * Math.PI)) / 2;
    }
  }
  return keys[keys.length - 1][1];
};

// Masa sumber (saat) selepas frame tempatan `frame`: jumlah kelajuan setiap frame / fps.
const cache = new Map<string, number[]>();
export const srcAt = (keys: RampKeys, frame: number, fps: number): number => {
  const k = JSON.stringify(keys) + fps;
  let acc = cache.get(k);
  if (!acc) cache.set(k, (acc = [0]));
  while (acc.length <= frame) {
    const n = acc.length - 1;
    acc.push(acc[n] + speedAt(keys, (n + 0.5) / fps) / fps);
  }
  return acc[Math.max(0, frame)];
};
