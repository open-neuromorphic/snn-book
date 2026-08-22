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

import path from 'node:path';

import {
  LEVEL_NOUN,
  PAGES,
  PDF_EXPORT,
  crossRef,
  plainText,
  replaceChildren,
} from './book-pages.mjs';

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
