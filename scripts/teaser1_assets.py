"""Petal Pop Drop 2 Teaser 1 assets.
  python3 scripts/teaser1_assets.py "<TEASER 1 folder>"
The five scarf SVGs share one artwork (same paths, same order); only the 7 fill colours and the background change.
Writes src/teaser1/pattern.json (paths once + one 7-colour palette per colourway), src/teaser1/logo.json
(the Petal Pop Drop 2 logo paths, tagged by part) and public/teaser1/nafesa.png.
Needs the per-unit bounding boxes from scripts/teaser1_bbox.js (Chromium getBBox)."""
import json, re, subprocess, sys, os
import xml.etree.ElementTree as ET
from PIL import Image

SRC = sys.argv[1].rstrip('/') + '/'
NS = '{http://www.w3.org/2000/svg}'
WAYS = ['Butter Bliss', 'Vanilla Sky', 'Expresso Poppy', 'Forest Bloom', 'Olive Spritz']
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


def load(name):
    raw = open(SRC + name + '.svg').read()
    cls = dict(re.findall(r'\.(cls-\d+)\s*\{\s*fill:\s*(#[0-9a-fA-F]+);', raw))
    root = ET.fromstring(raw)
    rect = root.find(NS + 'rect')
    bg = cls[rect.get('class')] if rect.get('class') else '#000000'
    big = max(root.findall(NS + 'g'), key=lambda g: len(list(g.iter(NS + 'path'))))
    units = []
    for ch in big:  # a <g> is one flower, a bare <path> is one leaf
        ps = [ch] if ch.tag == NS + 'path' else list(ch.iter(NS + 'path'))
        units.append([(p.get('d'), cls[p.get('class')].lower()) for p in ps])
    return bg.lower(), float(rect.get('x', 0)), units


data = {n: load(n) for n in WAYS}
base_bg, _, base = data[WAYS[0]]
order = []  # Butter Bliss colours in first-seen order = palette slots
for u in base:
    for _, c in u:
        if c not in order:
            order.append(c)
palettes = {}
for n in WAYS:
    bg, ox, units = data[n]
    slot = {}
    for bu, u in zip(base, units):
        assert len(bu) == len(u)
        for (_, c0), (_, c) in zip(bu, u):
            assert slot.setdefault(order.index(c0), c) == c, n
    palettes[n] = dict(bg=bg, colors=[slot[i] for i in range(len(order))])

bbox = json.loads(subprocess.check_output(['node', os.path.join(HERE, 'teaser1_bbox.js'), SRC + WAYS[0] + '.svg']))
assert len(bbox) == len(base)
units = []
for b, u in zip(bbox, base):
    units.append(dict(k='f' if b['tag'] == 'g' else 'l', x=round(b['x'] + b['w'] / 2, 1), y=round(b['y'] + b['h'] / 2, 1),
                      r=round(max(b['w'], b['h']) / 2, 1), p=[[d, order.index(c)] for d, c in u]))
json.dump(dict(TILE=3240, ways=WAYS, palettes=palettes, units=units), open(os.path.join(ROOT, 'src/teaser1/pattern.json'), 'w'), separators=(',', ':'))

# logo: every shape of "Untitled-1 [Recovered].svg" (the vector of loho petal pop 2.png), tagged by part
raw = open(SRC + 'Untitled-1 [Recovered].svg').read()
cls = dict(re.findall(r'\.(cls-\d+)\s*\{\s*fill:\s*(#[0-9a-fA-F]+);', raw))
vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', raw).group(1).split()]
paths = [(p.get('d'), cls.get(p.get('class'), '#000000')) for p in ET.fromstring(raw).iter(NS + 'path')]
# order (from getBBox): 0 big flower, 1-8 letters P e t a l P o p, 9-10 leaf + vein, 11 tulip, 12 stem, 13 heart,
# 14-15 stem veins, 16 pill, 17-21 DROP 2
roles = ['flower'] + [f'letter{i}' for i in range(8)] + ['leaf', 'leaf', 'tulip', 'stem', 'heart', 'stem', 'stem', 'pill'] + ['drop'] * 5
assert len(paths) == len(roles)
lb = json.loads(subprocess.check_output(['node', os.path.join(HERE, 'teaser1_bbox.js'), SRC + 'Untitled-1 [Recovered].svg', 'shapes']))
json.dump(dict(w=vb[2], h=vb[3], paths=[dict(d=d, fill=f, role=r, box=[round(b['x'], 1), round(b['y'], 1), round(b['w'], 1), round(b['h'], 1)])
                                       for (d, f), r, b in zip(paths, roles, lb)]),
          open(os.path.join(ROOT, 'src/teaser1/logo.json'), 'w'))

im = Image.open(SRC + 'Logo_Nafesa-04.png').convert('RGBA')
im = im.crop(im.getbbox())
im.thumbnail((1400, 1400), Image.LANCZOS)
im.save(os.path.join(ROOT, 'public/teaser1/nafesa.png'))
print('colours', order, {n: p['bg'] for n, p in palettes.items()}, len(units), 'units')
