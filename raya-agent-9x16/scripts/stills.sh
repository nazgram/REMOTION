#!/bin/bash
# usage: scripts/stills.sh t1 t2 ... -> out/st/f_<t>.png
cd "$(dirname "$0")/.."
FR=$(for t in "$@"; do python3 -c "print(round($t*30))"; done | paste -sd, -)
i=0; for t in "$@"; do f=$(python3 -c "print(round($t*30))"); npx remotion still src/index.ts RayaAgent out/st/f_$t.png --frame=$f --log=error >/dev/null 2>&1 || echo "fail $t"; done
