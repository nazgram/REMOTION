# render in 2 chunks (muted), concat, mux music+sfx, loudnorm
set -e; cd "$(dirname "$0")/.."; V=${1:-v2}
for r in 0-560 561-1121; do npx remotion render src/index.ts PetalPop4BTS out/part_$r.mp4 --frames=$r --muted --crf=16 --concurrency=3 --timeout=120000 > out/render_$r.log 2>&1; done
printf "file 'part_0-560.mp4'\nfile 'part_561-1121.mp4'\n" > out/parts.txt
ffmpeg -v error -y -f concat -safe 0 -i out/parts.txt -c copy out/video_$V.mp4
ffmpeg -v error -y -i public/bts/music.wav -i public/bts/sfx.wav -filter_complex "[0:a]aresample=48000,volume=0.9,afade=t=out:st=36.0:d=1.4[m];[1:a]volume=0.8[s];[m][s]amix=inputs=2:normalize=0,atrim=0:37.4,alimiter=limit=0.89,loudnorm=I=-14:TP=-1.2:LRA=11[a]" -map "[a]" -ar 48000 out/mix_$V.wav
ffmpeg -v error -y -i out/video_$V.mp4 -i out/mix_$V.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -ar 48000 -movflags +faststart -shortest out/PetalPop_Drop4_BTS_$V.mp4
echo DONE
