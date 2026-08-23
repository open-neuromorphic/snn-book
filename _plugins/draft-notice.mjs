/**
 * A standard "this chapter is still a draft" banner.
 *
 * Usage — one line directly under a chapter's title:
 *
 *   ```{draft}
 *   ```
 *
 * Or with a chapter-specific note appended to the standard wording:
 *
 *   ```{draft}
 *   The hardware benchmarks in this chapter are placeholders.
 *   ```
 *
 * On the web this renders as a `warning` admonition, which the theme styles as
 * a coloured callout. In the PDF the same banner would repeat as a framed box
 * on every chapter opening, so print gets a compact italic line instead — same
 * information, a fraction of the page. Keeping it in a directive rather than
 * copy-pasted prose means the wording and the version number are edited in
 * exactly one place.
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Read `book_version` from the pdf export in myst.yml, so the banner, the PDF
 * title page and the release all move together. Line-scanned rather than
 * YAML-parsed: the project has no YAML dependency and the key is written by
 * hand at a known indent.
 *
 * @returns {string | undefined} the version string, e.g. "0.8"
 */
function readBookVersion() {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'myst.yml'), 'utf8');
    const match = raw.match(/^\s*book_version:\s*['"]?([^'"\s]+)['"]?\s*$/m);
    return match?.[1];
  } catch {
    return undefined;
  }
}

const VERSION = readBookVersion();

// Set by `make pdf`; DYNSIM_STATIC is accepted as an alias so an ad-hoc
// `DYNSIM_STATIC=1 myst build --pdf` behaves the same as the Makefile target.
const PDF_EXPORT = !!(process.env.PDF_EXPORT || process.env.DYNSIM_STATIC);

// TODO(jens): wording is a placeholder — adjust to taste before release.
const NOTICE =
  VERSION
    ? `This chapter is a draft, part of the v${VERSION} release. Its content is still under review and may change before v1.0.`
    : 'This chapter is a draft. Its content is still under review and may change before v1.0.';

const plugin = {
  name: 'Draft notice',
  directives: [
    {
      name: 'draft',
      doc: 'Standard draft banner for an unreleased chapter',
      body: {
        type: 'myst',
        doc: 'Optional chapter-specific note, appended to the standard wording',
        required: false,
      },
      run(data) {
        const extra = Array.isArray(data.body) ? data.body : [];

        if (PDF_EXPORT) {
          return [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'emphasis',
                  children: [{ type: 'text', value: `Draft. ${NOTICE}` }],
                },
              ],
            },
            ...extra,
          ];
        }

        return [
          {
            type: 'admonition',
            kind: 'warning',
            children: [
              {
                type: 'admonitionTitle',
                children: [{ type: 'text', value: 'Draft' }],
              },
              { type: 'paragraph', children: [{ type: 'text', value: NOTICE }] },
              ...extra,
            ],
          },
        ];
      },
    },
  ],
};

export default plugin;
