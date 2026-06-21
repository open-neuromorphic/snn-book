---
kernelspec:
  name: python3
  display_name: 'Python 3'
---

(chapter:plasticity)=
# What is Synaptic Plasticity?

In the previous chapters, we saw how spikes travel across synapses and how synaptic weights control the flow of information in SNNs.
Up to now, those weights were _static_, i.e., set once, used forever.
But in biological systems, and often in SNN, weights can evolve over time.
This ability to change is called _synaptic plasticity_.

In biology, _plastic_ means malleable, i.e., capable of being reshaped.
A synapse is said to be plastic when its strength changes based on neural activity.
Two of the most studied complementary mechanisms of these synaptic changes are Long-Term Potentiation (LTP) and Long-Term Depression (LTD).
In the next sections, we look at how each mechanism works and why they matter for SNNs.

## Long-Term Potentiation

LTP refers to a persistent increase of a synaptic weight following specific patterns of correlated pre- and post-synaptic activity.
Specifically, when a pre-synaptic neuron repeatedly fires _just before_ the post-synaptic neuron, the system interprets it as a "causal" relationship:

> "Neuron A helped neuron B fire, let's make that connection stronger."

In SNNs, this principle appears in multiple practical forms.
One of the most common ones is based on how close in time the two spikes occur: if the pre-synaptic spike arrives shortly before the post-synaptic one, the weight increases; if the delay is large, the effect becomes negligible.

Formally, this timing-based increase of the weight can be described by:

```{math}
:label: eq:ltp
\Delta W_{\text{LTP}}
    = A_+ \, \exp\!\left(-\frac{\Delta t}{\tau_+}\right),
    \qquad \text{for } \Delta t > 0 ,
```

where:

- $A_+$ is a learning rate controlling the strength of the weight increase,
- $\tau_+$ is a time constant controling how fast the effect decays in time,
- $\Delta t = t_{\text{post}} - t_{\text{pre}}$ is the spike-timing difference.

Because $\tau_+$ appears in the denominator of the exponential term in Eq {numref}`eq:ltp`, it sets the rate at which the curve decays.
A small $\tau_+$ means only spikes that occur very close together strengthen the synapse, while a larger $\tau_+$ makes the rule more tolerant to longer delays between pre- and post-synaptic spikes.
This behavior is illustrated in the plot below.

```{code-cell} python
:tags: [remove-input]

import numpy as np
from bokeh.layouts import column, row, gridplot
from bokeh.models import ColumnDataSource, CustomJS, Slider
from bokeh.plotting import figure, output_notebook, show
from bokeh.models import (
    BoxZoomTool,
    ResetTool,
    PanTool,
    WheelZoomTool,
    SaveTool,
    Label,
    Node,
)

output_notebook(verbose=False, hide_banner=True)

x = np.linspace(0.0, 0.5, 100)

A_init = 0.5
tau_init = 0.1

y = A_init * np.exp(-x / tau_init)

source = ColumnDataSource(data=dict(x=x, y=y))

p = figure(
    height=400,
    x_range=(0, 0.5),
    y_range=(0, 1),
    tools=[PanTool(), WheelZoomTool(), BoxZoomTool(), ResetTool(), SaveTool()],
)

p.line("x", "y", source=source, line_width=3, line_alpha=0.6)
p.title.text = "Magnitude of weight update depending on relative spike timing"
p.title.align = "center"
p.title.text_font_size = "14px"

p.xaxis.axis_label = r"$$\Delta{t} [s]$$"
p.yaxis.axis_label = r"$$\Delta{W} [a.u.]$$"

text = r"$$\Delta{W} = A_{+} e^{-\Delta{t} / \tau_{+}}, \Delta{t}>0$$"
frame_right = Node(target="frame", symbol="right", offset=-10)
frame_top = Node(target="frame", symbol="top", offset=10)

label = Label(
    x=frame_right,
    y=frame_top,
    anchor="top_right",
    text=text,
    padding=10,
)
p.add_layout(label)

slider_A = Slider(
    start=0.001,
    end=1,
    value=A_init,
    step=0.001,
    title=r"$$A_{+}$$",
    width_policy="max",
)
slider_tau = Slider(
    start=0.001,
    end=1,
    value=tau_init,
    step=0.001,
    title=r"$$\tau_{+}$$",
    width_policy="max",
)

callback = CustomJS(
    args=dict(
        source=source,
        slider_A=slider_A,
        slider_tau=slider_tau,
    ),
    code="""
    const tau = slider_tau.value
    const A = slider_A.value
    const x = source.data.x
    const y = Array.from(x, (x) => A * Math.exp(- x / tau))
    source.data = { x, y }
""",
)

slider_A.js_on_change("value", callback)
slider_tau.js_on_change("value", callback)

layout = column(slider_tau, slider_A, p)

show(layout)
```

## Long-Term Depression

LTD refers to a persistent decrease of a synaptic weight that occurs when pre- and post-synaptic activity are poorly coordinated.
In practice, this happens when the pre-synaptic neuron tends to fire _after_ the post-synaptic one.
In that situation, the system interprets the timing as a "non-causal" relationship:

> "Neuron A didn't contribute to neuron B firing, let's weaken that connection."

Similar to LTP, a common form of LTD depends on timing: if the pre-synaptic spike arrives shortly after the post-synaptic one, the weight decreases, and the further apart the spikes are, the weaker the effect becomes.

Formally, this timing-based decrease of the weight can be described by:

```{math}
:label: eq:ltd
\Delta W_{\text{LTD}}
    = -A_- \, \exp\!\left(\frac{\Delta t}{\tau_-}\right),
    \qquad \text{for } \Delta t < 0 ,
```

where:

- $A_-$ is a learning rate controlling the strength of the weight decrease,
- $\tau_-$ is a time constant controlling how quickly the effect fades.

The following plot illustrates how $\tau_{-}$ and $A_{-}$ influence
the relation between $\Delta{W}$ and $\Delta{t}$.

```{code-cell} python
:tags: [remove-input]

import numpy as np
from bokeh.layouts import column, row, gridplot
from bokeh.models import ColumnDataSource, CustomJS, Slider
from bokeh.plotting import figure, output_notebook, show
from bokeh.models import (
    BoxZoomTool,
    ResetTool,
    PanTool,
    WheelZoomTool,
    SaveTool,
    Label,
    Node,
)

output_notebook(verbose=False, hide_banner=True)

x = np.linspace(-0.5, 0.0, 100)

A_init = 0.5
tau_init = 0.1

y = -A_init * np.exp(x / tau_init)

source = ColumnDataSource(data=dict(x=x, y=y))

p = figure(
    height=400,
    x_range=(-0.5, 0.0),
    y_range=(-1, 0.0),
    tools=[PanTool(), WheelZoomTool(), BoxZoomTool(), ResetTool(), SaveTool()],
)

p.line("x", "y", source=source, line_width=3, line_alpha=0.6)
p.title.text = "Magnitude of weight update depending on relative spike timing"
p.title.align = "center"
p.title.text_font_size = "14px"

p.xaxis.axis_label = r"$$\Delta{t} [s]$$"
p.yaxis.axis_label = r"$$\Delta{W} [a.u.]$$"

text = r"$$\Delta{W} = -A_{-} e^{\Delta{t} / \tau_{+}}, \Delta{t} < 0$$"
frame_left = Node(target="frame", symbol="left", offset=10)
frame_bottom = Node(target="frame", symbol="bottom", offset=-10)

label = Label(
    x=frame_left,
    y=frame_bottom,
    anchor="bottom_left",
    text=text,
    padding=10,
)
p.add_layout(label)

slider_A = Slider(
    start=0.001,
    end=1,
    value=A_init,
    step=0.001,
    title=r"$$A_{-}$$",
    width_policy="max",
)
slider_tau = Slider(
    start=0.001,
    end=1,
    value=tau_init,
    step=0.001,
    title=r"$$\tau_{-}$$",
    width_policy="max",
)

callback = CustomJS(
    args=dict(
        source=source,
        slider_A=slider_A,
        slider_tau=slider_tau,
    ),
    code="""
    const tau = slider_tau.value
    const A = slider_A.value
    const x = source.data.x
    const y = Array.from(x, (x) => -A * Math.exp(x / tau))
    source.data = { x, y }
""",
)

slider_A.js_on_change("value", callback)
slider_tau.js_on_change("value", callback)

layout = column(slider_tau, slider_A, p)

show(layout)
```

## From plasticity to learning

LTP and LTD capture both causal (input before output) and non-causal (output before input) spike relationships.
By combining these two mechanisms,
Taken together, they form the basis of timing-dependent learning rules such as Spike Timing-Dependent Plasticity (STDP), which we will cover in the next chapter.

## TODOs

- [ ] Correctly link the images
- [x] Add LTP/LTD plots
- [ ] Other forms of LTP/LTD (weight dependent, constant)
- [x] Add code to vizualize their effect
- [x] Runnable code to see effect of LTP/LTD based on value of tau
