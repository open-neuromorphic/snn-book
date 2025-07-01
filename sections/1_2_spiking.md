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

### Spiking Neurons
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
action potential _propagation_ via the concept of introducing _delays_ in spike
transmission time between the pre-synaptic and post-synpatic neurons.
```

Note that we have subtely introduced the concept of _point_ and _spatial_
spiking neuron models here. While researching in SNNs, you will see that a
majority of the SNN models are built with _point_ spiking neurons. Our next
chapter dives into different kinds of **Point Neuron** and **Spatial Neuron**
models.

---

### Point Spiking Neuron Models

**Point spiking neurons** are minimalistic neuron models that use simplified electro-mathematical equations to mimic the spike generation, voltage reset, and refractory state behaviour of biological neurons; they conveniently ignore to model the ionic channels, axial conductance, axonal propagation of spike/action-potential, etc., basically anything that relates to the spatial form of a biological neuron. Common examples of point spikting neurons are *Integrate & Fire*, *Leaky Integrate & Fire*, and *Resonate & Fire* neuron models.

#### Integrate & Fire neuron model

**Integrate & Fire** (IF) neuron model is the simplest of all the spiking neuron models -- by virtue of which, it's dynamic behaviour is also quite limited. An IF neuron, as the name goes, (at the very least) *integrates* the incoming/input spikes into its *non-decaying* membrane potential/voltage, followed by generating an output spike when its voltage reaches/crosses the set voltage threshold; whether or not it undergoes through a refractory state, is dependent on the subjective implementation. Following is the *continuous-time* equation of an IF neuron:

```{math}
:label: eq:continuous-if
C\frac{dV(t)}{dt} = I(t)
```

Note the inherent temporality in $t$.

To implement an IF neuron on digital systems, i.e., your computer, it is necessary to discretize its continuous-time equations. Following are the *discrete-time* equations that describe an IF neuron:

```{math}
:label: eq:discrete-if-cur-update
I[t] = (1 - \tau_\text{cur})\times I[t-1] + w\times S_\text{inp}[t]
```

```{math}
:label: eq:discrete-if-vol-update
V[t] = V[t-1] + I[t]
```

```{math}
:label: eq:discrete-if-spk-out
S_\text{out}[t] = \Theta(V[t] - V_\text{thr})
```

```{math}
:label: eq:discrete-if-v-reset
V[t] \leftarrow V_\text{rest} \quad \text{if } V[t] > V_\text{thr}
```

Before we begin explaining them, consider a *Spike Generator* that generates binary spikes $S_\text{inp}[t]$ (i.e., $S_\text{inp}[t]$ at time-step $t$ can either be $0$ or $1$) and feeds them to the IF neuron (see {numref}`fig:spk-neuron-if`). Note that spike generators are mere *programming constructs* (that follow a desired implementation) to generate spikes and stimulate the connected neuron(s).

```{figure}
:name: fig:spk-neuron-if
:align: center

[Spike Generator] --w--> [IF Neuron]

A Spike Generator stimulating an IF Neuron. $w$ is the weight of connection.
```

In Equation {eq}`eq:discrete-if-cur-update`, $I[t]$ and $I[t-1]$ are the IF neuron's *current* at time-step $t$ and $t-1$, $\tau_\text{cur}$ is the *current decay* constant (s.t., $0\leq\tau_\text{cur}\leq1$). As can be seen in the *current update* Equation {eq}`eq:discrete-if-cur-update`, the current at time-step $t$ i.e., $I[t]$ is a sum of the *decayed* value of current at the previous time-step $t-1$ i.e., $I[t-1]$ (decayed by the factor $(1 - \tau_\text{cur})$) **and** the $w$ weighted spike input $S_\text{inp}[t]$.

In Equation {eq}`eq:discrete-if-vol-update`,

where, $S_\text{inp}[t]$ are the *input* spikes from the preceding/pre-synaptic neuron to the IF neuron, $I[t]$ and $V[t]$ are the IF neuron's *current* and *voltage* respectively -- all at the *discrete* time-step $t$. Note that $I[t-1]$ and $V[t-1]$ are the IF neuron's current and voltage at the previous time-step '$t-1$' -- accounting these values realizes the stateful-ness of the IF neuron. Also note that the current $I[t]$ intakes a , where , whereas, there is no such decay term for $V[t]$'s update.

#### Leaky Integrate & Fire Neuron Model

```{note}
Most of the literature on SNNs use point neuron models because they are simple and easy to implement in both software and hardware.
```

```{admonition} Highlight
:class: important
Some highlight
```

### Spatial Spiking Neuron Models

#### Hodgkin Huxley Neuron Model

(sec:proin)=
```{note}
Here is some remark {ref}`sec:proin`.
```

---

**Spiking Neurons Summary**

Example of a website [example.com](https://example.com/).

### Should we write a section on why Spiking Neurons
Sparse method of encoding and working with temporal information. H/W neurons don't need to be active all the time.

