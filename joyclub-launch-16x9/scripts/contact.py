"""Contact sheet bernombor per design (vertical + landscape), label = saat dalam raw."""
import math, os, sys
from PIL import Image, ImageDraw, ImageFont
B = {'pearl': (90.3, 107.9), 'sky': (0, 20.4), 'blush': (24.1, 47.4), 'ruby': (67.0, 87.7), 'silver': (50.1, 64.2)}
OUT = sys.argv[1] if len(sys.argv) > 1 else 'out/v3/contact'
os.makedirs(OUT, exist_ok=True)
F = ImageFont.truetype('public/v3/Poppins-Bold.ttf', 22)
FB = ImageFont.truetype('public/v3/Poppins-Bold.ttf', 40)
for d, (a, b) in B.items():
    secs = list(range(math.ceil(a), math.floor(b)))
    for cam, cols in (('v', 10), ('l', 6)):
        ims = [Image.open(f'out/v3/thumbs/{cam}_{s + 1:04d}.jpg') for s in secs]
        w, h = ims[0].size
        rows = math.ceil(len(ims) / cols)
        sheet = Image.new('RGB', (cols * (w + 8) + 8, 80 + rows * (h + 40)), 'white')
        dr = ImageDraw.Draw(sheet)
        dr.text((10, 18), f"{d.upper()} · {'VERTICAL' if cam == 'v' else 'LANDSCAPE'} · nombor = saat dalam raw", font=FB, fill=(30, 30, 30))
        for i, (s, im) in enumerate(zip(secs, ims)):
            x = 8 + (i % cols) * (w + 8); y = 80 + (i // cols) * (h + 40)
            sheet.paste(im, (x, y + 32))
            dr.text((x, y + 2), f"{cam.upper()}{s}", font=F, fill=(200, 30, 40))
        sheet.save(f'{OUT}/{d}-{cam}.jpg', quality=82)
print('ok')
