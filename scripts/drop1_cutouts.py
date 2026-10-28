# Cut the model + full scarf out of each Drop 1 page for the "cut out" look in PetalPopDrop1.
#   pip install rembg; run rembg (birefnet-portrait) per page into public/drop1/cut/pageXX_raw.png first, e.g.
#   python3 -c "from rembg import new_session,remove;from PIL import Image;remove(Image.open('public/drop1/page03.png').convert('RGB'),session=new_session('birefnet-portrait')).save('public/drop1/cut/page03_raw.png')"
#   python3 scripts/drop1_cutouts.py   ->  public/drop1/cut/pageXX.png (trimmed) + src/drop1/cutouts.json (bbox + outline path in page px)
import json, glob, os
import numpy as np
from PIL import Image
from scipy import ndimage
from skimage import measure

out = {}
for f in sorted(glob.glob('public/drop1/cut/page*_raw.png')):
    page = os.path.basename(f)[:6]
    im = np.array(Image.open(f).convert('RGBA'))
    a = im[..., 3]
    # page furniture the matte keeps: footer line, the DROP 1 pill on the cover, the Moonflower title over her hand, the chair
    a[1560:] = 0
    rgb = im[..., :3].astype(int)
    warm = rgb[..., 0] - rgb[..., 2]
    if page == 'page01':  # salmon DROP 1 pill beside her hip
        a[1440:] = np.where(warm[1440:] > 60, 0, a[1440:])
    if page == 'page07':
        # the "Moonflower" title is printed across her hand: paint the letters out with the skin around them,
        # then keep only skin in that strip
        from skimage.restoration import inpaint_biharmonic
        y0, y1, x0, x1 = 625, 800, 150, 560
        src = np.array(Image.open('public/drop1/page07.png').convert('RGB'))[y0:y1, x0:x1].astype(float) / 255
        text = ndimage.binary_dilation(src.mean(2) < 0.42, iterations=2)
        fixed = inpaint_biharmonic(src, text, channel_axis=-1)
        im[y0:y1, x0:x1, :3] = (fixed * 255).astype(np.uint8)
        rgb = im[..., :3].astype(int)
        warm = rgb[..., 0] - rgb[..., 2]
        lum = rgb.mean(2)
        skin = ndimage.binary_opening((warm > 45) & (lum < 235), iterations=2)
        a[630:795, :560] = np.where(skin[630:795, :560], 255, 0)
        a[630:795, :560] = ndimage.gaussian_filter(a[630:795, :560].astype(float), 1).astype(np.uint8)
        a[1275:1600, 270:378] = 0  # rattan chair left of the scarf
    lab, n = ndimage.label(a > 40)
    sizes = ndimage.sum(np.ones_like(a), lab, range(1, n + 1))
    keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > 0.03 * sizes.max()])
    keep = ndimage.binary_dilation(keep, iterations=3)
    im[..., 3] = np.where(keep, a, 0)
    ys, xs = np.where(im[..., 3] > 8)
    x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    Image.fromarray(im[y0:y1, x0:x1]).save(f'public/drop1/cut/{page}.png', optimize=True)
    # outline for the "select subject" marching ants: the biggest contour, thinned to ~200 points
    m = ndimage.binary_fill_holes(im[..., 3] > 100)
    cs = measure.find_contours(np.pad(m, 1).astype(float), 0.5)
    c = max(cs, key=len)[:: max(1, len(max(cs, key=len)) // 220)] - 1
    path = 'M' + ' L'.join(f'{p[1]:.0f} {p[0]:.0f}' for p in c) + ' Z'
    out[page] = {'x': int(x0), 'y': int(y0), 'w': int(x1 - x0), 'h': int(y1 - y0), 'outline': path}
    print(page, out[page]['x'], out[page]['y'], out[page]['w'], out[page]['h'], len(c))
json.dump(out, open('src/drop1/cutouts.json', 'w'))
