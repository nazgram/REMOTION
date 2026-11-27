"""Kesan beat pada lagu PENUH (April Rain Rhythm), tukar ke masa video -> public/pp4/beats.json.
Video = lagu 2:45.5-3:12 (OFFSET 165.5, 26.5 s)."""
import json, os, subprocess, sys, tempfile
import numpy as np, librosa

src = sys.argv[1]
# Versi panjang 9:16: python3 scripts/beats.py <mp3> 165.5 51.2 public/pp4/beats_long.json
OFFSET = float(sys.argv[2]) if len(sys.argv) > 2 else 165.5
DUR = float(sys.argv[3]) if len(sys.argv) > 3 else 26.5
OUT = sys.argv[4] if len(sys.argv) > 4 else 'public/pp4/beats.json'
wav = os.path.join(tempfile.gettempdir(), 'pp4_song_full.wav')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vn', '-ac', '1', '-ar', '22050', wav], check=True)
y, sr = librosa.load(wav, sr=22050)
tempo, frames = librosa.beat.beat_track(y=y, sr=sr)
beats = [round(float(t) - OFFSET, 3) for t in librosa.frames_to_time(frames, sr=sr) if -0.05 <= t - OFFSET <= DUR]
bpm = float(np.atleast_1d(tempo)[0])
json.dump({'bpm': round(bpm, 2), 'beats': beats}, open(OUT, 'w'))
g = np.diff(beats)
print('bpm', round(bpm, 2), 'n', len(beats), 'gap min/med/max', g.min().round(3), np.median(g).round(3), g.max().round(3), 'first', beats[:4], 'last', beats[-3:])
