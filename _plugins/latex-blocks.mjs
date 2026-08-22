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
 *   - `exercise` / `solution` -> `admonition` (a `framed` box), with the
 *     enumerator baked into the title: "Exercise 1: Spatial credit assignment".
 *   - `tabSet`                -> its tabs one after another, each introduced by
 *     its title in bold. Tabs are a screen affordance; on paper the reader
 *     wants all three implementations in sequence.
 *
 * Solutions carry `class: dropdown` so the web collapses them. Print has no
 * disclosure triangle, so they are rendered open — which is what a printed
 * textbook does anyway.
 *
 * References *to* an exercise are rewritten to plain text at the same time; see
 * `flattenExerciseRefs` below for why they cannot stay as `\ref`s.
 */

// Set by `make pdf`; DYNSIM_STATIC is accepted as an alias so an ad-hoc
// `DYNSIM_STATIC=1 myst build --pdf` behaves the same as the Makefile target.
const PDF_EXPORT = !!(process.env.PDF_EXPORT || process.env.DYNSIM_STATIC);

// Node types this plugin replaces, plus the word that introduces each in print.
const BLOCK_NOUN = { exercise: 'Exercise', solution: 'Solution' };

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
 * Walk a tree, replacing nodes for which `visit` returns an array of
 * replacement nodes. Returning undefined leaves the node in place and recurses
 * into it.
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
      // Recurse into the replacements too: a rewritten exercise can contain a
      // tab-set, and a tab-set can contain an exercise.
      replacement.forEach((r) => replaceChildren(r, visit));
      next.push(...replacement);
    } else {
      replaceChildren(child, visit);
      next.push(child);
    }
  }
  node.children = next;
}

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

const printBlocks = {
  name: 'pdf-print-blocks',
  doc: 'Render exercise, solution and tabSet nodes, which LaTeX would otherwise drop',
  stage: 'project',
  plugin: () => (tree) => {
    if (!PDF_EXPORT) return tree;

    replaceChildren(tree, (node) => {
      const flattened = flattenExerciseRefs(node);
      if (flattened) return flattened;

      if (node.type === 'exercise' || node.type === 'solution') {
        const { title, body } = splitTitle(node);
        return [
          {
            type: 'admonition',
            kind: 'note',
            children: [
              { type: 'admonitionTitle', children: headingChildren(node, title) },
              ...body,
            ],
          },
        ];
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
    });

    return tree;
  },
};

const plugin = {
  name: 'LaTeX block fallbacks',
  transforms: [printBlocks],
};

export default plugin;
