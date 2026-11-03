"""Label the teaser stills into one storyboard PNG.
  python3 scripts/teaser1_storyboard.py <stillsDir> <out.png> <version>"""
import sys
from PIL import Image, ImageDraw, ImageFont
d_in, out, ver = sys.argv[1:4]
secs = ['0.9', '2.3', '3.3', '4.9', '5.9', '6.9', '8.3', '9.3', '10.6', '11.6', '13.0', '14.8']
cap = ['Bunga pop dari tepi (bulat)', '"Petal Pop" hold', 'Floral wipe ke Vanilla Sky', '"Blooming Soon" hold', 'Iris bulat ke Expresso Poppy', 'DROP 2 bounce',
       'Forest Bloom, DROP 2 hold', 'Floral wipe ke Olive Spritz', 'Zoom out ke scarf penuh', '"Stay Tuned" hold', 'Logo Petal Pop Drop 2', 'NAFESA sign-off']
ims = [Image.open(f'{d_in}/f_{s}.png') for s in secs]
w, h = ims[0].size
cols, pad, th = 6, 24, 70
B = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 34)
B2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 24)
R = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 21)
W, H = cols * (w + pad) + pad, 110 + 2 * (h + th + pad)
c = Image.new('RGB', (W, H), '#ffeac5')
d = ImageDraw.Draw(c)
d.text((pad, 28), f'PETAL POP DROP 2 — TEASER 1  ·  storyboard {ver}  ·  15s 9:16, SFX sahaja', font=B, fill='#042215')
for i, (s, im) in enumerate(zip(secs, ims)):
    x, y = pad + (i % cols) * (w + pad), 110 + (i // cols) * (h + th + pad)
    c.paste(im, (x, y))
    ly = y + int(1521 * h / 1920)
    d.line([(x, ly), (x + w, ly)], fill='#e0457b', width=2)
    d.text((x, y + h + 8), s + 's', font=B2, fill='#042215')
    d.text((x, y + h + 38), cap[i], font=R, fill='#042215')
d.text((W - 560, H - 28), 'garisan pink = had safe zone TikTok (1521px)', font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 18), fill='#e0457b')
c.save(out)
