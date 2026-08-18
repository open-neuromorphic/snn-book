/**
 * Minimal plugin for surrogate gradient interactive plots.
 * Emits an AnyWidget node handled by _widgets/surrogate-widget.mjs, which owns
 * its own Plotly plot + α slider (no globally-injected script required).
 *
 * The `arg` selects which plot variant to render:
 *   sg-fwd-plot | sg-dual-plot | sg-atan-plot | sg-v3-plot
 *
 * Usage:
 *   ```{sgplot} sg-fwd-plot
 *   :height: 360
 *   :caption: Try moving the α slider!
 *   ```
 */

const WIDGET_PATH = '/_widgets/surrogate-widget.mjs';

// LaTeX/PDF cannot render an anywidget node (it is dropped with a warning). When
// building the PDF we set DYNSIM_STATIC=1 (see the Makefile) and emit a static,
// pre-captured PNG of each plot instead. The PNGs live in _static/sg/<variant>.png
// and are regenerated from the live widgets (Plotly.toImage) when the plots change.
const STATIC_EXPORT = !!process.env.DYNSIM_STATIC;

const plugin = {
  name: 'Surrogate Gradient Plot',
  directives: [
    {
      name: 'sgplot',
      doc: 'Interactive surrogate gradient Plotly container with α slider',
      arg: { type: String, doc: 'Plot variant id (sg-fwd-plot | sg-dual-plot | sg-atan-plot | sg-v3-plot)', required: true },
      options: {
        height:    { type: Number, doc: 'Plot height in px (default 360)' },
        // slider_id/val_id are accepted for backward compatibility but unused —
        // the AnyWidget owns its own slider DOM.
        slider_id: { type: String, doc: 'Deprecated (ignored); the widget owns its slider' },
        val_id:    { type: String, doc: 'Deprecated (ignored); the widget owns its value display' },
        caption:   { type: String, doc: 'Instructional caption shown above the plot' },
      },
      run(data) {
        const variant = data.arg || 'sg-fwd-plot';

        if (STATIC_EXPORT) {
          // Static fallback for PDF: the interactive caption ("move the α
          // slider") is meaningless in print, so it is dropped.
          return [
            {
              type: 'image',
              url: `/_static/sg/${variant}.png`,
              alt: `Surrogate gradient plot: ${variant}`,
              width: '90%',
              align: 'center',
            }
          ];
        }

        return [
          {
            type: 'anywidget',
            esm: WIDGET_PATH,
            model: {
              variant,
              height: data.options?.height || 360,
              caption: data.options?.caption || '',
            }
          }
        ];
      }
    }
  ]
};

export default plugin;
