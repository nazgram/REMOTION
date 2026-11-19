#!/bin/bash
# Mac: potong julat shot dari raw asal, grade dibakar, 1080x1920 60fps CRF 14.
#   bash pp4_cut.sh pp4_cutlist.txt <from_line> <to_line>
R="$HOME/mnt/VACITY PETAL POP/PETAL POP 4/TEASER VIDEO/video raw"
O="$HOME/mnt/VACITY PETAL POP/_claude_preview/d4brain"
G="eq=contrast=1.08:brightness=0.015:saturation=1.15:gamma=1.04,curves=all='0/0 0.25/0.26 0.5/0.53 0.75/0.77 0.9/0.87 1/0.94'"
mkdir -p "$O/clips"
sed -n "${2},${3}p" "$1" | while read raw ss dur out; do
  ffmpeg -nostdin -v error -y -ss "$ss" -i "$R/$raw.MP4" -t "$dur" -an -vf "$G,format=yuv420p" -r 60 -c:v libx264 -preset fast -crf 14 -movflags +faststart "$O/$out" && echo "ok $out"
done
