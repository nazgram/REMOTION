import {continueRender, delayRender, Easing, interpolate, spring, staticFile} from 'remotion';
export const FPS = 60;
export const f = (sec: number) => Math.round(sec * FPS);
export const asset = (p: string) => staticFile(`pp4/${p}`);
// Fon: Transcity (nama design), DM Serif Display (COMING SOON, ikut teaser v6).
export const NAME_FONT = 'Transcity';
export const SERIF = 'DM Serif Display';
if (typeof document !== 'undefined' && typeof FontFace !== 'undefined') {
  const h = delayRender('fonts');
  Promise.all(
    [
      [NAME_FONT, 'fonts/Transcity.otf'],
      [SERIF, 'fonts/DMSerifDisplay.woff2'],
    ].map(([fam, p]) => new FontFace(fam, `url('${asset(p)}')`).load().then((ff) => document.fonts.add(ff))),
  )
    .then(() => continueRender(h))
    .catch((e) => {
      console.error(e);
      continueRender(h);
    });
}
// Pseudo-random tetap (supaya setiap render sama)
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const ease = (t: number, a: number, b: number, fn = Easing.inOut(Easing.cubic)) => interpolate(t, [a, b], [0, 1], {...clamp, easing: fn});
// Spring pop (0 -> 1 dengan lajak sedikit), t dan at dalam saat.
export const pop = (t: number, at: number, damping = 11) =>
  t < at ? 0 : spring({frame: (t - at) * FPS, fps: FPS, config: {damping, mass: 0.6, stiffness: 170}});
