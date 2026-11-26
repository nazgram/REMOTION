import glob,sys
from PIL import Image,ImageDraw,ImageFont
L={20:'Hook: fast 4-frame cuts (like reference)',50:'Hook: crew, styling, camera',112:'Title BEHIND the SCENE + DROP 4',150:'Title (shot 2), 6 colourways',205:'01 Black Dahlia: Styling the scarf first',250:'Mini fan, our hot-day hero',335:'02 Powder Blue: Poolside set',400:'Camera follows every move',470:'03 Dusty Rose: Lights up first',525:'Which take is this again?',598:'B&W film archive + light leak',640:'Film archive (2 frames)',700:'04 Lilac Mist',812:'05 Sage Petal: touch-up',885:'One team, one day',975:'Endcard: logo + 6 colourways',1012:'COMING SOON',1100:'NAFESA + Drop 4 coming soon'}
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
