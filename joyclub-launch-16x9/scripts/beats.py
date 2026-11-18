"""Kesan beat pada lagu PENUH (snapback.mp3), kemudian tukar ke masa video -> public/v3/beats.json.

Lagu video = Snap Back 1:47.792-2:51.192 (OFFSET). Kesan pada lagu penuh supaya fasa beat tak
terganggu oleh hujung potongan (kesan pada klip pendek tersasar separuh beat).
"""
import json, os, subprocess, sys, tempfile
import numpy as np, librosa

OFFSET = 107.792
src = sys.argv[1] if len(sys.argv) > 1 else 'public/v3/snapback.mp3'
wav = os.path.join(tempfile.gettempdir(), 'jc_song_full.wav')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vn', '-ac', '1', '-ar', '22050', wav], check=True)
y, sr = librosa.load(wav, sr=22050)
tempo, frames = librosa.beat.beat_track(y=y, sr=sr)
beats = [round(float(t) - OFFSET, 3) for t in librosa.frames_to_time(frames, sr=sr) if 0 <= t - OFFSET <= 63.4]
bpm = float(np.atleast_1d(tempo)[0])
json.dump({'bpm': round(bpm, 2), 'beats': beats}, open('public/v3/beats.json', 'w'))
g = np.diff(beats)
print('bpm', round(bpm, 2), 'n', len(beats), 'gap min/med/max', g.min().round(3), np.median(g).round(3), g.max().round(3), 'first', beats[:4], 'last', beats[-3:])
