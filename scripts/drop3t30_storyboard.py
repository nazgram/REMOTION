"""Storyboard sheet for PetalPopDrop3Teaser30: python3 scripts/drop3t30_storyboard.py <stillsDir> <out.png> <version>"""
import sys
from PIL import Image, ImageDraw, ImageFont
D, OUT, VER = sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else 'v1'
SHOTS = [
    ('0.3', 'HOOK: fast cut (Marigold)'), ('0.9', 'cut 0.3s + bunga pop di tepi'), ('1.5', 'cut laju, bunga makin penuh'),
    ('2.0', 'cut terakhir hook'), ('2.5', 'klip tutup jadi 4 kelopak'), ('3.4', 'kebun tumbuh dari bawah'), ('4.6', 'Petal Pop naik dari garis'),
    ('5.4', '4 kelopak buka: klip Buttercup'), ('6.0', 'klip speed biasa 1.3s'), ('7.5', 'SLOWMO hero Buttercup'), ('8.5', 'Camellia mekar tutup klip'),
    ('9.2', 'kecut jadi print Camellia'), ('10.3', '4 kelopak: Coming Soon'), ('11.0', 'kelopak sama buka jadi klip'),
    ('12.0', 'klip biasa Camellia'), ('13.5', 'SLOWMO hero Camellia'), ('14.3', 'Petunia mekar dari tengah'), ('15.8', 'print Petunia + DROP 3'),
    ('16.7', 'kelopak buka: klip Petunia'), ('17.3', 'klip biasa Petunia'), ('19.0', 'SLOWMO hero Petunia'),
    ('19.7', 'Lavender mekar dari bucu'), ('20.7', 'print Lavender'), ('21.4', 'kelopak buka: klip Lavender'), ('22.4', 'SLOWMO hero Lavender'),
    ('23.2', 'klip tutup balik ke print'), ('24.0', 'zoom out jadi tudung petak'), ('24.8', 'tudung pusing ke Marigold'),
    ('25.6', 'lipat bucu ke bucu'), ('26.6', 'segi tiga + 15 November'), ('28.3', 'logo + bunga 4 sudut'), ('29.3', 'Camellia mekar dari tengah'),
    ('29.7', 'bunga cair jadi magenta'), ('30.8', 'NAFESA last'),
]
TW, TH, COLS = 240, 427, 7
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
fb, fs = ImageFont.truetype(F.replace('.ttf', '-Bold.ttf'), 20), ImageFont.truetype(F, 16)
rows = (len(SHOTS) + COLS - 1) // COLS
sheet = Image.new('RGB', (COLS * (TW + 18) + 18, 90 + rows * (TH + 74)), '#f6efe9')
d = ImageDraw.Draw(sheet)
d.text((18, 24), f'Petal Pop Drop 3 · Teaser {VER} · 31s dengan klip raw: hook fast cut, slowmo hero, bunga tepi frame', font=ImageFont.truetype(F.replace('.ttf', '-Bold.ttf'), 28), fill='#5a2c3f')
for i, (t, cap) in enumerate(SHOTS):
    x, y = 18 + (i % COLS) * (TW + 18), 90 + (i // COLS) * (TH + 74)
    im = Image.open(f'{D}/f_{t}.png').convert('RGB').resize((TW, TH), Image.LANCZOS)
    sheet.paste(im, (x, y))
    d.text((x, y + TH + 8), f'{t}s', font=fb, fill='#5a2c3f')
    d.text((x, y + TH + 36), cap, font=fs, fill='#333')
sheet.save(OUT)
