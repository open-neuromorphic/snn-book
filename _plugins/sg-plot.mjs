/**
 * Minimal plugin for surrogate gradient interactive plots.
 * Generates a Plotly div + styled α slider; the actual JS lives in
 * _static/js/surrogate-plots.js (auto-injected by server.js).
 *
 * Usage:
 *   ```{sgplot} sg-fwd-plot
 *   :height: 340
 *   ```
 *
 *   ```{sgplot} sg-dual-plot
 *   :height: 400
 *   :slider_id: sg-dual-slider
 *   :val_id: sg-dual-val
 *   ```
 */

const plugin = {
  name: 'Surrogate Gradient Plot',
  directives: [
    {
      name: 'sgplot',
      doc: 'Interactive surrogate gradient Plotly container with α slider',
      arg: { type: String, doc: 'HTML id for the Plotly div (e.g. sg-fwd-plot)', required: true },
      options: {
        height:    { type: Number, doc: 'Plot height in px (default 360)' },
        slider_id: { type: String, doc: 'id for the range input (default: arg + "-slider")' },
        val_id:    { type: String, doc: 'id for the value span (default: arg + "-val")' },
        caption:   { type: String, doc: 'Instructional caption shown above the plot' },
      },
      run(data) {
        const plotId    = data.arg || 'sg-plot';
        const height    = data.options?.height    || 360;
        const sliderId  = data.options?.slider_id || (plotId + '-slider');
        const valId     = data.options?.val_id    || (plotId + '-val');
        const caption   = data.options?.caption   || '';

        const captionHtml = caption
          ? `<p style="font-style:italic; color:#555; margin:0 0 6px 0; font-size:0.92em;">${caption}</p>`
          : '';

        // MyST sanitizer strips <input> elements, so we use only <div> placeholders.
        // surrogate-plots.js builds the slider widget from these data attributes.
        const html = `
${captionHtml}<div id="${plotId}" style="width:100%; height:${height}px;"></div>
<div id="${sliderId}-wrap"
     style="background:#f8f9fa; padding:10px 14px; border-radius:6px; border:1px solid #ddd; margin-top:8px; font-size:0.88em;">
</div>`.trim();

        return [{ type: 'html', value: html }];
      }
    }
  ]
};

export default plugin;
