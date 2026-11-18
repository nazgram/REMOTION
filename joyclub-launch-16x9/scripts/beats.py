"""Kesan beat lagu (song.m4a sudah dipotong 0:01-0:46) -> public/v3/beats.json (masa video)."""
import json, sys, numpy as np, librosa
src = sys.argv[1] if len(sys.argv) > 1 else 'public/v3/song.m4a'
import subprocess, tempfile, os
wav = os.path.join(tempfile.gettempdir(), 'jc_song.wav')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-ac', '1', '-ar', '22050', wav], check=True)
y, sr = librosa.load(wav, sr=22050)
tempo, frames = librosa.beat.beat_track(y=y, sr=sr)
beats = [round(float(t), 3) for t in librosa.frames_to_time(frames, sr=sr) if 0 <= t <= 45]
bpm = float(np.atleast_1d(tempo)[0])
json.dump({'bpm': round(bpm, 2), 'beats': beats}, open('public/v3/beats.json', 'w'))
g = np.diff(beats); print('bpm', round(bpm, 2), 'n', len(beats), 'gap min/med/max', g.min().round(3), np.median(g).round(3), g.max().round(3), 'first', beats[:4])
