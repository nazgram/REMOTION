import json, sys, numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
SR=48000; DUR=float(sys.argv[3]) if len(sys.argv)>3 else 21.0; N=int(SR*DUR)
out=np.zeros((N,2))
rng=np.random.default_rng(3)
def env(n,a,d): t=np.arange(n)/SR; return np.minimum(t/a,1)*np.exp(-t/d)
def bp(x,lo,hi): return sosfilt(butter(2,[lo,hi],'band',fs=SR,output='sos'),x)
def pop(v):
    n=int(.12*SR); t=np.arange(n)/SR; f=520*v*np.exp(-t*28)+260*v
    return np.sin(2*np.pi*np.cumsum(f)/SR)*env(n,.002,.035)*0.55
def twinkle(v):
    n=int(.5*SR); t=np.arange(n)/SR; s=0
    for k,fr in enumerate([2093,2637,3136]):
        d=np.zeros(n); o=int(k*.05*SR); d[o:]=np.sin(2*np.pi*fr*v*t[:n-o])*np.exp(-t[:n-o]/.12); s=s+d
    return s*0.12
def scribble(v):
    n=int(.42*SR); t=np.arange(n)/SR; x=rng.normal(0,1,n)
    x=bp(x,1800,6500); am=0.5+0.5*np.sin(2*np.pi*(11+3*v)*t)**2
    return x*am*env(n,.02,.25)*0.16
def line(v):
    n=int(.8*SR); t=np.arange(n)/SR; x=rng.normal(0,1,n)
    x=bp(x,2200,7000); am=0.55+0.45*np.abs(np.sin(2*np.pi*(5+2*v)*t))
    e=np.minimum(t/.03,1)*np.minimum((t[-1]-t)/.15,1)
    return x*am*e*0.09
def whoosh(big):
    n=int((.55 if big else .45)*SR); t=np.arange(n)/SR; x=rng.normal(0,1,n)
    lo=np.linspace(300,1400 if big else 900,n); y=np.zeros(n)
    for i in range(0,n,1200):
        y[i:i+1200]=bp(x[i:i+1200],lo[i]*0.6,lo[i]*1.8)
    e=np.sin(np.pi*t/t[-1])**2
    return y*e*(0.32 if big else 0.13)
def slap(v):
    n=int(.18*SR); x=rng.normal(0,1,n); x=bp(x,250,3000)*env(n,.001,.03)
    t=np.arange(n)/SR; th=np.sin(2*np.pi*(140)*t)*env(n,.001,.05)
    return (x*0.35+th*0.35)
def boing():
    n=int(.6*SR); t=np.arange(n)/SR; f=330+120*np.sin(2*np.pi*7*t)*np.exp(-t*5)
    return np.sin(2*np.pi*np.cumsum(f)/SR)*env(n,.005,.18)*0.3
def chime(base):
    n=int(1.6*SR); t=np.arange(n)/SR; s=0
    for k,m in enumerate([1,1.25,1.5,2]):
        o=int(k*.07*SR); d=np.zeros(n); d[o:]=np.sin(2*np.pi*base*m*t[:n-o])*np.exp(-t[:n-o]/.5)*(0.9**k); s=s+d
    return s*0.12
ev=json.load(open(sys.argv[1] if len(sys.argv)>1 else 'scripts/events.json'))
for i,e in enumerate(ev):
    v=1+0.15*rng.uniform(-1,1); k=e['k']
    s={'pop':lambda:pop(v),'twinkle':lambda:twinkle(v),'scribble':lambda:scribble(v),'whoosh':lambda:whoosh(False),
       'whooshBig':lambda:whoosh(True),'slap':lambda:slap(v),'boing':boing,'line':lambda:line(v),'chime':lambda:chime(784),'chimeLow':lambda:chime(523)}[k]()
    st=int(e['f']/30*SR); pan=rng.uniform(-.35,.35)
    seg=s[:max(0,N-st)]
    out[st:st+len(seg),0]+=seg*(1-pan); out[st:st+len(seg),1]+=seg*(1+pan)
out/=max(1e-9,np.abs(out).max())/0.8
wavfile.write(sys.argv[2] if len(sys.argv)>2 else 'public/sfx.wav',SR,(out*32767).astype(np.int16))
print('ok')
