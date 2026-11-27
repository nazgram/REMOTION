"""Storyboard 9:16 Petal Pop Drop 4 dari still out/vs/: python3 scripts/storyboard_v.py [out.png]"""
import sys
from PIL import Image, ImageDraw, ImageFont
ST = 'out/vs/'
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans'
fb, fr, ft, fs = (ImageFont.truetype(F + '-Bold.ttf', 18), ImageFont.truetype(F + '.ttf', 17), ImageFont.truetype(F + '-Bold.ttf', 38), ImageFont.truetype(F + '.ttf', 22))
ITEMS = [  # (fail, frame, tajuk, nota)
    ('intro', 30, 'INTRO · BUNGA MEKAR', 'Bunga print Pearl Grey mekar dari tengah, terus pada beat pertama.'),
    ('introland', 62, 'INTRO · PRINT PENUH', 'Bunga mendarat balik dalam print Pearl Grey.'),
    ('pearl_wipe', 82, 'BLOOM WIPE KE FOOTAGE', 'Bunga print mekar tutup skrin, kemudian mengecil hilang dan buka klip model. Ini transition antara setiap design.'),
    ('pearl_model', 112, 'PEARL GREY · MODEL', 'Klip penuh skrin. Masuk laju, jadi slow-mo 0.5x atas beat. Kad nama kecil bawah kiri.'),
    ('pearl_detail', 205, 'PEARL GREY · DETAIL', 'Model laju 2.4x masuk cut (beat 3), detail mula laju lalu slow-mo + zoom punch kecil.'),
    ('dusty_wipe', 231, 'WIPE KE DUSTY ROSE', 'Bunga Dusty Rose mekar dari bawah atas klip detail yang sedang laju semula.'),
    ('dusty_model', 285, 'DUSTY ROSE · MODEL', 'Ramp sama: laju, slow-mo, laju ke cut.'),
    ('dusty_detail', 376, 'DUSTY ROSE · DETAIL', 'Tangan pegang kain.'),
    ('lilac_model', 458, 'LILAC MIST · MODEL', 'Wipe dari bucu kiri bawah.'),
    ('lilac_detail', 550, 'LILAC MIST · DETAIL', 'Belakang tudung, print penuh.'),
    ('sage_model', 631, 'SAGE PETAL · MODEL', 'Wipe dari bucu kanan atas.'),
    ('sage_detail', 723, 'SAGE PETAL · DETAIL', 'Hujung tudung.'),
    ('powder_model', 803, 'POWDER BLUE · MODEL', 'Wipe dari tengah.'),
    ('powder_detail', 896, 'POWDER BLUE · DETAIL', 'Print di bahu dengan tangan.'),
    ('dahlia_model', 976, 'BLACK DAHLIA · MODEL', 'Wipe bunga cerah Black Dahlia dari bawah.'),
    ('dahlia_detail', 1067, 'BLACK DAHLIA · DETAIL', 'Kain tergantung, laju semula ke klimaks.'),
    ('climax1', 1145, 'KLIMAKS · 6 MUKA', 'Satu muka setiap design, cut setiap 2/3 beat. Setiap klip masuk 2x lalu slow-mo.'),
    ('coming1b', 1341, 'COMING SOON', 'Bunga Black Dahlia mekar, huruf pop satu-satu ikut beat (2 baris, tengah y 900).'),
    ('coming4b', 1485, 'LOGO PETAL POP 4', 'Bulatan bunga 6 design + logo; COMING SOON kecil di bawah, semua atas garis UI TikTok.'),
    ('nafesa', 1558, 'NAFESA', 'Hitam, logo putih fade in, bunga sikit di bucu. Lagu fade di hujung. 26.5 s.'),
]
tw, th, pad, cap = 320, 569, 24, 150
cols = 5
rows = (len(ITEMS) + cols - 1) // cols
img = Image.new('RGB', (cols * tw + (cols + 1) * pad, 160 + rows * (th + cap + pad)), (250, 247, 242))
d = ImageDraw.Draw(img)
d.text((pad, 34), 'PETAL POP DROP 4 · Teaser 9:16 (1080x1920, 26.5 s) · Storyboard v1', font=ft, fill=(30, 30, 30))
d.text((pad, 92), 'Footage menegak sahaja, satu klip penuh skrin (tiada grid), speed ramp setiap klip. Garis merah = had UI TikTok (y 1521).', font=fs, fill=(90, 90, 90))
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
out = sys.argv[1] if len(sys.argv) > 1 else 'out/storyboard-teaser9x16-v1.png'
img.save(out, optimize=True); print(out, img.size)
