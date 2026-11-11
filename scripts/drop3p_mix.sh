#!/bin/sh
# song (April Rain Rhythm from 0:08, cut in public/drop3p/song2.wav) + SFX -> public/drop3p/mix2.wav, fade out at the end
cd "$(dirname "$0")/.."
D=$(node -p "require('./src/drop3p/timeline.json').DURATION")
F=$(node -p "require('./src/drop3p/timeline.json').DURATION - 0.8")
ffmpeg -v error -y -i public/drop3p/song2.wav -i public/drop3p/sfx.wav \
  -filter_complex "[0]volume=0.85[a];[1]volume=0.9[b];[a][b]amix=inputs=2:normalize=0:duration=first,atrim=0:$D,afade=t=out:st=$F:d=0.8,alimiter=limit=0.85" \
  -ar 44100 public/drop3p/mix2.wav
