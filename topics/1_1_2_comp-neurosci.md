---
kernelspec:
  name: python3
  display_name: 'Python 3'
---

(chapter:comp-neurosci)=
# Computational Neuroscience

Neuroscience provides insight about the inner workings of neurons and the
supporting "infrastructure" in the central and peripheral nervous system that
helps neurons perform their function. As a subfield of neuroscience,
computational neuroscience focuses on understanding the principles that enable
neurons to process information (in other words, to **compute**).
Extracting these principles makes it possible
to create idealised models with simplified dynamics as a way of replicating
these biological processes and, by extension, the corresponding computation.

## Relation between biological and spiking neurons

The membrane potential is dynamic, meaning that it fluctuates depending on
two inherent physical quantities of the membrane:

- Capacitance $C_{m}$: A measure of the amount of charge that the membrane
can maintain.
- Resistance $R_{m}$: A measure of the permeability of the ion channels
across the membrane.

The dynamics of the membrane potential can be modelled in simple terms
by using a simple $RC$ circuit (@fig:rc-circuit):

```{figure} ../assets/topic_1/chapter_1_1/RC_circuit.png
:label: fig:rc-circuit
:align: center

An RC circuit with a capacitor and a resistor. Here, $I$ denotes current
flowing from one of the capacitor's electrodes into the other via a
resistance $R$. Credit:
[Ismaelteodoro](https://commons.wikimedia.org/w/index.php?title=User:Ismaelteodoro),
[CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/),
Wikimedia Commons.
```

Together, $R_{m}$ and $C_{m}$ determine
the rate at which the membrane can charge or discharge as the neuron
reacts to stimuli.
Specifically, the product of $R_{m}$ and $C_{m}$ is known as
the **time constant** $\tau_{m}$ of the membrane:

\begin{equation}
    \tau_{m}=R_{m}C_{m}
\end{equation}

The time constant represents the characteristic timescale on
which a neuron's membrane potential responds to input currents
or changes in conductance, effectively defining the temporal
lag or integration window of the cell.
Conceptually, the dynamics of the membrane potential is akin to that of a
low-pass filter, meaning that it attenuates high-frequency inputs and only
'tracks' the exponential moving average of the input.
Physiologically, $\tau_{m}$ dictates how quickly the membrane potential
$V(t)$ approaches its new steady-state value following a stimulus.

In the absence of stimuli, the voltage across a capacitor in an RC circuit
evolves according to

\begin{equation}
    \frac{dV(t)}{dt} = - \frac{V(t)}{\tau}
\end{equation}

The solution to this equation is

\begin{equation}
    V(t) = V_{0} e^{−t/\tau}
\end{equation}

An interactive plot of the temporal evolution of the
membrane potential is shown below.

```{code-cell} python
:tags: [remove-input]
:label: membrane-evolution

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

x = np.linspace(0.0, 30.0, 200)

V0 = 0.5
tau_init = 5

y = V0 * np.exp(-x / tau_init)

source = ColumnDataSource(data=dict(x=x, y=y))

p = figure(
    height=400,
    x_range=(0, 30.0),
    y_range=(0, 1),
    tools=[PanTool(), WheelZoomTool(), BoxZoomTool(), ResetTool(), SaveTool()],
)

p.line("x", "y", source=source, line_width=3, line_alpha=0.6)
p.title.text = "Temporal evolution of the membrane potential"
p.title.align = "center"
p.title.text_font_size = "14px"

p.xaxis.axis_label = r"$$t [s]$$"
p.yaxis.axis_label = r"$$V(t) [mV]$$"

text = r"$$V(t) = V_{0} e^{-t / \tau}$$"
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

slider_V = Slider(
    start=0.001,
    end=1,
    value=V0,
    step=0.001,
    title=r"$$V_{0}$$",
    width_policy="max",
)
slider_tau = Slider(
    start=0.01,
    end=10,
    value=tau_init,
    step=0.01,
    title=r"$$\tau$$",
    width_policy="max",
)

callback = CustomJS(
    args=dict(
        source=source,
        slider_V=slider_V,
        slider_tau=slider_tau,
    ),
    code="""
    const tau = slider_tau.value
    const V = slider_V.value
    const x = source.data.x
    const y = Array.from(x, (x) => V * Math.exp(- x / tau))
    source.data = { x, y }
""",
)

slider_V.js_on_change("value", callback)
slider_tau.js_on_change("value", callback)

layout = column(slider_tau, slider_V, p)

show(layout)
```

Here, $V(t)$ is the membrane potential as a function of time, $V_{0}$ is the
initial potential, and $t$ is time.
A larger time constant resulting from either high resistance (low ion leakage)
or high capacitance (large surface area) allows the neuron to integrate inputs
over longer durations, facilitating temporal summation,
whereas a smaller $\tau_{m}$ enables a more rapid, transient response.

The $RC$ circuit model of the dynamics of the membrane potential underpins
a substantial portion of the various spiking neuron models introduced in
the following sections.
