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
