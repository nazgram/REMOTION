#!/usr/bin/env bash
# Muat turun bahan v3 dari folder Drive Nas ke public/v3 (gitignored).
set -euo pipefail
cd "$(dirname "$0")/../public/v3"
get(){ [ -s "$2" ] || curl -sSL -o "$2" "https://drive.usercontent.google.com/download?id=$1&export=download&confirm=t"; }
get 1CSs95-094qE1xCM5fsJRaQKFBQZwADAk vertical.mp4
get 1GbVq8RxXRW3IQ5t7BG2IYXanjEySeq07 landscape.mp4
get 1MJ-M6NVyXzNcVBKsV_AFONOd_2WHeEbd snapback.mp3
get 1v0Hm4B5WzvPxPSkF-KqZ6nw2JwMNTuXO typo1.png
get 11VPvew4DXh-erBsJ-tN8VvYpG1ski-wj typo2.png
get 1Lm1Qqhn58XUTyJx18_zvKyvlk18noTff nafesa-olive.png
get 1Nc5HCGblFD-JIDYsEi_xGTmsMqVuAM_6 poppins.zip
get 1eWpzz9o3Pa5VA3T0lxiPWJHd6zqrARfm pearl.svg
get 19MM7dsTBmU8mLSxggtChUNs45NSOeeVR sky.svg
get 1j-9iqZI3SmmUEuss9Qc3BKgZznCfdU9t blush.svg
get 1kMRrh6B8VH7jJa1XhUeidlrDujiL035S ruby.svg
get 1T3OziqtyhQqYQG1H_ZYFvbDVgaHSiGHV silver.svg
# Lagu: 45s terakhir Snap Back, tamat semula jadi di 2:50.9. Downbeat pertama (125.806s) jatuh pada 0.25s video.
[ -s song.m4a ] || ffmpeg -v error -y -ss 125.556 -t 45 -i snapback.mp3 -vn -c:a aac -b:a 256k song.m4a
[ -s Poppins-Bold.ttf ] || unzip -j -o -q poppins.zip '*Poppins-Bold.ttf' '*Poppins-Medium.ttf' '*Poppins-SemiBold.ttf' -x '__MACOSX/*'
ls -la
