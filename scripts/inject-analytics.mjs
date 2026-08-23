// Injects the Umami analytics tag into every page of the built site.
//
// MyST only knows two analytics options (`analytics_google` and
// `analytics_plausible` under site.options), neither of which can emit a
// self-hosted Umami tag, and the book theme gives us no hook for extra <head>
// content. So we stamp the tag into the static HTML after the build instead.
//
// Run by `make html`; safe to re-run — pages that already carry the tag are
// left alone.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const HTML_DIR = '_build/html';

const TAG =
  '<script defer src="https://analytics.jepedersen.dk/script.js" ' +
  'data-website-id="23a3d87e-e641-45a6-a836-725eb958d725"></script>';

// Enough to recognise our own tag on a re-run, and narrow enough that it won't
// match anything else the theme puts in <head>.
const MARKER = 'analytics.jepedersen.dk/script.js';

/** Every .html file under `dir`, recursively. */
async function htmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return htmlFiles(path);
      return entry.name.endsWith('.html') ? [path] : [];
    }),
  );
  return files.flat();
}

/**
 * Add the tag just before </head>. Returns the new HTML, or null if the file
 * needs no change (already tagged, or has no <head> to put it in).
 */
export function injectTag(html) {
  if (html.includes(MARKER)) return null;
  const head = html.indexOf('</head>');
  if (head === -1) return null;
  return html.slice(0, head) + TAG + html.slice(head);
}

async function main() {
  const files = await htmlFiles(HTML_DIR);
  let injected = 0;
  for (const file of files) {
    const updated = injectTag(await readFile(file, 'utf8'));
    if (updated === null) continue;
    await writeFile(file, updated);
    injected += 1;
  }
  console.log(
    `analytics: tagged ${injected} of ${files.length} page(s) in ${HTML_DIR}`,
  );
}

// Only run when invoked directly, so the tests can import injectTag.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
