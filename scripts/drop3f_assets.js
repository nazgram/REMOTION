// Fabric close-ups of the five Drop 3 prints for PetalPopDrop3Fabric, from Nas's vector (src/drop3t/pattern.json).
// Writes public/drop3f/<way>.jpg (the print face) and <way>_back.jpg (the fabric's reverse: mirrored, washed out).
//   node scripts/drop3f_assets.js
const { chromium } = require('playwright');
const fs = require('fs');
const P = require('../src/drop3t/pattern.json');
const OUT = __dirname + '/../public/drop3f';
fs.mkdirSync(OUT, { recursive: true });
const VB = [1240, 780, 760, 1352]; // tile units shown (wraps: units near the edge are drawn shifted by TILE too)
const W = 1170, H = 2080;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: W, height: H } });
  for (const way of P.ways) {
    const pal = P.palettes[way];
    let body = `<rect x="-9999" y="-9999" width="99999" height="99999" fill="${pal.bg}"/>`;
    for (const dx of [-P.TILE, 0, P.TILE]) for (const dy of [-P.TILE, 0, P.TILE]) {
      const g = P.units.filter((u) => u.x + dx > VB[0] - 300 && u.x + dx < VB[0] + VB[2] + 300 && u.y + dy > VB[1] - 300 && u.y + dy < VB[1] + VB[3] + 300);
      if (!g.length) continue;
      body += `<g transform="translate(${dx} ${dy})">` + g.map((u) => u.p.map(([d, c]) => `<path d="${d}" fill="${pal.colors[c]}"/>`).join('')).join('') + '</g>';
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${VB.join(' ')}">${body}</svg>`;
    for (const back of [false, true]) {
      const css = back ? 'transform:scaleX(-1);filter:saturate(.7) brightness(1.02);opacity:.42' : '';
      const bg = back ? (way === 'Petunia' ? '#2a211c' : '#fffaf4') : pal.bg;
      await p.setContent(`<html><body style="margin:0;background:${bg}"><div style="${css}">${svg}</div></body></html>`);
      await p.screenshot({ path: `${OUT}/${way}${back ? '_back' : ''}.jpg`, type: 'jpeg', quality: 90 });
    }
    console.log(way);
  }
  await b.close();
})();
