// node scripts/stills.mjs t1 t2 ... -> out/st/v2_<t>.png (satu bundle, scale 0.4)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'path';
const BROWSER = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public')});
const comp = await selectComposition({serveUrl, id: 'RayaAgent', browserExecutable: BROWSER});
for (const t of process.argv.slice(2)) {
  await renderStill({serveUrl, composition: comp, frame: Math.min(comp.durationInFrames - 1, Math.round(Number(t) * 30)), output: `out/st/v2_${t}.png`, scale: 0.4, browserExecutable: BROWSER, timeoutInMilliseconds: 120000});
  console.log('ok', t);
}
