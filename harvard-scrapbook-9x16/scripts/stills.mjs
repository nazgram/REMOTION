import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'path';
const frames = process.argv[2].split(',').map(Number);
const scale = Number(process.argv[3] || 0.4);
const outDir = process.argv[4] || 'out/st';
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: process.env.COMP || 'HarvardScrapbook', browserExecutable});
for (const f of frames) {
  await renderStill({serveUrl, composition, frame: f, output: `${outDir}/f${String(f).padStart(3,'0')}.png`, scale, browserExecutable});
  console.log('ok', f);
}
