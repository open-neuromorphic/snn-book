import { beforeAll, describe, expect, it } from 'vitest';

// The plugin decides whether to do anything at import time, from the env.
let plugin;

beforeAll(async () => {
  process.env.PDF_EXPORT = '1';
  plugin = (await import('./latex-blocks.mjs')).default;
});

function transform(tree) {
  const spec = plugin.transforms.find((t) => t.name === 'pdf-print-blocks');
  return spec.plugin()(tree);
}

/** Collect every node of a type, depth-first. */
function collect(node, type, out = []) {
  if (node?.type === type) out.push(node);
  (node?.children ?? []).forEach((c) => collect(c, type, out));
  return out;
}

/** Concatenate all text in a subtree. */
function text(node) {
  if (typeof node?.value === 'string') return node.value;
  return (node?.children ?? []).map(text).join('');
}

const root = (...children) => ({ type: 'root', children });

const titled = (type, title, extra = {}) => ({
  type,
  children: [
    { type: 'admonitionTitle', children: [{ type: 'text', value: title }] },
    { type: 'paragraph', children: [{ type: 'text', value: 'body' }] },
  ],
  ...extra,
});

describe('latex-blocks plugin structure', () => {
  it('exposes one project-stage transform', () => {
    expect(plugin.transforms).toHaveLength(1);
    expect(plugin.transforms[0].stage).toBe('project');
  });
});

describe('exercise and solution', () => {
  it('becomes an admonition with the enumerator in the title', () => {
    const tree = root(titled('exercise', 'Spatial credit assignment', { enumerator: '1' }));
    transform(tree);

    const [box] = collect(tree, 'admonition');
    expect(box).toBeDefined();
    expect(text(box.children[0])).toBe('Exercise 1: Spatial credit assignment');
    // The body must survive — dropping it is the bug this plugin exists to fix.
    expect(text(box.children[1])).toBe('body');
    expect(collect(tree, 'exercise')).toHaveLength(0);
  });

  it('replaces an inline solution with a pointer to the appendix', () => {
    const tree = root(titled('solution', 'Solution to Exercise 1', { class: 'dropdown' }));
    transform(tree);

    // Print has no disclosure triangle, so the answer must not sit under the
    // question the way the inline box did.
    expect(collect(tree, 'admonition')).toHaveLength(0);
    // The crossReference's own text is placeholder only; LaTeX renders the
    // template, which is what the identifier/template assertion below checks.
    expect(text(tree)).toBe('Solution in Appendix.');
    const [ref] = collect(tree, 'crossReference');
    expect(ref).toMatchObject({ identifier: 'appendix:solutions', template: 'Appendix %s' });
  });

  it('renders an embedded solution as a box titled with its chapter', () => {
    const tree = root({
      type: 'embed',
      source: { location: '/topics/2_1_credit_assignment.md', title: 'Credit Assignment in SNNs' },
      children: [titled('solution', 'Solution to Exercise 1', { class: 'dropdown' })],
    });
    transform(tree);

    const [box] = collect(tree, 'admonition');
    expect(box).toBeDefined();
    expect(text(box.children[0])).toBe('Solution to Exercise 1 (Chapter)');
    // Exercise numbers restart per page, so the chapter ref is what keeps two
    // "Exercise 1" entries apart in the appendix.
    expect(collect(box.children[0], 'crossReference')[0]).toMatchObject({
      identifier: 'credit_assignment',
      template: 'Chapter %s',
    });
    expect(text(box.children[1])).toBe('body');
  });

  it('falls back to the chapter title when the page has no label', () => {
    const tree = root({
      type: 'embed',
      source: { location: '/topics/does-not-exist.md', title: 'Somewhere Else' },
      children: [titled('solution', 'Solution to Exercise 9')],
    });
    transform(tree);

    const [box] = collect(tree, 'admonition');
    expect(text(box.children[0])).toBe('Solution to Exercise 9 (Somewhere Else)');
  });

  it('falls back to the bare noun when there is no title or enumerator', () => {
    const tree = root({
      type: 'exercise',
      children: [{ type: 'paragraph', children: [{ type: 'text', value: 'body' }] }],
    });
    transform(tree);
    expect(text(collect(tree, 'admonition')[0].children[0])).toBe('Exercise');
  });

  it('flattens references to an exercise into their resolved text', () => {
    const tree = root({
      type: 'paragraph',
      children: [
        {
          type: 'crossReference',
          kind: 'exercise',
          identifier: '2_1_exercise_1',
          template: 'Exercise %s',
          children: [
            { type: 'text', value: 'Exercise ' },
            { type: 'text', value: '1' },
          ],
        },
      ],
    });
    transform(tree);

    // A \ref here would resolve against the enclosing section counter, not the
    // exercise number, so the reference must become plain text.
    expect(collect(tree, 'crossReference')).toHaveLength(0);
    expect(text(tree)).toBe('Exercise 1');
  });

  it('leaves figure and equation references alone', () => {
    const tree = root({
      type: 'paragraph',
      children: [
        {
          type: 'crossReference',
          kind: 'figure',
          identifier: 'fig-bptt',
          template: 'Figure %s',
          children: [{ type: 'text', value: 'Figure 2.8' }],
        },
      ],
    });
    transform(tree);
    expect(collect(tree, 'crossReference')).toHaveLength(1);
  });
});

describe('tabSet', () => {
  it('flattens tabs into labelled sections in order', () => {
    const tab = (title, code) => ({
      type: 'tabItem',
      title,
      children: [{ type: 'code', lang: 'python', value: code }],
    });
    const tree = root({
      type: 'tabSet',
      children: [tab('NumPy', 'a'), tab('PyTorch', 'b'), tab('JAX', 'c')],
    });
    transform(tree);

    expect(collect(tree, 'tabSet')).toHaveLength(0);
    expect(collect(tree, 'strong').map(text)).toEqual(['NumPy', 'PyTorch', 'JAX']);
    // Every tab's content is kept, not just the first one the web would show.
    expect(collect(tree, 'code').map((c) => c.value)).toEqual(['a', 'b', 'c']);
  });

  it('rewrites blocks nested inside a tab', () => {
    const tree = root({
      type: 'tabSet',
      children: [
        {
          type: 'tabItem',
          title: 'NumPy',
          children: [titled('exercise', 'Try it', { enumerator: '3' })],
        },
      ],
    });
    transform(tree);

    expect(collect(tree, 'exercise')).toHaveLength(0);
    expect(text(collect(tree, 'admonition')[0].children[0])).toBe('Exercise 3: Try it');
  });
});
