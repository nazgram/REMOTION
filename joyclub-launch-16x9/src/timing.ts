// Lagu Nas mula 0:31, 136 BPM. 1 beat = 0.441s, 1 bar = 1.765s.
export const FPS = 30;
export const BEAT = 60 / 136;
export const BAR = BEAT * 4;
export const f = (sec: number) => Math.round(sec * FPS);
export const INTRO_END = BAR * 5;            // 8.82s
export const CW_LEN = BAR * 3;               // 5.29s per colorway
export const cwStart = (i: number) => INTRO_END + i * CW_LEN;
export const CLIMAX = cwStart(5);            // 35.29s
export const JOY = CLIMAX + BAR * 2;         // 38.82s
export const NAFESA = JOY + BAR * 2;         // 42.35s
export const END = 45;
