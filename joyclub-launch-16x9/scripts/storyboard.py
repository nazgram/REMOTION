"""Gabung still frame v3 jadi satu storyboard berlabel."""
import json, sys
from PIL import Image, ImageDraw, ImageFont
ST = 'out/v3/st/'
b = json.load(open('public/v3/beats.json'))['beats']
F = 'public/v3/Poppins-'
fb, fr, ft = ImageFont.truetype(F + 'Bold.ttf', 26), ImageFont.truetype(F + 'Medium.ttf', 20), ImageFont.truetype(F + 'Bold.ttf', 46)
ITEMS = [
    ('01_intro_bulatan', '0:03', 'INTRO', 'Latar cream. Bulatan semua warna pop satu setiap beat, bernafas ikut beat.'),
    ('02_dot_sapu_masuk', '0:04', 'A · DOT SAPU', 'Corak PEARL menutup skrin dari tepi (dot membesar berperingkat).'),
    ('03_pearl_grid3', '0:05', 'PEARL · GRID 3', '3 panel vertical penuh skrin, garis putih 4px. Hard cut panel demi panel ikut beat.'),
    ('04_pearl_nama', '0:07', 'NAMA', 'Plat bulat + nama design di tengah, 3 bulatan aksen pop dari tepi.'),
    ('05_cutout_ke_grid2', '0:07', 'C · CUTOUT', 'Grid 2 muncul dalam kotak sejajar panel, satu kotak setiap separuh beat.'),
    ('06_pearl_grid2', '0:09', 'GRID 2', '2 panel separuh badan / detail, hard cut ikut beat.'),
    ('07_landscape_detail', '0:10', 'B · LANDSCAPE', 'Close-up landscape penuh skrin, slow motion 50% (speed ramp).'),
    ('08_sapu_ke_sky', '0:11', 'A · KE SKY', 'Corak SKY menyapu skrin, terbuka semula ke grid SKY.'),
    ('09_sky_nama', '0:13', 'SKY · NAMA', 'Corak sama untuk setiap design.'),
    ('10_blush_nama', '0:19', 'BLUSH · NAMA', 'Warna plat dan bulatan ikut design.'),
    ('11_ruby_nama', '0:27', 'RUBY · NAMA', ''),
    ('12_silver_grid2', '0:35', 'SILVER · GRID 2', 'SILVER design terakhir, hard cut ke klimaks.'),
    ('13_klimaks', '0:39', 'KLIMAKS', '5 panel, satu setiap design. Bulatan pop di sudut.'),
    ('14_joyclub_bulatan', '0:41', 'JOY CLUB', 'Latar corak Silver. Bulatan biru & merah bergerak jadi huruf O dan U.'),
    ('15_joyclub_logo', '0:42', 'JOY CLUB', 'Logo penuh + AVAILABLE NOW.'),
    ('16_nafesa', '0:44', 'NAFESA', 'Logo olive atas cream, bulatan olive & tan, dot halus. Lagu fade.'),
]
tw, th, pad, cap = 600, 338, 26, 92
cols = 4
rows = (len(ITEMS) + cols - 1) // cols
img = Image.new('RGB', (cols * tw + (cols + 1) * pad, 130 + rows * (th + cap + pad)), (250, 247, 242))
d = ImageDraw.Draw(img)
d.text((pad, 34), 'JOY CLUB · Video Launching 16:9 v3 · Storyboard still frame', font=ft, fill=(30, 30, 30))
for i, (fn, t, title, desc) in enumerate(ITEMS):
    x = pad + (i % cols) * (tw + pad); y = 130 + (i // cols) * (th + cap + pad)
    img.paste(Image.open(ST + fn + '.jpg').resize((tw, th), Image.LANCZOS), (x, y))
    d.text((x, y + th + 8), f'{i + 1}. {t}  {title}', font=fb, fill=(177, 31, 36))
    words, line, ly = desc.split(), '', y + th + 44
    for w_ in words:
        if d.textlength(line + ' ' + w_, font=fr) > tw:
            d.text((x, ly), line.strip(), font=fr, fill=(50, 50, 50)); ly += 24; line = ''
        line += ' ' + w_
    d.text((x, ly), line.strip(), font=fr, fill=(50, 50, 50))
out = sys.argv[1] if len(sys.argv) > 1 else 'out/v3/storyboard-v3.png'
img.save(out, optimize=True); print(out, img.size)
