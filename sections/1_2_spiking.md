(chapter:spiking)=
# What is a spiking neuron?

In this chapter, we will study the most fundamental unit of building SNNs -- the
**Spiking Neuron**. In the previous chapter you were introduced to **Biological
Neurons** and their common types. Here'in, we will learn how to _simulate_ them
with various levels of fidelity, using the *neuroscience principles* underlying
the biological neurons. Later, a section on the *functional comparison* between
spiking neurons and artificial neurons will also be presented, where, we:

- highlight the inherent _temporality_ and _sparsity_ of spiking neurons, and
- intuitively explain the _relation_ between spiking and artificial neurons

## Spiking Neurons
**Spiking Neurons** are electro-mathematical abstraction of biological neurons.
They are generally *not* very detailed representations of biological neurons,
rather simple enough to reproduce their intended spiking behaviour. The **major
characteristics** of biological neurons -- that are of common interest to mimic
(via spiking neurons) are:

- **Accounting incoming action-potentials**: Spiking neurons simulate this
behavior by *integrating* the incoming action-potentials into their membrane
potential/voltage -- either in a *decaying* or *non-decaying* fashion (more
details later). Assuming the incoming action-potentials positively contribute,
the spiking neuron's potential/voltage increases with time and eventually
reaches/crosses a certain set voltage threshold.

- **Generating an output action-potential**: Spiking neurons simulate the
generation of action-potential by producing a *binary*/*graded* *spike*, where a
*binary* *spike* implies a binary value ∈ {0, 1} and a *graded* *spike* implies
an integer value ∈ ℤ⁺ > 1. Note that the values of spikes are also sometimes
referred as their *amplitude*.

```{note}
Some SNN implementations may use negative spikes! Also, it is commonly agreed
that biological neurons' action potentials do *not* have the notion of amplitude.
```

- **Resetting the membrane potential**: Spiking neurons simulate the resetting of
membrane potential/voltage via two common methods: *hard-reset* and *soft-reset*,
where *hard-reset* implies setting the neuron's voltage to 0, whereas
*soft-reset* implies setting the neuron's voltage to a value that is equal to
the neuron's current voltage *subtracted* by its assumed voltage threshold. The
difference between these two will be clear in the later sections.

- **Entering into refractory state**: Spiking neurons simulate this behavior by
generally _keeping_ their membrane potential/voltage at 0 (in case of soft-reset)
or at a subtracted value (in case of hard-reset) for a certain number of
time-steps.

- **Propagating the action-potential along axon**: Spiking neurons generally do
*not* simulate this behaviour, except for the *spatial* spiking neuron models;
whose neural dynamics incorporate this behaviour as a _delay_ (effected in
simulation time-steps) in action potential propagation through the modeled axon
to the axon-terminals.

```{note}
SNNs built with _point_ spiking neuron models incorporate the characteristic of
action potential _propagation_ through the concept of introducing _delays_ in 
spike transmission time - between the pre-synaptic and post-synpatic neurons.
```

Note that we have subtely introduced the concept of _point_ and _spatial_
spiking neuron models here. While researching in SNNs, you will see that a
majority of the SNN models are built with _point_ spiking neurons. Our next
chapter dives into different kinds of **Point Neuron** and **Spatial Neuron**
models.

### Should we write a section on why Spiking Neurons
Sparse method of encoding and working with temporal information. H/W neurons don't need to be active all the time. Sparsity in spiking.

### Section on Spiking Neurons summary?

