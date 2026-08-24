// Regenerate the static PNG fallbacks for the interactive {sgplot} surrogate
// plots (used in the PDF, which cannot render the live AnyWidget).
//
// It serves the repo, loads scripts/plot-harness.html once per variant (which
// renders the real widget), and exports each Plotly figure to _static/sg/<id>.png
// via Plotly.toImage — i.e. it automates the manual "screenshot the plot" step.
//
// Usage:  make plots   (or: node scripts/capture-plots.mjs)
// Requires: npm install, plus a Chromium for Playwright to drive:
//   - most systems:  npx playwright install chromium
//   - NixOS (bundled Chromium can't find system libs): point at a Nix-provided
//     browser, e.g.  PLAYWRIGHT_CHROMIUM=$(command -v chromium) make plots
//
// This is OPTIONAL. Contributors can instead capture the PNGs by hand — see the
// "Interactive plots" note in contributors.md. Regenerate whenever the plot code
// in _widgets/surrogate-widget.mjs changes.

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, '_static', 'sg');

// One entry per {sgplot} variant. width/height are the exported canvas size (px)
// before `scale`; pick per-variant so aspect ratios match the on-page plots.
const VARIANTS = [
  { id: 'sg-atan-plot', width: 900, height: 430 },
  { id: 'sg-fwd-plot', width: 900, height: 430 },
  { id: 'sg-dual-plot', width: 900, height: 430 },
  { id: 'sg-v3-plot', width: 1100, height: 440 },
];
const SCALE = 2; // 2x for crisp print resolution

const MIME = {
  '.html': 'text/html',
  '.mjs': 'text/javascript',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
};

function serveRepo() {
  const server = createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
      const filePath = path.join(ROOT, urlPath);
      // Keep the server inside the repo.
      if (!filePath.startsWith(ROOT)) {
        res.writeHead(403).end('forbidden');
        return;
      }
      const body = await readFile(filePath);
      res.writeHead(200, { 'content-type': MIME[path.extname(filePath)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const { server, port } = await serveRepo();
  // On NixOS, Playwright's bundled Chromium can't find system libs; set
  // PLAYWRIGHT_CHROMIUM to a Nix/system Chromium binary to use that instead.
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined,
  });
  try {
    const page = await browser.newPage();
    for (const { id, width, height } of VARIANTS) {
      await page.goto(`http://127.0.0.1:${port}/scripts/plot-harness.html?variant=${id}`);
      // Wait until the widget has rendered actual trace data.
      await page.waitForFunction(
        () => {
          const gd = document.querySelector('.js-plotly-plot');
          return gd && gd.data && gd.data.length > 0;
        },
        { timeout: 30000 },
      );
      // The widget re-renders once the bundled web font is ready; give it a beat
      // so text metrics are final before exporting.
      await page.waitForTimeout(500);

      const dataUrl = await page.evaluate(
        async ({ width, height, scale }) => {
          const gd = document.querySelector('.js-plotly-plot');
          return await window.Plotly.toImage(gd, { format: 'png', width, height, scale });
        },
        { width, height, scale: SCALE },
      );

      const b64 = dataUrl.split(',')[1];
      const outPath = path.join(OUT_DIR, `${id}.png`);
      await writeFile(outPath, Buffer.from(b64, 'base64'));
      console.log(`✔ wrote ${path.relative(ROOT, outPath)} (${width}x${height} @${SCALE}x)`);
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
