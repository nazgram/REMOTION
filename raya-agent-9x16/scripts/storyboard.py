import sys
from PIL import Image, ImageDraw, ImageFont
F='public/raya/fonts/'
fb=ImageFont.truetype(F+'Poppins-SemiBold.ttf',22); fs=ImageFont.truetype(F+'Poppins-Regular.ttf',17); ft=ImageFont.truetype(F+'DreamAvenue.ttf',64); fm=ImageFont.truetype(F+'Poppins-Medium.ttf',24)
items=[l.split('|') for l in open('scripts/sb_items.txt').read().strip().split('\n')]
cols=7; tw,th=300,533; lab=78; pad=16
rows=(len(items)+cols-1)//cols
W=cols*(tw+pad)+pad; H=170+rows*(th+lab+pad)+pad
s=Image.new('RGB',(W,H),'#F2ECE4'); d=ImageDraw.Draw(s)
d.text((pad,28),'NAFESA — Raya Is Your Opportunity',font=ft,fill='#5E673D')
d.text((pad,110),sys.argv[1],font=fm,fill='#473B34')
for i,(t,sc,txt) in enumerate(items):
    x=pad+(i%cols)*(tw+pad); y=170+(i//cols)*(th+lab+pad)
    im=Image.open(f'out/st/f_{t}.png').convert('RGB').resize((tw,th),Image.LANCZOS); s.paste(im,(x,y))
    d.rectangle([x,y+th,x+tw,y+th+lab],fill='#FFFFFF')
    d.text((x+10,y+th+6),f'{float(t):.1f}s · {sc}',font=fb,fill='#5E673D')
    d.text((x+10,y+th+38),txt,font=fs,fill='#473B34')
s.save(sys.argv[2],quality=88); print(s.size)
