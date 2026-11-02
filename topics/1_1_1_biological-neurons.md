---
authors:
- name: Hadjiivanov, Alexander
  affiliation: Netherlands eScience Center
---
(chapter:biological-neurons)=
# Biological Neurons

Biological neurons are specialized cells that play a central role in sensing,
information processing, cognition and learning, controlling essential
involuntary
functions of the body (such as breathing, heart rate, and hormone regulation),
as well as voluntary functions (such as fine and coarse motor control)
that allow animals to move
in space and manipulate their environment.
A peculiar feature of neurons is that once they mature, they lose the
ability to undergo mitosis and cannot divide like other cells
[@Aranda-Anzaldo-2012-PostmitoticState].
Nevertheless, new neurons are still generated in
in certain parts of the nervous system, such as in the olfactory bulb
and the hippocampus [@Appleby.Kempermann.ea-2011-RoleAdditive].

The anatomical structure of a neuron is shown in @fig:bio-neuron. 
The physical architecture of a neuron is highly specialized for communication,
which is typically carried out via [action potentials](#sec:action-potential).
The main structural components of a neuron are 
[neurotransmitters](#sec:neurotransmitters),
[synapses](#sec:synapses),
[dendrites](#sec:dendrites), 
the [soma](#sec:soma) (or cell body), and 
the [axon](#sec:axon).
In addition to these components, @fig:bio-neuron also includes additional 
components such as the **nucleus**, the **axon hillock**, 
the **myelin sheath**, **nodes of Ranvier**, and **ion channels**.

While ultimately each of these elements contributes to the
function and dynamics of a neuron, in this chapter we concentrate on the 
abovementioned main components as they are of primary interest for neuron 
modelling. However, it is worth noting that the computational complexity 
of simulating a biological neuron depends on the desired fidelity.
In other words, a simulation that takes into account only the dynamics of the 
soma is computationally **simpler** and **more efficient** than one that also 
includes axonal and ion channel dynamics.

As neuron-to-neuron communication is a conceptually circular process, 
the structure of this chapter follows the end-to-end journey of an 
action potential between the moments when it is converted from and back into 
a chemical signal at the [synaptic cleft](#sec:synapses).

```{figure} ../assets/topic_1/chapter_1_1/bio_neuron.png
:label: fig:bio-neuron
:align: center

A biological neuron.
In this chapter, we cover the main structural parts of the neuron, namely
dendrites, synapses, neurotransmitters, the soma, and the axon.
Adapted from
[Complete neuron cell diagram](https://en.wikipedia.org/wiki/File:Complete_neuron_cell_diagram_en.svg)
by [LadyofHats](https://commons.wikimedia.org/wiki/User:LadyofHats),
public domain, Wikimedia Commons.
```

(sec:action-potential)=
# Action potential
The **action potential** is an **electrical signal** that is the biological 
equivalent of a {term}`spike <spike>`, which is introduced in detail 
in [](#spiking).
As mentioned above, the action potential is the basic unit of the language that 
neurons use to communicate with each other.
As such, it is a central concept in the study and modelling of neurons, and a
substantial portion of the neuromorphic field is dedicated to emulating the
processes that stem from or lead to action potentials.
It is noteworthy that the action potential is a **functional property** 
of the neuron, in contrast to the **structural components** covered below.

Physiologically, the action potential is manifested as a wave of rapid temporary
change in the membrane potential of a neuron. 
Despite the considerable variation that neurons display in terms of morphology, 
dynamics and functional properties, almost all types of neurons generate or
receive action potentials.
The basic processes of generating an receiving an action potential is also 
remarkably consistent across neuron types and involves the entire neuron. 
This process begins at the [dendrites](#sec:dendrites), passes through 
the [soma](#sec:soma) and ends at the [axon](#sec:axon).
At either end, the process is typically mediated by 
[neurotransmitters](#sec:neurotransmitters), which propagate action 
potentials across the physical gap between neurons 
inside a [synapse](#sec:synapse).

```{figure} ../assets/topic_1/chapter_1_1/action_potential.png
:label: fig:action-potential
:align: center

An illustration of the process of rapid depolarization that leads
to an action potential. Credit:
[Chris 73](https://en.wikipedia.org/wiki/User:Chris_73)
[CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/),
Wikimedia Commons.
```

<!-- TODO: Interactive / dynamic plot. -->

(sec:neurotransmitters)=
# Neurotransmitters

The journey of an action potential as an electrical signal begins and ends 
with chemicals known as **neurotransmitters**, which propagate the action
potential across the physical gap between neurons 
(the [synaptic cleft](#sec:synapses)),
thereby enabling interneuron communication.
Neurotransmitters diffuse across the synaptic cleft and bind to specialized
receptors on the receiving side. In turn, this causes **ion channels**
in the postsynaptic neuron's membrane to open, letting sodium and calcium ions
($Na^{+}$ and $Ca^{2+}$) to
flow through these channels and change the balance of charge
across the membrane. This flow of charge induces electric pulses
inside the [dendrites](#sec:dendrites) of the postsynaptic neuron.

These electric pulses are known as **Excitatory
and Inhibitory Postsynaptic Potentials** (EPSPs and IPSPs, respectively).
The type of postsynaptic potential is determined by the type
of neurotransmitter that induces it.
Accordingly, neurotransmitters are also categorized into **excitatory** and
**inhibitory**. Excitatory neurotransmitters, such as glutamate, induce a
depolarization of the membrane of the receiving neuron, evoking
an EPSP, which makes the neuron more likely to produce an action potential.
In contrast, inhibitory neurotransmitters, such as GABA, induce an
IPSP, which leads to the **hyperpolarization** of the membrane of the
postsynaptic neuron and makes it _less_ likely to produce an action potential.
These opposing effects play a crucial role in learning
and ensuring the stability of brain activity as a whole.

Most types of neurons release the same set of neurotransmitters at all of their
synapses. Accordingly, most synapses have a reliable net inhibitory or
excitatory effect on the neurons at the receiving end.
Remarkably, the ratio of excitatory to inhibitory neurons in the brain seems
to be stable at about $4:1$ [@Sahara.Yanagawa.ea-2012-FractionCortical].
```{aside}
The observation that a neuron releases the same set of neurotransmitters
from all of its synapses is known as **Dale's principle**.
While it generally holds true, it is subject to ongoing discussion
[@Gutierrez.Baas-Thomas.ea-2026-WhatDale].
```

```{note}
As with every other model of a physical system, artificial
[spiking neurons](#spiking) (and {term}`SNN`s) deviate
from their biological counterparts, unless special care is taken
to ensure that they do not.
For instance, SNNs are rarely initialized in a way that ensures
a specific ratio of excitatory to inhibitory connections.
Also, learning rules such as backpropagation can turn an excitatory
connection into an inhibitory one and vice versa.
```

(sec:synapses)=
# Synapses

Neurons communicate with each other via **synapses**,
which are channels that propagate [action potentials](#sec:action-potential)
between two neurons.

There are two distinct types of biological synapses: **electrical** and 
**chemical**.
Electrical synapses, also known as **gap junctions**
[@Shimizu.Stopfer-2013-GapJunctions], are conductive channels that allow
ions to flow directly from one cell to another, enabling
almost instantaneous, synchronized communication.
Importantly, this communication is **bidirectional**,
meaning that ions can flow from either neuron into
the other, so there are no distinct "source" and "target" neurons.
This mechanism is critical for ensuring rapid responses that are more or less
automatic. For instance, gap junctions exist between two types of neurons
(photoreceptors and horizontal cells)<!-- See Issue #118: https://github.com/open-neuromorphic/snn-book/issues/118 -->
in the very first layers of the
retina, which plays a role in the rapid adaptation of the retina to
changes in illumination.
Gap junctions also play an important role in the
synchronization of brain waves [@Bennett.Zukin-2004-ElectricalCoupling].

In contrast, chemical synapses are characterized by the presence
of a physical gap (known as the **synaptic cleft**) between
an [axon](#sec:axon) on the side of the transmitting neuron and a 
[dendrite](#sec:dendrites) on the side of the receiving neuron.
Chemical synapses contain multiple tiny capsules called **vesicles** that are
full of [neurotransmitters](#sec:neurotransmitters).
When an action potential arrives at a synapse on the side of the source neuron,
it causes vesicles to burst and release their neurotransmitters into
the synaptic cleft. These neurotransmitters diffuse across the gap and
reach the tips of **dendritic spines** located on the
[dendrites](#sec:dendrites) of the receiving neuron. Each neurotransmitter binds
to specialised receptors on the tips of dendritic spines, triggering a response
that opens [ion channels](#sec:neurotransmitters) to allow ions to flow from the
intercellular space into the neuron. The influx of ions changes the
electric potential inside the dendrite of the receiving neuron, inducing
dendritic current that propagates to the soma of the receiving neuron.
where it contributes to the total activation of the neuron.

This mechanism involving a physical gap that needs to be bridged with chemical
neurotransmitters ensures that communication is **unidirectional**,
with distinct source and target neurons. Since induced dendritic
currents do not propagate directly back through the synapse,
the brain employs a range of other mechanisms enabling postsynaptic neurons
to provide feedback to presynaptic ones.

<!-- TODO: Plasticity in the brain. -->

(sec:dendrites)=
# Dendrites

Dendrites are the primary structures responsible for receiving inputs from
other neurons. They are active processing
units that can locally filter, amplify or otherwise modulate
incoming signals. A neuron can have thousands of dendrites, each of which 
features tiny membrane protrusions called **dendritic spines** that can 
take a variety of shapes and sizes. 
The tip of a dendritic spine forms the receiving end of a 
[synapse](#sec:synapses), which contains specialised receptors that bind with 
[neurotransmitters](#sec:neurotransmitters)
released by the **synaptic boutons** at the tip of an [axon](#sec:axon).

Neurons can receive input in the form of raw external stimuli (in the case
of biosensors) or action potentials generated by other neurons.
For example, in the retina, light is absorbed by a special type of cell called
a **photoreceptor**,<!-- See Issue #118: https://github.com/open-neuromorphic/snn-book/issues/118 -->
which triggers a series of chemical reactions and
electrical connections that ultimately translate the intensity of the absorbed
light into electrical current. This current flows into other neurons,
ultimately generating action potentials that travel down the optic nerve and
become input stimuli for other neurons in the brain.

Upon receiving stimuli via the dendrites, the ion channels of the neuron open,
and the membrane potential changes due to the inflow and outflow of ions across
the cell membrane. This direction of this change (positive or negative) depends 
on whether the neurotransmitter received by the dendrites is **excitatory** or
**inhibitory**. The change in membrane potential induces a small **dendritic 
current** that propagates all the way to the [soma](#sec:soma), which integrates
the cumulative effect of hundreds or even thousands dendritic currents.

(sec:soma)=
# Soma

The cell body of the neuron, known as the soma, contains the nucleus and
essential organelles (such as ribosomes and mitochondria), which are necessary
for maintaining the neuron's physiological functions.

A fundamental characteristic of neurons is that they are
**electrically charged**.
This charge arises from a difference in ionic concentrations across the cell
membrane in the soma, which induces a potential difference known as the
**{term}`membrane potential`**. In humans, the membrane potential of most neurons
in the absence of any external stimulation is around $−70~mV$
[@Coward-2013-TheoreticalNeuroscience].
This is known as the **resting potential**.

Like most cells in the body, the membrane of the neuron is composed of a double
lipid layer, which is an excellent electrical insulator.
This allows the membrane to function as a capacitor, where the interior and
exterior of the cells function as the electrodes.

While the membrane facilitates the accumulation and maintenance of
electrical charge, the **process** of charging and discharging the membrane
depends on special protein structures known as **ion channels**.
As the membrane itself is impermeable, ion channels serve as tunnels for
transporting specific types of ions across the membrane.
For instance, there are $Na^{+}$, $K^{+}$ and $Ca^{2+}$ channels that transport
exclusively the respective ions across the membrane, either from the interior
towards the intercellular space or vice versa. The concentration imbalance of
ions on both sides of the membrane gives rise to a charge imbalance, which
in turn translates into the membrane potential.

The soma serves as the primary site for integrating all inputs generated by
external stimuli or other neurons.
This integration occurs across the
neuron's cell membrane, where the collective electrical influence of [synaptic
inputs](#sec:synapses) determines whether the membrane potential in the soma
reaches the threshold required to trigger an
[action potential](#sec:action-potential) at the [axon hillock](#sec:axon).

(sec:axon)=
# Axon

The axon is a wire-like structure that extends from the soma to other neurons.
It the primary output channel of the neuron.
In some cases, the axon can reach a length of more than one meter
[@bear2025neuroscience].
While a single neuron can have hundreds or thousands of dendrites,
it typically has only one axon, with rare exceptions including multiaxonal 
[@BaccusOlveczkyManuEtAl_2008_RetinalCircuitThatb] and anaxonal
[@Wu.Ivanova.ea-2011-ActionPotential] amacrine cells in the retina.

The neuron integrates the influx of current received via dendrites
at the axon hillock, a crucial junction between the soma and the axon.
This current causes the membrane to *de*polarize, shifting the state
of the neuron away from the resting potential in the positive direction
(the membrane becomes less negative).
If the membrane depolarization
reaches a certain critical voltage level known as the **threshold**,
the neuron enters a regime of cascading excitation that ultimately results in an
[**action potential**](#sec:action-potential),
which travels rapidly down the axon and contributes to the activation
of other neurons, thus closing the cycle.

```{note}
It is important to mention that the threshold is not a physical quantity that
can be measured directly; rather, it emerges dynamically from the current
neuron state, particularly the membrane depolarization level, the amount of
incoming current from the dendrites, the time constant of the membrane and
so forth.
```

In many neurons, the axon is wrapped in a lipid-rich myelin layer known as
the **myelin sheath**.
Myelin acts as an insulator and prevents the dissipation of charge.
In axons with a myelin sheath, the transmission of action potentials is
much faster than in unmyelinated axons.

```{aside}
The boost in transmission speed is enabled by little gaps in the myelin sheath
known as **nodes of Ranvier**.
These gaps allow the action potential to regenerate at each node,
creating the effect of "jumping" from one node to another
in a process known as **saltatory conduction**.
```

The axon terminates in synaptic boutons, the specialized structures
that transmit the signal to other cells, usually via
**neurotransmitters**.

# Summary

In short, in a biological neuron, the dendrites _accept_ signals from the
pre-synaptic neurons, and the soma _integrates_ those signals. If the effect of
the integrated signals is **excitatory**, then an action potential is 
_generated_ and _communicated_ to the next neuron. If the effect of the 
integrated signals is **inhibitory**, then it _reduces_ the ability of the 
receiving neuron to generate an action potential, thus, _inhibiting_ 
the firing of the receiving neuron.

In the next chapter ([](#spiking)), we will cover the basics of spiking
neurons, which are artificial models of biological neurons.
