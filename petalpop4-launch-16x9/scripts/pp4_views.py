"""Raster setiap view print (16:9) tepat 1920x1080 -> public/pp4/view_<id>.jpg (latar penuh bila sweep tutup skrin).
  python3 scripts/pp4_views.py "<TEASER VIDEO folder>"   (views dalam src/pp4/views.json)"""
import json, os, subprocess, sys, tempfile
from PIL import Image
SRC = sys.argv[1].rstrip('/') + '/'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V = json.load(open(os.path.join(ROOT, 'src/pp4/views.json')))
P = json.load(open(os.path.join(ROOT, 'src/pp4/pattern.json')))
WAY = {'pearl': 'Pearl Grey', 'dusty': 'Dusty Rose', 'lilac': 'Lilac Mist', 'sage': 'Sage Petal', 'powder': 'Powder Blue', 'dahlia': 'Black Dahlia'}
TMP = tempfile.mkdtemp()
jobs = []
for k, (x, y) in V['views'].items():
    if k not in WAY:
        continue
    jobs.append(dict(svg=SRC + WAY[k] + '.svg', vb=[x, y, V['w'], V['h']], W=1920, H=1080, out=os.path.join(TMP, k + '.png')))
jf = os.path.join(TMP, 'jobs.json'); json.dump(jobs, open(jf, 'w'))
subprocess.check_call(['node', os.path.join(ROOT, 'scripts/pp4_raster.js'), jf], cwd=ROOT)
for j in jobs:
    k = os.path.basename(j['out'])[:-4]
    im = Image.open(j['out']).convert('RGBA')
    flat = Image.new('RGB', im.size, P['palettes'][WAY[k]]['bg'])
    flat.paste(im, (0, 0), im)
    flat.save(os.path.join(ROOT, 'public/pp4/view_' + k + '.jpg'), quality=92)
    print('ok', k)
