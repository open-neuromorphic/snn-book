const WIDGET_PATH = '/_widgets/dynsim-widget.mjs';

/**
 * MyST Plugin for Dynamical Systems Simulator with PyScript
 *
 * Usage in markdown:
 * ```{dynsim}
 * :params: [{"id": "tau", "label": "τ", "min": 0.1, "max": 2, "step": 0.1, "value": 1}]
 * :plotType: timeseries
 * :plotConfig: {"title": "My System", "xaxis": {"title": "Time", "range": [0, 50]}}
 * :initialState: {"v": 0, "t": 0}
 * :initialX: 0
 * :height: 400
 *
 * from typing import NamedTuple
 * import numpy as np
 *
 * class State(NamedTuple):
 *     v: float  # membrane potential
 *     t: float  # time
 *
 * def step(x, state, p):
 *     # x: current input/output (feedback)
 *     # state: State namedtuple with internal variables
 *     # p: parameters as SimpleNamespace
 *
 *     dv = (-state.v + x + p.current) / p.tau
 *     v_new = state.v + 0.02 * dv
 *     x_new = np.tanh(p.weight * v_new)
 *
 *     return (x_new, State(v=v_new, t=state.t + 0.02))
 * ```
 */


function parseJsonOption(value, fallback, optionName) {
  if (value == null) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`Invalid JSON for dynsim option "${optionName}": ${error.message}`);
  }
}

const plugin = {
  name: 'Dynamical Systems Simulator',
  directives: [
    {
      name: 'dynsim',
      doc: 'Embed an interactive dynamical systems simulator with Python',
      body: {
        type: 'string',
        required: true
      },
      options: {
        params: {
          type: String,
          doc: 'JSON array of parameter definitions [{id, label, min, max, step, value}, ...]'
        },
        plotType: {
          type: String,
          doc: 'Plot type: 2d, 3d, or timeseries (default: timeseries)'
        },
        plotConfig: {
          type: String,
          doc: 'JSON object for Plotly configuration'
        },
        initialState: {
          type: String,
          doc: 'JSON object for initial state (default: {"t": 0})'
        },
        initialX: {
          type: Number,
          doc: 'Initial input/output value (default: 0)'
        },
        input: {
          type: String,
          doc: 'JSON object for input slider configuration'
        },
        height: {
          type: Number,
          doc: 'Height in pixels (default: 400)'
        },
        dt: {
          type: Number,
          doc: 'Timestep for integration (default: 0.02)'
        },
        spikes: {
          type: String,
          doc: 'State key that marks spikes for raster/marker overlays'
        },
        spikeThreshold: {
          type: Number,
          doc: 'Y-value used to draw a spike threshold line'
        },
        packages: {
          type: String,
          doc: 'JSON array of Pyodide/PyScript packages required by the Python code'
        }
      },
      run(data) {
        return [
          {
            type: 'anywidget',
            esm: WIDGET_PATH,
            model: {
              params: parseJsonOption(data.options?.params, [], 'params'),
              plotType: data.options?.plotType || 'timeseries',
              plotConfig: parseJsonOption(data.options?.plotConfig, {}, 'plotConfig'),
              initialState: parseJsonOption(data.options?.initialState, { t: 0 }, 'initialState'),
              initialX: data.options?.initialX ?? 0,
              input: parseJsonOption(data.options?.input, null, 'input'),
              height: data.options?.height || 400,
              dt: data.options?.dt || 0.02,
              spikes: data.options?.spikes || null,
              spikeThreshold: data.options?.spikeThreshold ?? null,
              packages: parseJsonOption(data.options?.packages, ['numpy'], 'packages'),
              pythonCode: data.body || ''
            }
          }
        ];
      }
    }
  ]
};

export default plugin;
