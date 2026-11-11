"""Split Nas's "Petal Pop Typography.png" lockup into animatable layers for PetalPopIntro.

Usage: python3 scripts/intro_newlogo.py <Petal Pop Typography.png>
  -> public/intro/newlogo/<part>.png  (letters repainted in the ivory of the color sheet, motifs as drawn)
  -> src/intro/newlogo.json           (each part's box inside the lockup, in output pixels)
"""
import json
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'intro', 'newlogo')
SCALE = 0.5
IVORY = (0xF8, 0xEA, 0xD9)
# letters, left to right; a letter can be several white blobs (P = stem + bowl, the stencil o = two halves)
LETTERS = ['P', 'e', 't', 'a', 'l', 'P2', 'o', 'p']
MOTIFS = ['leaf', 'flower', 'tulip', 'heart']

im = Image.open(sys.argv[1]).convert('RGBA')
A = np.asarray(im).astype(int)
alpha, rgb = A[..., 3], A[..., :3]
white = (alpha > 0) & (rgb.min(-1) > 200) & (rgb.max(-1) - rgb.min(-1) < 40)
colour = (alpha > 0) & ~white

# letter blobs -> letters: Petal is the top line, Pop the bottom, read left to right; the P bowls and the
# two halves of the stencil o are separate blobs, hence the blob count per letter
BLOBS = [2, 1, 1, 1, 1, 2, 2, 1]
lab, n = ndimage.label(white)
sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
blobs = [(i + 1, s) for i, s in enumerate(ndimage.find_objects(lab)) if sizes[i] > 20000]
split = (min(s[0].start for _, s in blobs) + max(s[0].start for _, s in blobs)) / 2
order = [i for top in (True, False) for i, s in sorted(blobs, key=lambda b: b[1][1].start) if (s[0].start < split) == top]
assert len(order) == sum(BLOBS), len(order)
groups, k = [], 0
for c in BLOBS:
    groups.append({'ids': order[k:k + c]}); k += c
assert len(groups) == len(LETTERS), [g['ids'] for g in groups]

# coloured motifs: blobs after a small dilation, stray bits join the nearest big one
clab, cn = ndimage.label(ndimage.binary_dilation(colour, iterations=2))
csizes = ndimage.sum(np.ones_like(clab), clab, range(1, cn + 1))
big = [i + 1 for i in range(cn) if csizes[i] > 8000]
centres = {i: np.argwhere(clab == i).mean(axis=0) for i in big}
for j in range(1, cn + 1):
    if j not in big and csizes[j - 1] > 50:
        c = np.argwhere(clab == j).mean(axis=0)
        clab[clab == j] = min(big, key=lambda i: np.hypot(*(centres[i] - c)))
# leaf (top), flower (biggest), tulip (right), heart (smallest, bottom right)
by_size = sorted(big, key=lambda i: -csizes[i - 1])
flower, small = by_size[0], [i for i in big if i != by_size[0]]
leaf = min(small, key=lambda i: centres[i][0])
heart = min([i for i in small if i != leaf], key=lambda i: csizes[i - 1])
tulip = [i for i in small if i not in (leaf, heart)][0]

ys, xs = np.where(alpha > 0)
X0, Y0, X1, Y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
os.makedirs(OUT, exist_ok=True)
parts = []

def save(name, mask, kind, paint=None):
    m = mask & (alpha > 0)
    yy, xx = np.where(m)
    x0, y0, x1, y1 = xx.min(), yy.min(), xx.max() + 1, yy.max() + 1
    px = np.zeros((y1 - y0, x1 - x0, 4), np.uint8)
    sub = A[y0:y1, x0:x1]
    px[..., :3] = paint if paint else sub[..., :3]
    px[..., 3] = np.where(m[y0:y1, x0:x1], sub[..., 3], 0)
    out = Image.fromarray(px)
    out = out.resize((max(1, round(out.width * SCALE)), max(1, round(out.height * SCALE))), Image.LANCZOS)
    out.save(os.path.join(OUT, f'{name}.png'), optimize=True)
    parts.append({'name': name, 'kind': kind, 'x': round((x0 - X0) * SCALE), 'y': round((y0 - Y0) * SCALE),
                  'w': out.width, 'h': out.height})
    print(name, parts[-1])

for name, i in (('leaf', leaf), ('flower', flower), ('tulip', tulip), ('heart', heart)):
    save(name, colour & (clab == i), 'motif')
# a letter keeps its anti-aliased rim: grow the blob mask a few px, but only over white pixels
for name, g in zip(LETTERS, groups):
    m = ndimage.binary_dilation(np.isin(lab, g['ids']), iterations=3) & white
    save(name, m, 'letter', IVORY)

json.dump({'width': round((X1 - X0) * SCALE), 'height': round((Y1 - Y0) * SCALE), 'parts': parts},
          open(os.path.join(ROOT, 'src', 'intro', 'newlogo.json'), 'w'), indent=1)
