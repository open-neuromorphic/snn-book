---
numbering:
  title: false
---
# Interactive Visualizations
Here, we present one of the key strengths of this online SNN book -
**Interactive Visualizations**!. Such interactive visualizations - _accompanied 
with their code_ - can help you build a clear and thorough understanding of the 
core SNN concepts. You can engage with these visualizations / demonstrations -
_right on the spot_ - to quickly learn the presented concept's _intricacies_ and 
the _effects_ of its variable parameters. The code runs on _your browser_, thus, 
there is **no** need to spawn a separate `jupyter notebook` or any IDE to 
programmatically study those concepts! You can study them right here!

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

### Code
```{dynsim}
:params: [{"id": "v_decay", "label": "Voltage Decay", "min": 0.0, "max": 1.0, 
           "step": 0.1, "value": 0.2}]
:plotType: timeseries
:plotConfig: {"title": "Leaky Integrate & Fire Neuron", "xaxis": {"title": "Time-Steps", "range": [0, 10]}, "yaxis": {"title": "Voltage (V)", "range": [-0.5, 1.5]}}
:initialState: {"V": 0}
:initialX: 1.0
:height: 400
:dt: 0.01 RGASK: Do I need to use `dt` in my code? What I do not want to?  

import numpy as np

def step(I, state, p):
  """ Leaky Integrate & Fire neuron.

  Args:
    I: Input current `I` from the slider. 
    state: State variable dict, i.e., `state["V"]`.
    p: Other parameters dict, i.e., `p[v_decay]`.
  
  Returns:
    Tuple of (new `I` value, new `state["V"]` value).
  """
  V_new = (1 - p["v_decay"])*state["V"] + I # Update Voltage.

  # Update the current `state` to the new Voltage for next iteration.
  state["V"] = V_new # Update the current state to the new Voltage for next itr.

  return (V_new, {"V": V_new}) # RGASK: Why same information `V_new` is returned twice? 
```

### Interactive Visualization
