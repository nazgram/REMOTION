"""Assets for PetalPopDrop3Photo (photo collage in the style of the two TikTok references).
   python3 scripts/drop3p_assets.py <dir with the 10 Facetune .heic> <sticker sheet .jpg>
   -> public/drop3p/ : page_<way>.jpg + cut_<way>.png (page photo + die-cut model with a torn white border),
      cardA_<way>.jpg / cardB_<way>.jpg (second photo, scarf detail), cell_<k>.jpg + cellcut_<k>.png (grid cells),
      stk/<name>.png (pink stickers cut out of the sheet), meta.json
"""
import sys, os, json, glob
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
import pillow_heif
pillow_heif.register_heif_opener()

SRC, SHEET = sys.argv[1], sys.argv[2]
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'drop3p')
os.makedirs(OUT + '/stk', exist_ok=True)

# colourway -> (primary photo = the page, secondary = card + grid), by the start of the Facetune name's hash
PHOTOS = {
    'Buttercup': ('b46faba4', 'c0c14ea7'),
    'Camellia': ('305a5ae0', '7f3f5460'),
    'Petunia': ('41a1b8be', '98bade0b'),
    'Lavender': ('a0e7eac9', 'cd16252e'),
    'Marigold': ('b1088f1f', 'c5df9fbe'),
}
ACC = {'Buttercup': '#e889b3', 'Camellia': '#c53b73', 'Petunia': '#ad8a76', 'Lavender': '#b0688f', 'Marigold': '#eeb1c9'}  # outline round the cut-out
CUTS_ONLY = '--cuts-only' in sys.argv
MODE = {'a0e7eac9': 'human', 'cd16252e': 'human'}  # no props added from the general model (plate / chair behind)
PW, PH = 960, 1700           # page
CW, CH = 540, 384            # grid cell
CARD = (540, 675)
rng = np.random.default_rng(7)


def load(h):
    f = glob.glob(os.path.join(SRC, f'{h}*'))[0]
    return Image.open(f).convert('RGB')


def person_mask(im, mode):
    """float mask 0..1 at the size of im: human model, plus (props in hand) the general model near the person"""
    from rembg import new_session, remove
    sm = im.copy(); sm.thumbnail((1024, 1024))
    hm = np.array(remove(sm, session=SESS['h'], only_mask=True)).astype(float) / 255
    if mode == 'union':
        gm = np.array(remove(sm, session=SESS['g'], only_mask=True)).astype(float) / 255
        near = ndi.binary_dilation(hm > 0.5, iterations=int(sm.height * 0.05))
        hm = np.maximum(hm, np.where(near & (gm > 0.55), 1.0, 0.0))
    m = hm > 0.45
    m = ndi.binary_closing(m, iterations=3)
    m = ndi.binary_fill_holes(m)
    lab, n = ndi.label(m)
    if n > 1:  # keep the largest piece plus pieces of a fair size (hand, flowers)
        sizes = ndi.sum(m, lab, range(1, n + 1))
        keep = [i + 1 for i, s in enumerate(sizes) if s > 0.02 * sizes.max()]
        m = np.isin(lab, keep)
    mm = Image.fromarray((m * 255).astype(np.uint8)).resize(im.size, Image.BICUBIC).filter(ImageFilter.GaussianBlur(3))
    return np.array(mm).astype(float) / 255


def bbox(m):
    ys, xs = np.where(m > 0.5)
    return xs.min(), ys.min(), xs.max(), ys.max()


def crop_to(im, m, box, size):
    x0, y0, x1, y1 = [int(round(v)) for v in box]
    x0 = max(0, x0); y0 = max(0, y0); x1 = min(im.width, x1); y1 = min(im.height, y1)
    a = im.crop((x0, y0, x1, y1)).resize(size, Image.LANCZOS)
    b = Image.fromarray((m[y0:y1, x0:x1] * 255).astype(np.uint8)).resize(size, Image.BICUBIC)
    return a, np.array(b).astype(float) / 255


def torn(photo, alpha, r=19, amp=7, accent=None, ring=6, jag=2.2):
    """die-cut with a torn white border: the person's pixels over a ragged white silhouette;
       with accent, a thin coloured line runs round the outside of the white"""
    pa = alpha > 0.5
    dist = ndi.distance_transform_edt(~pa)
    noise = ndi.gaussian_filter(rng.standard_normal(dist.shape), 9)
    noise /= np.abs(noise).max()
    noise2 = ndi.gaussian_filter(rng.standard_normal(dist.shape), 1.3 if accent else 2.5)
    noise2 /= np.abs(noise2).max()
    radius = r + amp * noise + jag * noise2
    border = np.clip((radius - dist) * 1.6 + 0.5, 0, 1)
    pa_s = ndi.gaussian_filter(alpha, 0.9)
    p = np.array(photo).astype(float)
    white = np.array([255, 252, 249.])
    if accent is not None:
        outer = np.clip((radius + ring - dist) * 1.6 + 0.5, 0, 1)
        acc = np.array([int(accent[i:i + 2], 16) for i in (1, 3, 5)], float)
        base = acc[None, None] * (1 - border[..., None]) + white * border[..., None]
        rgb = p * pa_s[..., None] + base * (1 - pa_s[..., None])
        a = np.maximum(outer, pa_s)
    else:
        rgb = p * pa_s[..., None] + white * (1 - pa_s[..., None])
        a = np.maximum(border, pa_s)
    return Image.fromarray(np.dstack([rgb, a * 255]).astype(np.uint8), 'RGBA')


SESS = {}
from rembg import new_session
SESS['h'] = new_session('u2net_human_seg')
SESS['g'] = new_session('isnet-general-use')

meta = {'ways': {}}
cell_i = 0
for way, (a, b) in PHOTOS.items():
    info = {}
    for role, h in (('A', a), ('B', b)):
        im = load(h)
        m = person_mask(im, MODE.get(h, 'union'))
        x0, y0, x1, y1 = bbox(m)
        bw, bh = x1 - x0, y1 - y0
        headx = np.median(np.where(m[y0:y0 + int(bh * 0.1)] > 0.5)[1])
        info[role] = dict(h=h, size=im.size, bbox=[int(x0), int(y0), int(x1), int(y1)], headx=float(headx))
        if role == 'A':
            # page: portrait photo cover-cropped to the page, kept centred on the person
            if im.width < im.height:
                s = PH / im.height
                cx = np.clip(headx * 0.55 + (x0 + x1) / 2 * 0.45, PW / 2 / s, im.width - PW / 2 / s)
                box = (cx - PW / 2 / s, 0, cx + PW / 2 / s, im.height)
            else:
                raise SystemExit('primary photo must be portrait')
            ph, pm = crop_to(im, m, box, (PW, PH))
            ph.save(f'{OUT}/page_{way}.jpg', quality=92)
            cut = torn(ph, pm, r=7, amp=4, accent=ACC[way], ring=6, jag=3.2)
            cut.save(f'{OUT}/cut_{way}.png', optimize=True)
            info['cutbox'] = list(cut.getchannel('A').point(lambda v: 255 if v > 128 else 0).getbbox())
            if CUTS_ONLY:
                break
            # scarf detail card (4:5) from the chest of the same photo
            ch = bh * 0.30; cw = ch * 0.8
            cy = y0 + bh * 0.50
            d, _ = crop_to(im, m, (headx - cw / 2, cy - ch / 2, headx + cw / 2, cy + ch / 2), CARD)
            d.save(f'{OUT}/cardB_{way}.jpg', quality=90)
        else:
            # card (4:5): head and shoulders of the second photo
            ch = bh * 0.62; cw = ch * 0.8
            c, _ = crop_to(im, m, (headx - cw / 2, y0 - bh * 0.06, headx + cw / 2, y0 - bh * 0.06 + ch), CARD)
            c.save(f'{OUT}/cardA_{way}.jpg', quality=90)
        # grid cell (landscape): face and scarf
        ch = bh * 0.40; cw = ch * CW / CH
        box = (headx - cw / 2, y0 - bh * 0.035, headx + cw / 2, y0 - bh * 0.035 + ch)
        cj, cm = crop_to(im, m, box, (CW * 2, CH * 2))
        cj.save(f'{OUT}/cell_{cell_i}.jpg', quality=90)
        torn(cj, cm, r=34, amp=12).save(f'{OUT}/cellcut_{cell_i}.png', optimize=True)
        info[role]['cell'] = cell_i
        cell_i += 1
        del im, m
    if CUTS_ONLY:
        old = json.load(open(OUT + '/meta.json'))
        old['ways'][way]['cutbox'] = info['cutbox']
        json.dump(old, open(OUT + '/meta.json', 'w'))
        print(way, 'cut done', info['cutbox'], flush=True)
        continue
    meta['ways'][way] = info
    print(way, 'done', flush=True)
if CUTS_ONLY:
    raise SystemExit(0)

# ---------- stickers: cut by hand-picked boxes (x0,y0,x1,y1 in a 1333-wide view of the sheet) ----------
BOX = {
    'bow1': (10, 25, 255, 365), 'butterfly1': (490, 32, 728, 240), 'camera1': (880, 28, 1105, 232), 'cherry': (1130, 15, 1320, 262),
    'cup1': (22, 265, 170, 520), 'heartg1': (435, 280, 648, 482), 'cat': (663, 248, 933, 458), 'heart1': (965, 260, 1070, 385),
    'butterfly2': (893, 408, 1088, 627), 'books': (14, 515, 340, 750), 'heartg2': (365, 505, 550, 688), 'bow2': (718, 518, 893, 685),
    'heartl1': (255, 725, 422, 878), 'strawberry': (758, 707, 921, 886), 'candle': (443, 731, 588, 925), 'envelope': (733, 892, 980, 1112),
    'cup2': (998, 865, 1168, 1128), 'heart2': (1195, 778, 1302, 887), 'heart3': (1190, 937, 1310, 1060), 'bow3': (403, 937, 598, 1108),
    'polaroid': (177, 910, 393, 1140), 'sunglasses': (233, 1138, 583, 1290), 'heartg3': (1158, 1090, 1308, 1238), 'bow4': (700, 1165, 862, 1368),
    'scrunchie': (985, 1222, 1210, 1418), 'camera2': (23, 1270, 253, 1480), 'butterfly3': (277, 1308, 478, 1475), 'heartl2': (683, 1385, 878, 1558),
    'bowg1': (893, 1408, 1133, 1598), 'cloud1': (10, 1497, 197, 1628), 'jar': (233, 1500, 402, 1672), 'hat': (440, 1520, 685, 1648),
    'heart4': (727, 1612, 790, 1688), 'hearts5': (1163, 1517, 1307, 1635), 'heart5': (225, 1690, 365, 1803), 'bowg2': (370, 1677, 558, 1810),
    'headphones': (593, 1665, 757, 1830), 'heartg4': (985, 1635, 1157, 1785), 'cup3': (1160, 1530, 1310, 1860), 'butterfly4': (975, 1795, 1152, 1968),
    'moon': (160, 1832, 275, 1955), 'heartg5': (490, 1848, 605, 1960), 'cloud2': (613, 1855, 815, 1950), 'bow5': (1172, 1865, 1308, 1970),
}
sheet = Image.open(SHEET).convert('RGB')
f = sheet.width / 1333
bgc = np.array([253, 249, 250.])
for name, (x0, y0, x1, y1) in BOX.items():
    box = [int(round(v * f)) for v in (x0, y0, x1, y1)]
    c = sheet.crop(box)
    a = np.array(c).astype(float)
    d = np.abs(a - bgc).max(axis=2)
    m = ndi.binary_dilation(ndi.binary_closing(d > 13, iterations=2), iterations=2)
    lab, n = ndi.label(m)
    sizes = ndi.sum(m, lab, range(1, n + 1))
    m = lab == (1 + int(np.argmax(sizes)))
    m = ndi.binary_fill_holes(m)
    S = 3
    big = c.resize((c.width * S, c.height * S), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 90, 2))
    mm = Image.fromarray((m * 255).astype(np.uint8)).resize(big.size, Image.BICUBIC).filter(ImageFilter.GaussianBlur(2.2))
    ma = np.array(mm).astype(float) / 255
    ma = np.clip((ma - 0.5) * 3 + 0.5, 0, 1)
    ma = ndi.binary_dilation(ma > 0.5, iterations=5).astype(float)  # a little white rim round the die-cut
    ma = ndi.gaussian_filter(ma, 1.4)
    rgb = np.array(big).astype(float)
    # outside the original sticker the rim is white
    inner = np.array(Image.fromarray((m * 255).astype(np.uint8)).resize(big.size, Image.BICUBIC)).astype(float) / 255
    inner = np.clip((ndi.gaussian_filter(inner, 2.2) - 0.5) * 3 + 0.5, 0, 1)
    rgb = rgb * inner[..., None] + np.array([255, 252, 252.]) * (1 - inner[..., None])
    out = Image.fromarray(np.dstack([rgb, ma * 255]).astype(np.uint8), 'RGBA')
    bb = out.getbbox(); out = out.crop(bb)
    out.save(f'{OUT}/stk/{name}.png', optimize=True)
    meta.setdefault('stk', {})[name] = [out.width // S, out.height // S]
json.dump(meta, open(OUT + '/meta.json', 'w'))
print('stickers', len(BOX))
