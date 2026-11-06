"""Petal Pop Drop 3 Teaser 1 assets.
  python3 scripts/drop3_assets.py "<PETAL POP 3 folder>"
The five Abstract Floral SVGs share one artwork (same paths); only the fills change. Hero motifs are picked by
connected component on a 2x raster of Camellia, then each one is re-rasterized big (about 1100 px) for every
colourway. Writes public/drop3/<way>/<motif>.png, <way>/pattern.png, public/drop3/logo.png, paper.png and
src/drop3/assets.json (motif sizes + colourway backgrounds)."""
import json, os, re, subprocess, sys, tempfile
import xml.etree.ElementTree as ET
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SRC = sys.argv[1].rstrip('/') + '/'
NS = '{http://www.w3.org/2000/svg}'
WAYS = ['Buttercup', 'Camellia', 'Petunia', 'Lavender', 'Marigold']
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, 'public/drop3')
TMP = tempfile.mkdtemp()
# component ids on the 6480 px Camellia raster (label order of scipy.ndimage.label), picked from a contact sheet
MOTIFS = dict(L1=424, L2=723, L3=178, L4=1066, L5=1252, L6=209, F1=1802, F2=13, F3=25, F4=315, F5=323,
              V1=516, V2=248, S1=14, S2=106, P1=100)
BIG = 1100  # longest side of a motif PNG


def raster(jobs):
    jf = os.path.join(TMP, 'jobs.json')
    json.dump(jobs, open(jf, 'w'))
    subprocess.check_call(['node', os.path.join(HERE, 'drop3_raster.js'), jf], cwd=ROOT)


bgs = {}
for n in WAYS:  # artwork only: the main group, without the background, border and corner wordmark
    raw = open(SRC + n + '.svg').read()
    cls = dict(re.findall(r'\.(cls-\d+)\s*\{\s*fill:\s*(#[0-9a-fA-F]+);', raw))
    root = ET.fromstring(raw)
    rc = root.find(NS + 'rect').get('class')
    bgs[n] = cls[rc].lower() if rc else '#000000'  # Petunia's background rect has no class: black
    big = max(root.findall(NS + 'g'), key=lambda g: len(list(g.iter(NS + 'path'))))
    style = re.search(r'<defs>.*?</defs>', raw, re.S).group(0)
    body = ET.tostring(big, encoding='unicode').replace('ns0:', '').replace(':ns0', '')
    open(os.path.join(TMP, n + '.svg'), 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3240 3240">{style}{body}</svg>')

raster([dict(svg=os.path.join(TMP, 'Camellia.svg'), vb=[0, 0, 3240, 3240], W=6480, H=6480, out=os.path.join(TMP, 'full.png'))])
full = np.array(Image.open(os.path.join(TMP, 'full.png')))[..., 3] > 20
lab, _ = ndimage.label(full)
objs = ndimage.find_objects(lab)

meta, jobs = {}, []
for k, cid in MOTIFS.items():
    o = objs[cid - 1]
    y0, y1, x0, x1 = o[0].start / 2, o[0].stop / 2, o[1].start / 2, o[1].stop / 2
    w, h = x1 - x0, y1 - y0
    pad = 0.06 * max(w, h)
    vb = [x0 - pad, y0 - pad, w + 2 * pad, h + 2 * pad]
    s = BIG / max(vb[2], vb[3])
    W, H = round(vb[2] * s), round(vb[3] * s)
    ys, xs = np.nonzero(lab[o] == cid)  # a pixel of this motif, to find it again in the big raster
    seed = ((ys[len(ys) // 2] / 2 + y0 - vb[1]) * s, (xs[len(xs) // 2] / 2 + x0 - vb[0]) * s)
    meta[k] = dict(w=W, h=H, seed=seed)
    for n in WAYS:
        os.makedirs(os.path.join(OUT, n), exist_ok=True)
        jobs.append(dict(svg=os.path.join(TMP, n + '.svg'), vb=vb, W=W, H=H, out=os.path.join(OUT, n, k + '.png')))
raster(jobs)
for k, mt in meta.items():
    ref = None
    for n in WAYS:
        f = os.path.join(OUT, n, k + '.png')
        im = np.array(Image.open(f))
        if ref is None:  # same shapes in every colourway: one mask for all five
            l2, _ = ndimage.label(im[..., 3] > 10)
            sy, sx = int(mt['seed'][0]), int(mt['seed'][1])
            win = l2[max(0, sy - 3):sy + 4, max(0, sx - 3):sx + 4]
            keep = np.bincount(win[win > 0]).argmax()
            ref = ndimage.binary_dilation(l2 == keep, iterations=2)
        im[..., 3] = im[..., 3] * ref
        Image.fromarray(im).save(f, optimize=True)
    del mt['seed']

logo = Image.open(SRC + 'Logo Petal Pop 3.png')
logo = logo.crop(logo.getbbox())
logo.thumbnail((1600, 1600), Image.LANCZOS)
logo.save(os.path.join(OUT, 'logo.png'), optimize=True)


# the far wall: each colourway's whole artwork (no background), seen softly behind everything
raster([dict(svg=os.path.join(TMP, n + '.svg'), vb=[0, 0, 3240, 3240], W=2200, H=2200, out=os.path.join(OUT, n, 'pattern.png')) for n in WAYS])

# watercolor paper: soft blotches + fine grain + a few fibres, mid grey, laid over the frame in overlay mode
rng = np.random.default_rng(21)
PW, PH = 1080, 1920
def blot(sc, amp):
    g = rng.random((PH // sc + 2, PW // sc + 2)).astype(np.float32)
    return amp * (np.array(Image.fromarray(g).resize((PW, PH), Image.BICUBIC)) - 0.5)
tex = 0.5 + blot(240, 0.10) + blot(60, 0.06) + blot(12, 0.04) + (rng.random((PH, PW)).astype(np.float32) - 0.5) * 0.10
fib = Image.new('L', (PW, PH), 0)
from PIL import ImageDraw
dr = ImageDraw.Draw(fib)
for _ in range(500):
    x, y = rng.random() * PW, rng.random() * PH
    ang, ln = rng.random() * 6.28, 8 + rng.random() * 30
    dr.line([x, y, x + np.cos(ang) * ln, y + np.sin(ang) * ln], fill=int(40 + rng.random() * 60), width=1)
tex -= np.array(fib.filter(ImageFilter.GaussianBlur(0.6)), np.float32) / 255 * 0.25
Image.fromarray((np.clip(tex, 0, 1) * 255).astype(np.uint8)).save(os.path.join(OUT, 'paper.png'), optimize=True)
json.dump(dict(ways=WAYS, bg=bgs, motifs=meta), open(os.path.join(ROOT, 'src/drop3/assets.json'), 'w'), indent=1)
print('ok', bgs)
