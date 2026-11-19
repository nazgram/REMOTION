// Render bahagian tengah setiap SVG corak (tanpa wordmark NAFESA di sudut) ke PNG 1920x1920.
const {chromium} = require('playwright');
const fs = require('node:fs');
const dir = require('node:path').join(__dirname, '../public/v3/');
(async () => {
const browser = await chromium.launch();
const page = await browser.newPage({viewport: {width: 1920, height: 1920}});
for (const d of ['pearl', 'sky', 'blush', 'ruby', 'silver']) {
  let svg = fs.readFileSync(dir + d + '.svg', 'utf8');
  svg = svg.replace(/viewBox="[^"]*"/, 'viewBox="640 640 1960 1960" width="1920" height="1920" preserveAspectRatio="xMidYMid slice"');
  await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  await page.screenshot({path: dir + `pattern-${d}.png`, clip: {x: 0, y: 0, width: 1920, height: 1920}});
  console.log('ok', d);
}
await browser.close();
})();
