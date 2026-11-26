"""Petal Pop Drop 3 Teaser 1 (Drop 1/2 style) assets.
  python3 scripts/drop3t_assets.py "<PETAL POP 3 folder>"
The five scarf SVGs share one artwork (same paths, same order); only the fills change. The ~6300 children of the
artwork are grouped into units (a leaf cluster, a flower, a vine, a dot) by connected component on a 2x raster, so
each unit pops as one piece. Writes src/drop3t/pattern.json (paths once + a palette per colourway),
src/drop3t/logo.json (the Petal Pop Drop 3 logo, tagged by part) and public/drop3t/<way>.jpg (the whole scarf,
border and wordmark included, at 1 px per unit) for the moments a scene is fully built."""
import json, os, re, subprocess, sys, tempfile
import xml.etree.ElementTree as ET
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = sys.argv[1].rstrip('/') + '/'
NS = '{http://www.w3.org/2000/svg}'
WAYS = ['Buttercup', 'Camellia', 'Petunia', 'Lavender', 'Marigold']
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, 'public/drop3t')
os.makedirs(OUT, exist_ok=True)
os.makedirs(os.path.join(ROOT, 'src/drop3t'), exist_ok=True)
TMP = tempfile.mkdtemp()


def raster(jobs):
    jf = os.path.join(TMP, 'jobs.json')
    json.dump(jobs, open(jf, 'w'))
    subprocess.check_call(['node', os.path.join(HERE, 'drop3_raster.js'), jf], cwd=ROOT)


def load(name):
    raw = open(SRC + name + '.svg').read()
    cls = dict(re.findall(r'\.(cls-\d+)\s*\{\s*fill:\s*(#[0-9a-fA-F]+);', raw))
    root = ET.fromstring(raw)
    rect = root.find(NS + 'rect')
    bg = cls[rect.get('class')] if rect.get('class') else '#000000'
    big = max(root.findall(NS + 'g'), key=lambda g: len(list(g.iter(NS + 'path'))))
    kids = [[(p.get('d'), cls.get(p.get('class'), '#000000').lower()) for p in ([ch] if ch.tag == NS + 'path' else ch.iter(NS + 'path'))] for ch in big]
    style = re.search(r'<defs>.*?</defs>', raw, re.S).group(0)
    body = ET.tostring(big, encoding='unicode').replace('ns0:', '').replace(':ns0', '')
    open(os.path.join(TMP, name + '_art.svg'), 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3240 3240">{style}{body}</svg>')
    return bg.lower(), kids


data = {n: load(n) for n in WAYS}
base = data[WAYS[0]][1]
order = []
for k in base:
    for _, c in k:
        if c not in order:
            order.append(c)
palettes = {}
for n in WAYS:
    bg, kids = data[n]
    votes = {}  # path data differ only by export rounding; colours must map slot -> colour one to one
    for bk, k in zip(base, kids):
        assert len(bk) == len(k)
        for (_, c0), (_, c) in zip(bk, k):
            v = votes.setdefault(order.index(c0), {})
            v[c] = v.get(c, 0) + 1
    bad = {i: v for i, v in votes.items() if len(v) > 1}
    if bad:
        print('colour conflicts', n, bad)
    palettes[n] = dict(bg=bg, colors=[max(votes[i], key=votes[i].get) for i in range(len(order))])

# group children into units: connected components of the 2x raster of the artwork
raster([dict(svg=os.path.join(TMP, 'Camellia_art.svg'), vb=[0, 0, 3240, 3240], W=6480, H=6480, out=os.path.join(TMP, 'full.png'))])
lab, nlab = ndimage.label(np.array(Image.open(os.path.join(TMP, 'full.png')))[..., 3] > 20)
objs = ndimage.find_objects(lab)
pts = json.loads(subprocess.check_output(['node', os.path.join(HERE, 'drop3t_points.js'), SRC + 'Camellia.svg'], cwd=ROOT))
assert len(pts) == len(base)
groups, solo = {}, []
for i, p in enumerate(pts):
    votes = {}
    for x, y in p['pts']:
        X, Y = int(x * 2), int(y * 2)
        win = lab[max(0, Y - 3):Y + 4, max(0, X - 3):X + 4]
        for v in win[win > 0].ravel():
            votes[v] = votes.get(v, 0) + 1
    if votes:
        groups.setdefault(max(votes, key=votes.get), []).append(i)
    elif p['w'] > 0.5 or p['h'] > 0.5:
        solo.append(i)
units = []
for lid, kids in groups.items():
    o = objs[lid - 1]
    y0, y1, x0, x1 = o[0].start / 2, o[0].stop / 2, o[1].start / 2, o[1].stop / 2
    units.append((min(kids), dict(x=round((x0 + x1) / 2, 1), y=round((y0 + y1) / 2, 1), r=round(max(x1 - x0, y1 - y0) / 2, 1),
                                  p=[[d, order.index(c)] for k in sorted(kids) for d, c in base[k]])))
for i in solo:
    p = pts[i]
    units.append((i, dict(x=round(p['x'] + p['w'] / 2, 1), y=round(p['y'] + p['h'] / 2, 1), r=round(max(p['w'], p['h']) / 2, 1), p=[[d, order.index(c)] for d, c in base[i]])))
units = [u for _, u in sorted(units, key=lambda t: t[0])]
json.dump(dict(TILE=3240, ways=WAYS, palettes=palettes, units=units), open(os.path.join(ROOT, 'src/drop3t/pattern.json'), 'w'), separators=(',', ':'))
rs = sorted(u['r'] for u in units)
print(len(units), 'units from', nlab, 'components; r p50/p90/max', rs[len(rs) // 2], rs[int(len(rs) * .9)], rs[-1])

# whole scarves (background, border, corner wordmarks) at 1 px per unit
raster([dict(svg=SRC + n + '.svg', vb=[0, 0, 3240, 3240], W=3240, H=3240, out=os.path.join(TMP, n + '.png')) for n in WAYS])
for n in WAYS:
    im = Image.open(os.path.join(TMP, n + '.png')).convert('RGBA')
    flat = Image.new('RGB', im.size, palettes[n]['bg'])
    flat.paste(im, (0, 0), im)
    flat.save(os.path.join(OUT, n + '.jpg'), quality=92)

# logo: every shape, tagged by part (same layout as the Drop 2 logo)
raw = open(SRC + 'Logo Petal Pop 3.svg').read()
cls = dict(re.findall(r'\.(cls-\d+)\s*\{\s*fill:\s*(#[0-9a-fA-F]+);', raw))
vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', raw).group(1).split()]
paths = [(p.get('d'), cls.get(p.get('class'), '#000000')) for p in ET.fromstring(raw).iter(NS + 'path')]
roles = ['flower'] + [f'letter{i}' for i in range(8)] + ['leaf', 'leaf', 'tulip', 'stem', 'heart', 'stem', 'stem', 'pill'] + ['drop'] * 5
assert len(paths) == len(roles)
lb = json.loads(subprocess.check_output(['node', os.path.join(HERE, 'drop3t_bbox.js'), SRC + 'Logo Petal Pop 3.svg', 'shapes'], cwd=ROOT))
json.dump(dict(w=vb[2], h=vb[3], paths=[dict(d=d, fill=f, role=r, box=[round(b['x'], 1), round(b['y'], 1), round(b['w'], 1), round(b['h'], 1)])
                                       for (d, f), r, b in zip(paths, roles, lb)]), open(os.path.join(ROOT, 'src/drop3t/logo.json'), 'w'))
print('palettes', {n: p['bg'] for n, p in palettes.items()}, 'slots', len(order))

# sharp 2x crops around each scene's view (src/drop3t/views.json), laid over the 1x scarf while a scene fills the frame
V = json.load(open(os.path.join(ROOT, 'src/drop3t/views.json')))
hx, hy = 540 / V['S'] * V['pad'], 960 / V['S'] * V['pad']
jobs, crops = [], {}
for n, (cx, cy) in V['views'].items():
    vb = [round(cx - hx), round(cy - hy), round(2 * hx), round(2 * hy)]
    crops[n] = vb
    jobs.append(dict(svg=SRC + n + '.svg', vb=vb, W=vb[2] * 2, H=vb[3] * 2, out=os.path.join(TMP, n + '_crop.png')))
raster(jobs)
for n, vb in crops.items():
    im = Image.open(os.path.join(TMP, n + '_crop.png')).convert('RGBA')
    flat = Image.new('RGB', im.size, palettes[n]['bg'])
    flat.paste(im, (0, 0), im)
    flat.save(os.path.join(OUT, n + '_crop.jpg'), quality=90)
json.dump(crops, open(os.path.join(ROOT, 'src/drop3t/crops.json'), 'w'))
print('crops', crops)
