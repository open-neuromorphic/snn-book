---
numbering:
  title: false
---
# Interactive Visualizations
Here, we present one of the key strengths of this online SNN book -
**Interactive Visualizations**! Such interactive visualizations - _accompanied 
with their code_ - can help you build a clear and thorough understanding of the 
core SNN concepts. You can engage with these visualizations / demonstrations -
_right on the spot_ - to quickly learn the presented concept's _intricacies_ and 
the _effects_ of its variable parameters.

Try to move the sliders in the animation!

```{dynsim}
:params: [{"id": "v_decay", "label": "Voltage Decay", "min": 0.0, "max": 0.12, "step": 0.01, "value": 0.09}]
:plotType: timeseries
:plotConfig: {"title": "Leaky Integrate & Fire Neuron", "xaxis": {"title": "Time-Steps", "range": [0, 0.3]}, "yaxis": {"title": "Voltage (V)", "range": [-0.5, 1.5]}}
:initialState: {"V": 0, "S": 0}
:initialX: 0.1
:input: {"label": "Input Current (I)", "min": 0.0, "max": 0.5, "step": 0.01, "value": 0.1}
:height: 400
:dt: 0.001
:spikes: S
:spikeThreshold: 1.0

import numpy as np

def step(x, state, p):
  """ Leaky Integrate & Fire neuron.

  Args:
    x: Input current `I` from the slider.
    state: State variable dict, i.e., `state["V"]`.
    p: Other parameters dict, i.e., `p[v_decay]`.

  Returns:
    Tuple of (new `V` value, new `state` dict).
  """
  V_new = (1 - p["v_decay"])*state["V"] + x # Update Voltage.

  S = 0
  if V_new > 1.0:
    S = 1
    V_new = 0.0

  return (V_new, {"V": V_new, "S": S})
```

## Example of Leaky Integrate & Fire neuron
We take the example of simulating a [Leaky Integrate &
Fire](https://neuronaldynamics.epfl.ch/online/Ch1.S3.html) (LIF) neuron to
demonstrate its interactive visualization. Following is the discrete-time 
voltage equation of a typical LIF neuron:

\begin{equation}
V[t] = (1-v_\text{decay})V[t-1] + I[t]
\end{equation}

where $V[t]$ is LIF's voltage state, $I[t]$ is its input current, and
$v_\text{decay}$ is its voltage decay parameter. When $V[t]$ reaches or 
crosses a voltage threshold (say $v_\text{thr}$), the LIF neuron:

* produces a spike $S[t]$, which can be modeled as a [Heaviside Step
  Function](https://mathworld.wolfram.com/HeavisideStepFunction.html) 
$\Theta(.)$, i.e.,
\begin{equation}
S[t] = \Theta(V[t] - v_\text{thr})
\end{equation}

* and its voltage $V[t]$ is hard reset to $0$, i.e., 
\begin{equation}
V[t] = 0
\end{equation}

### LIF neuron visualization
Try to move the sliders in the animation above!

Keeping **Input Current (I)** fixed:
- If you _decrease_ **Voltage Decay**, you will find that the frequency of 
  spikes _increases_; this is because:
  - the **Voltage (V)** does _not_ decay rapidly, and 
  - it quickly crosses the voltage threshold (i.e., 1.0). 

- If you _increase_ **Voltage Decay**, you will find that either the frequency 
  of spikes _decreases_ or the neuron does _not_ spike at all!; this is because:
  - the **Voltage (V)** either crosses the threshold _late_ (due to increased 
  decay), or 
  - it _never_ crosses the threshold (due to the decay being too much), thus, no
    spikes!

Similarly, keeping the **Voltage Decay** fixed:
- If you _increase_ the **Input Current (I)**, you will observe that the 
  frequency of spikes _increases_; this is because:
  - a higher **Current (I)** value is fed to the neuron, and
  - its **Voltage (V)** is updated by a large value, 
  - thus, **V** _quickly_ crosses the threshold

- If you _decrease_ the **Input Current (I)**, you will observe that either the 
  frequency of spikes _decreases_ or the neuron does _not_ spike at all!; this 
  is because:
  - a smaller **Current (I)** value is fed to the neuron, and
  - its **Voltage (V)** is updated by a small value,
  - thus, **V** either takes _longer_ to cross the threshold, or
  - the update in **V** is too small to overcome the voltage decaying effect, 
    thus no spikes!

### Code
Our visualization relies on the [DynSim library](https://github.com/Jegp/dynsim/), 
developed by the editors of the SNN book. It works as a Plugin to the platform 
we used to build this book, [Jupyter Book](https://jupyterbook.org/). Users and 
contributors can simply type down the Python code in a `step()` function as 
below. Following is the example code for the visualization above.

```python
import numpy as np

def step(x, state, p):
  """ 
  Leaky Integrate & Fire neuron.

  Args:
    x: Input current `I` from the slider.
    state: State variable dict, i.e., `state["V"]`.
    p: Other parameters dict, i.e., `p[v_decay]`.

  Returns:
    Tuple of (new `I` value, new `state` dict).
  """
  
  V_new = (1 - p["v_decay"])*state["V"] + x # Update Voltage.

  S = 0
  if V_new > 1.0:
    S = 1
    V_new = 0.0

  return (V_new, {"V": V_new, "S": S})
```

And that is it!
We cannot wait to see what you will build with it.
