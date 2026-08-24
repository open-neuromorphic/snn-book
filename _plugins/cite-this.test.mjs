import fs from 'node:fs';
import path from 'node:path';

import { afterAll, describe, expect, it } from 'vitest';

import plugin from './cite-this.mjs';

const ROOT = process.cwd();
// Pages have to live under the project root for the transform to derive a
// sensible slug, so scratch files go in a directory that is already ignored.
const SCRATCH = path.join(ROOT, '_build', 'cite-this-test');

const transform = plugin.transforms.find((t) => t.name === 'cite-this').plugin();

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
    expect(entry).toMatch(/^@incollection\{snnbook-plain,/);
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
    expect(entry).toMatch(/^@incollection\{snnbook-guest,/);
    expect(entry).toContain('author    = {Doe, Jane and Roe, Richard}');
    expect(entry).toContain('{{A Guest Chapter}}');
    expect(entry).toMatch(/editor\s+= \{.*Pedersen, Jens Egholm.*\}/);
    expect(reference(block)).toContain('(Eds.)');
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

  it('leaves front matter and the PDF build alone', () => {
    const tree = { type: 'root', children: [] };
    transform(tree, { path: path.join(ROOT, 'glossary.md') });
    expect(tree.children).toHaveLength(0);
  });
});
