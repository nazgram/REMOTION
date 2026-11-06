"""Storyboard sheet for PetalPopDrop3Teaser: python3 scripts/drop3_storyboard.py <stillsDir> <out.png>"""
import sys
from PIL import Image, ImageDraw, ImageFont
D, OUT = sys.argv[1], sys.argv[2]
SHOTS = [
    ('0.3', 'bunga Buttercup mekar depan lensa'), ('0.9', 'lalu kamera, buka scene'),
    ('2.0', 'corak print di belakang, parallax'), ('3.5', 'bunga besar seterusnya dah datang'),
    ('4.4', 'hero terbang lalu lensa'), ('4.7', 'Camellia mekar dari tengah'),
    ('6.0', 'bunga kecil melayang 3D'), ('8.1', 'Petunia hitam mekar keluar'),
    ('10.0', 'Petunia: bunga putih melayang'), ('11.75', 'Lavender mekar dari tengah'),
    ('13.5', 'Lavender'), ('15.5', 'Marigold'),
    ('17.5', 'kamera mula perlahan'), ('19.0', 'hero terakhir lalu jadi wash'),
    ('21.5', 'kelopak berpusar keliling logo'), ('24.5', 'NAFESA last'),
]
TW, TH, COLS = 270, 480, 8
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
fb, fs = ImageFont.truetype(F.replace('.ttf', '-Bold.ttf'), 22), ImageFont.truetype(F, 17)
rows = (len(SHOTS) + COLS - 1) // COLS
sheet = Image.new('RGB', (COLS * (TW + 20) + 20, 90 + rows * (TH + 80)), '#f6efe9')
d = ImageDraw.Draw(sheet)
d.text((20, 22), 'Petal Pop Drop 3 · Teaser 1 · storyboard v4 · terbang lalu taman berlapis, latar ikut print (25s, 9:16, SFX sahaja)', font=ImageFont.truetype(F.replace('.ttf', '-Bold.ttf'), 30), fill='#5a2c3f')
for i, (t, cap) in enumerate(SHOTS):
    x, y = 20 + (i % COLS) * (TW + 20), 90 + (i // COLS) * (TH + 80)
    im = Image.open(f'{D}/f_{t}.png').convert('RGB').resize((TW, TH), Image.LANCZOS)
    sheet.paste(im, (x, y))
    d.text((x, y + TH + 8), f'{t}s', font=fb, fill='#5a2c3f')
    d.text((x, y + TH + 38), cap, font=fs, fill='#333')
sheet.save(OUT)
