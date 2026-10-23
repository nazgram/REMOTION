# Petal Pop

A 10-second 9:16 (1080×1920, 30 fps) floral pop video made with Remotion: gouache flower sprigs pop on a
120 BPM ukulele groove, sway in a gust of wind, wash away like watercolor, and the title PETAL POP pops in letter by letter.

```bash
npm install
python3 scripts/make_assets.py <folder with the 10 sprig PNGs>   # public/flowers, paper grain, wash masks
node scripts/layout.js                                           # src/layout.json: positions + pop times
node audio/song.js                                               # public/music.wav, synced to the same layout
npx remotion still PetalPop out/frame.png --frame=180            # preview one frame
npx remotion render PetalPop out/petal-pop.mp4 --props='{"withAudio":true}'
```

`src/layout.json` is the single timeline: the picture (`src/PetalPop.tsx`) and the soundtrack (`audio/song.js`)
both read it, so every flower's pop lands on its sound. The synth in `audio/engine/` is vendored from the
animation-studio skill. Title font: DM Serif Display (SIL OFL, `public/fonts`).
