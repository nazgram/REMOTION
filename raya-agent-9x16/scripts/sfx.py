"""Jana SFX sendiri (tiada AI): pop, pop kecil, whoosh. Output public/v3/sfx-*.wav, puncak -1 dBFS.
Aras dalam video diturunkan ke -18 dB di bawah lagu (lihat SFX_VOL dalam src/v3/Sfx.tsx)."""
import numpy as np, soundfile as sf

SR = 48000
rng = np.random.default_rng(7)


def norm(x):
    return (x / np.abs(x).max() * 10 ** (-1 / 20)).astype(np.float32)


def pop(f0, f1, dur):
    t = np.arange(int(SR * dur)) / SR
    f = f1 + (f0 - f1) * np.exp(-t / (dur * 0.25))
    ph = 2 * np.pi * np.cumsum(f) / SR
    env = (1 - np.exp(-t / 0.002)) * np.exp(-t / (dur * 0.3))
    return norm(np.sin(ph) * env)


def whoosh(dur):
    n = int(SR * dur)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    # band-pass yang naik: tapis lowpass satu kutub dengan pekali berubah, tolak lowpass lebih rendah
    out = np.zeros(n); lp1 = lp2 = 0.0
    for i in range(n):
        p = t[i] / dur
        fc = 300 + 4500 * p ** 1.5
        a1 = 1 - np.exp(-2 * np.pi * fc / SR)
        a2 = 1 - np.exp(-2 * np.pi * (fc * 0.35) / SR)
        lp1 += a1 * (noise[i] - lp1); lp2 += a2 * (noise[i] - lp2)
        out[i] = lp1 - lp2
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2 * (0.4 + 0.6 * t / dur)
    fade = np.minimum(1, (dur - t) / 0.05)
    return norm(out * env * fade)


sf.write('public/raya/sfx-pop.wav', pop(900, 260, 0.14), SR)
sf.write('public/raya/sfx-pop-small.wav', pop(1400, 600, 0.08), SR)
sf.write('public/raya/sfx-whoosh.wav', whoosh(0.8), SR)
print('ok')
# notifikasi mesej: dua nada lembut
t = np.arange(int(SR * 0.32)) / SR
def tone(f, st, d):
    e = np.where(t >= st, np.exp(-(t - st) / d) * (1 - np.exp(-np.maximum(t - st, 0) / 0.003)), 0)
    return np.sin(2 * np.pi * f * t) * e
sf.write('public/raya/sfx-notif.wav', norm(tone(1318.5, 0, 0.06) + 0.8 * tone(1760, 0.09, 0.08)), SR)
print('notif ok')
# v2 (typografi bermotion): hentakan, tik, swish pendek
def thud(dur=0.45):
    tt = np.arange(int(SR * dur)) / SR
    f = 45 + 110 * np.exp(-tt / 0.05)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.12)
    click = rng.standard_normal(len(tt)) * np.exp(-tt / 0.006) * 0.5
    return norm(body + click)
def tick():
    tt = np.arange(int(SR * 0.035)) / SR
    return norm(np.sin(2 * np.pi * 2600 * tt) * np.exp(-tt / 0.006) + 0.3 * rng.standard_normal(len(tt)) * np.exp(-tt / 0.003))
sf.write('public/raya/sfx-thud.wav', thud(), SR)
sf.write('public/raya/sfx-tick.wav', tick(), SR)
sf.write('public/raya/sfx-swish.wav', whoosh(0.32), SR)
print('v2 ok')
