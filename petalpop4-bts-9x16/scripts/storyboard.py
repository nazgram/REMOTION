import glob,sys
from PIL import Image,ImageDraw,ImageFont
L={20:'Hook: potong laju 4 frame (macam contoh)',50:'Hook: crew, styling, kamera',112:'Tajuk BEHIND the SCENE + DROP 4',150:'Tajuk (shot 2)',205:'01 Black Dahlia: styling tudung',250:'Kipas kecil, penyelamat hari panas',335:'02 Powder Blue: set tepi kolam',400:'Kamera ikut setiap gerak',470:'03 Dusty Rose: lampu disusun dulu',525:'Take ke berapa dah ni?',598:'Arkib filem B&W + light leak',640:'Arkib filem (2 frame)',700:'04 Lilac Mist',812:'05 Sage Petal: touch-up',885:'Satu team, satu hari',965:'Endcard: logo + 6 colourway',1012:'Terima kasih, team!',1092:'NAFESA (akhir)'}
fs=sorted(glob.glob('out/stills/f*.jpg'));ims=[Image.open(f) for f in fs];w,h=ims[0].size
cols=6;rows=(len(ims)+cols-1)//cols;pad=24;lab=70;top=120
sh=Image.new('RGB',(cols*(w+pad)+pad,top+rows*(h+lab+pad)),'#F2ECE4');d=ImageDraw.Draw(sh)
B='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';R='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
d.text((pad,30),sys.argv[2],font=ImageFont.truetype(B,44),fill='#473B34')
for i,(f,im) in enumerate(zip(fs,ims)):
    fr=int(f[-8:-4]);x=pad+(i%cols)*(w+pad);y=top+(i//cols)*(h+lab+pad)
    sh.paste(im,(x,y));d.text((x,y+h+8),f'{fr/30:.1f}s',font=ImageFont.truetype(B,24),fill='#5E673D')
    d.text((x+90,y+h+10),L.get(fr,''),font=ImageFont.truetype(R,19),fill='#473B34')
sh.save(sys.argv[1]);print(sh.size)
