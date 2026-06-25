// Surrogate gradient interactive plots — functions mirror surrogate_gradients.ipynb
// circ/tanh/erfc forward (smooth Heaviside) + their gradients + superspike gradient

(function () {

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

  // Colors match the notebook (superspike=indianred, circ=cadetblue, tanh=orange, erfc=midnightblue)
  var SURROGATES = [
    { name: 'superspike', color: 'indianred',    fwd: fwd_superspike, bwd: bwd_superspike },
    { name: 'circular',   color: 'cadetblue',    fwd: fwd_circ, bwd: bwd_circ       },
    { name: 'tanh',       color: '#e07b00',      fwd: fwd_tanh, bwd: bwd_tanh       },
    { name: 'erfc',       color: 'midnightblue', fwd: fwd_erfc, bwd: bwd_erfc       }
  ];

  function buildSlider(wrapId, sliderId, valId, initVal, min, max, step) {
    min  = (min  !== undefined) ? min  : 1;
    max  = (max  !== undefined) ? max  : 20;
    step = (step !== undefined) ? step : 0.5;
    var wrap = document.getElementById(wrapId);
    if (!wrap) return null;
    wrap.innerHTML = [
      '<div style="display:flex;align-items:center;gap:10px;">',
      '<span style="font-weight:600;white-space:nowrap;">α (sharpness):</span>',
      '<input id="' + sliderId + '" type="range" min="' + min + '" max="' + max + '" step="' + step + '" value="' + initVal + '"',
      ' style="flex:1;height:6px;accent-color:#2196f3;">',
      '<span id="' + valId + '" style="background:#e9ecef;padding:2px 10px;',
      'border-radius:3px;font-family:monospace;min-width:40px;text-align:center;">' + initVal.toFixed(1) + '</span>',
      '</div>'
    ].join('');
    return document.getElementById(sliderId);
  }

  // Capture current per-name visibility from a live Plotly div, then restore
  // it onto freshly built traces so legend toggles survive slider updates.
  function saveVis(plotId) {
    var el = document.getElementById(plotId);
    var map = {};
    if (el && el.data) {
      el.data.forEach(function(t) { if (t.name) map[t.name] = t.visible; });
    }
    return map;
  }
  function restoreVis(traces, map) {
    traces.forEach(function(t) {
      if (t.name && map[t.name] !== undefined) t.visible = map[t.name];
    });
  }

  // ── Plot 1: forward (smooth Heaviside approximations) ─────────────────────
  function initFwdPlot() {
    var plotId   = 'sg-fwd-plot';
    var sliderId = 'sg-fwd-slider';
    var valId    = 'sg-fwd-val';
    var wrapId   = sliderId + '-wrap';
    var INIT     = 5.0;

    var slider = buildSlider(wrapId, sliderId, valId, INIT);
    var valEl  = document.getElementById(valId);

    var LAYOUT = {
      xaxis: { title: { text: '<i>V</i> − <i>V</i><sub>thr</sub>', font: {size:14} },
               range: [-3, 3], zeroline: true, zerolinecolor: '#bbb' },
      yaxis: { title: { text: 'S̃(<i>V</i>)', font: {size:14} }, range: [-0.05, 1.05] },
      legend: { x:0.02, y:0.98, bgcolor:'rgba(255,255,255,0.85)',
                bordercolor:'#ccc', borderwidth:1, font:{size:12} },
      margin: { l:60, r:20, t:20, b:50 },
      plot_bgcolor: '#fafafa', paper_bgcolor: '#fff', hovermode: false
    };

    function render(alpha) {
      var vis = saveVis(plotId);
      var traces = [];
      traces.push({
        x: [-3, -0.001, 0, 0.001, 3], y: [0, 0, 0.5, 1, 1],
        mode: 'lines', name: 'Heaviside',
        line: { color: '#aaa', width: 1.5, dash: 'dot' }, hoverinfo: 'skip'
      });
      SURROGATES.forEach(function(s) {
        traces.push({
          x: V, y: V.map(function(v) { return s.fwd(v, alpha); }),
          mode: 'lines', name: s.name,
          line: { color: s.color, width: 2.5 }, hoverinfo: 'skip'
        });
      });
      restoreVis(traces, vis);
      Plotly.react(plotId, traces, LAYOUT);
    }

    Plotly.newPlot(plotId, [], LAYOUT);
    render(INIT);
    if (slider) {
      slider.addEventListener('input', function() {
        var a = parseFloat(slider.value);
        valEl.textContent = a.toFixed(1);
        render(a);
      });
    }
  }

  // ── Plot 2: surrogate gradients (backward / derivative of each forward) ───
  function initDualPlot() {
    var plotId   = 'sg-dual-plot';
    var sliderId = 'sg-dual-slider';
    var valId    = 'sg-dual-val';
    var wrapId   = sliderId + '-wrap';
    var INIT     = 5.0;

    var slider = buildSlider(wrapId, sliderId, valId, INIT);
    var valEl  = document.getElementById(valId);

    var LAYOUT = {
      xaxis: { title: { text: '<i>V</i> − <i>V</i><sub>thr</sub>', font: {size:14} },
               range: [-3, 3], zeroline: true, zerolinecolor: '#bbb' },
      yaxis: { title: { text: '∂S̃/∂<i>V</i>', font: {size:14} }, autorange: true },
      legend: { x:0.02, y:0.98, bgcolor:'rgba(255,255,255,0.85)',
                bordercolor:'#ccc', borderwidth:1, font:{size:12} },
      margin: { l:60, r:20, t:20, b:50 },
      plot_bgcolor: '#fafafa', paper_bgcolor: '#fff', hovermode: false
    };

    function render(alpha) {
      var vis = saveVis(plotId);
      var traces = SURROGATES.map(function(s) {
        return {
          x: V, y: V.map(function(v) { return s.bwd(v, alpha); }),
          mode: 'lines', name: s.name,
          line: { color: s.color, width: 2.5 }, hoverinfo: 'skip'
        };
      });
      restoreVis(traces, vis);
      Plotly.react(plotId, traces, LAYOUT);
    }

    Plotly.newPlot(plotId, [], LAYOUT);
    render(INIT);
    if (slider) {
      slider.addEventListener('input', function() {
        var a = parseFloat(slider.value);
        valEl.textContent = a.toFixed(1);
        render(a);
      });
    }
  }

  // ── Plot 0: arctan only, color-per-sweep ──────────────────────────────────
  var SWEEP_COLORS = ['#1f77b4','#ff7f0e','#2ca02c','#9467bd','#d62728','#8c564b'];

  function initAtanPlot() {
    var plotId   = 'sg-atan-plot';
    var sliderId = 'sg-atan-slider';
    var valId    = 'sg-atan-val';
    var wrapId   = sliderId + '-wrap';
    var INIT     = 1.0;

    var slider = buildSlider(wrapId, sliderId, valId, INIT);
    if (slider) { slider.min = '0.5'; slider.max = '10'; slider.step = '0.5'; slider.value = INIT; }
    var valEl = document.getElementById(valId);
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
      xaxis: { title: { text: '<i>V</i> − <i>V</i><sub>thr</sub>', font: {size:14} },
               range: [-3, 3], zeroline: true, zerolinecolor: '#bbb' },
      yaxis: { title: { text: 'S̃(<i>V</i>)', font: {size:14} }, range: [-0.05, 1.05] },
      legend: { x:0.02, y:0.98, bgcolor:'rgba(255,255,255,0.85)',
                bordercolor:'#ccc', borderwidth:1, font:{size:12} },
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
        line: { color: '#aaa', width: 1.5, dash: 'dot' }, hoverinfo: 'skip'
      });
      traces.push(mkTrace(alpha, SWEEP_COLORS[colorIdx % SWEEP_COLORS.length], true));
      Plotly.react(plotId, traces, LAYOUT);
    }
    Plotly.newPlot(plotId, [], LAYOUT);
    render(INIT);
    if (slider) {
      slider.addEventListener('input', function() {
        var a = parseFloat(slider.value);
        valEl.textContent = a.toFixed(1);
        render(a);
      });
    }
  }

  // ── V3: side-by-side subplots (forward left | backward right) ───────────────
  function initV3Plot() {
    var plotId   = 'sg-v3-plot';
    var sliderId = 'sg-v3-slider';
    var valId    = 'sg-v3-val';
    var wrapId   = sliderId + '-wrap';
    var INIT     = 5.0;

    var slider = buildSlider(wrapId, sliderId, valId, INIT);
    var valEl  = document.getElementById(valId);
    // Index-based: [heaviside, ss_fwd, ss_bwd, circ_fwd, circ_bwd, tanh_fwd, tanh_bwd, erfc_fwd, erfc_bwd]
    var visMap = null;

    var LAYOUT = {
      xaxis:  { domain: [0, 0.45], range: [-3,3], zeroline: true, zerolinecolor: '#bbb',
                title: { text: '<i>V</i> − <i>V</i><sub>thr</sub>', font:{size:13} } },
      yaxis:  { title: { text: 'S̃(<i>V</i>)', font:{size:13} }, range: [-0.05, 1.05] },
      xaxis2: { domain: [0.55, 1], anchor: 'y2', range: [-3,3], zeroline: true, zerolinecolor: '#bbb',
                title: { text: '<i>V</i> − <i>V</i><sub>thr</sub>', font:{size:13} } },
      yaxis2: { anchor: 'x2', title: { text: '∂S̃/∂<i>V</i>', font:{size:13} }, autorange: true },
      legend: { x:0.02, y:0.98, bgcolor:'rgba(255,255,255,0.85)',
                bordercolor:'#ccc', borderwidth:1, font:{size:12} },
      annotations: [
        { text: '<b>Forward pass</b>', xref:'paper', yref:'paper',
          x: 0.225, y: 1.04, xanchor:'center', yanchor:'bottom', showarrow: false, font:{size:13} },
        { text: '<b>Surrogate gradient</b>', xref:'paper', yref:'paper',
          x: 0.775, y: 1.04, xanchor:'center', yanchor:'bottom', showarrow: false, font:{size:13} }
      ],
      margin: { l:55, r:20, t:40, b:50 },
      plot_bgcolor: '#fafafa', paper_bgcolor: '#fff', hovermode: false
    };

    function render(alpha) {
      var el = document.getElementById(plotId);
      if (el && el.data && el.data.length > 0) {
        visMap = el.data.map(function(t) { return t.visible; });
      }
      var traces = [];
      traces.push({
        x: [-3,-0.001,0,0.001,3], y: [0,0,0.5,1,1],
        mode: 'lines', name: 'Heaviside',
        xaxis: 'x', yaxis: 'y', legendgroup: 'heaviside',
        line: { color: '#aaa', width: 1.5, dash: 'dot' }, hoverinfo: 'skip'
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
      Plotly.react(plotId, traces, LAYOUT);
    }

    Plotly.newPlot(plotId, [], LAYOUT);
    render(INIT);
    if (slider) {
      slider.addEventListener('input', function() {
        var a = parseFloat(slider.value);
        valEl.textContent = a.toFixed(1);
        render(a);
      });
    }
  }

  function keepAlive() {
    if (typeof Plotly === 'undefined') return;
    var atan = document.getElementById('sg-atan-plot');
    var fwd  = document.getElementById('sg-fwd-plot');
    var dual = document.getElementById('sg-dual-plot');
    if (atan && atan.children.length === 0) initAtanPlot();
    if (fwd  && fwd.children.length  === 0) initFwdPlot();
    if (dual && dual.children.length === 0) initDualPlot();
    var v3 = document.getElementById('sg-v3-plot');
    if (v3   && v3.children.length   === 0) initV3Plot();
  }

  document.addEventListener('DOMContentLoaded', function () {
    setInterval(keepAlive, 300);
  });
})();
