"""Storyboard sheet for PetalPopDrop3Teaser1: python3 scripts/drop3t_storyboard.py <stillsDir> <out.png> <version>"""
import sys
from PIL import Image, ImageDraw, ImageFont
D, OUT, VER = sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else 'v1'
SHOTS = [
    ('0.6', 'kebun tumbuh dari bawah'), ('1.2', 'bunga naik ke atas'), ('2.2', 'Petal Pop naik dari garis'),
    ('3.2', 'jalur tudung turun (Camellia)'), ('3.55', 'jalur mendarat, berayun'), ('4.9', 'bukaan 4 kelopak: Coming Soon'),
    ('5.85', 'kipas daun buka ke Petunia'), ('6.7', 'pil DROP 3 meregang'), ('7.0', 'huruf DROP 3 jatuh'),
    ('7.85', 'petak flip dari tengah'), ('8.15', 'flip ke Lavender'), ('9.0', 'Lavender, 3 bergoyang'),
    ('9.9', 'zoom out jadi tudung petak'), ('10.5', 'tudung flip...'), ('10.8', '...belakang Marigold'),
    ('11.3', 'lipat bucu ke bucu'), ('12.2', 'segi tiga + 15 November'), ('13.25', 'huruf logo jatuh'),
    ('14.0', 'logo + bunga sudut 3 saiz'), ('14.55', 'jalur magenta naik'), ('15.5', 'NAFESA last'),
]
TW, TH, COLS = 240, 427, 7
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
fb, fs = ImageFont.truetype(F.replace('.ttf', '-Bold.ttf'), 20), ImageFont.truetype(F, 16)
rows = (len(SHOTS) + COLS - 1) // COLS
sheet = Image.new('RGB', (COLS * (TW + 18) + 18, 90 + rows * (TH + 74)), '#f6efe9')
d = ImageDraw.Draw(sheet)
d.text((18, 24), f'Petal Pop Drop 3 · Teaser 1 · storyboard {VER} · gaya Drop 1 & 2, motion baru (16s, 9:16, SFX sahaja)', font=ImageFont.truetype(F.replace('.ttf', '-Bold.ttf'), 28), fill='#5a2c3f')
for i, (t, cap) in enumerate(SHOTS):
    x, y = 18 + (i % COLS) * (TW + 18), 90 + (i // COLS) * (TH + 74)
    im = Image.open(f'{D}/f_{t}.png').convert('RGB').resize((TW, TH), Image.LANCZOS)
    sheet.paste(im, (x, y))
    d.text((x, y + TH + 8), f'{t}s', font=fb, fill='#5a2c3f')
    d.text((x, y + TH + 36), cap, font=fs, fill='#333')
sheet.save(OUT)
