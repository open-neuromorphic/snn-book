(chapter:point-neurons)=
# Point Neuron Models
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

## Integrate & Fire neuron model

## Leaky Integrate & Fire neuron model

## Resonate & Fire neuron model
