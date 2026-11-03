"""Label the teaser stills into one storyboard PNG.
  python3 scripts/teaser1_storyboard.py <stillsDir> <out.png> <version>"""
import sys
from PIL import Image, ImageDraw, ImageFont
d_in, out, ver = sys.argv[1:4]
secs = ['0.6', '1.6', '2.15', '3.3', '4.1', '4.2', '4.7', '5.6', '6.9', '7.8', '8.6', '9.9']
cap = ['Bunga pop dari 4 tepi', '"Petal Pop" huruf pop', 'Floral wipe ke Vanilla Sky', '"Blooming Soon"', 'Iris bulat ke Expresso Poppy', 'Iris (sambungan)',
       'DROP 2 bounce', 'Iris ke Forest Bloom', 'Olive Spritz: corak penuh', 'Zoom out: scarf + "Stay Tuned"', 'Logo Petal Pop Drop 2', 'NAFESA sign-off']
ims = [Image.open(f'{d_in}/f_{s}.png') for s in secs]
w, h = ims[0].size
cols, pad, th = 6, 24, 70
B = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 34)
B2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 24)
R = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 21)
W, H = cols * (w + pad) + pad, 110 + 2 * (h + th + pad)
c = Image.new('RGB', (W, H), '#ffeac5')
d = ImageDraw.Draw(c)
d.text((pad, 28), f'PETAL POP DROP 2 — TEASER 1  ·  storyboard {ver}  ·  10s 9:16, SFX sahaja', font=B, fill='#042215')
for i, (s, im) in enumerate(zip(secs, ims)):
    x, y = pad + (i % cols) * (w + pad), 110 + (i // cols) * (h + th + pad)
    c.paste(im, (x, y))
    ly = y + int(1521 * h / 1920)
    d.line([(x, ly), (x + w, ly)], fill='#e0457b', width=2)
    d.text((x, y + h + 8), s + 's', font=B2, fill='#042215')
    d.text((x, y + h + 38), cap[i], font=R, fill='#042215')
d.text((W - 560, H - 28), 'garisan pink = had safe zone TikTok (1521px)', font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 18), fill='#e0457b')
c.save(out)
