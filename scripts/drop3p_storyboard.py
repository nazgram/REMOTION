"""Storyboard sheet for PetalPopDrop3Photo: python3 scripts/drop3p_storyboard.py <stillsDir> <out.png> <version>"""
import sys
from PIL import Image, ImageDraw, ImageFont
D, OUT, VER = sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else 'v1'
SHOTS = [
    ('0.8', 'A: kamera tolak ke tepi, halaman Buttercup'), ('2.0', 'sticker + bunga pop bila masuk frame'), ('3.5', 'halaman Camellia, polaroid + tag'),
    ('5.0', 'Petunia'), ('6.5', 'Lavender'), ('7.7', 'Marigold, kamera berhenti'),
    ('8.2', 'B: potong ke grid, sel pop ikut beat'), ('9.0', 'grid 2 x 5, 5 colourway'), ('11.5', 'model timbul keluar sel'),
    ('12.5', 'sticker + bunga stop-motion'), ('13.0', 'grid zoom out'), ('13.7', 'C: logo Pétal Pop Drop 3'),
    ('14.5', '15 November + bunga 4 sudut'), ('15.5', 'NAFESA last'),
]
TW, TH, COLS = 240, 427, 7
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
fb, fs = ImageFont.truetype(F.replace('.ttf', '-Bold.ttf'), 20), ImageFont.truetype(F, 14)
rows = (len(SHOTS) + COLS - 1) // COLS
sheet = Image.new('RGB', (COLS * (TW + 18) + 18, 90 + rows * (TH + 74)), '#f6efe9')
d = ImageDraw.Draw(sheet)
d.text((18, 24), f'Petal Pop Drop 3 · Video gambar {VER} · 16s, lagu contoh 1: pan halaman, grid, end card', font=ImageFont.truetype(F.replace('.ttf', '-Bold.ttf'), 28), fill='#5a2c3f')
for i, (t, cap) in enumerate(SHOTS):
    x, y = 18 + (i % COLS) * (TW + 18), 90 + (i // COLS) * (TH + 74)
    im = Image.open(f'{D}/f_{t}.png').convert('RGB').resize((TW, TH), Image.LANCZOS)
    sheet.paste(im, (x, y))
    d.text((x, y + TH + 8), f'{t}s', font=fb, fill='#5a2c3f')
    d.text((x, y + TH + 36), cap, font=fs, fill='#333')
sheet.save(OUT)
