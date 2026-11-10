#!/bin/bash
# Proxies for PetalPopDrop3Teaser30: short 1080x1920 59.94 fps H.264 cuts of the raw Sony clips (10-bit 4:2:2, shot
# vertical) used by the "Teaser v4" Premiere timeline. Run where the raw footage is (the Mac), then copy the
# proxies to raw/drop3t/ in this repo.   scripts/drop3t30_proxies.sh "<RAW VIDEO dir>" "<out dir>"
B="$1"; D="$2"; mkdir -p "$D"
cut(){ ffmpeg -v error -y -ss $3 -i "$B/$2.MP4" -t $4 -vf format=yuv420p -c:v libx264 -crf 20 -preset veryfast -an "$D/$1.mp4"; }
# hook cuts (1.2 s each)
cut h1 C4578 33.0 1.2; cut h2 C4586 16.0 1.2; cut h3 C4602 50.0 1.2; cut h4 C4599 41.0 1.2
cut h5 C4592 24.0 1.2; cut h6 C4578 24.0 1.2; cut h7 C4599 75.0 1.2; cut h8 C4602 62.5 1.2
# per colourway: A = normal speed, B = slow-motion hero (2.6 s each)
cut butA C4586 5.0 2.6;  cut butB C4586 29.5 2.6
cut camA C4602 43.0 2.6; cut camB C4602 59.0 2.6; cut camC C4602 72.0 2.6
cut petA C4599 32.5 2.6; cut petB C4599 72.5 2.6
cut lavA C4592 15.0 2.6; cut lavB C4592 36.0 2.6; cut lavC C4592 40.5 2.6
cut marA C4578 5.0 2.6;  cut marB C4578 35.0 2.6
