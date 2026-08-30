/**
 * A "Cite this chapter" block at the foot of every content page (web only).
 *
 * MyST has no built-in citation widget: the theme surfaces the *project*
 * frontmatter (authors, licence, DOI) in the page header, but offers no way for
 * a reader to lift a BibTeX entry for the page they are on. This transform
 * appends one — a collapsed `dropdown` admonition holding a plain-text
 * reference and a `bibtex` code block, which the web theme renders with its
 * usual copy button.
 *
 * Every page is cited as a chapter of the book — an `@incollection` naming the
 * page, not the book — because that is what the reader is actually reading. Who
 * it names depends on the page: authors declared in its own frontmatter if it
 * has any, the book's editors otherwise, since a page that names nobody was
 * written by them. A guest-authored chapter additionally carries the editors in
 * `editor`; a chapter by the editors themselves does not repeat them there.
 *
 * Everything in the entry is derived, so there is nothing to keep in sync by
 * hand:
 *
 *   - editors / booktitle / publisher  -> `project:` in myst.yml
 *   - edition                          -> `book_version:` of the pdf export
 *   - year                             -> the build year
 *   - authors / title                  -> the page's frontmatter, falling back
 *                                         to its first `#` heading
 *   - url                              -> SITE_URL + the page's slug
 *   - key                              -> book name + year + the page's
 *                                         `(label)=` target
 *
 * Suppressed for the PDF build (a print reader cannot copy from it, and the
 * book is cited as a whole there) and on front/back matter, which is not
 * chapter-like enough to be worth a citation box.
 *
 * If the book ever gets a DOI — per release from Zenodo, say — add it to
 * `DOI` below and it will appear in every entry.
 */

import fs from 'node:fs';
import path from 'node:path';

const PDF_EXPORT = !!(process.env.PDF_EXPORT || process.env.DYNSIM_STATIC);

const ROOT = process.cwd();

// Canonical home of the published book; every citation URL hangs off it.
// Override at build time with SITE_URL=... if the deployment moves.
const SITE_URL = (process.env.SITE_URL || 'https://snnbook.net').replace(/\/$/, '');

// Plain DOM id on the block, so it can be linked to directly.
const ANCHOR = 'cite-this';

// Concept DOI for the book, once one exists (e.g. from Zenodo). Empty = omitted.
const DOI = '';

const PUBLISHER = 'Open Neuromorphic';

// Stem of the BibTeX citation key. The build year is appended to it (BOOK_KEY,
// below), and each page then adds its own suffix (citationKey), giving
// e.g. snnbook2026-point-neurons.
const BOOK_KEY_STEM = 'snnbook';

// Front and back matter: no citation box at all.
const SKIP = new Set([
  'README.md',
  'acknowledgements.md',
  'contributors.md',
  'reviewers.md',
  'glossary.md',
  'lif_visual.md',
  'dev/simulation.md',
]);

/**
 * Pull the handful of keys the citation needs out of myst.yml.
 *
 * Line-scanned rather than YAML-parsed, matching the other plugins here: the
 * project has no YAML dependency, and these keys are hand-written at a known
 * indent.
 *
 * @returns {{title: string, version?: string, editors: string[]}}
 */
function readProjectMeta() {
  let raw;
  try {
    raw = fs.readFileSync(path.join(ROOT, 'myst.yml'), 'utf8');
  } catch {
    return { title: '', editors: [] };
  }
  const title = raw.match(/^\s{2}title:\s*(.+?)\s*$/m)?.[1]?.replace(/^['"]|['"]$/g, '') ?? '';
  // Same key the draft banner and the PDF title page use, so all three move
  // together with the release.
  const version = raw.match(/^\s*book_version:\s*['"]?([^'"\s]+)['"]?\s*$/m)?.[1];
  const editors = readAuthorList(raw.split('\n'), /^\s{2}authors:\s*$/, 2);
  return { title, version, editors };
}

/**
 * Collect the names out of a YAML `authors:` block: a list of either mappings
 * with a `name:` key, or bare strings.
 *
 * @param {string[]} lines the document, split into lines
 * @param {RegExp} opener matches the `authors:` line that starts the block
 * @param {number} indent column the `authors:` key sits at; the block ends at
 *                        the next key indented no further
 * @returns {string[]} the names, in order
 */
function readAuthorList(lines, opener, indent) {
  const start = lines.findIndex((line) => opener.test(line));
  if (start === -1) return [];
  const names = [];
  // The block ends at the next *key*, not at the next non-blank line: YAML lets
  // a sequence sit at the same indent as the key that owns it, so page
  // frontmatter is commonly written flush-left --
  //
  //   authors:
  //   - name: Doe, Jane
  //
  // and a terminator of `\S` would end the block on the very first entry.
  // Excluding `-` keeps sequence items inside it.
  const ends = new RegExp(`^\\s{0,${indent}}[^\\s-]`);
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim() === '') continue;
    if (ends.test(line)) break;
    const named = line.match(/^\s*-\s*name:\s*(.+?)\s*$/);
    const bare = line.match(/^\s*-\s*([^:]+?)\s*$/);
    const name = named?.[1] ?? bare?.[1];
    if (name) names.push(name.replace(/^['"]|['"]$/g, ''));
  }
  return names;
}

/**
 * The names a page claims for itself, in any of the shapes MyST accepts for
 * page frontmatter:
 *
 *   author: Doe, Jane
 *   authors: [Doe, Jane]          (an inline list — or a single name)
 *   authors:
 *     - Doe, Jane
 *     - name: Roe, Richard
 *
 * @param {string[]} frontmatter the lines between the opening and closing `---`
 * @returns {string[]} the names, in order
 */
function readFrontmatterAuthors(frontmatter) {
  const scalar = frontmatter.find((line) => /^authors?:\s*\S/.test(line));
  if (scalar) {
    const value = scalar.replace(/^authors?:\s*/, '').trim();
    const inline = value.match(/^\[(.*)\]$/);
    // Names contain commas ("Doe, Jane"), so an inline list only splits on the
    // commas that fall outside quotes.
    const items = inline ? inline[1].match(/(?:"[^"]*"|'[^']*'|[^,])+/g) ?? [] : [value];
    return items.map((name) => name.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
  }
  return readAuthorList(frontmatter, /^authors?:\s*$/, 0);
}

/**
 * Everything the citation needs from a page's own source: its YAML frontmatter
 * (if any), the `(label)=` target above the top heading, and the heading text.
 *
 * Read from disk rather than from the tree: by the `project` stage MyST has
 * hoisted the heading into the article title and removed it from the body, and
 * the vfile handed to a transform carries no parsed frontmatter at all (its
 * `data` is empty), so the source file is the only place the page's own authors
 * can be recovered from.
 *
 * @param {string} absPath absolute path to a source markdown file
 * @returns {{title?: string, label?: string, authors: string[]}}
 */
function readPageMeta(absPath) {
  let text;
  try {
    text = fs.readFileSync(absPath, 'utf8');
  } catch {
    return { authors: [] };
  }
  const lines = text.split('\n');

  // A frontmatter block, if present, is the very first line: `---` to `---`.
  let body = lines;
  let frontmatter = [];
  if (lines[0]?.trim() === '---') {
    const end = lines.findIndex((line, i) => i > 0 && line.trim() === '---');
    if (end !== -1) {
      frontmatter = lines.slice(1, end);
      body = lines.slice(end + 1);
    }
  }

  const authors = readFrontmatterAuthors(frontmatter);
  const fmTitle = frontmatter
    .find((line) => /^title:\s*\S/.test(line))
    ?.replace(/^title:\s*/, '')
    .trim()
    .replace(/^['"]|['"]$/g, '');

  let label;
  let heading;
  for (const line of body) {
    const target = line.match(/^\(([^)]+)\)=\s*$/);
    if (target) {
      label = target[1];
      continue;
    }
    const match = line.match(/^#\s+(.+?)\s*$/);
    if (match) {
      heading = match[1].trim();
      break;
    }
    // Anything else between the target and the heading means the target
    // belongs to something other than the page.
    if (line.trim() !== '') label = undefined;
  }

  return { title: fmTitle ?? heading, label, authors };
}

/**
 * The site path MyST serves a page at. With `folders: true` the slug keeps the
 * source directory, so `topics/1_2_spiking.md` -> `/topics/1_2_spiking`.
 *
 * @param {string} relPath source path relative to the project root
 * @returns {string}
 */
function pageUrl(relPath) {
  return `${SITE_URL}/${relPath.replace(/\.(md|ipynb)$/, '')}`;
}

/**
 * A BibTeX citation key for a page: the book key plus the page's label with its
 * namespace prefix dropped. `chapter:point-neurons` -> `snnbook2026-point-neurons`.
 *
 * Each page needs its own key because each page emits its own `@incollection`,
 * with that chapter's title and authors. BibTeX cannot hold two entries under
 * one key, so a shared key would break for any reader citing two chapters.
 *
 * @param {string | undefined} label
 * @param {string} relPath used when the page declares no label
 * @returns {string}
 */
function citationKey(label, relPath) {
  const base = label?.split(':').pop() ?? path.basename(relPath).replace(/\.\w+$/, '');
  const suffix = base
    .replace(/[^A-Za-z0-9-]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return `${BOOK_KEY}-${suffix}`;
}

/**
 * Render the fields as a BibTeX entry, aligning the `=` the way a hand-written
 * .bib file does. Fields with no value are dropped.
 *
 * @param {string} type entry type, without the `@`
 * @param {string} key citation key
 * @param {Array<[string, string | undefined]>} fields
 * @returns {string}
 */
function formatBibtex(type, key, fields) {
  const present = fields.filter(([, value]) => value);
  const width = Math.max(...present.map(([name]) => name.length));
  const body = present
    .map(([name, value]) => `  ${name.padEnd(width)} = {${value}},`)
    .join('\n');
  return `@${type}{${key},\n${body}\n}`;
}

/**
 * Do these two name lists describe the same people?
 *
 * Compared as unordered bags of words, so neither the order of the list nor the
 * order of a name ("Bogdan, Petrut" vs "Petrut Bogdan") decides whether a page
 * counts as separately authored.
 *
 * @param {string[]} a
 * @param {string[]} b
 * @returns {boolean}
 */
function sameNames(a, b) {
  if (a.length !== b.length) return false;
  const norm = (names) =>
    names.map((name) => name.toLowerCase().split(/[\s,]+/).filter(Boolean).sort().join(' ')).sort();
  const [left, right] = [norm(a), norm(b)];
  return left.every((name, i) => name === right[i]);
}

const PROJECT = readProjectMeta();
// Stamped once per build, so every page of a given deployment agrees.
const YEAR = String(new Date().getFullYear());
// e.g. snnbook2026 — stem plus year, the usual BibTeX convention. Derived from
// YEAR rather than written out, so the key and the entry's `year` field cannot
// disagree; a rebuild in a later year moves both together.
const BOOK_KEY = `${BOOK_KEY_STEM}${YEAR}`;
// Double braces keep BibTeX styles that case-fold titles from doing so.
const BOOK_TITLE = `{${PROJECT.title}}`;
const EDITION = PROJECT.version ? `Version ${PROJECT.version}` : undefined;

/**
 * Build the chapter citation for a page.
 *
 * @param {{title?: string, label?: string, authors: string[]}} page
 * @param {string} relPath
 * @returns {{text: string, bibtex: string, url: string}}
 */
function citationFor(page, relPath) {
  // A page that names nobody was written by the editors themselves; they are
  // its authors, and repeating them as `editor` would say nothing.
  const authors = page.authors.length > 0 ? page.authors : PROJECT.editors;
  const editors = sameNames(authors, PROJECT.editors) ? [] : PROJECT.editors;
  const url = pageUrl(relPath);

  const inBook = editors.length
    ? `In ${editors.join('; ')} (Eds.), ${PROJECT.title}.`
    : `In ${PROJECT.title}.`;

  return {
    url,
    text: `${authors.join('; ')} (${YEAR}). ${page.title}. ${inBook}${EDITION ? ` ${EDITION}.` : ''} ${PUBLISHER}. `,
    bibtex: formatBibtex('incollection', citationKey(page.label, relPath), [
      ['author', authors.join(' and ')],
      ['title', `{${page.title}}`],
      ['booktitle', BOOK_TITLE],
      ['editor', editors.join(' and ')],
      ['publisher', PUBLISHER],
      ['year', YEAR],
      ['edition', EDITION],
      ['doi', DOI],
      ['url', url],
    ]),
  };
}

const citeThis = {
  name: 'cite-this',
  doc: 'Append a copyable BibTeX entry to the foot of every content page',
  stage: 'project',
  plugin: () => (tree, file) => {
    if (PDF_EXPORT || !file?.path) return tree;
    const absPath = path.resolve(file.path);
    const relPath = path.relative(ROOT, absPath);
    if (SKIP.has(relPath)) return tree;

    const page = readPageMeta(absPath);
    if (!page.title) return tree;

    const { text, bibtex, url } = citationFor(page, relPath);

    tree.children = [
      ...(tree.children ?? []),
      {
        type: 'admonition',
        kind: 'note',
        class: 'dropdown',
        // A plain DOM id (not a MyST `identifier`, which would be a duplicate
        // target on every page) so the block can be linked to directly.
        html_id: ANCHOR,
        children: [
          {
            type: 'admonitionTitle',
            children: [{ type: 'text', value: 'Cite this chapter' }],
          },
          {
            type: 'paragraph',
            children: [
              { type: 'text', value: text },
              { type: 'link', url, children: [{ type: 'text', value: url }] },
            ],
          },
          { type: 'code', lang: 'bibtex', value: bibtex },
        ],
      },
    ];
    return tree;
  },
};

const plugin = {
  name: 'Cite this chapter',
  transforms: [citeThis],
};

export default plugin;
