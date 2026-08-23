/**
 * Print fallbacks for block types `myst-to-tex` cannot render.
 *
 * ## The problem
 *
 * `myst-to-tex` has no handler for `exercise`, `solution` or `tabSet`. An
 * unhandled node is logged (`⛔️ Unhandled LaTeX conversion for node of ...`)
 * and then **silently dropped**, so the PDF was missing every exercise, every
 * solution, and the whole NumPy/PyTorch/JAX code tab-set in the surrogate
 * gradients chapter — with nothing in the output to show that content was gone.
 *
 * ## The fix
 *
 * Rewrite each of them, at the `project` stage and only when building the PDF,
 * into node types the LaTeX renderer already understands:
 *
 *   - `exercise` -> `admonition` (a `framed` box), with the enumerator baked
 *     into the title: "Exercise 1: Spatial credit assignment".
 *   - `tabSet`   -> its tabs one after another, each introduced by its title in
 *     bold. Tabs are a screen affordance; on paper the reader wants all three
 *     implementations in sequence.
 *   - `solution` -> depends on where it is; see below.
 *
 * ## Solutions move to an appendix
 *
 * Solutions are authored with `:class: dropdown`, i.e. hidden until the reader
 * asks for them. The web honours that. Print has no disclosure triangle, so
 * setting a solution directly under its exercise would put the answer in the
 * reader's eye before they have attempted the question — the opposite of what
 * the source asks for.
 *
 * `topics/a_solutions.md` (in the pdf export's `articles:` list, deliberately
 * absent from the site `toc`) embeds each solution by label. This transform
 * then renders a solution differently depending on the context it is found in:
 *
 *   - inside an `embed`, i.e. in the appendix -> the full framed box, titled
 *     with the chapter it came from so that two "Exercise 1"s from different
 *     chapters stay distinguishable.
 *   - anywhere else, i.e. inline in a chapter -> replaced by a one-line
 *     pointer, "Solution in Appendix B."
 */

import {
  LEVEL_NOUN,
  PAGES,
  PDF_EXPORT,
  crossRef,
  pageIdForFile,
  plainText,
  replaceChildren,
} from './book-pages.mjs';

// Node types this plugin replaces, plus the word that introduces each in print.
const BLOCK_NOUN = { exercise: 'Exercise', solution: 'Solution' };

// Page target of topics/a_solutions.md. Inline solutions point here.
const SOLUTIONS_APPENDIX = 'appendix:solutions';

/**
 * Split an exercise/solution into its title node and its body.
 *
 * Both directives put an `admonitionTitle` first — the same shape `admonition`
 * uses — so the body is simply everything after it.
 *
 * @param {object} node
 * @returns {{title: object[], body: object[]}} title children and body nodes
 */
function splitTitle(node) {
  const children = node.children ?? [];
  const first = children[0];
  if (first?.type === 'admonitionTitle') {
    return { title: first.children ?? [], body: children.slice(1) };
  }
  return { title: [], body: children };
}

/**
 * Build the heading text for an exercise or solution.
 *
 * MyST has already numbered exercises, so the enumerator is baked in as literal
 * text rather than left to LaTeX: see `flattenExerciseRefs` for why a real
 * counter is not worth introducing. A solution's title already reads
 * "Solution to Exercise 1" once its cross-reference is flattened, so it is used
 * as-is instead of being prefixed again.
 *
 * @param {object} node an `exercise` or `solution` node
 * @param {object[]} title the original title children
 * @returns {object[]} title children for the generated admonition
 */
function headingChildren(node, title) {
  const noun = BLOCK_NOUN[node.type];
  const text = plainText(title);

  // "Solution to Exercise 1" — MyST wrote the whole heading already.
  if (text.startsWith(noun)) return title;

  const prefix = node.enumerator ? `${noun} ${node.enumerator}` : noun;
  return title.length
    ? [{ type: 'text', value: `${prefix}: ` }, ...title]
    : [{ type: 'text', value: prefix }];
}

/**
 * Name the chapter an embedded solution came from.
 *
 * Exercise enumerators restart on every page, so the appendix would otherwise
 * list two indistinguishable "Solution to Exercise 1" entries. `embedTransform`
 * records where the embedded content came from on the embed node's `source`;
 * `location` gives the source file, which maps to that page's `\label`.
 *
 * @param {object | undefined} source an embed node's `source` metadata
 * @returns {object[]} nodes to append to the heading, empty if unresolvable
 */
function chapterSuffix(source) {
  const id = pageIdForFile(source?.location);
  if (id) {
    const noun = LEVEL_NOUN[PAGES.byId.get(id)?.level ?? 1] ?? 'Chapter';
    return [
      { type: 'text', value: ' (' },
      crossRef(id, `${noun} %s`),
      { type: 'text', value: ')' },
    ];
  }
  // No label to point at: the chapter title alone still disambiguates.
  return source?.title ? [{ type: 'text', value: ` (${source.title})` }] : [];
}

/**
 * Cross-references to an exercise cannot survive as `\ref`s.
 *
 * A `\label` inside the generated `framed` box would bind to whichever counter
 * LaTeX last stepped — the enclosing section — so `\ref` would print "2.1"
 * where the book means "Exercise 1". Adding a genuine LaTeX exercise counter
 * would then have to be kept in step with MyST's own numbering.
 *
 * Since MyST resolved these references before this transform runs, the node's
 * children already hold the finished text ("Exercise", "1"). Dropping the
 * wrapper keeps the right words and loses only a hyperlink that would have
 * pointed at the wrong number.
 *
 * @param {object} node
 * @returns {object[] | undefined}
 */
function flattenExerciseRefs(node) {
  if (node.type !== 'crossReference') return undefined;
  if (node.kind !== 'exercise' && node.kind !== 'solution') return undefined;
  return node.children?.length ? node.children : [{ type: 'text', value: node.identifier }];
}

/**
 * Wrap content in the framed box LaTeX renders for an admonition.
 *
 * @param {object[]} title heading children
 * @param {object[]} body remaining content
 */
function framed(title, body) {
  return {
    type: 'admonition',
    kind: 'note',
    children: [{ type: 'admonitionTitle', children: title }, ...body],
  };
}

/**
 * Build the tree visitor.
 *
 * @param {{embedSource?: object}} ctx `embedSource` is set while walking the
 *   contents of an `embed` node, i.e. while inside the solutions appendix.
 */
function makeVisitor(ctx) {
  return function visit(node) {
    const flattened = flattenExerciseRefs(node);
    if (flattened) return flattened;

    // Descend into embedded content with the embed's provenance in hand, then
    // splice the result in place: myst-to-tex renders `embed` transparently.
    if (node.type === 'embed') {
      const lifted = { children: node.children ?? [] };
      replaceChildren(lifted, makeVisitor({ ...ctx, embedSource: node.source }));
      return lifted.children;
    }

    if (node.type === 'solution') {
      const { title, body } = splitTitle(node);
      if (ctx.embedSource) {
        return [framed([...headingChildren(node, title), ...chapterSuffix(ctx.embedSource)], body)];
      }
      // Inline: send the reader to the appendix instead of showing the answer.
      return [
        {
          type: 'paragraph',
          children: [
            {
              type: 'emphasis',
              children: [
                { type: 'text', value: 'Solution in ' },
                crossRef(SOLUTIONS_APPENDIX, 'Appendix %s'),
                { type: 'text', value: '.' },
              ],
            },
          ],
        },
      ];
    }

    if (node.type === 'exercise') {
      const { title, body } = splitTitle(node);
      return [framed(headingChildren(node, title), body)];
    }

    if (node.type === 'tabSet') {
      return (node.children ?? []).flatMap((tab) => [
        {
          type: 'paragraph',
          children: [{ type: 'strong', children: [{ type: 'text', value: tab.title ?? '' }] }],
        },
        ...(tab.children ?? []),
      ]);
    }

    return undefined;
  };
}

const printBlocks = {
  name: 'pdf-print-blocks',
  doc: 'Render exercise, solution and tabSet nodes, which LaTeX would otherwise drop',
  stage: 'project',
  plugin: () => (tree) => {
    if (!PDF_EXPORT) return tree;
    replaceChildren(tree, makeVisitor({}));
    return tree;
  },
};

const plugin = {
  name: 'LaTeX block fallbacks',
  transforms: [printBlocks],
};

export default plugin;
