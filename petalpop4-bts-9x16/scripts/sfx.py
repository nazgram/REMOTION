# SFX sintesis untuk BTS Petal Pop Drop 4 -> public/bts/sfx.wav
import json, numpy as np
from scipy.io import wavfile
SR=48000; P=json.load(open('public/bts/plan.json')); N=int(P['total']/30*SR)+SR
out=np.zeros(N); rng=np.random.default_rng(4)
def add(sig,t,g=1.0):
    i=int(t*SR); j=min(N,i+len(sig)); out[i:j]+=sig[:j-i]*g
def env(n,a,d): t=np.arange(n)/SR; return np.minimum(1,t/max(a,1e-4))*np.exp(-t/d)
def shutter():
    n=int(0.09*SR); s=rng.standard_normal(n); s=np.convolve(s,np.ones(6)/6,'same')
    e=np.zeros(n); e[:int(.012*SR)]=1; e[int(.045*SR):int(.06*SR)]=0.7
    return s*e*np.exp(-np.arange(n)/SR/0.03)
def whoosh(d=0.35,up=True):
    n=int(d*SR); s=rng.standard_normal(n); t=np.arange(n)/SR
    # sapuan band-pass kasar: low-pass bergerak
    a=np.linspace(0.02,0.25,n) if up else np.linspace(0.25,0.02,n); y=np.zeros(n); acc=0
    for k in range(n): acc+=a[k]*(s[k]-acc); y[k]=acc
    return y*np.sin(np.pi*t/d)**2*3
def pop(f0=520):
    n=int(0.12*SR); t=np.arange(n)/SR; f=f0*np.exp(-t*18)+f0*0.6
    return np.sin(2*np.pi*np.cumsum(f)/SR)*env(n,0.002,0.035)
def chime():
    n=int(1.6*SR); t=np.arange(n)/SR; s=0
    for fr,g in [(1318.5,1),(1975.5,.5),(2637,.3)]: s=s+g*np.sin(2*np.pi*fr*t)
    return s*env(n,0.005,0.45)*0.35
def thump():
    n=int(0.4*SR); t=np.arange(n)/SR; return np.sin(2*np.pi*(55+90*np.exp(-t*25))*t)*env(n,0.003,0.12)
fr=lambda x:x/30
for k in range(0,68,8): add(shutter(),fr(k),0.35)
add(thump(),fr(68),0.6); add(whoosh(0.3),fr(62),0.35); add(pop(600),fr(90),0.35)
dah=[s['from_'] for s in P['shots'] if s['chap']=='dahlia'][0]
starts={}
for s in P['shots']:
    if s['chap'] not in ('hook','title') and s['chap'] not in starts: starts[s['chap']]=s['from_']
for c,v in starts.items(): add(whoosh(0.32),fr(v-6),0.45)
for k in range(4): add(shutter(),fr(P['filmFrom']+k*(P['filmTo']-P['filmFrom'])/4),0.55)
E=P['endFrom']; add(whoosh(0.4),fr(E-4),0.45); add(pop(480),fr(E+10),0.4)
for i in range(6): add(pop(700+i*60),fr(E+26+i*4),0.22)
add(whoosh(0.45),fr(P['nafesaFrom']-2),0.4); add(chime(),fr(P['nafesaFrom']+34),0.5)
out=out/max(1,np.abs(out).max()/0.9)
wavfile.write('public/bts/sfx.wav',SR,(out*32767).astype(np.int16)); print('sfx ok',starts)
