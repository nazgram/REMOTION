"""Storyboard sheet for PetalPopDrop3Teaser: python3 scripts/drop3_storyboard.py <stillsDir> <out.png>"""
import sys
from PIL import Image, ImageDraw, ImageFont
D, OUT = sys.argv[1], sys.argv[2]
SHOTS = [
    ('0.8', 'Buttercup: daun tumbuh dari bawah'), ('2.5', 'bunga jatuh dari atas, hold'),
    ('4.1', 'cat air bleed ke Camellia'), ('5.8', 'Camellia: 2 motif gergasi'),
    ('8.1', 'bleed ke Petunia (hitam)'), ('9.8', 'Petunia: diagonal'),
    ('12.1', 'bleed ke Lavender'), ('13.8', 'Lavender (cermin)'),
    ('16.1', 'bleed ke Marigold'), ('18.0', 'Marigold hold, goyang halus'),
    ('19.8', 'semua jadi wash kabur'), ('20.6', 'logo Drop 3 "ditulis" masuk'),
    ('22.2', 'logo hold'), ('24.6', 'NAFESA last'),
]
TW, TH, COLS = 300, 533, 7
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
fb, fs = ImageFont.truetype(F.replace('.ttf', '-Bold.ttf'), 22), ImageFont.truetype(F, 17)
rows = (len(SHOTS) + COLS - 1) // COLS
sheet = Image.new('RGB', (COLS * (TW + 20) + 20, 90 + rows * (TH + 80)), '#f6efe9')
d = ImageDraw.Draw(sheet)
d.text((20, 22), 'Petal Pop Drop 3 · Teaser 1 · storyboard v1 (25.5s, 9:16, lagu + SFX)', font=ImageFont.truetype(F.replace('.ttf', '-Bold.ttf'), 30), fill='#5a2c3f')
for i, (t, cap) in enumerate(SHOTS):
    x, y = 20 + (i % COLS) * (TW + 20), 90 + (i // COLS) * (TH + 80)
    im = Image.open(f'{D}/f_{t}.png').convert('RGB').resize((TW, TH), Image.LANCZOS)
    sheet.paste(im, (x, y))
    d.text((x, y + TH + 8), f'{t}s', font=fb, fill='#5a2c3f')
    d.text((x, y + TH + 38), cap, font=fs, fill='#333')
sheet.save(OUT)
