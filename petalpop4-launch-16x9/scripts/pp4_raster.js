// Rasterize regions of SVG files to transparent PNGs with the local Chromium (Playwright).
//   node scripts/drop3_raster.js jobs.json   jobs = [{ svg, vb: [x, y, w, h], W, H, out }, ...]
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const jobs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const b = await chromium.launch();
  const cache = {};
  const p = await b.newPage();
  for (const j of jobs) {
    const svg = (cache[j.svg] ??= fs.readFileSync(j.svg, 'utf8'));
    await p.setViewportSize({ width: j.W, height: j.H });
    const s = svg.replace(/<svg [^>]*?viewBox="[^"]*"/, `<svg xmlns="http://www.w3.org/2000/svg" width="${j.W}" height="${j.H}" viewBox="${j.vb.join(' ')}"`);
    await p.setContent(`<html><body style="margin:0;background:transparent">${s}</body></html>`);
    await p.screenshot({ path: j.out, omitBackground: true });
  }
  await b.close();
})();
