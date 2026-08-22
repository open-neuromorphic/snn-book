import { beforeAll, describe, expect, it } from 'vitest';

// The plugin reads myst.yml and the source markdown from process.cwd(), and it
// only builds its page index when PDF_EXPORT is set — both happen at import
// time, so the env has to be in place before the dynamic import below.
let plugin;

beforeAll(async () => {
  process.env.PDF_EXPORT = '1';
  plugin = (await import('./pdf-fixups.mjs')).default;
});

function transform(name, tree, file) {
  const spec = plugin.transforms.find((t) => t.name === name);
  return spec.plugin()(tree, file);
}

/** Collect every node of a type, depth-first. */
function collect(node, type, out = []) {
  if (node?.type === type) out.push(node);
  (node?.children ?? []).forEach((c) => collect(c, type, out));
  return out;
}

const link = (identifier, text, extra = {}) => ({
  type: 'link',
  internal: true,
  identifier,
  url: `/topics/${identifier}`,
  children: [{ type: 'text', value: text }],
  ...extra,
});

describe('pdf-fixups plugin structure', () => {
  it('exposes both transforms at the project stage', () => {
    const names = plugin.transforms.map((t) => t.name);
    expect(names).toEqual(['pdf-label-chapters', 'pdf-resolve-page-links']);
    expect(plugin.transforms.every((t) => t.stage === 'project')).toBe(true);
  });
});

describe('pdf-label-chapters', () => {
  it('prepends a raw \\label for a page in the PDF export', () => {
    const tree = { type: 'root', children: [{ type: 'paragraph', children: [] }] };
    transform('pdf-label-chapters', tree, { path: 'topics/2_training.md' });
    expect(tree.children[0]).toMatchObject({ type: 'raw', tex: '\\label{training}\n' });
  });

  it('leaves pages outside the PDF export alone', () => {
    const tree = { type: 'root', children: [{ type: 'paragraph', children: [] }] };
    transform('pdf-label-chapters', tree, { path: 'contributors.md' });
    expect(tree.children).toHaveLength(1);
    expect(tree.children[0].type).toBe('paragraph');
  });
});

describe('pdf-resolve-page-links', () => {
  it('appends a printed reference to a link into the PDF', () => {
    const tree = {
      type: 'root',
      children: [{ type: 'paragraph', children: [link('training', 'Training SNNs')] }],
    };
    transform('pdf-resolve-page-links', tree);

    const [ref] = collect(tree, 'crossReference');
    expect(ref).toMatchObject({ identifier: 'training', template: 'Topic %s' });
    // A template without %s would silently drop the \ref entirely.
    expect(ref.template).toContain('%s');
    expect(collect(tree, 'link')).toHaveLength(0);
  });

  it('uses the noun matching the sectioning level', () => {
    const tree = {
      type: 'root',
      // rate-enc is a level-2 article, which the print book calls a Section.
      children: [{ type: 'paragraph', children: [link('chapter:rate-enc', 'Rate Encoding')] }],
    };
    transform('pdf-resolve-page-links', tree);
    expect(collect(tree, 'crossReference')[0].template).toBe('Section %s');
  });

  it('replaces a {number} link outright instead of repeating itself', () => {
    const tree = {
      type: 'root',
      children: [{ type: 'paragraph', children: [link('training', 'Topic {number}')] }],
    };
    transform('pdf-resolve-page-links', tree);

    const refs = collect(tree, 'crossReference');
    expect(refs).toHaveLength(1);
    expect(refs[0].template).toBe('Topic %s');
    // The whole link became the reference — no leftover "(Topic %s)" tail.
    expect(tree.children[0].children).toHaveLength(1);
  });

  it('unwraps links to pages that are not in the PDF', () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'link',
              internal: true,
              url: '/contributors',
              children: [{ type: 'text', value: 'You can participate' }],
            },
          ],
        },
      ],
    };
    transform('pdf-resolve-page-links', tree);

    expect(collect(tree, 'link')).toHaveLength(0);
    expect(collect(tree, 'crossReference')).toHaveLength(0);
    expect(tree.children[0].children[0].value).toBe('You can participate');
  });

  it('leaves external links untouched', () => {
    const external = {
      type: 'link',
      url: 'https://open-neuromorphic.org',
      children: [{ type: 'text', value: 'ONM' }],
    };
    const tree = { type: 'root', children: [{ type: 'paragraph', children: [external] }] };
    transform('pdf-resolve-page-links', tree);
    expect(collect(tree, 'link')).toHaveLength(1);
  });
});
