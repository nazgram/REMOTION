// Rasterize SVG sprite sheets to transparent PNGs with the local Chromium (Playwright).
//   node scripts/raster_svg.js '[["in.svg","out.png"], ...]'
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  for (const [src, out] of JSON.parse(process.argv[2])) {
    const svg = fs.readFileSync(src, 'utf8');
    const vb = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
    const W = 7600, H = Math.round(W * vb[3] / vb[2]);
    const p = await b.newPage({ viewport: { width: W, height: H } });
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${W}" height="${H}" `)}</body></html>`);
    await p.screenshot({ path: out, omitBackground: true });
    await p.close();
    console.log(out, W, H);
  }
  await b.close();
})();
