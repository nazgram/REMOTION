// Joy Club polka dot: pull hand-drawn dot shapes + the five colourways out of Nas's SVGs.
// The NAFESA wordmark in two corners is skipped (no text / logo in the video).
//   node scripts/joyclub_assets.js "<JOY CLUB folder>"   ->  src/joyclub/shapes.json
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const dir = process.argv[2];
const FILES = [
  ['White Sky blue', 'White Sky blue.svg'],
  ['Sky blue Red', 'Sky blue Red.svg'],
  ['Red Sky blue', 'Red Sky blue.svg'],
  ['Sage Taupe', 'Sage Taupe.svg'],
  ['Silver Brownie', '_Silver Brownie.svg'],
];
const N_SHAPES = 36;
const hex = (rgb) => '#' + rgb.match(/\d+/g).slice(0, 3).map((v) => (+v).toString(16).padStart(2, '0')).join('');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const palettes = [];
  let shapes = null;
  for (const [name, file] of FILES) {
    const svg = fs.readFileSync(path.join(dir, file), 'utf8').replace(/<\?xml[^>]*>/, '');
    await p.setContent(svg);
    const r = await p.evaluate(() => {
      const st = getComputedStyle;
      const paths = [...document.querySelectorAll('path')].map((e) => {
        const bb = e.getBBox();
        return { cx: bb.x + bb.width / 2, cy: bb.y + bb.height / 2, w: bb.width, h: bb.height, fill: st(e).fill, d: e.getAttribute('d') };
      });
      return { bg: st(document.querySelector('rect')).fill, paths };
    });
    // wordmark letters sit in the bottom-left and top-right corners
    const isLogo = (q) => (q.cx < 260 && q.cy > 3120) || (q.cx > 2980 && q.cy < 120);
    const dots = r.paths.filter((q) => !isLogo(q) && Math.abs(q.w - q.h) < 6 && q.w > 10);
    const count = {};
    dots.forEach((q) => (count[q.fill] = (count[q.fill] || 0) + 1));
    const dotFill = Object.keys(count).sort((a, c) => count[c] - count[a])[0];
    palettes.push({ name, bg: hex(r.bg), dot: hex(dotFill) });
    if (!shapes) {
      const step = Math.floor(dots.length / N_SHAPES);
      shapes = Array.from({ length: N_SHAPES }, (_, i) => dots[i * step]).map((q) => ({
        d: q.d, cx: +q.cx.toFixed(2), cy: +q.cy.toFixed(2), size: +Math.max(q.w, q.h).toFixed(2),
      }));
    }
    console.log(name, palettes.at(-1), 'dots', dots.length);
  }
  await b.close();
  fs.writeFileSync(path.join(__dirname, '..', 'src', 'joyclub', 'shapes.json'), JSON.stringify({ palettes, shapes }));
})();
