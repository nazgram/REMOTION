// Render banyak still sekali bundle: node scripts/stills.mjs out/dir label:frame ...
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
const [outDir, ...items] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: process.env.COMP ?? 'PetalPop4Launch'});
for (const it of items) {
  const [label, frame] = it.split(':');
  await renderStill({serveUrl, composition, frame: +frame, output: path.join(outDir, `${label}.jpg`), imageFormat: 'jpeg', jpegQuality: 85});
  console.log('ok', label, frame);
}
