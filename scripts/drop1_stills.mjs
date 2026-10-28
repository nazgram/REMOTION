// Render chosen seconds of a composition as PNGs from one bundle (storyboard frames).
//   node scripts/drop1_stills.mjs <outDir> <compId> <sec> [sec...]   (SCALE env, default 0.5)
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'path';
const [outDir, id, ...secs] = process.argv.slice(2);
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const composition = await selectComposition({ serveUrl, id, browserExecutable });
for (const s of secs) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(Number(s) * composition.fps));
  await renderStill({ serveUrl, composition, frame, output: `${outDir}/f_${s}.png`, scale: Number(process.env.SCALE ?? 0.5), browserExecutable });
  console.log(s);
}
