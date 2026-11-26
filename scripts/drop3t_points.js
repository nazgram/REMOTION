// For every child of the main artwork group of a scarf SVG: its bbox and a few points on its outline (Chromium).
//   node scripts/drop3t_points.js <scarf.svg>  ->  [{x,y,w,h,pts:[[x,y],...]}, ...]
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setContent(fs.readFileSync(process.argv[2], 'utf8'));
  const r = await p.evaluate(() => {
    const s = document.querySelector('svg');
    const big = [...s.children].filter((e) => e.tagName === 'g').sort((a, b) => b.querySelectorAll('path').length - a.querySelectorAll('path').length)[0];
    return [...big.children].map((el) => {
      const bb = el.getBBox();
      const paths = el.tagName === 'path' ? [el] : [...el.querySelectorAll('path')];
      const pts = [];
      for (const q of paths.slice(0, 3)) {
        const L = q.getTotalLength();
        for (const f of [0, 0.25, 0.5, 0.75]) { const pt = q.getPointAtLength(L * f); pts.push([pt.x, pt.y]); }
      }
      return { x: bb.x, y: bb.y, w: bb.width, h: bb.height, pts };
    });
  });
  process.stdout.write(JSON.stringify(r));
  await b.close();
})();
