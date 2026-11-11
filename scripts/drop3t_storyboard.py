"""Storyboard sheet for PetalPopDrop3Teaser1: python3 scripts/drop3t_storyboard.py <stillsDir> <out.png> <version>"""
import sys
from PIL import Image, ImageDraw, ImageFont
D, OUT, VER = sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else 'v1'
SHOTS = [
    ('0.6', 'kebun tumbuh dari bawah'), ('2.2', 'Petal Pop naik dari garis'), ('3.0', 'Camellia mekar dari bawah'),
    ('3.35', 'bunga mekar tutup skrin'), ('3.75', 'kecut balik jadi print'), ('4.9', '4 kelopak: Coming Soon'),
    ('6.05', 'Petunia mekar dari tengah'), ('6.45', 'tutup lembut'), ('7.1', 'jadi print Petunia + DROP 3'),
    ('8.5', 'Lavender dari bucu kanan'), ('8.85', 'tutup lembut'), ('9.6', 'Lavender, 3 bergoyang'),
    ('10.4', 'zoom out jadi tudung petak'), ('11.35', 'tudung pusing ke Marigold'), ('12.1', 'lipat bucu ke bucu'),
    ('12.9', 'segi tiga + 15 November'), ('14.4', 'logo + bunga sudut 3 saiz'), ('15.5', 'Camellia mekar dari tengah'),
    ('16.0', 'bunga cair jadi magenta'), ('16.4', 'NAFESA muncul'), ('17.2', 'NAFESA last'),
]
TW, TH, COLS = 240, 427, 7
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
fb, fs = ImageFont.truetype(F.replace('.ttf', '-Bold.ttf'), 20), ImageFont.truetype(F, 16)
rows = (len(SHOTS) + COLS - 1) // COLS
sheet = Image.new('RGB', (COLS * (TW + 18) + 18, 90 + rows * (TH + 74)), '#f6efe9')
d = ImageDraw.Draw(sheet)
d.text((18, 24), f'Petal Pop Drop 3 · Teaser 1 · storyboard {VER} · transition bunga mekar yang lembut (17.5s, 9:16, SFX sahaja)', font=ImageFont.truetype(F.replace('.ttf', '-Bold.ttf'), 28), fill='#5a2c3f')
for i, (t, cap) in enumerate(SHOTS):
    x, y = 18 + (i % COLS) * (TW + 18), 90 + (i // COLS) * (TH + 74)
    im = Image.open(f'{D}/f_{t}.png').convert('RGB').resize((TW, TH), Image.LANCZOS)
    sheet.paste(im, (x, y))
    d.text((x, y + TH + 8), f'{t}s', font=fb, fill='#5a2c3f')
    d.text((x, y + TH + 36), cap, font=fs, fill='#333')
sheet.save(OUT)
