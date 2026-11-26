import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'path';
const frames = process.argv[2].split(',').map(Number);
const scale = Number(process.argv[3] || 0.5);
const outDir = process.argv[4] || 'out/stills';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const composition = await selectComposition({serveUrl, id: 'PetalPop4BTS', browserExecutable});
for (const frame of frames) {
  await renderStill({composition, serveUrl, frame, output: `${outDir}/f${String(frame).padStart(4, '0')}.jpg`, imageFormat: 'jpeg', scale, browserExecutable, chromiumOptions: {gl: 'swangle'}});
  process.stdout.write(frame + ' ');
}
