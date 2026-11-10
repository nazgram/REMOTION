// Frames for the footage in PetalPopDrop3Teaser30: for every shot in src/drop3t/timeline30.json, the JPEGs it needs
// at 30 fps (normal speed = every second frame of the 59.94 fps proxy, slow motion = every frame), lightly graded.
//   node scripts/drop3t30_frames.js   raw/drop3t/<id>.mp4 -> public/drop3t/v/<id>/000.jpg ...
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const TL = require('../src/drop3t/timeline30.json');
const GRADE = 'eq=contrast=1.06:saturation=1.07:gamma=0.97';
const seen = new Set();
for (const v of Object.values(TL.videos)) {
  for (const s of v.shots) {
    if (seen.has(s.id)) throw new Error('shot used twice: ' + s.id);
    seen.add(s.id);
    const dir = path.join(__dirname, '../public/drop3t/v', s.id);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const pick = s.speed === 1 ? "select='not(mod(n\\,2))'," : '';
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(s.ss), '-i', path.join(__dirname, '../raw/drop3t', s.id + '.mp4'),
      '-vf', `${pick}${GRADE}`, '-fps_mode', 'passthrough', '-frames:v', String(s.n), '-q:v', '3', '-start_number', '0', path.join(dir, '%03d.jpg')]);
    const got = fs.readdirSync(dir).length;
    if (got < s.n) throw new Error(`${s.id}: ${got} frames, need ${s.n} (proxy too short)`);
    console.log(s.id, got);
  }
}
