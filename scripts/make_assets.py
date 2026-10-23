"""Prepare public/ assets: trimmed flower sprigs, paper grain, watercolor dissolve masks.

Usage: python3 scripts/make_assets.py <folder with the 10 sprig PNGs>
"""
import glob
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, "public")
FPS = 30
DISSOLVE = (6.5, 8.0)  # seconds, keep in sync with src/timeline.ts


def sprigs(src):
    os.makedirs(os.path.join(PUB, "flowers"), exist_ok=True)
    for i, f in enumerate(sorted(glob.glob(os.path.join(src, "*.png"))), 1):
        im = Image.open(f).convert("RGBA")
        im = im.crop(im.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox())
        im.thumbnail((720, 720), Image.LANCZOS)
        im.save(os.path.join(PUB, "flowers", f"{i:02d}.png"), optimize=True)
        print(f"{i:02d}", os.path.basename(f), im.size)


def fbm(w, h, seed, octaves=5):
    rng = np.random.default_rng(seed)
    out = np.zeros((h, w), np.float32)
    amp, total = 1.0, 0.0
    for o in range(octaves):
        cw, ch = max(2, w >> (5 - o)), max(2, h >> (5 - o))
        layer = Image.fromarray((rng.random((ch, cw)) * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
        out += np.asarray(layer, np.float32) / 255 * amp
        total += amp
        amp *= 0.55
    return out / total


def paper():
    w, h = 1080, 1920
    g = fbm(w, h, 7, 6)
    fine = np.random.default_rng(3).random((h, w)).astype(np.float32)
    v = (g - g.mean()) * 0.5 + (fine - 0.5) * 0.5
    a = np.clip(np.abs(v) * 40, 0, 16).astype(np.uint8)
    rgb = np.where(v[..., None] > 0, [255, 252, 240], [120, 98, 70]).astype(np.uint8)
    Image.fromarray(np.dstack([rgb, a]), "RGBA").save(os.path.join(PUB, "paper.png"), optimize=True)


def masks():
    """Alpha masks for the watercolor wash: the flowers wash away from the centre outwards,
    with blotchy, pigment-like edges. White/opaque = flowers still visible."""
    w, h = 540, 960
    os.makedirs(os.path.join(PUB, "wash"), exist_ok=True)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    r = np.sqrt(((xx - w * 0.5) / w) ** 2 + ((yy - h * 0.55) / h * 1.1) ** 2) / 0.62
    n = fbm(w, h, 11, 6)
    field = np.clip(r * 0.62 + n * 0.55, 0, 1.2)  # low = washes first
    n_frames = round((DISSOLVE[1] - DISSOLVE[0]) * FPS) + 1
    for k in range(n_frames):
        p = k / (n_frames - 1)
        thr = -0.08 + p * 1.25
        soft = 0.09
        a = np.clip((field - thr) / soft, 0, 1)
        img = Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
        Image.merge("RGBA", [img, img, img, img]).save(os.path.join(PUB, "wash", f"{k:02d}.png"), optimize=True)
    print("wash frames", n_frames)


if __name__ == "__main__":
    sprigs(sys.argv[1])
    paper()
    masks()
