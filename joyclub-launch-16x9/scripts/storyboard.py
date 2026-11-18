"""Gabung still frame v3 jadi satu storyboard berlabel."""
import json, sys
from PIL import Image, ImageDraw, ImageFont
ST = 'out/v3/r3/'
b = json.load(open('public/v3/beats.json'))['beats']
F = 'public/v3/Poppins-'
fb, fr, ft = ImageFont.truetype(F + 'Bold.ttf', 26), ImageFont.truetype(F + 'Medium.ttf', 20), ImageFont.truetype(F + 'Bold.ttf', 46)
ITEMS = [  # (fail, frame, tajuk, nota) - revisi 3
    ('01-kain-pearl', 48, 'INTRO · KAIN AI', '5 kain AI penuh skrin, beralun. Satu kain setiap 3 beat: PEARL, SKY, BLUSH, RUBY, SILVER.'),
    ('02-kain-slide', 127, 'INTRO · TOLAK', 'Kain baru menolak kain lama ke tepi, kedua-duanya terus beralun.'),
    ('04-intro-cover', 516, 'DOT DARI BUCU', 'Dot muncul dari 4 bucu, kecil ke besar sampai tutup skrin (warna PEARL).'),
    ('05-pearl-masuk', 599, 'PEARL · 3 PANEL MASUK', 'Panel masuk satu demi satu ikut beat (beat 1, 2, 3). Ruang kosong warna design.'),
    ('06-pearl-3panel', 681, 'PEARL · 3 PANEL + NAMA', '3 klip, setiap satu main terus tanpa cut (~3s). Nama di bawah kiri.'),
    ('07-pearl-2panel', 815, 'PEARL · 2 PANEL', 'Cut bersih ke 2 panel, masuk satu demi satu, main hingga habis (~3s).'),
    ('08-pearl-landscape', 1014, 'PEARL · LANDSCAPE', 'Close-up landscape penuh skrin, slow motion 50%.'),
    ('09-sweep-cover', 1061, 'DOT KE SKY', 'Dot warna design seterusnya tutup skrin, kemudian mengecil balik ke bucu.'),
    ('11-sky-3panel', 1216, 'SKY · 3 PANEL (B)', 'Bentuk B: tengah besar, kiri kanan kecil.'),
    ('12-sky-2panel', 1348, 'SKY · 2 PANEL (G)', 'Bentuk G: garis serong.'),
    ('13-sky-landscape', 1549, 'SKY · LANDSCAPE', ''),
    ('14-blush-3panel', 1734, 'BLUSH · 3 PANEL (C)', 'Bentuk C: diagonal.'),
    ('15-blush-2panel', 1865, 'BLUSH · 2 PANEL (G2)', 'Serong lebih tajam.'),
    ('16-blush-landscape', 2066, 'BLUSH · LANDSCAPE', ''),
    ('17-ruby-3panel', 2265, 'RUBY · 3 PANEL (H)', 'Bentuk H: zigzag.'),
    ('18-ruby-2panel', 2399, 'RUBY · 2 PANEL (G3)', 'Garis terus bucu ke bucu. Guna klip landscape supaya muka penuh dalam segitiga.'),
    ('19-ruby-landscape', 2598, 'RUBY · LANDSCAPE', ''),
    ('20-silver-3panel', 2799, 'SILVER · 3 PANEL (I)', 'Bentuk I: trapezium tengah.'),
    ('21-silver-2panel', 2932, 'SILVER · 2 PANEL (G)', ''),
    ('22-silver-landscape', 3132, 'SILVER · LANDSCAPE', ''),
    ('23-klimaks-masuk', 3239, 'KLIMAKS · MASUK', '5 design dalam satu skrin, masuk setiap separuh beat.'),
    ('24-klimaks-penuh', 3299, 'KLIMAKS · PENUH', 'Semua close-up muka.'),
    ('25-joyclub', 3460, 'JOY CLUB', 'Logo + AVAILABLE NOW, 2 bar.'),
    ('26-nafesa', 3720, 'NAFESA', 'Lagu tamat sendiri (2:51). Video 1:03.'),
]
tw, th, pad, cap = 600, 338, 26, 92
cols = 4
rows = (len(ITEMS) + cols - 1) // cols
img = Image.new('RGB', (cols * tw + (cols + 1) * pad, 130 + rows * (th + cap + pad)), (250, 247, 242))
d = ImageDraw.Draw(img)
d.text((pad, 34), 'JOY CLUB · Video Launching 16:9 · Revisi 3 (63s) · Still frame', font=ft, fill=(30, 30, 30))
for i, (fn, fr_, title, desc) in enumerate(ITEMS):
    t = f'{int(fr_ / 60) // 60}:{int(fr_ / 60) % 60:02d}'
    x = pad + (i % cols) * (tw + pad); y = 130 + (i // cols) * (th + cap + pad)
    img.paste(Image.open(ST + fn + '.jpg').resize((tw, th), Image.LANCZOS), (x, y))
    d.text((x, y + th + 8), f'{i + 1}. {t}  {title}', font=fb, fill=(177, 31, 36))
    words, line, ly = desc.split(), '', y + th + 44
    for w_ in words:
        if d.textlength(line + ' ' + w_, font=fr) > tw:
            d.text((x, ly), line.strip(), font=fr, fill=(50, 50, 50)); ly += 24; line = ''
        line += ' ' + w_
    d.text((x, ly), line.strip(), font=fr, fill=(50, 50, 50))
out = sys.argv[1] if len(sys.argv) > 1 else 'out/v3/storyboard-v3-rev3.png'
img.save(out, optimize=True); print(out, img.size)
