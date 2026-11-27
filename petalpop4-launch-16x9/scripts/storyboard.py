"""Gabung still frame Petal Pop Drop 4 jadi satu storyboard berlabel: python3 scripts/storyboard.py [out.png]"""
import sys
from PIL import Image, ImageDraw, ImageFont
ST = 'out/sb/'
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans'
fb, fr, ft = ImageFont.truetype(F + '-Bold.ttf', 24), ImageFont.truetype(F + '.ttf', 19), ImageFont.truetype(F + '-Bold.ttf', 40)
ITEMS = [  # (fail, frame, tajuk, nota)
    ('01-intro', 27, 'INTRO · BUNGA MEKAR', 'Bunga print Pearl Grey mekar dari tengah atas latar warnanya, terus pada beat pertama (2:45.5).'),
    ('02-intro-penuh', 66, 'INTRO · PRINT PENUH', 'Bunga tutup skrin, print Pearl Grey penuh. Bunga mengecil balik ke tempat asal dalam print.'),
    ('03-pearl-kad', 105, 'PEARL GREY · PANEL 1 + NAMA', 'Panel masuk ikut beat. Kad putih bulat bawah kiri (tak tutup muka). Slot kosong tunjuk print.'),
    ('04-pearl-3panel', 168, 'PEARL GREY · 3 PANEL (A)', 'Panel tengah = shot detail print. Bunga accent kecil di bucu kanan bawah.'),
    ('05-sweep-dusty', 225, 'BLOOM SWEEP KE DUSTY ROSE', 'Bunga print Dusty Rose mekar dari bawah, tutup skrin lalu jadi latar blok baru.'),
    ('06-dusty-3panel', 339, 'DUSTY ROSE · 3 PANEL (B)', 'Tengah besar. Detail: tangan pegang kain.'),
    ('07-sweep-lilac', 398, 'BLOOM SWEEP KE LILAC MIST', 'Mekar dari bucu kiri bawah.'),
    ('08-lilac-3panel', 510, 'LILAC MIST · 3 PANEL (C)', 'Serong. Detail: belakang tudung, print penuh.'),
    ('09-sweep-sage', 571, 'BLOOM SWEEP KE SAGE PETAL', 'Mekar dari bucu kanan atas.'),
    ('10-sage-3panel', 684, 'SAGE PETAL · 3 PANEL (H)', 'Zigzag. Detail: hujung tudung.'),
    ('11-sweep-powder', 743, 'BLOOM SWEEP KE POWDER BLUE', 'Mekar dari tengah.'),
    ('12-powder-3panel', 858, 'POWDER BLUE · 3 PANEL (I)', 'Trapezium tengah. Detail: print di bahu.'),
    ('13-sweep-dahlia', 916, 'BLOOM SWEEP KE BLACK DAHLIA', 'Mekar dari bawah.'),
    ('14-dahlia-3panel', 1032, 'BLACK DAHLIA · 3 PANEL (K)', 'Serong arah lain. Detail: kain tergantung.'),
    ('15-klimaks-masuk', 1146, 'KLIMAKS · MASUK', '6 jalur (satu setiap design) masuk setiap separuh beat, slow-mo.'),
    ('16-klimaks-penuh', 1218, 'KLIMAKS · PENUH', 'Muka depan, susunan ikut design.'),
    ('17-coming-sweep', 1266, 'BLOOM SWEEP KE BLACK DAHLIA', 'Bunga cerah Black Dahlia mekar dari tengah, latar print hitam.'),
    ('18-coming-soon', 1360, 'COMING SOON', 'Huruf pop satu-satu ikut beat (besar + naik + fade). Bunga kecil mekar di sekeliling.'),
    ('19-logo-masuk', 1410, 'LOGO PETAL POP 4 · MASUK', 'COMING SOON mengecil ke bawah. Bulatan bunga 6 design mekar, huruf logo pop satu-satu.'),
    ('20-logo-penuh', 1470, 'LOGO PETAL POP 4 · PENUH', 'Motif, pil DROP 4. Logo putih dalam bulatan bunga.'),
    ('21-nafesa', 1560, 'NAFESA', 'Hitam, logo putih fade in sahaja. Lagu fade 0.5 s di hujung (3:12). Video 26.5 s.'),
]
tw, th, pad, cap = 600, 338, 26, 92
cols = 4
rows = (len(ITEMS) + cols - 1) // cols
img = Image.new('RGB', (cols * tw + (cols + 1) * pad, 130 + rows * (th + cap + pad)), (250, 247, 242))
d = ImageDraw.Draw(img)
d.text((pad, 40), 'PETAL POP DROP 4 · Teaser LED 16:9 (26.5 s) · Storyboard v2 (footage VIDEO GRADE)', font=ft, fill=(30, 30, 30))
for i, (fn, fr_, title, desc) in enumerate(ITEMS):
    t = f'{fr_ / 60:.1f}s'
    x = pad + (i % cols) * (tw + pad); y = 130 + (i // cols) * (th + cap + pad)
    img.paste(Image.open(ST + fn + '.jpg').resize((tw, th), Image.LANCZOS), (x, y))
    d.text((x, y + th + 8), f'{i + 1}. {t}  {title}', font=fb, fill=(144, 101, 119))
    words, line, ly = desc.split(), '', y + th + 44
    for w_ in words:
        if d.textlength(line + ' ' + w_, font=fr) > tw:
            d.text((x, ly), line.strip(), font=fr, fill=(50, 50, 50)); ly += 24; line = ''
        line += ' ' + w_
    d.text((x, ly), line.strip(), font=fr, fill=(50, 50, 50))
out = sys.argv[1] if len(sys.argv) > 1 else 'out/storyboard-pp4-v1.png'
img.save(out, optimize=True); print(out, img.size)
