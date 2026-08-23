/**
 * Shared helpers for the print-only plugins (`pdf-fixups`, `latex-blocks`).
 *
 * The two things both need are a picture of which pages are in the PDF — MyST
 * does not hand a plugin its own project config — and a couple of mdast
 * utilities for rewriting trees.
 */

import fs from 'node:fs';
import path from 'node:path';

// `make pdf` sets PDF_EXPORT; DYNSIM_STATIC is accepted as an alias so an ad-hoc
// `DYNSIM_STATIC=1 myst build --pdf` behaves the same as the Makefile target.
export const PDF_EXPORT = !!(process.env.PDF_EXPORT || process.env.DYNSIM_STATIC);

const ROOT = process.cwd();

/**
 * LaTeX sectioning depth (the `level:` key in myst.yml) -> the word the print
 * book uses for it. The template relabels \chapter as "Topic" and \section as
 * "Chapter" (see templates/plain_latex_book/template.tex), so these have to
 * match that relabelling rather than LaTeX's own names.
 */
export const LEVEL_NOUN = ['Topic', 'Chapter', 'Section', 'Section'];

/**
 * Read the `articles:` list of the PDF export out of myst.yml.
 *
 * Deliberately a line scanner rather than a YAML parse: the project has no
 * YAML dependency, and the block is a flat, machine-written list of
 * `- file: <path>` / `level: <n>` pairs.
 *
 * @returns {Array<{file: string, level: number}>} exported articles, in order
 */
export function readExportedArticles() {
  const raw = fs.readFileSync(path.join(ROOT, 'myst.yml'), 'utf8');
  const lines = raw.split('\n');
  const start = lines.findIndex((l) => /^\s*articles:\s*$/.test(l));
  if (start === -1) return [];

  const articles = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^\s*$/.test(line)) continue;
    // The articles block is indented; the first line back at column 0 ends it.
    if (!/^\s/.test(line)) break;
    const fileMatch = line.match(/^\s*-\s*file:\s*(\S+)\s*$/);
    if (fileMatch) {
      articles.push({ file: fileMatch[1], level: 0 });
      continue;
    }
    const levelMatch = line.match(/^\s*level:\s*(\d+)\s*$/);
    if (levelMatch && articles.length) {
      articles[articles.length - 1].level = Number(levelMatch[1]);
    }
  }
  return articles;
}

/**
 * Find the MyST target that names a page as a whole — the `(label)=` line
 * directly above the file's first `#` heading.
 *
 * @param {string} absPath absolute path to a source markdown file
 * @returns {string | undefined} the page identifier, if the file declares one
 */
export function readPageIdentifier(absPath) {
  let text;
  try {
    text = fs.readFileSync(absPath, 'utf8');
  } catch {
    return undefined;
  }
  let lastTarget;
  for (const line of text.split('\n')) {
    const target = line.match(/^\(([^)]+)\)=\s*$/);
    if (target) {
      lastTarget = target[1];
      continue;
    }
    if (/^#\s+\S/.test(line)) return lastTarget;
    // Anything other than blank/frontmatter between the target and the heading
    // means the target belongs to something else.
    if (line.trim() !== '' && !line.startsWith('---')) lastTarget = undefined;
  }
  return undefined;
}

/**
 * Map every page in the PDF export to its identifier and sectioning level.
 *
 * Built once per process — myst.yml and the page targets do not change during
 * a build.
 *
 * @returns {{byId: Map<string, {level: number}>, byPath: Map<string, string>}}
 */
function buildPageIndex() {
  const byId = new Map();
  const byPath = new Map();
  for (const { file, level } of readExportedArticles()) {
    const absPath = path.resolve(ROOT, file);
    const id = readPageIdentifier(absPath);
    if (!id) continue;
    byId.set(id, { level });
    byPath.set(absPath, id);
  }
  return { byId, byPath };
}

export const PAGES = PDF_EXPORT ? buildPageIndex() : { byId: new Map(), byPath: new Map() };

/**
 * Look up the page identifier for a source file.
 *
 * Accepts the several shapes MyST uses for a file location: an absolute path,
 * a project-relative path, or one with a leading slash as it appears in an
 * embed node's `source.location`.
 *
 * @param {string | undefined} location
 * @returns {string | undefined} the page identifier, if the page is in the PDF
 */
export function pageIdForFile(location) {
  if (!location) return undefined;
  return PAGES.byPath.get(path.resolve(ROOT, location.replace(/^\//, '')));
}

/**
 * Concatenate the text carried by a subtree, ignoring formatting nodes.
 *
 * @param {object[]} nodes
 * @returns {string}
 */
export function plainText(nodes) {
  return (nodes ?? [])
    .map((n) => (typeof n.value === 'string' ? n.value : plainText(n.children)))
    .join('');
}

/**
 * Build a cross-reference node that myst-to-tex renders as a real `\ref`.
 *
 * The LaTeX renderer substitutes `%s` in `template` with `\ref{identifier}`;
 * a template *without* `%s` makes it print the node's text and emit no
 * reference at all, so every caller must include one. `children` is only there
 * to satisfy MyST's empty-link-text check — the template wins for output.
 *
 * @param {string} identifier target label
 * @param {string} template display text containing exactly one `%s`
 */
export function crossRef(identifier, template) {
  return {
    type: 'crossReference',
    kind: 'ref',
    identifier,
    label: identifier,
    template,
    resolved: true,
    children: [{ type: 'text', value: template.replace(/%s/g, '').trim() || identifier }],
  };
}

/**
 * Walk a tree, replacing nodes for which `visit` returns an array of
 * replacement nodes. Returning undefined leaves the node in place and recurses
 * into it.
 *
 * Replacements are run back through `visit` themselves, not just their
 * children: flattening a container lifts its content up a level, and that
 * content may still need rewriting. Visitors must therefore never return a
 * node of a type they also match, or this will not terminate.
 *
 * @param {object} node
 * @param {(child: object) => object[] | undefined} visit
 */
export function replaceChildren(node, visit) {
  if (!node || !Array.isArray(node.children)) return;
  const next = [];
  for (const child of node.children) {
    const replacement = visit(child);
    if (replacement) {
      const lifted = { children: replacement };
      replaceChildren(lifted, visit);
      next.push(...lifted.children);
    } else {
      replaceChildren(child, visit);
      next.push(child);
    }
  }
  node.children = next;
}
