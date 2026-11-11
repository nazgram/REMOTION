#!/bin/sh
# song (contoh 1) + SFX -> public/drop3p/mix.wav, fade out over the last 0.4 s
cd "$(dirname "$0")/.."
ffmpeg -v error -y -i public/drop3p/song.wav -i public/drop3p/sfx.wav \
  -filter_complex "[0]volume=1.0[a];[1]volume=0.9[b];[a][b]amix=inputs=2:normalize=0:duration=first,atrim=0:16.1,afade=t=out:st=15.7:d=0.4,alimiter=limit=0.89" \
  -ar 44100 public/drop3p/mix.wav
