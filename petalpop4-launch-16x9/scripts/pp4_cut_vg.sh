#!/bin/bash
# Mac: potong julat shot dari "VIDEO GRADE .mp4" (Nas sudah grade; tiada grade tambahan), 1080x1920 60fps CRF 14.
#   bash pp4_cut_vg.sh pp4_cutlist_vg.txt <from_line> <to_line>
V="$HOME/mnt/VACITY PETAL POP/PETAL POP 4/TEASER VIDEO/VIDEO GRADE .mp4"
O="$HOME/mnt/VACITY PETAL POP/_claude_preview/d4brain"
mkdir -p "$O/clips"
sed -n "${2},${3}p" "$1" | while read src ss dur out; do
  ffmpeg -nostdin -v error -y -ss "$ss" -i "$V" -t "$dur" -an -vf "format=yuv420p" -r 60 -c:v libx264 -preset fast -crf 14 -movflags +faststart "$O/$out" && echo "ok $out"
done
