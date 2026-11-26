# Plan BTS Petal Pop Drop 4 -> public/bts/plan.json. Masa dalam saat, 30 fps.
import json
FPS=30
f=lambda t: round(t*FPS)
HOOK=[('4063',1.5),('4161',2.5),('4066',3.5),('4088',25.8),('4119',1.0),('4160',1.5),('4064',2.0),('4167',0.5),
      ('4169',19.0),('4123',0.4),('4068',0.5),('4162',0.3),('4087',3.3),('4070',10.0),('4061',1.0),('4168',3.9),('4082',4.0)]
# (src, in, start, end, chapter, caption)
MAIN=[
 ('4070',2.0, 2.27, 3.93,'title',''),
 ('4086',0.2, 3.93, 5.64,'title',''),
 ('4063',0.3, 5.64, 7.00,'dahlia','Styling the scarf first'),
 ('4066',1.4, 7.00, 8.41,'dahlia','Mini fan, our hot-day hero'),
 ('4070',9.4, 8.41,10.00,'dahlia','Fixing the folds every take'),
 ('4082',0.3,10.00,11.10,'powder','Crew on standby'),
 ('4096',0.5,11.10,12.70,'powder','Poolside set'),
 ('4088',24.6,12.70,14.33,'powder','Camera follows every move'),
 ('4119',0.3,14.33,15.93,'dusty','Lights up first'),
 ('4123',0.0,15.93,17.43,'dusty','Which take is this again?'),
 ('4108',2.0,17.43,19.00,'dusty','Pose, hold... got it!'),
 ('4130',3.0,22.17,23.40,'lilac','Even the flower has a role'),
 ('4133',6.4,23.40,24.60,'lilac','Finding the best angle'),
 ('4134',5.3,24.60,26.13,'lilac','One more, the last one'),
 ('4160',1.5,26.13,27.40,'sage','Last-minute touch-up'),
 ('4161',1.2,27.40,28.50,'sage','Pin, fix, repeat'),
 ('4169',19.5,28.50,29.80,'sage','One team, one day'),
 ('4181',1.0,29.80,31.00,'sage','And the result...'),
]
FILM=[('4105',8.0),('4130',10.2),('4122',1.5),('4151',3.0)]  # 19.0-22.17, still frames B&W
shots=[]; fr=0
for i,(s,t) in enumerate(HOOK):
    shots.append(dict(id=f'h{i:02d}',src=s,inS=t,from_=fr,dur=4,chap='hook',cap='')); fr+=4
assert fr==68
for i,(s,t,a,b,c,cap) in enumerate(MAIN):
    shots.append(dict(id=f'm{i:02d}',src=s,inS=t,from_=f(a),dur=f(b)-f(a),chap=c,cap=cap))
film=[dict(id=f'f{i}',src=s,inS=t) for i,(s,t) in enumerate(FILM)]
plan=dict(fps=FPS,total=f(37.4),filmFrom=f(19.0),filmTo=f(22.17),endFrom=f(31.0),nafesaFrom=f(34.5),shots=shots,film=film)
json.dump(plan,open('public/bts/plan.json','w'),indent=1)
# senarai potongan untuk device: src, in, dur(s) (+ruang)
cuts=[(x['id'],x['src'],x['inS'],x['dur']/FPS+0.2) for x in shots]+[(x['id'],x['src'],x['inS'],0.2) for x in film]
open('public/bts/cuts.txt','w').write('\n'.join(f'{a} {b} {c:.3f} {d:.3f}' for a,b,c,d in cuts)+'\n')
print(len(shots),'shots', plan['total'],'frames')
