"""Gabung still frame v3 jadi satu storyboard berlabel."""
import json, sys
from PIL import Image, ImageDraw, ImageFont
ST = 'out/v3/st/'
b = json.load(open('public/v3/beats.json'))['beats']
F = 'public/v3/Poppins-'
fb, fr, ft = ImageFont.truetype(F + 'Bold.ttf', 26), ImageFont.truetype(F + 'Medium.ttf', 20), ImageFont.truetype(F + 'Bold.ttf', 46)
ITEMS = [
    ('01a_intro_punch', '0:01', 'INTRO · PUNCH', 'Bar 1: satu bulatan besar menghentak skrin setiap beat, warna berganti.'),
    ('01b_intro_burst', '0:04', 'INTRO · BURST', 'Bar 2: bulatan kecil pecah di tepi setiap separuh beat.'),
    ('02_dot_sapu_masuk', '0:04', 'A · SAPU 1 WARNA', 'Bulatan besar satu warna (warna design seterusnya) pop dari sudut, tutup skrin.'),
    ('03_pearl_grid3', '0:05', 'PEARL · GRID 3', '3 panel vertical penuh skrin, garis putih 4px. Hard cut panel demi panel ikut beat.'),
    ('04_pearl_nama', '0:07', 'NAMA', 'Nama di bawah kiri atas bulatan sudut. Bulatan aksen di bawah/kanan, jauh dari muka.'),
    ('05_cutout_ke_grid2', '0:07', 'C · CUTOUT', 'Grid 2 muncul dalam kotak sejajar panel, satu kotak setiap separuh beat.'),
    ('06_pearl_grid2', '0:09', 'GRID 2', '2 panel separuh badan / detail, hard cut ikut beat.'),
    ('07_landscape_detail', '0:10', 'B · LANDSCAPE', 'Close-up landscape penuh skrin, slow motion 50% (speed ramp).'),
    ('08_sapu_ke_sky', '0:11', 'A · KE SKY', 'Bulatan biru SKY menutup skrin dari sudut.'),
    ('08b_buka_sky', '0:12', 'A · BUKA', 'Bulatan mengecil dan terbuka ke grid SKY.'),
    ('09_sky_nama', '0:13', 'SKY · NAMA', ''),
    ('10_blush_nama', '0:19', 'BLUSH · NAMA', 'Warna bulatan ikut design.'),
    ('11_ruby_nama', '0:27', 'RUBY · NAMA', ''),
    ('13_klimaks', '0:39', 'KLIMAKS', '5 panel, satu setiap design. Bulatan pop di bawah, tak halang muka.'),
    ('15_joyclub_logo', '0:42', 'JOY CLUB', 'Bulatan biru & merah jadi huruf O dan U, logo penuh + AVAILABLE NOW.'),
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
