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
        return [
          {
            type: 'anywidget',
            esm: WIDGET_PATH,
            model: {
              variant: data.arg || 'sg-fwd-plot',
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
