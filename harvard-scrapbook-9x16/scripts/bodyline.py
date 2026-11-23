import json, numpy as np, cv2
from PIL import Image
out={}
for i in range(1,11):
    n=f'p{i:02d}'
    im=Image.open(f'public/photos/{n}.jpg')
    m=np.array(Image.open(f'public/masks/{n}.png').convert('L')); m=(m>128).astype(np.uint8)*255
    H,W=m.shape
    k=cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(41,41))
    d=cv2.dilate(m,k); d=cv2.GaussianBlur(d,(31,31),0); d=(d>128).astype(np.uint8)*255
    cs,_=cv2.findContours(d,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
    c=max(cs,key=cv2.contourArea)[:,0,:]
    # drop points on the image border -> open segments
    B=6
    ok=(c[:,0]>B)&(c[:,0]<W-1-B)&(c[:,1]>B)&(c[:,1]<H-1-B)
    segs=[];cur=[]
    for p,o in zip(c,ok):
        if o: cur.append(p)
        elif cur: segs.append(cur); cur=[]
    if cur:
        if segs and ok[0]: segs[0]=cur+segs[0]
        else: segs.append(cur)
    segs=[s for s in segs if len(s)>80]
    res=[]
    for s in segs:
        a=np.array(s,np.float32).reshape(-1,1,2)
        a=cv2.approxPolyDP(a,2.5,False)[:,0,:]
        res.append([[round(float(x),1),round(float(y),1)] for x,y in a])
    out[n]=res
    print(n,[len(s) for s in res])
json.dump(out,open('src/bodylines.json','w'))
