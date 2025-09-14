(chapter:bio-neurons)=
# Biological Neurons

Neurons in our brain are structurally composed of **soma** (or cell body), 
**dendrites**, **axon**, and **axon terminals** (or synaptic endings) -- these 
are the primary components of interest (to us) - with respect to simulating a 
spiking neuron (see [](#bio-neuron); other components of a biological neuron are 
**nucleus**, **axon hillock**, **myelin sheath**, **nodes of ranvier**, and 
**ion-channels**, etc.

```{figure} ../images/1/1_1/BioNeuron.png
:label: bio-neuron
:align: center

A biological neuron. Credit: Wikipedia CC BY-SA 4.0 [@wiki-img-bio-neuron] 
```

In the soma, due to the difference in ionic concentrations _across_ the cell 
membrane, there exists a potential difference (i.e., **membrane potential**) – 
generally considered to be around "−70" milliVolts (mV ). In the absence of any 
external stimulation, the neuron lies at _rest_ at −70mV (also known as the 
**resting potential**).

Upon stimulation (which generally happens when the dendrites accept 
neurotransmitters), the ion channels open up; and, due to the in-flow and 
out-flow of ions across the cell membrane, there results a change in the membrane 
potential. If the accepted neurotransmitters (henceforth, stimulus) is 
_excitatory_ and causes sufficient depolarization (i.e., increase in membrane 
potential) - such that the membrane potential reaches a certain **threshold** 
(generally agreed to be −55mV ), then there is rapid depolarization and the 
membrane potential rises upto "+40"mV . Immediately after, there is 
repolarization and the neuron’s membrane potential falls way below the resting 
state/potential; it eventually recovers to the resting potential after certain 
time (generally < 2 millisecond (ms)). This process results in the initiation of 
an **action potential** at the axon hillock. (see Fig 4).

```{note}
An action potential is a wave of rapid and temporary change in membrane potential 
of a neuron (similar to an electrical impulse) that propagates through the axon.
```
When the action potential reaches the axon terminals, it triggers 
neurotransmitter release at the **synaptic cleft**, thereby enabling 
communication with the next synaptically connected neuron. Note that the period 
of hyper-polarization (see Fig ) is also called **refractory period**, where the 
neuron is _least_ likely to generate another action potential.

In short, in a biological neuron, the dendrites _accept_ signals from the 
pre-synaptic neurons, and the soma _integrates_ those signals. If the effect of 
the integrated signals is _excitatory_, then an action potential is _generated_ 
and _communicated_ to the next neuron. Note that if the effect of the integrated 
signals is _inhibitory_, then it _reduces_ the ability of the receiving neuron to 
generate an action potential, thus, _inhibiting_ the firing of the receiving 
neuron.

Different types of neurons: Excitatory Neurons, Inhibitory Neurons, Pyramidal
Cells.

## Action Potentials
Perhaps look here: https://pure.rug.nl/ws/portalfiles/portal/1106997626/Complete_thesis.pdf

Introduce the notations for membrane potential, V[t], input current I[t], etc. here and then explain them in the Spiking Neurons section.

### Dales Principle
and How SNNs violate that?
