"""Storyboard sheet for PetalPopDrop3Photo: python3 scripts/drop3p_storyboard.py <stillsDir> <out.png> <version>"""
import sys
from PIL import Image, ImageDraw, ImageFont
D, OUT, VER = sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else 'v1'
SHOTS = [
    ('0.2', 'mula: halaman Buttercup, latar kuning'), ('0.9', 'polaroid masuk bertindih tepi halaman'), ('1.6', 'model timbul: outline koyak + kilau'),
    ('2.9', 'kamera terus gerak, latar jadi Camellia'), ('3.7', 'kad feed + model Camellia timbul'), ('5.1', 'Petunia, latar wine'),
    ('6.3', 'polaroid Petunia + sticker pink'), ('7.4', 'Lavender, latar ungu, model timbul'), ('8.6', 'Marigold masuk'),
    ('9.6', 'model Marigold timbul'), ('10.6', 'halaman krim akhir masuk, bunga pop'), ('12.1', 'logo, halaman membesar penuh skrin'),
    ('13.8', '15 November'), ('15.6', 'NAFESA last'),
]
TW, TH, COLS = 240, 427, 7
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
fb, fs = ImageFont.truetype(F.replace('.ttf', '-Bold.ttf'), 20), ImageFont.truetype(F, 12)
rows = (len(SHOTS) + COLS - 1) // COLS
sheet = Image.new('RGB', (COLS * (TW + 18) + 18, 90 + rows * (TH + 74)), '#f6efe9')
d = ImageDraw.Draw(sheet)
d.text((18, 24), f'Petal Pop Drop 3 · Video gambar {VER} · 16s, lagu contoh 1: susun macam contoh 1, latar warna Petal Pop 3', font=ImageFont.truetype(F.replace('.ttf', '-Bold.ttf'), 28), fill='#5a2c3f')
for i, (t, cap) in enumerate(SHOTS):
    x, y = 18 + (i % COLS) * (TW + 18), 90 + (i // COLS) * (TH + 74)
    im = Image.open(f'{D}/f_{t}.png').convert('RGB').resize((TW, TH), Image.LANCZOS)
    sheet.paste(im, (x, y))
    d.text((x, y + TH + 8), f'{t}s', font=fb, fill='#5a2c3f')
    d.text((x, y + TH + 36), cap, font=fs, fill='#333')
sheet.save(OUT)
