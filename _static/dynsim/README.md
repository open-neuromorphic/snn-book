# Static dynsim figures for the PDF

Interactive `{dynsim}` widgets (AnyWidget + PyScript + Plotly) cannot render in
the PDF/LaTeX export — MyST drops the `anywidget` node. For print we substitute a
pre-captured screenshot.

## How it works

`_plugins/dynamical-systems.mjs` is env-switched:

- **Normal build** (`jupyter book build`) → emits the live `anywidget`.
- **`DYNSIM_STATIC=1` build** (the PDF build / `make pdf`) → emits an `image`
  node pointing at `/_static/dynsim/<label>.png` instead.

Each `{dynsim}` block therefore needs a stable `:label:`, and a matching PNG in
this folder.

## Adding / refreshing a figure

1. Give the block a label:

   ````markdown
   ```{dynsim}
   :label: lif
   ...
   ```
   ````

2. Open the live book, let the widget settle at its default slider values, and
   screenshot just the plot. Save it here as `<label>.png`:

   - `lif.png`            — `lif_visual.md`
   - `leaky-integrator.png` — `dev/simulation.md`

3. Commit the PNG (these are release assets, kept in git — not generated).

## Building the PDF

```sh
make pdf            # sets DYNSIM_STATIC=1 for you
# or:
DYNSIM_STATIC=1 uv run jupyter-book build --pdf
```

If a labelled block has no PNG here, the PDF build will fail to find the image;
if a block has no `:label:` at all, the plugin warns and leaves it blank.
