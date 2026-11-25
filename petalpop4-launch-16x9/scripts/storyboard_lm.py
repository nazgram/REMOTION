"""Storyboard 9:16 Petal Pop Drop 4 dari still out/vs/: python3 scripts/storyboard_v.py [out.png]"""
import sys
from PIL import Image, ImageDraw, ImageFont
ST = 'out/lm/'
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans'
fb, fr, ft, fs = (ImageFont.truetype(F + '-Bold.ttf', 18), ImageFont.truetype(F + '.ttf', 17), ImageFont.truetype(F + '-Bold.ttf', 38), ImageFont.truetype(F + '.ttf', 22))
ITEMS = [  # (fail, frame, tajuk, nota)
    ('s00', 0, 'DIAM (0:00-0:04)', 'Gambar tenang: logo Petal Pop Drop 4 di tengah, bunga dari print Drop 4 berselerak keliling. Tiada gerakan langsung sampai 0:04.'),
    ('s42', 252, 'MULA ANIMASI 0:04', 'Semua kecut sikit (jangkaan), huruf Petal Pop melompat ikut gelombang kiri ke kanan.'),
    ('s47', 282, 'BUNGA LOGO BERPUSING', 'Bunga pink logo pusing 360, daun dan tulip bergoyang. Bunga keliling mula bergerak.'),
    ('s51', 306, 'BUNGA BERKUMPUL', 'Bunga berselerak terbang ikut lengkung, berpusing, menuju ke bulatan keliling logo.'),
    ('s55', 330, 'BUNGA POP MASUK', 'Bunga baru pop isi tempat kosong dalam bulatan.'),
    ('s62', 372, 'KALUNGAN SIAP', 'Bulatan bunga (5 warna Drop 4) siap dan mula berputar perlahan.'),
    ('s65', 390, 'GELOMBANG MEKAR', 'Bunga dalam bulatan mekar satu-satu keliling (macam ombak).'),
    ('s72', 432, 'TUKAR 0:07', 'Logo pecah kecut hilang (whoosh), huruf COMING SOON mula pop.'),
    ('s75', 450, 'COMING SOON', 'Huruf pop satu-satu ikut bunyi pop, 2 baris di tengah kalungan. Bunga kecil mula jatuh di belakang.'),
    ('s82', 492, 'COMING SOON PENUH', 'Tulisan siap, kalungan terus berputar.'),
    ('s99', 594, 'AKHIR 0:10', 'Tulisan bernafas perlahan, bunga bergoyang dan jatuh. SFX sahaja (pop + whoosh), tiada muzik.'),
]
tw, th, pad, cap = 320, 569, 24, 150
cols = 6
rows = (len(ITEMS) + cols - 1) // cols
img = Image.new('RGB', (cols * tw + (cols + 1) * pad, 160 + rows * (th + cap + pad)), (250, 247, 242))
d = ImageDraw.Draw(img)
d.text((pad, 34), 'PETAL POP DROP 4 · Logo motion 9:16 (1080x1920, 10 s) · Storyboard v2', font=ft, fill=(30, 30, 30))
d.text((pad, 92), '0:00-0:04 diam, animasi mula 0:04, tukar ke COMING SOON pada 0:07. Semua bunga dipotong dari print Drop 4 sendiri. Garis merah = had UI TikTok (y 1521).', font=fs, fill=(90, 90, 90))
for i, (fn, fr_, title, desc) in enumerate(ITEMS):
    x = pad + (i % cols) * (tw + pad); y = 160 + (i // cols) * (th + cap + pad)
    img.paste(Image.open(ST + fn + '.jpg').resize((tw, th), Image.LANCZOS), (x, y))
    ly0 = y + int(th * 1521 / 1920)
    d.line([(x, ly0), (x + tw, ly0)], fill=(220, 40, 40), width=2)
    d.text((x, y + th + 8), f'{i + 1}.  {fr_ / 60:.1f}s', font=fb, fill=(144, 101, 119))
    d.text((x, y + th + 32), title, font=fb, fill=(144, 101, 119))
    words, line, ly = desc.split(), '', y + th + 60
    for w_ in words:
        if d.textlength(line + ' ' + w_, font=fr) > tw:
            d.text((x, ly), line.strip(), font=fr, fill=(50, 50, 50)); ly += 22; line = ''
        line += ' ' + w_
    d.text((x, ly), line.strip(), font=fr, fill=(50, 50, 50))
out = sys.argv[1] if len(sys.argv) > 1 else 'out/storyboard-logomotion-v2.png'
img.save(out, optimize=True); print(out, img.size)
