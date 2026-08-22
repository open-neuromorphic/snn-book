/**
 * Print-only repairs for cross-page references.
 *
 * ## The problem
 *
 * MyST resolves a reference to another *page* (`[](#training)`, or a markdown
 * link like `[training](/topics/training)`) into a `link` node carrying the
 * page URL. `myst-to-tex` renders those as `\href{/topics/training}{...}` — an
 * absolute site path that means nothing inside a PDF, so the reader gets a
 * dead link. Where the link text used the `{number}` template, the enumerator
 * is never substituted either and the PDF literally prints "Chp. {number}".
 *
 * References to a *heading inside* a page (`[](#sec:spk-nrn-lif)`) are fine:
 * those come through as `crossReference` nodes and become real `\ref`s.
 *
 * ## The fix
 *
 * Two passes, both active only when building the PDF (see PDF_EXPORT below):
 *
 * 1. `labelChapters` — MyST hoists each file's top heading into the article
 *    title and the export machinery re-emits it as `\chapter`/`\section`. That
 *    synthesised heading carries no `\label`, so there is nothing for a `\ref`
 *    to point at. We prepend a raw `\label{<page id>}` to every exported page,
 *    which lands immediately after the `\chapter{...}` and binds to it.
 *
 * 2. `resolvePageLinks` — rewrite every internal page link:
 *      - target *is* in the PDF  -> keep the link text and append a printed
 *        reference, e.g. "Training SNNs (Topic 2)", where the number is a real
 *        `\ref` resolved by LaTeX.
 *      - target is *not* in the PDF (contributors, reviewers, glossary — web
 *        only) -> unwrap to plain text, so print readers see prose rather than
 *        a link they cannot follow.
 *
 * Runs at the `project` stage: that is the only point where internal links
 * have been resolved (they carry `internal: true` and an `identifier`) but the
 * LaTeX renderer has not yet run.
 */

import fs from 'node:fs';
import path from 'node:path';

// `make pdf` sets both; DYNSIM_STATIC is accepted as an alias so an ad-hoc
// `DYNSIM_STATIC=1 myst build --pdf` behaves the same as the Makefile target.
const PDF_EXPORT = !!(process.env.PDF_EXPORT || process.env.DYNSIM_STATIC);

const ROOT = process.cwd();

// LaTeX sectioning depth (the `level:` key in myst.yml) -> the word the print
// book uses for it. The template relabels \chapter as "Topic" and \section as
// "Chapter" (see templates/plain_latex_book/template.tex), so these have to
// match that relabelling rather than LaTeX's own names.
const LEVEL_NOUN = ['Topic', 'Chapter', 'Section', 'Section'];

/**
 * Read the `articles:` list of the PDF export out of myst.yml.
 *
 * Deliberately a line scanner rather than a YAML parse: the project has no
 * YAML dependency, and the block is a flat, machine-written list of
 * `- file: <path>` / `level: <n>` pairs.
 *
 * @returns {Array<{file: string, level: number}>} exported articles, in order
 */
function readExportedArticles() {
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
function readPageIdentifier(absPath) {
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

// Built once per process — myst.yml and the page targets do not change during
// a build.
const PAGES = PDF_EXPORT ? buildPageIndex() : { byId: new Map(), byPath: new Map() };

/**
 * Walk a tree, replacing nodes for which `visit` returns an array of
 * replacement nodes. Returning undefined leaves the node in place.
 *
 * @param {object} node
 * @param {(child: object) => object[] | undefined} visit
 */
function replaceChildren(node, visit) {
  if (!node || !Array.isArray(node.children)) return;
  const next = [];
  for (const child of node.children) {
    const replacement = visit(child);
    if (replacement) {
      next.push(...replacement);
    } else {
      replaceChildren(child, visit);
      next.push(child);
    }
  }
  node.children = next;
}

/**
 * Concatenate the text carried by a subtree, ignoring formatting nodes.
 *
 * @param {object[]} nodes
 * @returns {string}
 */
function plainText(nodes) {
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
function crossRef(identifier, template) {
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

const labelChapters = {
  name: 'pdf-label-chapters',
  doc: 'Emit a \\label for each exported page so cross-page \\refs resolve',
  stage: 'project',
  plugin: () => (tree, file) => {
    if (!PDF_EXPORT || !file?.path) return tree;
    const id = PAGES.byPath.get(path.resolve(file.path));
    if (!id) return tree;
    // A `raw` node with a `tex` property is written verbatim by myst-to-tex.
    // As the first child it lands directly after the generated \chapter{...}.
    tree.children = [{ type: 'raw', lang: 'latex', tex: `\\label{${id}}\n` }, ...(tree.children ?? [])];
    return tree;
  },
};

const resolvePageLinks = {
  name: 'pdf-resolve-page-links',
  doc: 'Turn internal page links into printed cross-references or plain text',
  stage: 'project',
  plugin: () => (tree) => {
    if (!PDF_EXPORT) return tree;
    replaceChildren(tree, (node) => {
      if (node.type !== 'link' || !node.internal) return undefined;
      const children = node.children ?? [];
      const target = node.identifier ? PAGES.byId.get(node.identifier) : undefined;

      if (!target) {
        // Web-only page (contributors, reviewers, glossary) or an unresolvable
        // path: keep the words, drop the dead link.
        return children;
      }

      const noun = LEVEL_NOUN[target.level] ?? 'Section';
      const text = plainText(children);

      // `[Topic {number}](#training)` — the link text *is* the reference, but
      // only the web build substitutes `{number}`. Turn the whole link into one
      // cross-reference so LaTeX fills the enumerator in, instead of printing
      // the template literally and then repeating itself.
      if (text.includes('{number}')) {
        return [crossRef(node.identifier, text.replace(/\{number\}/g, '%s'))];
      }

      // Otherwise the link text is prose ("Training SNNs"): keep it and add the
      // printed location the reader needs in order to find it.
      return [
        ...children,
        { type: 'text', value: ' (' },
        crossRef(node.identifier, `${noun} %s`),
        { type: 'text', value: ')' },
      ];
    });
    return tree;
  },
};

const plugin = {
  name: 'PDF cross-reference fixups',
  transforms: [labelChapters, resolvePageLinks],
};

export default plugin;
