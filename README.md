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

## Petal Pop intro (PetalPopIntro)

12 s 9:16 intro for NAFESA: the Petal Pop motifs pop on, recolour through five colorways (Dahlia, Bluebell,
Moonflower, Toffee Rose, Peony), wash away like watercolor, a thin tagline eases in, the Petal Pop
logo pops in letter by letter, its flower, leaf, tulip and heart land after, and it breathes out, then the NAFESA logo fades in. SFX only, no music.

```bash
python3 scripts/intro_assets.py "<intro video AI folder>"   # public/intro: motifs from FLOWER.png, logo parts, wash masks
python3 scripts/intro_newlogo.py "<Petal Pop Typography.png>" # public/intro/newlogo: Petal Pop logo cut into layers
node scripts/intro_layout.js                               # src/intro/layout.json: positions + pop times
node audio/intro_sfx.js                                    # public/intro/sfx.wav
npx remotion render PetalPopIntro out/petal-pop-intro.mp4 --props='{"withAudio":true}'
```

The Petal Pop logo comes from Nas's `Petal Pop Typography.png` (Fabulosa, Adobe Fonts): the script splits it into
letters (repainted ivory) and drawn motifs, so no font file is needed.

## Petal Pop Drop 1 editor reel (PetalPopDrop1)

17 s 9:16 reel of the Drop 1 catalog (`PetalPop_Drop1_PNG`) in Nas's "editor moves" style: the Petal Pop logo
appears too big and a cursor free-transforms it down, the cover gets a marquee, each colorway page slides in and an
eyedropper picks its colour into a palette strip (Moonflower gets a zoom), then all five are selected and scaled
into the DROP 1 pill, ending on Petal Pop + NAFESA. SFX only (Nas's POP 3 pops, clicks, swishes).

```bash
node scripts/drop1_layout.js                  # src/drop1/timeline.json: every move and sound event
node audio/drop1_sfx.js                       # public/drop1/sfx.wav
SCALE=0.4 node scripts/drop1_stills.mjs out/sb PetalPopDrop1 1.0 4.8 7.8   # storyboard stills
npx remotion render PetalPopDrop1 out/drop1.mp4 --props='{"withAudio":true}' \
  --browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
```
