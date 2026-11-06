"""Storyboard sheet for PetalPopDrop3Teaser: python3 scripts/drop3_storyboard.py <stillsDir> <out.png>"""
import sys
from PIL import Image, ImageDraw, ImageFont
D, OUT = sys.argv[1], sys.argv[2]
SHOTS = [
    ('0.3', 'Buttercup mekar depan lensa'), ('1.0', 'lalu kamera, buka scene'),
    ('3.4', 'bunga besar seterusnya datang'), ('5.3', 'bunga gergasi lintas skrin...'),
    ('5.67', '...tutup penuh, warna tukar'), ('6.2', 'Camellia'),
    ('9.33', 'tutup, tukar ke Petunia'), ('10.5', 'Petunia hitam'),
    ('13.0', 'tutup, tukar ke Lavender'), ('14.5', 'Lavender'),
    ('16.67', 'tutup, tukar ke Marigold'), ('18.0', 'Marigold'),
    ('19.7', 'tutup terakhir, jadi wash'), ('21.2', 'bunga bersaiz bingkai sudut'),
    ('22.5', 'logo Drop 3'), ('24.6', 'NAFESA last'),
]
TW, TH, COLS = 270, 480, 8
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
fb, fs = ImageFont.truetype(F.replace('.ttf', '-Bold.ttf'), 22), ImageFont.truetype(F, 17)
rows = (len(SHOTS) + COLS - 1) // COLS
sheet = Image.new('RGB', (COLS * (TW + 20) + 20, 90 + rows * (TH + 80)), '#f6efe9')
d = ImageDraw.Draw(sheet)
d.text((20, 22), 'Petal Pop Drop 3 · Teaser 1 · storyboard v5 · bunga gergasi lintas skrin untuk tukar warna (25s, 9:16, SFX sahaja)', font=ImageFont.truetype(F.replace('.ttf', '-Bold.ttf'), 30), fill='#5a2c3f')
for i, (t, cap) in enumerate(SHOTS):
    x, y = 20 + (i % COLS) * (TW + 20), 90 + (i // COLS) * (TH + 80)
    im = Image.open(f'{D}/f_{t}.png').convert('RGB').resize((TW, TH), Image.LANCZOS)
    sheet.paste(im, (x, y))
    d.text((x, y + TH + 8), f'{t}s', font=fb, fill='#5a2c3f')
    d.text((x, y + TH + 38), cap, font=fs, fill='#333')
sheet.save(OUT)
