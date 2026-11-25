"""Potong jeda kosong dalam VO Nas (Nas 25/11: "cut VO kalau rasa kosong").
Jeda senyap > MAXP dipendekkan kepada MAXP. Output: public/raya/vo_tight.wav + src/voMap.ts (peta masa lama -> baru)."""
import json, numpy as np, soundfile as sf
x, sr = sf.read('public/raya/vo.wav')
if x.ndim > 1: x = x.mean(1)
hop = int(sr * 0.01)
rms = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2) + 1e-12) for i in range(0, len(x) - hop, hop)])
db = 20 * np.log10(rms / rms.max())
TH, MINS, MAXP = -38, 0.16, 0.11
sil = db < TH
segs = []  # (start,end) silences in s
i = 0
while i < len(sil):
    if sil[i]:
        j = i
        while j < len(sil) and sil[j]: j += 1
        s, e = i * 0.01, j * 0.01
        if e - s >= MINS: segs.append((s, e))
        i = j
    else: i += 1
dur = len(x) / sr
# lead/tail silence: keep 0.05 s at head
keep = []  # (src_start, src_end)
cur = 0.0
for s, e in segs:
    if s <= 0.02:  # head
        cur = max(0, e - 0.05); continue
    pad = MAXP / 2
    keep.append((cur, s + pad)); cur = e - pad
keep.append((cur, dur))
fade = int(sr * 0.006)
out = []; mp = []; t_new = 0.0
for s, e in keep:
    a, b = int(s * sr), int(e * sr)
    seg = x[a:b].copy()
    if len(seg) > 2 * fade:
        seg[:fade] *= np.linspace(0, 1, fade); seg[-fade:] *= np.linspace(1, 0, fade)
    mp.append([round(s, 3), round(e, 3), round(t_new, 3)])
    out.append(seg); t_new += len(seg) / sr
y = np.concatenate(out)
sf.write('public/raya/vo_tight.wav', y.astype(np.float32), sr)
with open('src/voMap.ts', 'w') as f:
    f.write('// Dijana oleh scripts/vo_tighten.py: [mulaAsal, tamatAsal, mulaBaru] (saat dalam VO)\n')
    f.write(f'export const VO_MAP: [number, number, number][] = {json.dumps(mp)};\nexport const VO_TIGHT_DUR = {t_new:.3f};\n')
print(f'{dur:.2f}s -> {t_new:.2f}s, {len(segs)} jeda dipotong')
for s, e in segs: print(f'  {s:.2f}-{e:.2f} ({e-s:.2f})')
