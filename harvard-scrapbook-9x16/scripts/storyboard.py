import sys,glob
from PIL import Image,ImageDraw,ImageFont
fs=sorted(glob.glob('out/st/f*.png')); ims=[Image.open(f).convert('RGB') for f in fs]
w,h=ims[0].size; cols=6; pad=16; top=110
font=ImageFont.load_default(size=26); big=ImageFont.load_default(size=40)
rows=(len(ims)+cols-1)//cols; sh=Image.new('RGB',(cols*(w+pad)+pad,top+rows*(h+60)),'#2b2433')
d=ImageDraw.Draw(sh); d.text((pad,30),sys.argv[2],fill='white',font=big)
for i,(f,im) in enumerate(zip(fs,ims)):
    x=pad+(i%cols)*(w+pad); y=top+(i//cols)*(h+60)
    fr=int(f.split('/f')[-1][:3]); d.text((x,y+10),f'{fr/30:.1f}s',fill='#f7a8c8',font=font)
    sh.paste(im,(x,y+46))
sh.save(sys.argv[1]); print(sh.size)
