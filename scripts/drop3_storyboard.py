"""Storyboard sheet for PetalPopDrop3Teaser: python3 scripts/drop3_storyboard.py <stillsDir> <out.png>"""
import sys
from PIL import Image, ImageDraw, ImageFont
D, OUT = sys.argv[1], sys.argv[2]
SHOTS = [
    ('0.8', 'Buttercup tumbuh dari jauh'), ('2.8', 'kamera terbang ke depan'),
    ('3.6', 'bunga besar makin dekat'), ('4.3', 'lalu tepi, belakang kamera'),
    ('5.4', 'Camellia masuk, angin kiri ke kanan'), ('6.5', 'pan ke kanan'),
    ('8.0', 'Camellia lalu, Petunia dari jauh'), ('9.5', 'Petunia'),
    ('11.0', 'Petunia besar lalu kanan'), ('12.5', 'Lavender'),
    ('14.0', 'Lavender ke Marigold'), ('15.5', 'Marigold'),
    ('17.0', 'daun besar lalu, kamera perlahan'), ('20.0', 'jadi wash kabur'),
    ('22.2', 'logo Drop 3'), ('24.6', 'NAFESA last'),
]
TW, TH, COLS = 270, 480, 8
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
fb, fs = ImageFont.truetype(F.replace('.ttf', '-Bold.ttf'), 22), ImageFont.truetype(F, 17)
rows = (len(SHOTS) + COLS - 1) // COLS
sheet = Image.new('RGB', (COLS * (TW + 20) + 20, 90 + rows * (TH + 80)), '#f6efe9')
d = ImageDraw.Draw(sheet)
d.text((20, 22), 'Petal Pop Drop 3 · Teaser 1 · storyboard v3 · kamera terbang, bunga ditiup angin (25.5s, 9:16, SFX sahaja)', font=ImageFont.truetype(F.replace('.ttf', '-Bold.ttf'), 30), fill='#5a2c3f')
for i, (t, cap) in enumerate(SHOTS):
    x, y = 20 + (i % COLS) * (TW + 20), 90 + (i // COLS) * (TH + 80)
    im = Image.open(f'{D}/f_{t}.png').convert('RGB').resize((TW, TH), Image.LANCZOS)
    sheet.paste(im, (x, y))
    d.text((x, y + TH + 8), f'{t}s', font=fb, fill='#5a2c3f')
    d.text((x, y + TH + 38), cap, font=fs, fill='#333')
sheet.save(OUT)
