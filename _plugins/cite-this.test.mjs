import fs from 'node:fs';
import path from 'node:path';

import { afterAll, describe, expect, it } from 'vitest';

import plugin from './cite-this.mjs';

const ROOT = process.cwd();
// Pages have to live under the project root for the transform to derive a
// sensible slug, so scratch files go in a directory that is already ignored.
const SCRATCH = path.join(ROOT, '_build', 'cite-this-test');

const transform = plugin.transforms.find((t) => t.name === 'cite-this').plugin();

// Keys are `<book><year>-<page>`. The year part is computed the same way the
// plugin computes it — hard-coding it here would make these tests start failing
// on 1 January.
const BOOK_KEY = `snnbook${new Date().getFullYear()}`;

/** Matches the opening line of an entry keyed for `page`. */
const keyed = (page) => new RegExp(`^@incollection\\{${BOOK_KEY}-${page},`);

/** Write a scratch page and run the transform over an empty tree for it. */
function citationBlockFor(name, source) {
  fs.mkdirSync(SCRATCH, { recursive: true });
  const filePath = path.join(SCRATCH, name);
  fs.writeFileSync(filePath, source);
  const tree = { type: 'root', children: [] };
  transform(tree, { path: filePath });
  return tree.children.at(-1);
}

/** The BibTeX source out of a citation admonition. */
function bibtex(block) {
  return block?.children.find((child) => child.type === 'code')?.value ?? '';
}

/** The plain-text reference out of a citation admonition. */
function reference(block) {
  return block?.children.find((child) => child.type === 'paragraph')?.children[0]?.value ?? '';
}

afterAll(() => {
  fs.rmSync(SCRATCH, { recursive: true, force: true });
});

describe('cite-this', () => {
  it('cites the page, under the editors, when it names no authors', () => {
    const block = citationBlockFor('plain.md', '(chapter:plain)=\n# A Plain Chapter\n\nText.\n');
    const entry = bibtex(block);
    expect(entry).toMatch(keyed('plain'));
    expect(entry).toContain('{{A Plain Chapter}}');
    expect(entry).toContain('author    = {Gaurav, Ramashish and Pedersen, Jens Egholm and Bogdan, Petrut}');
    expect(entry).toContain('booktitle = {{Practical Spiking Neural Networks}}');
    expect(entry).toContain('/_build/cite-this-test/plain}');
    // Nothing is gained by naming the editors twice.
    expect(entry).not.toMatch(/^\s*editor\s+=/m);
    expect(reference(block)).not.toContain('(Eds.)');
  });

  it('cites the page authors, with the editors as editors, when it has its own', () => {
    const block = citationBlockFor(
      'guest.md',
      '---\nauthors:\n  - name: Doe, Jane\n  - Roe, Richard\n---\n\n(chapter:guest)=\n# A Guest Chapter\n\nText.\n',
    );
    const entry = bibtex(block);
    expect(entry).toMatch(keyed('guest'));
    expect(entry).toContain('author    = {Doe, Jane and Roe, Richard}');
    expect(entry).toContain('{{A Guest Chapter}}');
    expect(entry).toMatch(/editor\s+= \{.*Pedersen, Jens Egholm.*\}/);
    expect(reference(block)).toContain('(Eds.)');
  });

  it('reads an author list written flush-left', () => {
    // YAML lets a sequence sit at the same indent as its key, and the chapters
    // in topics/2_* are written that way. A terminator of `\S` ended the block
    // on the first `- name:` line, so those chapters silently fell back to
    // being credited to the editors.
    const block = citationBlockFor(
      'flush.md',
      [
        '---',
        'authors:',
        '- name: Kembay, Assel',
        '  affiliation: University of California, Santa Cruz',
        '  email: akembay@ucsc.edu',
        '- name: Pedersen, Jens Egholm',
        '  affiliation: Technical University of Denmark',
        '---',
        '',
        '(chapter:flush)=',
        '# A Flush Chapter',
        '',
      ].join('\n'),
    );
    const entry = bibtex(block);
    expect(entry).toContain('author    = {Kembay, Assel and Pedersen, Jens Egholm}');
    // Guest authors, so the editors belong in `editor` rather than `author`.
    expect(entry).toMatch(/editor\s+= \{.*Gaurav, Ramashish.*\}/);
    // The keys nested under each entry are not names.
    expect(entry).not.toContain('affiliation');
    expect(entry).not.toContain('ucsc.edu');
  });

  it('ends the author list at the next key', () => {
    const block = citationBlockFor(
      'stops.md',
      '---\nauthors:\n- name: Doe, Jane\nsubtitle: Not An Author\n---\n\n# Stops\n',
    );
    expect(bibtex(block)).toContain('author    = {Doe, Jane}');
    expect(bibtex(block)).not.toContain('Not An Author');
  });

  it('reads the scalar and inline-list author forms too', () => {
    const scalar = citationBlockFor('scalar.md', '---\nauthor: Doe, Jane\n---\n\n# Scalar\n');
    expect(bibtex(scalar)).toContain('author    = {Doe, Jane}');

    const inline = citationBlockFor(
      'inline.md',
      '---\nauthors: ["Doe, Jane", "Roe, Richard"]\n---\n\n# Inline\n',
    );
    expect(bibtex(inline)).toContain('author    = {Doe, Jane and Roe, Richard}');
  });

  it('does not repeat the editors as editors when the page just lists them', () => {
    const block = citationBlockFor(
      'editors.md',
      // Same people as myst.yml, in a different order and name format.
      '---\nauthors:\n  - Petrut Bogdan\n  - Ramashish Gaurav\n  - Jens Egholm Pedersen\n---\n\n# Editorial\n',
    );
    expect(bibtex(block)).not.toMatch(/^\s*editor\s+=/m);
  });

  it('gives every chapter its own citation key', () => {
    const a = bibtex(citationBlockFor('key-a.md', '(chapter:key-a)=\n# Key A\n'));
    const b = bibtex(citationBlockFor('key-b.md', '(chapter:key-b)=\n# Key B\n'));

    // Each page emits its own @incollection, with that chapter's title and
    // authors. BibTeX cannot hold two entries under one key, so sharing a key
    // would break for any reader citing two chapters.
    expect(a).toMatch(keyed('key-a'));
    expect(b).toMatch(keyed('key-b'));
    expect(a).toContain('{{Key A}}');
    expect(b).toContain('{{Key B}}');
  });

  it('drops the label namespace and normalises the suffix', () => {
    // `chapter:` is a namespace, not part of the name, and underscores are not
    // idiomatic in a citation key.
    const entry = bibtex(citationBlockFor('sg.md', '(chapter:surrogate_gradients)=\n# SG\n'));
    expect(entry).toMatch(keyed('surrogate-gradients'));
  });

  it('falls back to the filename when the page declares no label', () => {
    const entry = bibtex(citationBlockFor('no-label.md', '# No Label\n'));
    expect(entry).toMatch(keyed('no-label'));
  });

  it('leaves front matter and the PDF build alone', () => {
    const tree = { type: 'root', children: [] };
    transform(tree, { path: path.join(ROOT, 'glossary.md') });
    expect(tree.children).toHaveLength(0);
  });
});
