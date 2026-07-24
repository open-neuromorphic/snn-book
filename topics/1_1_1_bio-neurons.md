---
kernelspec:
  name: python3
  display_name: 'Python 3'
---

(chapter:bio-neurons)=
# Biological Neurons

Biological neurons are specialised cells that play a central role in sensing,
information processing, cognition and learning, controlling essential
functions of the body (such as breathing, heart rate and hormone regulation),
as well as fine and coarse motor control that allow animals to move
in space and manipulate their environment.
A peculiar feature of neurons is that they lack the key cellular
structures responsible for mitosis, and therefore neurons are unable
to divide like other cells.

The physical architecture of a neuron is highly specialised for communication.
Neurons in our brain are structurally composed of a **soma** (or cell body),
**dendrites**, **axon** and **axon terminals** (or synaptic endings). These
are the primary components of interest to us with respect to simulating a
spiking neuron. Other components of a biological neuron include
the **nucleus**, the **axon hillock**, **myelin sheathing**,
**nodes of Ranvier**, **ion channels** and so forth.

The general structure of a neuron is shown in @fig:bio-neuron.

```{figure} ../assets/topic_1/chapter_1_1/bio_neuron.png
:label: fig:bio-neuron
:align: center

A biological neuron. Adapted from
[Complete neuron cell diagram](https://en.wikipedia.org/wiki/File:Complete_neuron_cell_diagram_en.svg)
by [LadyofHats](https://commons.wikimedia.org/wiki/User:LadyofHats),
public domain, Wikimedia Commons.
```

## Soma

The cell body of the neuron, known as the soma, contains the nucleus and
essential organelles (such as ribosomes and mitochondria), which are necessary
for maintaining the neuron's functions.
The soma serves as the primary site for integrating
incoming excitatory and inhibitory postsynaptic potentials (EPSPs and IPSPs;
see @neurotransmitters). This integration occurs across the
neuronal membrane, where the collective electrical influence of synaptic
inputs (@synapses) determines whether the soma reaches the threshold
required to trigger an action potential (action-potential)
at the axon hillock (@axon).

A fundamental characteristic of neurons is that they are
electrically **charged**.
This charge arises from a difference in ionic concentrations across the cell
membrane in the soma, which induces a potential difference known as the
**membrane potential**. The membrane potential of human neurons is
generally around $−70~mV$, which means that in the absence of any
external stimulation, the neuron lies at _rest_ at $−70~mV$,
also known as the **resting potential**.

The membrane potential is dynamic, meaning that it fluctuates depending on
two inherent physical quantities of the membrane: its resistance $R_{m}$
and its capacitance $C_{m}$.
In fact, its dynamics can be modelled in simple terms
by using a simple RC circuit model (@fig:rc-circuit):

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
the speed at which the membrane can charge or discharge as the neuron
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

The membrane potential will be revisited in @axon below in the context
of action potential integration.

## Dendrites

Inside a neuron, input in the form of electric pulses propagates in the
direction from dendrites towards the soma and ultimately the axon, which
transmits the neuron's activation to other neurons.

Dendrites, the primary input receptors of neurons, are active processing
units that can locally filter and amplify incoming signals. A neuron can have
thousands of dendrites, each of which contains special receptors for
**neurotransmitters** released by the **synaptic bouton** at the tip of an axon.
Synapses are covered in more detail below.

Neurons can receive input in the form of raw external stimuli (in the case
of biosensors) or in the form of action potentials generated by other neurons.
For example, in the retina, light is absorbed by a special type of cell called
a **photoreceptor**, which triggers a series of chemical reactions and
electric connections that ultimately translate the intensity of the absorbed
light into an electric current. This current flows into other neurons,
ultimately generating action potentials that travel down the optic nerve and
become input stimuli for other neurons in the brain.

## Synapses

Neurons communicate with each other via **synapses**, which are channels
that propagate electric pulses between two neurons.
There are two distinct types of synapses: electrical and chemical.
Electrical synapses, also known as **gap junctions**
[@Shimizu.Stopfer-2013-GapJunctions], are conductive channels that allow
ions to flow directly from one cell to another, enabling
almost instantaneous, synchronised communication.
Importantly, this communication is **bidirectional**,
meaning that ions can flow from either neuron into
the other, so there are no distinct 'source' and 'target' neurons.
This mechanism is critical for ensuring rapid responses that are more or less
automatic. For instance, gap junctions exist between two types of neurons
(photoreceptors and horizontal cells) in the very first layers of the
retina, which plays a role in the rapid adaptation of the retina to
changes in illumination.
Gap junctions also play an important role in the
synchronisation of brain waves [@Bennett.Zukin-2004-ElectricalCoupling].

In contrast, chemical synapses are characterised by the presence
of a physical gap (known as the **synaptic cleft**) between
the transmitting and receiving ends.
Chemical synapses contain multiple tiny capsules called **vesicles** that are
full of chemicals known as **neurotransmitters**.
When an action potential arrives at a synapse on the side of the source neuron,
it causes vesicles to burst and release their neurotransmitters into
the synaptic cleft. The neurotransmitters diffuse across the gap and
bind to receptors on the receiving neuron, triggering a new electrical response,
this time inside the dendrite of the receiving neuron.
This dendritic current is propagated to the soma of the receiving neuron,
where it adds to the total input of the neuron.
Since the action potentials transmitted via axons cannot propagate directly
through the synaptic cleft, this structure ensures that communication
via chemical synapses is **unidirectional**, so there are distinct
source and target neurons.

## Axon

The axon is the primary output channel of the neuron. While a single neuron
can have hundreds or thousands of dendrites, it typically has only one axon.

At the base of the axon lies the axon hillock, a crucial junction where
the neuron integrates the influx of current received via dendrites.
This current causes the membrane to *de*polarise, shifting the state
of the neuron away from the resting potential. If the membrane depolarisation
reaches a certain critical level known as the **threshold**, the neuron enters
a regime of cascading excitation that ultimately results in an
[action potential](@action-potential),
which travels rapidly down the axon and contributes to the activation
of other neurons, thus closing the cycle.
It is important to note that the threshold is not a physical quantity that
can be measured independently; rather, it emerges dynamically from the current
neuron state, particularly the membrane depolarisation level, the amount of
incoming current from the dendrites, the time constant of the membrane and
so forth.

In many neurons, the axon is wrapped in a fatty
myelin sheath, which allows the electrical signal to "jump"
between gaps called nodes of Ranvier, vastly increasing conduction velocity
through a process known as **saltatory conduction**.
The axon terminates in synaptic boutons, the specialized structures
that transmit the signal to other cells, usually via
**neurotransmitters**.

## Action potential

An action potential is a wave of rapid and temporary change in the membrane
potential of a neuron that propagates as an electric impulse through the axon
(@axon).

Upon receiving stimuli via the dendrites, the ion channels of the neuron open,
and the membrane potential changes due to the inflow and outflow of ions across
the cell membrane. If the neurotransmitter (henceforth, stimulus) received
by the dendrites is _excitatory_ and the resulting potential change causes
sufficient depolarization to push the membrane potential beyond a certain
**threshold** (generally around $−55~mV$ ), the membrane enters a process of
rapid depolarization, reaching a level of up to $+40~mV$.
Immediately after that, the membrane *re*polarises and falls _below_ the resting
potential. It eventually recovers to the resting potential after a certain
amount of time (generally less than $2~ms$). This process results in the
initiation of an **action potential** at the axon hillock
(@fig:action-potential). The period of hyperpolarisation is also called
the **refractory period**, where the neuron is _least_ likely to generate
another action potential.

```{figure} ../assets/topic_1/chapter_1_1/action_potential.png
:label: fig:action-potential
:align: center

An illustration of the process of rapid depolarisation that leads
to an action potential. Credit:
[Chris 73](https://en.wikipedia.org/wiki/User:Chris_73)
[CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/),
Wikimedia Commons.
```

<!-- TODO: Interactive / dynamic plot. -->

## Neurotransmitters

When the action potential reaches the axon terminals, it triggers the release
of neurotransmitters into the **synaptic cleft**, thereby enabling
communication with the next synaptically connected neuron.

Neurotransmitters are broadly categorised into **excitatory** and
**inhibitory**. Excitatory neurotransmitters, such as glutamate, induce a
depolarisation of the membrane of the receiving neuron known as an
**excitatory post-synaptic potential (EPSP)**, making it more likely
to produce an action potential. In contrast, inhibitory neurotransmitters,
such as GABA, induce an **inhibitory post-synaptic potential (IPSP)**
which leads to the **hyperpolarisation** of the membrane of the
receiving neuron and makes an action potential _less_ likely.
These opposing effects play a crucial role in learning
and ensuring the stability of brain activity as a whole.

As a rule, synapses can be either inhibitory or excitatory based on what type
of neurotransmitter they release, and in biological neural networks they never
spontaneously switch from one type into the other. The ratio of inhibitory
to excitatory synapses in the human brain is about $1:4$, meaning that about
$20%$ of all synaptic connections in the brain are inhibitory. This is known
as Dale's principle. Note that in general spiking neural networks (cf. @snn)
_do not_ follow Dale's principle in at least two ways,
unless special care is taken to ensure that they do. First, SNNs are rarely
initialised in a way that ensures a $1:4$ ratio of inhibitory to excitatory
connections. Second, learning rules such as backpropagation can turn an
excitatory connection into an inhibitory one.

In short, in a biological neuron, the dendrites _accept_ signals from the
pre-synaptic neurons, and the soma _integrates_ those signals. If the effect of
the integrated signals is _excitatory_, then an action potential is _generated_
and _communicated_ to the next neuron. Note that if the effect of the integrated
signals is _inhibitory_, then it _reduces_ the ability of the receiving neuron
to generate an action potential, thus, _inhibiting_ the firing of the receiving
neuron.

In the next chapter (@spiking), we will cover the basics of spiking
neurons, which are artificial models of biological neurons.

---

ToDo:

- [ ] Add references for the membrane potential evolution and the axon.
- [ ] Add dynamic plots for the temporal evolution of the membrane potential.
- [ ] Add a plot showing how the membrane is charged.
- [ ] Add an animated plot of a synapse, including neurotransmitter release
and binding.
- [ ] Add an interactive plot of the activation threshold.
- [ ] Add an animated plot of an ion pump.
- [ ] Add an animated plot of action potential propagation.
- [ ] Outline the Hodgkin-Huxley model.
- [ ] Add an interactive plot for the Hodgkin-Huxley model with variable
parameters.
