"""Storyboard sheet for PetalPopDrop4Catalog: python3 scripts/drop4c_storyboard.py <stillsDir> <out.png>"""
import sys
from PIL import Image, ImageDraw, ImageFont
D, OUT = sys.argv[1], sys.argv[2]
SHOTS = [
    ('0.3', 'logo muncul besar'), ('1.2', 'cursor tarik bucu, kecilkan'), ('2.4', 'logo naik, cover masuk'),
    ('3.0', 'cover jatuh atas meja'), ('3.8', 'marquee: COVER · DROP 4'), ('4.9', 'Black Dahlia dibawa masuk'),
    ('5.6', 'eyedropper klik tudung'), ('6.0', 'swatch print terbang + bunga pop'), ('7.3', 'Dusty Rose'),
    ('9.2', 'Lilac Mist'), ('11.1', 'Pearl Grey'), ('12.9', 'Powder Blue'), ('14.5', 'Sage Petal (6 swatch)'),
    ('15.0', 'timbunan page hilang'), ('15.6', '6 page jadi satu baris'), ('16.1', 'SELECT ALL · 6'),
    ('16.4', 'scale masuk pil DROP 4'), ('17.2', 'pil berdenyut, logo ke tengah'), ('18.9', 'logo Petal Pop sahaja'),
    ('21.6', 'NAFESA last (alamat dibuang)'),
]
TW, TH, COLS = 270, 480, 10
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
fb, fs = ImageFont.truetype(F.replace('.ttf', '-Bold.ttf'), 22), ImageFont.truetype(F, 16)
rows = (len(SHOTS) + COLS - 1) // COLS
sheet = Image.new('RGB', (COLS * (TW + 20) + 20, 90 + rows * (TH + 80)), '#fbf5ea')
d = ImageDraw.Draw(sheet)
d.text((20, 24), 'Petal Pop Drop 4 · Catalog editor-moves reel · storyboard v1 (22.5s, 9:16, SFX sahaja)', font=ImageFont.truetype(F.replace('.ttf', '-Bold.ttf'), 32), fill='#b03f74')
for i, (t, cap) in enumerate(SHOTS):
    x, y = 20 + (i % COLS) * (TW + 20), 90 + (i // COLS) * (TH + 80)
    sheet.paste(Image.open(f'{D}/f_{t}.png').convert('RGB').resize((TW, TH), Image.LANCZOS), (x, y))
    d.text((x, y + TH + 8), f'{t}s', font=fb, fill='#b03f74')
    d.text((x, y + TH + 38), cap, font=fs, fill='#333')
sheet.save(OUT)
