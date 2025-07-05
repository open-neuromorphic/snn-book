(chapter:point-neurons)=
# Point Neuron Models

**Point Neurons Models** are minimalistic spiking neuron models that use 
simplified electro-mathematical equations to mimic the spike generation, 
voltage reset, and refractory state behaviour of biological neurons; they 
conveniently ignore to model the ionic channels, axial conductance, axonal 
propagation of spike/action-potential, etc., basically anything that relates to 
the spatial form of a biological neuron. Common examples of point spikting 
neurons are *Integrate & Fire*, *Leaky Integrate & Fire*, and *Resonate & Fire* 
spiking neuron models. We explain each of these three point nueron models below, 
along with their code examples. We highly encourage you to play with their
different hyper-parameter settings, and observe/analyse their spiking behaviour.

### Notations
Before we explain the various spiking models of point neurons, we first introduce 
the mathematical notations (of their variables) that we henceforth use to work 
with them; these notations are consistent in their meaning throughout the book, 
unless stated otherwise.

- **Spikes**: The (incoming/outgoing) spike is denoted as $S(t)$ in continuous
  time or $S[t]$ in discrete time.  

- **Current**: The input current (to the spiking neuron) is denoted as $I(t)$ in
  continuous time or$I[t]$ in discrete time.

- **Voltage**: The voltage/membrane potential of a spiking neuron is denoted as
  $V(t)$ in continuous time or $V[t]$ in discrete time. 

## Integrate & Fire Neuron

**Integrate & Fire** (**IF**) neuron model is the simplest of all the spiking 
neuron models -- by virtue of which, it's dynamic behaviour is also quite 
limited. An IF neuron, as the name goes, (at the very least) *integrates* the 
incoming/input spikes into its *non-decaying* membrane potential/voltage, 
followed by generating an output spike when its voltage reaches/crosses the set 
voltage threshold; whether or not it undergoes through a refractory state, is 
dependent on the subjective implementation. Following is the *continuous-time* 
equation of an IF neuron [@heeger2000integrate] :

```{math}
:label: eq:continuous-if
C_m\frac{dV(t)}{dt} = I(t)
```
where, $C_m$ is the neuron's _Capacitance_ value (generally assumed to be $1$),
$V(t)$ is neuron's membrane potential/voltage, and $I(t)$ is the input 
stimulus/current due to the incoming spikes.

In Eq {eq}`eq:continuous-if`, note the inherent temporality in $V(t)$ and $I(t)$ 
by the virtue of time $t$. Here, we subtly note the activation function of an 
example artificial neuron, say $\texttt{ReLU}$: $max(x, 0)$, where 
$x\in\mathbb{R}$; and as can be seen, there is **no** temporal component in 
$\texttt{ReLU}$! This is a stark difference between between **spiking neurons** 
and **artificial neurons**, i.e.,

```{important}
In contrast to the Artificial Neurons, the Spiking Neurons are **inherently**
temporal!
```

In the later sections, we will present an interesting relation between the 
spiking and artificial neurons. 

### Implementing IF neuron
Coming back to the IF neurons, to implement it on a digital system, i.e., your 
computer, it is necessary to discretize its continuous-time equation such that 
you can program it. We can discretize the Eq {eq}`eq:continuous-if` using the 
**forward Euler method** -- we show how to do it in the Appx X. Following are the 
*discrete-time* equations that describe an IF neuron:

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

Before we begin explaining the Eqs {eq}`eq:discrete-if-cur-update`, 
{eq}`eq:discrete-if-vol-update`, {eq}`eq:discrete-if-spk-out`, and 
{eq}`eq:discrete-if-v-reset`, consider a *Spike Generator* that generates 
binary spikes $S_\text{inp}[t]$ (i.e., $S_\text{inp}[t]$ at time-step $t$ can 
either be a $0$ or a $1$) and feeds them to the IF neuron (see 
{numref}`fig:spk-neuron-if`). 

```{figure}
:name: fig:spk-neuron-if
:align: center

[Spike Generator] --w--> [IF Neuron]

A Spike Generator stimulating an IF Neuron. $w$ is the weight of connection.
```

Note that the spike generators are mere *programming constructs* (that follow a 
desired implementation) to generate spikes and stimulate the connected neuron(s).

In Equation {eq}`eq:discrete-if-cur-update`, $I[t]$ and $I[t-1]$ are the IF 
neuron's *current* at time-step $t$ and $t-1$, $\tau_\text{cur}$ is the *current decay* constant (s.t., $0\leq\tau_\text{cur}\leq1$). As can be seen in the *current update* Equation {eq}`eq:discrete-if-cur-update`, the current at time-step $t$ i.e., $I[t]$ is a sum of the *decayed* value of current at the previous time-step $t-1$ i.e., $I[t-1]$ (decayed by the factor $(1 - \tau_\text{cur})$) **and** the $w$ weighted spike input $S_\text{inp}[t]$.

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
