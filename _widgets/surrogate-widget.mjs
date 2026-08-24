// Surrogate gradient interactive plots as an AnyWidget.
//
// The math and Plotly render logic below is ported verbatim from the legacy
// _static/js/surrogate-plots.js. The only structural change is that each plot
// now owns its DOM inside the widget's `el` (a Plotly div + α slider) instead
// of rendering into globally-injected divs found by fixed id.

const PLOTLY_URL = 'https://cdn.plot.ly/plotly-2.27.0.min.js';

function readModel(model, key, fallback) {
  const value = model.get(key);
  return value === undefined ? fallback : value;
}

// Plotly injects its stylesheet into document.head, but shadow-DOM
// encapsulation blocks it from reaching the widget's shadow root. Without the
// `.main-svg { position: absolute }` rule the three stacked SVG layers fall back
// to `position: static` and pile up vertically (3× height), pushing the legend
// out below the plot and over the slider. Re-inject the critical rules into the
// shadow root so the layers overlap as Plotly intends.
function ensurePlotlyShadowStyles(el) {
  const root = el.getRootNode();
  if (!root || root === document || !root.host) return; // light DOM: global style already applies
  if (root.querySelector('style[data-plotly-shadow]')) return;
  const style = document.createElement('style');
  style.setAttribute('data-plotly-shadow', '');
  style.textContent =
    '.js-plotly-plot .svg-container{position:relative;}' +
    '.js-plotly-plot .main-svg{position:absolute;top:0;left:0;}';
  root.appendChild(style);
}

function loadScript(src, attributes = {}) {
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing?.dataset.loaded === 'true') return Promise.resolve();
  if (existing?.dataset.loading === 'true') {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = existing || document.createElement('script');
    Object.entries(attributes).forEach(([key, value]) => script.setAttribute(key, value));
    script.src = src;
    script.dataset.loading = 'true';
    script.addEventListener('load', () => { script.dataset.loaded = 'true'; resolve(); }, { once: true });
    script.addEventListener('error', reject, { once: true });
    if (!existing) document.head.appendChild(script);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// BEGIN ported logic (verbatim from surrogate-plots.js) — YOUR math/render.
// ─────────────────────────────────────────────────────────────────────────────

// erf approximation, max error ~1.5e-7 (Abramowitz & Stegun 7.1.26)
function erf(x) {
  var a1=0.254829592, a2=-0.284496736, a3=1.421413741, a4=-1.453152027, a5=1.061405429, p=0.3275911;
  var t = 1.0 / (1.0 + p * Math.abs(x));
  var y = 1.0 - ((((a5*t + a4)*t + a3)*t + a2)*t + a1) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
}

var V = [];
for (var i = 0; i <= 300; i++) V.push(-3 + i * 0.02);

// ── Forward functions (smooth Heaviside approximations) ───────────────────
// circ: reparametrised so larger α = steeper (α replaces 1/α from notebook)
function fwd_circ(v, a)  { var s = 1/a; return 0.5 + 0.5 * v / Math.sqrt(v*v + s*s); }
function fwd_tanh(v, a)  { return 0.5 + 0.5 * Math.tanh(a * v); }
function fwd_erfc(v, a)  { return 0.5 * (1.0 + erf(a * v)); }
// superspike: antiderivative of bwd_superspike (normalised to [0,1])
function fwd_superspike(v, a) { return 0.5 + a * v / (2.0 * (1.0 + a * Math.abs(v))); }

// ── Backward functions (surrogate gradients = d/dV of each forward) ───────
function bwd_circ(v, a) {
  var s2 = 1.0 / (a * a);
  return 0.5 * s2 / Math.pow(v * v + s2, 1.5);
}
function bwd_tanh(v, a) {
  var t = Math.tanh(a * v);
  return 0.5 * a * (1.0 - t * t);
}
function bwd_erfc(v, a) {
  return (a / Math.sqrt(Math.PI)) * Math.exp(-(a * v) * (a * v));
}
// SuperSpike surrogate gradient (Zenke & Ganguli 2018) — forward is Heaviside
function bwd_superspike(v, a) {
  return 1.0 / Math.pow(a * Math.abs(v) + 1.0, 2);
}

// Typeface matched to the static figures (matplotlib DejaVu Sans).
var FONT = 'DejaVu Sans, Verdana, Geneva, Tahoma, sans-serif';

// Categorical palette aligned with Figures 2 & 3 and validated for
// colorblind separation (dataviz validate_palette.js, light + dark):
//   steel blue = the figures' beta color; orange = the gradient color.
var SURROGATES = [
  { name: 'superspike', color: '#3e7cb1', fwd: fwd_superspike, bwd: bwd_superspike },
  { name: 'circular',   color: '#e85838', fwd: fwd_circ, bwd: bwd_circ       },
  { name: 'tanh',       color: '#4f9d6c', fwd: fwd_tanh, bwd: bwd_tanh       },
  { name: 'erfc',       color: '#9c5ba6', fwd: fwd_erfc, bwd: bwd_erfc       }
];

// Capture current per-name visibility from a live Plotly div, then restore
// it onto freshly built traces so legend toggles survive slider updates.
function saveVis(plotDiv) {
  var map = {};
  if (plotDiv && plotDiv.data) {
    plotDiv.data.forEach(function(t) { if (t.name) map[t.name] = t.visible; });
  }
  return map;
}
function restoreVis(traces, map) {
  traces.forEach(function(t) {
    if (t.name && map[t.name] !== undefined) t.visible = map[t.name];
  });
}

var SWEEP_COLORS = ['#1f77b4','#ff7f0e','#2ca02c','#9467bd','#d62728','#8c564b'];

// ─────────────────────────────────────────────────────────────────────────────
// END ported logic.
// ─────────────────────────────────────────────────────────────────────────────

// Build the α slider inside `wrap` (an element the widget owns). Returns the
// live <input> and value <span> so the caller can wire the 'input' listener.
// Replaces the legacy buildSlider(wrapId, sliderId, valId, ...) that used
// document-global ids.
function buildSlider(wrap, initVal, min, max, step) {
  min  = (min  !== undefined) ? min  : 1;
  max  = (max  !== undefined) ? max  : 20;
  step = (step !== undefined) ? step : 0.5;
  wrap.innerHTML = [
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">',
    '<span style="font-weight:600;white-space:nowrap;">α (sharpness):</span>',
    '<span class="sg-val" style="background:#e9ecef;padding:2px 10px;',
    'border-radius:3px;font-family:monospace;min-width:40px;text-align:center;">' + initVal.toFixed(1) + '</span>',
    '</div>',
    '<input type="range" min="' + min + '" max="' + max + '" step="' + step + '" value="' + initVal + '"',
    ' style="display:block;width:100%;height:6px;accent-color:#3e7cb1;">'
  ].join('');
  return {
    slider: wrap.querySelector('input[type="range"]'),
    valEl: wrap.querySelector('.sg-val'),
  };
}

// Each init function renders one variant into (plotDiv, sliderWrap) and returns
// a `refresh()` that re-renders at the current α (used after the web font loads
// so text metrics are correct — replaces the legacy document.fonts re-render).

// ── Plot 1: forward (smooth Heaviside approximations) ─────────────────────
function initFwdPlot(plotDiv, sliderWrap) {
  var INIT = 5.0;
  var s = buildSlider(sliderWrap, INIT);
  var slider = s.slider, valEl = s.valEl;

  var LAYOUT = {
    font: { family: FONT, size: 14, color: '#222' },
    xaxis: { title: { text: '<i>V</i> − <i>V</i><sub>thr</sub>', font: {size:16} },
             range: [-3, 3], zeroline: true, zerolinecolor: '#bbb' },
    yaxis: { title: { text: 'S̃(<i>V</i>)', font: {size:16} }, range: [-0.05, 1.05] },
    legend: { x:0.02, y:0.98, bgcolor:'rgba(255,255,255,0.85)',
              bordercolor:'#ccc', borderwidth:1, font:{size:13} },
    margin: { l:60, r:20, t:20, b:50 },
    plot_bgcolor: '#fafafa', paper_bgcolor: '#fff', hovermode: false
  };

  function render(alpha) {
    var vis = saveVis(plotDiv);
    var traces = [];
    traces.push({
      x: [-3, -0.001, 0, 0.001, 3], y: [0, 0, 0.5, 1, 1],
      mode: 'lines', name: 'Heaviside',
      line: { color: '#333', width: 1.6, dash: 'dot' }, hoverinfo: 'skip'
    });
    SURROGATES.forEach(function(s) {
      traces.push({
        x: V, y: V.map(function(v) { return s.fwd(v, alpha); }),
        mode: 'lines', name: s.name,
        line: { color: s.color, width: 2.5 }, hoverinfo: 'skip'
      });
    });
    restoreVis(traces, vis);
    Plotly.react(plotDiv, traces, LAYOUT);
  }

  Plotly.newPlot(plotDiv, [], LAYOUT);
  render(INIT);
  if (slider) {
    slider.addEventListener('input', function() {
      var a = parseFloat(slider.value);
      valEl.textContent = a.toFixed(1);
      render(a);
    });
  }
  return function refresh() { render(slider ? parseFloat(slider.value) : INIT); };
}

// ── Plot 2: surrogate gradients (backward / derivative of each forward) ───
function initDualPlot(plotDiv, sliderWrap) {
  var INIT = 5.0;
  var s = buildSlider(sliderWrap, INIT);
  var slider = s.slider, valEl = s.valEl;

  var LAYOUT = {
    font: { family: FONT, size: 14, color: '#222' },
    xaxis: { title: { text: '<i>V</i> − <i>V</i><sub>thr</sub>', font: {size:16} },
             range: [-3, 3], zeroline: true, zerolinecolor: '#bbb' },
    yaxis: { title: { text: '∂S̃/∂<i>V</i>', font: {size:16} }, autorange: true },
    legend: { x:0.02, y:0.98, bgcolor:'rgba(255,255,255,0.85)',
              bordercolor:'#ccc', borderwidth:1, font:{size:13} },
    margin: { l:60, r:20, t:20, b:50 },
    plot_bgcolor: '#fafafa', paper_bgcolor: '#fff', hovermode: false
  };

  function render(alpha) {
    var vis = saveVis(plotDiv);
    var traces = SURROGATES.map(function(s) {
      return {
        x: V, y: V.map(function(v) { return s.bwd(v, alpha); }),
        mode: 'lines', name: s.name,
        line: { color: s.color, width: 2.5 }, hoverinfo: 'skip'
      };
    });
    restoreVis(traces, vis);
    Plotly.react(plotDiv, traces, LAYOUT);
  }

  Plotly.newPlot(plotDiv, [], LAYOUT);
  render(INIT);
  if (slider) {
    slider.addEventListener('input', function() {
      var a = parseFloat(slider.value);
      valEl.textContent = a.toFixed(1);
      render(a);
    });
  }
  return function refresh() { render(slider ? parseFloat(slider.value) : INIT); };
}

// ── Plot 0: arctan only, color-per-sweep ──────────────────────────────────
function initAtanPlot(plotDiv, sliderWrap) {
  var INIT = 1.0;
  var s = buildSlider(sliderWrap, INIT);
  var slider = s.slider, valEl = s.valEl;
  if (slider) { slider.min = '0.5'; slider.max = '10'; slider.step = '0.5'; slider.value = INIT; }
  if (valEl) valEl.textContent = INIT.toFixed(1);

  var colorIdx = 0, lastAlpha = null, archived = [];
  function fwdAtan(v, a) { return 0.5 + Math.atan(Math.PI * a * v) / Math.PI; }
  function mkTrace(alpha, color, bold) {
    return { x: V, y: V.map(function(v) { return fwdAtan(v, alpha); }),
             mode: 'lines', showlegend: false, hoverinfo: 'skip',
             line: { color: color, width: bold ? 2.5 : 1.5 },
             opacity: bold ? 1.0 : 0.45 };
  }
  var LAYOUT = {
    font: { family: FONT, size: 14, color: '#222' },
    xaxis: { title: { text: '<i>V</i> − <i>V</i><sub>thr</sub>', font: {size:16} },
             range: [-3, 3], zeroline: true, zerolinecolor: '#bbb' },
    yaxis: { title: { text: 'S̃(<i>V</i>)', font: {size:16} }, range: [-0.05, 1.05] },
    legend: { x:0.02, y:0.98, bgcolor:'rgba(255,255,255,0.85)',
              bordercolor:'#ccc', borderwidth:1, font:{size:13} },
    margin: { l:60, r:20, t:20, b:50 },
    plot_bgcolor: '#fafafa', paper_bgcolor: '#fff', hovermode: false
  };
  function render(alpha) {
    if (lastAlpha !== null && Math.abs(alpha - lastAlpha) > 1e-9) {
      archived.push({ alpha: lastAlpha, color: SWEEP_COLORS[colorIdx % SWEEP_COLORS.length] });
      if (archived.length > 5) archived.shift();
      colorIdx++;
    }
    lastAlpha = alpha;
    var traces = archived.map(function(a) { return mkTrace(a.alpha, a.color, false); });
    traces.push({
      x: [-3, -0.001, 0, 0.001, 3], y: [0, 0, 0.5, 1, 1],
      mode: 'lines', name: 'Heaviside',
      line: { color: '#333', width: 1.6, dash: 'dot' }, hoverinfo: 'skip'
    });
    traces.push(mkTrace(alpha, SWEEP_COLORS[colorIdx % SWEEP_COLORS.length], true));
    Plotly.react(plotDiv, traces, LAYOUT);
  }
  Plotly.newPlot(plotDiv, [], LAYOUT);
  render(INIT);
  if (slider) {
    slider.addEventListener('input', function() {
      var a = parseFloat(slider.value);
      valEl.textContent = a.toFixed(1);
      render(a);
    });
  }
  return function refresh() { render(slider ? parseFloat(slider.value) : INIT); };
}

// ── V3: side-by-side subplots (forward left | backward right) ───────────────
function initV3Plot(plotDiv, sliderWrap) {
  var INIT = 5.0;
  var s = buildSlider(sliderWrap, INIT);
  var slider = s.slider, valEl = s.valEl;
  // Index-based: [heaviside, ss_fwd, ss_bwd, circ_fwd, circ_bwd, tanh_fwd, tanh_bwd, erfc_fwd, erfc_bwd]
  var visMap = null;

  var LAYOUT = {
    font: { family: FONT, size: 13, color: '#222' },
    xaxis:  { domain: [0, 0.45], range: [-3,3], zeroline: true, zerolinecolor: '#bbb',
              title: { text: '<i>V</i> − <i>V</i><sub>thr</sub>', font:{size:15} } },
    yaxis:  { title: { text: 'S̃(<i>V</i>)', font:{size:15} }, range: [-0.05, 1.05] },
    xaxis2: { domain: [0.55, 1], anchor: 'y2', range: [-3,3], zeroline: true, zerolinecolor: '#bbb',
              title: { text: '<i>V</i> − <i>V</i><sub>thr</sub>', font:{size:15} } },
    yaxis2: { anchor: 'x2', title: { text: '∂S̃/∂<i>V</i>', font:{size:15} }, autorange: true },
    legend: { x:0.02, y:0.98, bgcolor:'rgba(255,255,255,0.85)',
              bordercolor:'#ccc', borderwidth:1, font:{size:13} },
    annotations: [
      { text: '<b>Forward pass</b>', xref:'paper', yref:'paper',
        x: 0.225, y: 1.04, xanchor:'center', yanchor:'bottom', showarrow: false, font:{size:14} },
      { text: '<b>Surrogate gradient</b>', xref:'paper', yref:'paper',
        x: 0.775, y: 1.04, xanchor:'center', yanchor:'bottom', showarrow: false, font:{size:14} }
    ],
    margin: { l:55, r:20, t:40, b:50 },
    plot_bgcolor: '#fafafa', paper_bgcolor: '#fff', hovermode: false
  };

  function render(alpha) {
    if (plotDiv && plotDiv.data && plotDiv.data.length > 0) {
      visMap = plotDiv.data.map(function(t) { return t.visible; });
    }
    var traces = [];
    traces.push({
      x: [-3,-0.001,0,0.001,3], y: [0,0,0.5,1,1],
      mode: 'lines', name: 'Heaviside',
      xaxis: 'x', yaxis: 'y', legendgroup: 'heaviside',
      line: { color: '#333', width: 1.6, dash: 'dot' }, hoverinfo: 'skip'
    });
    SURROGATES.forEach(function(s) {
      traces.push({
        x: V, y: V.map(function(v) { return s.fwd(v, alpha); }),
        mode: 'lines', name: s.name,
        xaxis: 'x', yaxis: 'y', legendgroup: s.name,
        line: { color: s.color, width: 2.5 }, hoverinfo: 'skip'
      });
      traces.push({
        x: V, y: V.map(function(v) { return s.bwd(v, alpha); }),
        mode: 'lines', name: s.name,
        xaxis: 'x2', yaxis: 'y2', legendgroup: s.name, showlegend: false,
        line: { color: s.color, width: 2.5 }, hoverinfo: 'skip'
      });
    });
    if (visMap && visMap.length === traces.length) {
      traces.forEach(function(t, i) {
        if (visMap[i] !== undefined) t.visible = visMap[i];
      });
    }
    Plotly.react(plotDiv, traces, LAYOUT);
  }

  Plotly.newPlot(plotDiv, [], LAYOUT);
  render(INIT);
  if (slider) {
    slider.addEventListener('input', function() {
      var a = parseFloat(slider.value);
      valEl.textContent = a.toFixed(1);
      render(a);
    });
  }
  return function refresh() { render(slider ? parseFloat(slider.value) : INIT); };
}

const VARIANTS = {
  'sg-fwd-plot': initFwdPlot,
  'sg-dual-plot': initDualPlot,
  'sg-atan-plot': initAtanPlot,
  'sg-v3-plot': initV3Plot,
};

function render({ model, el }) {
  const variant = readModel(model, 'variant', 'sg-fwd-plot');
  const height = Number(readModel(model, 'height', 360));
  const caption = readModel(model, 'caption', '');
  const init = VARIANTS[variant];

  el.innerHTML = '';

  if (caption) {
    const p = document.createElement('p');
    p.style.cssText = 'font-style:italic; color:#555; margin:0 0 6px 0; font-size:0.92em;';
    p.innerHTML = caption; // caption may contain HTML entities (e.g. &#945;)
    el.appendChild(p);
  }

  const plotDiv = document.createElement('div');
  plotDiv.style.cssText = `width:100%; height:${height}px;`;
  el.appendChild(plotDiv);

  const sliderWrap = document.createElement('div');
  sliderWrap.style.cssText = 'background:#f8f9fa; padding:10px 14px; border-radius:6px; border:1px solid #ddd; margin-top:8px; font-size:0.88em;';
  el.appendChild(sliderWrap);

  if (!init) {
    plotDiv.textContent = `Unknown sgplot variant: ${variant}`;
    return () => {};
  }

  let active = true;

  (async () => {
    await loadScript(PLOTLY_URL, { defer: '' });
    if (!active) return;
    ensurePlotlyShadowStyles(el);
    const refresh = init(plotDiv, sliderWrap);
    // Once the bundled DejaVu Sans web font is ready, re-render so Plotly
    // measures text with the real font metrics.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { if (active && el.isConnected) refresh(); });
    }
  })();

  return () => {
    active = false;
    try { if (window.Plotly) Plotly.purge(plotDiv); } catch (e) { /* noop */ }
  };
}

export default { render };
