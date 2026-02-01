---
numbering:
  title: false
---
# Plugin: Dynamical Systems Visualization

We built a [Jupyter Book plugin](https://jupyterbook.org/stable/plugins/plugins/) that embeds dynamical systems visualizations *as pure Python code* via [PyScript](https://docs.pyscript.net/2026.1.1/). That is, **we can visualize differential systems written in Python in the browser**. Which is pretty cool.

## Leaky Integrator Example

A simple leaky integrator system. The state `v` decays exponentially towards zero with time constant τ, driven by input `x`.

The system is defined by:
- **Dynamics**: `dv/dt = (-v + x) / τ`
- **Output**: `x_new = v` (output equals state)

```{dynsim}
:params: [{"id": "tau", "label": "Time Constant (τ)", "min": 0.1, "max": 5, "step": 0.1, "value": 1}]
:plotType: timeseries
:plotConfig: {"title": "Leaky Integrator", "xaxis": {"title": "Time Steps", "range": [0, 10]}, "yaxis": {"title": "State (v)", "range": [-3, 3]}}
:initialState: {"v": 0}
:initialX: 1.0
:height: 400
:dt: 0.01

import numpy as np

def step(x, state, p):
    """Leaky integrator dynamics.

    Args:
        x: Current input
        state: dict with 'v' (integrator state)
        p: dict with 'tau' (time constant) and 'dt' (timestep, default 0.01)

    Returns:
        Tuple of (x_new, state_new)
    """
    # Leaky integrator: dv/dt = (-v + x) / tau
    dv = (-state['v'] + x) / p['tau']
    v_new = state['v'] + p['dt'] * dv

    # Output equals state
    return (v_new, {'v': v_new})
```

## How It Works

The simulator:
1. Implements `step(x, state, p)` that computes one timestep
2. `x` is the input (controlled by the Input slider)
3. `state` and `p` are plain Python dicts for simplicity
4. Returns `(x_new, state_new)` with updated state

Try adjusting the sliders:
- **Input (x)**: Drive signal to the system - move this to see the system respond in real-time!
- **τ (tau)**: Time constant - controls how quickly the state converges to the input

## Usage

To create your own dynamical system, use the `dynsim` directive with Python code:

````markdown
```{dynsim}
:params: [{"id": "param1", "label": "Label", "min": 0, "max": 1, "step": 0.1, "value": 0.5}]
:plotType: timeseries
:plotConfig: {"title": "My System"}
:initialState: {"your_var": 0}
:initialX: 0

import numpy as np

def step(x, state, p):
    # x: input from slider
    # state: your state variables (dict)
    # p: parameters including 'dt' (dict)

    # Your dynamics here (can use numpy functions)
    new_var = state['your_var'] + p['dt'] * (x - state['your_var'])
    x_new = new_var
    return (x_new, {'your_var': new_var})
```
````

## Directive Options

- `:params:` - JSON array of parameter definitions with id, label, min, max, step, value
- `:plotType:` - Type of plot: `timeseries` (default), `2d`, or `3d`
- `:plotConfig:` - JSON object with Plotly configuration (title, axis labels, ranges)
- `:initialState:` - JSON object with initial state values
- `:initialX:` - Initial input/output value (default: 0)
- `:height:` - Plot height in pixels (default: 400)
- `:dt:` - Integration timestep (default: 0.02)


## How to run it locally

```{note}
We created a script that does this for you: just run `dev/build_simulation.sh`.
```

We had to hack the Jupyter book code, so to get this running you need to inject our hack and then re-start the server. Here is a sequence of commands you can run to make it work:
1. `rm -rf _build/site` - clears the build cache
2. `jupyter book build` - pulls the latest Jupyter book templates, including the code we'll overwrite
3. `cp _static/js/server.js _build/templates/site/myst/book-theme/server.js ` - copies our own hacky script into the Jupyter book system
4. `jupyter book start` - builds the book and starts a webserver you can access with your browser