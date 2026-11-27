"""Storyboard 9:16 versi panjang (~51 s) dari still out/vl/: python3 scripts/storyboard_vl.py [out.png]"""
import sys
from PIL import Image, ImageDraw, ImageFont
ST = 'out/vl/'
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans'
fb, fr, ft, fs = (ImageFont.truetype(F + '-Bold.ttf', 18), ImageFont.truetype(F + '.ttf', 17), ImageFont.truetype(F + '-Bold.ttf', 38), ImageFont.truetype(F + '.ttf', 22))
ITEMS = [  # (fail, frame, tajuk, nota)
    ('intro', 30, 'INTRO · BUNGA MEKAR', 'Bunga print Pearl Grey mekar dari tengah pada beat pertama (lagu 2:45.5).'),
    ('introland', 62, 'INTRO · PRINT PENUH', 'Bunga mendarat balik dalam print.'),
    ('pearl_wipe', 82, 'BLOOM WIPE KE FOOTAGE', 'Bunga mekar tutup skrin lalu hilang, buka klip. Transition setiap design.'),
    ('pearl_1', 252, 'PEARL GREY · 3 KLIP', 'Setiap design 11 beat (6.3 s): model 4 beat, detail 3 beat, model kedua 4 beat.'),
    ('pearl_2', 355, 'PEARL GREY · KLIP 3', 'Setiap klip laju masuk cut, slow-mo 0.5x di tengah, laju keluar.'),
    ('dusty_wipe', 439, 'WIPE KE DUSTY ROSE', 'Bunga Dusty Rose mekar dari bawah.'),
    ('dusty_0', 487, 'DUSTY ROSE · MODEL', 'Kad nama kekal sepanjang design.'),
    ('dusty_2', 735, 'DUSTY ROSE · KLIP 3', 'Close-up muka.'),
    ('lilac_0', 867, 'LILAC MIST · MODEL', 'Wipe dari bucu kiri bawah.'),
    ('lilac_1', 1011, 'LILAC MIST · DETAIL', 'Belakang tudung, print penuh.'),
    ('lilac_2', 1113, 'LILAC MIST · KLIP 3', 'Dengan bunga.'),
    ('sage_0', 1245, 'SAGE PETAL · MODEL', 'Wipe dari bucu kanan atas.'),
    ('sage_1', 1390, 'SAGE PETAL · DETAIL', 'Hujung tudung.'),
    ('sage_2', 1493, 'SAGE PETAL · KLIP 3', 'Dekat dinding batu.'),
    ('powder_0', 1625, 'POWDER BLUE · MODEL', 'Wipe dari tengah.'),
    ('powder_2', 1872, 'POWDER BLUE · KLIP 3', 'Model kedua, depan arch.'),
    ('dahlia_0', 2004, 'BLACK DAHLIA · MODEL', 'Wipe bunga cerah Black Dahlia.'),
    ('dahlia_1', 2148, 'BLACK DAHLIA · DETAIL', 'Kain tergantung.'),
    ('dahlia_2', 2251, 'BLACK DAHLIA · KLIP 3', 'Laju masuk ke klimaks.'),
    ('climax1', 2422, 'KLIMAKS · 6 MUKA', 'Satu muka setiap design, 1.5 beat setiap satu, ramp laju-slow-laju.'),
    ('climax3', 2526, 'KLIMAKS', 'Semua 24 klip dipakai sekali sahaja.'),
    ('coming1', 2752, 'COMING SOON', 'Bunga Black Dahlia mekar atas klip terakhir, huruf pop ikut beat.'),
    ('coming4', 2914, 'LOGO PETAL POP 4', 'Logo dalam bulatan bunga, ditahan lebih lama (8 beat).'),
    ('nafesa', 3009, 'NAFESA', 'Masuk tepat pada hit terakhir lagu (3:34.3). Video tamat bila gema lagu habis, 51.2 s.'),
]
tw, th, pad, cap = 320, 569, 24, 150
cols = 6
rows = (len(ITEMS) + cols - 1) // cols
img = Image.new('RGB', (cols * tw + (cols + 1) * pad, 160 + rows * (th + cap + pad)), (250, 247, 242))
d = ImageDraw.Draw(img)
d.text((pad, 34), 'PETAL POP DROP 4 · Teaser 9:16 versi panjang (51.2 s) · Storyboard v1', font=ft, fill=(30, 30, 30))
d.text((pad, 92), 'Lagu 2:45.5 hingga tamat (3:36.5). Semua 24 klip, satu klip penuh skrin, speed ramp. Garis merah = had UI TikTok.', font=fs, fill=(90, 90, 90))
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
out = sys.argv[1] if len(sys.argv) > 1 else 'out/storyboard-teaser9x16-long-v1.png'
img.save(out, optimize=True); print(out, img.size)
