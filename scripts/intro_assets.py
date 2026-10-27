"""Prepare public/intro/ assets for the PetalPopIntro composition.

Usage: python3 scripts/intro_assets.py <"intro video AI" folder>
  FLOWER.png         -> public/intro/flowers/01..09.png (one motif per file, trimmed)
  Logo_Nafesa-04.png -> public/intro/logo_mark.png + logo_word.png (diamond and wordmark, animated apart)
  wash masks         -> public/intro/wash/NN.png (watercolor dissolve, white = flowers still visible)
  Petal Pop.svg      -> src/intro/title.json (outlined Fabulosa, one path per letter)
"""
import json
import os
import re
import sys

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_assets import fbm  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "intro")
FPS = 30
DISSOLVE = (5.0, 6.3)  # seconds, keep in sync with scripts/intro_layout.js


def flowers(src):
    os.makedirs(os.path.join(OUT, "flowers"), exist_ok=True)
    im = Image.open(os.path.join(src, "FLOWER.png")).convert("RGBA")
    small = im.reduce(8)  # label on a small copy, cut out of the full one
    a = np.asarray(small.getchannel("A")) > 10
    lab, n = ndimage.label(ndimage.binary_dilation(a, iterations=2))
    ids = [i for i in range(1, n + 1) if (lab == i).sum() > 300]
    objs = ndimage.find_objects(lab)
    boxes = {i: objs[i - 1] for i in ids}
    ids.sort(key=lambda i: (boxes[i][0].start // 200, boxes[i][1].start))  # reading order: rows, then left to right
    for k, i in enumerate(ids, 1):
        ys, xs = boxes[i]
        keep = Image.fromarray(((lab == i) * 255).astype(np.uint8)).resize(im.size, Image.NEAREST)
        piece = im.copy()
        piece.putalpha(Image.fromarray(np.minimum(np.asarray(im.getchannel("A")), np.asarray(keep))))
        crop = piece.crop((xs.start * 8, ys.start * 8, xs.stop * 8, ys.stop * 8))
        crop = crop.crop(crop.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox())
        crop.thumbnail((900, 900), Image.LANCZOS)
        crop.save(os.path.join(OUT, "flowers", f"{k:02d}.png"), optimize=True)
        print(f"flower {k:02d}", crop.size)


def logo(src):
    im = Image.open(os.path.join(src, "Logo_Nafesa-04.png")).convert("RGBA")
    im = im.crop(im.getchannel("A").getbbox())
    rows = np.asarray(im.getchannel("A")).max(axis=1) > 10
    # the widest empty band of rows separates the diamond from the wordmark
    gaps, start = [], None
    for y, filled in enumerate(rows):
        if not filled and start is None:
            start = y
        if filled and start is not None:
            gaps.append((y - start, start, y))
            start = None
    _, g0, g1 = max(gaps)
    for name, box in (("logo_mark", (0, 0, im.width, g0)), ("logo_word", (0, g1, im.width, im.height))):
        part = im.crop(box)
        part = part.crop(part.getchannel("A").getbbox())
        part.thumbnail((1400, 1400), Image.LANCZOS)
        part.save(os.path.join(OUT, f"{name}.png"), optimize=True)
        print(name, part.size)


def masks():
    """Blotchy, pigment-edged wash that eats the flowers from the centre outwards."""
    w, h = 540, 960
    os.makedirs(os.path.join(OUT, "wash"), exist_ok=True)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    r = np.sqrt(((xx - w * 0.5) / w) ** 2 + ((yy - h * 0.5) / h * 1.1) ** 2) / 0.62
    n = fbm(w, h, 23, 6)
    field = np.clip(r * 0.6 + n * 0.6, 0, 1.2)  # low = washes first
    n_frames = round((DISSOLVE[1] - DISSOLVE[0]) * FPS) + 1
    for k in range(n_frames):
        p = k / (n_frames - 1)
        a = np.clip((field - (-0.08 + p * 1.25)) / 0.09, 0, 1)
        img = Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
        Image.merge("RGBA", [img, img, img, img]).save(os.path.join(OUT, "wash", f"{k:02d}.png"), optimize=True)
    print("wash frames", n_frames)


def title(src):
    svg = open(os.path.join(src, "Petal Pop.svg"), encoding="utf-8").read()
    _, _, w, h = map(float, re.search(r'viewBox="([^"]+)"', svg).group(1).split())
    paths = re.findall(r'<path d="([^"]+)"', svg)
    with open(os.path.join(ROOT, "src", "intro", "title.json"), "w") as f:
        json.dump({"width": w, "height": h, "letters": paths}, f)
    print("title letters", len(paths))


if __name__ == "__main__":
    flowers(sys.argv[1])
    logo(sys.argv[1])
    title(sys.argv[1])
    masks()
