// Bounding boxes via Chromium getBBox.
//   node scripts/teaser1_bbox.js <scarf.svg>         -> each child (flower group / leaf path) of the artwork's main group
//   node scripts/teaser1_bbox.js <logo.svg> shapes   -> every path of a logo, in document order
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setContent(fs.readFileSync(process.argv[2], 'utf8'));
  const r = await p.evaluate((mode) => {
    const box = (el) => { const bb = el.getBBox(); return { tag: el.tagName, x: bb.x, y: bb.y, w: bb.width, h: bb.height }; };
    const s = document.querySelector('svg');
    if (mode === 'shapes') return [...s.querySelectorAll('path')].map(box);
    const big = [...s.children].filter((e) => e.tagName === 'g').sort((a, b) => b.querySelectorAll('path').length - a.querySelectorAll('path').length)[0];
    return [...big.children].map(box);
  }, process.argv[3] || '');
  process.stdout.write(JSON.stringify(r));
  await b.close();
})();
