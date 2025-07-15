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

**Notations:**

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

## Integrate & Fire Neuron Model

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
C_\text{m}\frac{dV(t)}{dt} = I(t)
```
where, $C_\text{m}$ is the neuron's _Capacitance_ value (generally assumed to be
$1$), $V(t)$ is neuron's membrane potential/voltage, and $I(t)$ is the input
stimulus/current due to the incoming spikes.

In Eq {eq}`eq:continuous-if`, note the inherent temporality in $V(t)$ and $I(t)$
by the virtue of them being a function of time $t$. Here, we subtly note the
activation function of an example artificial neuron, say $\texttt{ReLU}$:
$max(x, 0)$, where $x\in\mathbb{R}$; and as can be seen, there is **no** temporal
component in $\texttt{ReLU}$! This is a stark difference between between
**spiking neurons** and **artificial neurons**, i.e.,

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

\begin{align}
I[t] &= (1 - \tau_\text{cur})\times I[t-1] + w\times S_\text{inp}[t] \tag{a}\\
V[t] &= V[t-1] + I[t] \tag{b}\\
S_\text{out}[t] &= \Theta(V[t] - V_\text{thr}) \tag{c}\\
V[t] &\leftarrow \begin{cases}
    V_\text{rest} \text{\quad\qquad\qquad\qquad$\cdots$ if $V[t]>V_\text{thr}$ and \textit{hard reset}} \\
    V[t] - V_\text{rest}  \text{\qquad\qquad$\cdots$ if $V[t]>V_\text{thr}$ and \textit{soft reset}} \\
\end{cases} \tag{d}
\label{eq:discrete-if}
\end{align}

Before we begin explaining the Eqs {eq}`eq:discrete-if`, consider a
_Spike Generator_ that generates binary spikes $S_\text{inp}[t]$ (i.e.,
$S_\text{inp}[t]$ at time-step $t$ can either be a $0$ or a $1$) and feeds them
to the IF neuron (see {numref}`fig:spk-neuron-if`).

```{figure}
:name: fig:spk-neuron-if
:align: center

[Spike Generator] --w--> [IF Neuron]

A Spike Generator stimulating an IF Neuron. $w$ is the weight of connection.
```

Note that the spike generators are mere *programming constructs* (that follow a
desired implementation) to generate spikes and stimulate the connected neuron(s).

In Eq {eq}`eq:discrete-if`$\textsf{a}$, $I[t]$ and $I[t-1]$ are the IF neuron's
*current* at time-step $t$ and $t-1$, $\tau_\text{cur}$ is the *current decay*
constant (such that, $0\leq\tau_\text{cur}\leq1$). As can be seen in the
*current update* Eq {eq}`eq:discrete-if`$\textsf{a}$, the current at
time-step $t$ i.e., $I[t]$ is a sum of the *decayed* value of current at the
previous time-step $t-1$ i.e., $I[t-1]$ (decayed by the factor $(1 -
\tau_\text{cur})$) and the $w$ weighted spike input $S_\text{inp}[t]$. Note that
the $S_\text{int}[t]$ can be from a pre-synaptic neuron too.

In Eq {eq}`eq:discrete-if`$\textsf{b}$, $V[t]$ and $V[t−1]$ are the IF neuron’s
*voltage* at the time-steps $t$ and $t-1$. Note that unlike Eq
{eq}`eq:discrete-if`$\textsf{a}$, **no** decayed value of $V[t-1]$ is added to
$I[t]$ to obtain the updated $V[t]$.

In Eq {eq}`eq:discrete-if`$\textsf{c}$ $V_\text{thr}$ is the threshold voltage and
$\Theta$ is the Heaviside step-function that outputs $1$ for positive arguments
and $0$ for non-positive arguments. As can be seen in the spike output Eq
{eq}`eq:discrete-if`$\textsf{c}$, a binary spike $S_\text{out}[t]$ (which can
either be a $0$ or a $1$) is generated by the IF neuron at the time-step $t$ if
it’s voltage $V[t]$ crosses the $V_\text{thr}$. Note that $V_\text{thr}$ here is
fixed, however, a few implementations also keep it variable/adaptable over time.

In the Eq {eq}`eq:discrete-if`$\textsf{d}$, $V_\text{rest}$ is the resting membrane
potential/voltage value, which is generally set as $0$. As explained before, the
two ways to _hard reset_ and _soft reset_ are shown in the voltage reset Eq
{eq}`eq:discrete-if`$\textsf{d}$, either of which can be chosen for the
implementation. The operational difference between these two implementations of
voltage reset will be clear when we will implement them in code later. For now,
a hard reset sets $V[t]$ to $V_\text{rest}$ after the neuron produces a spike and
a soft reset sets $V[t]$ to its new value lesser by $V_\text{rest}$. In other
words, the soft reset enables the neuron to retain some contribution of the
$I[t]$ or $S_\text{inp}[t]$ received, while hard reset results the neuron to
discard any such contribution and start updating its $V[t]$ right from
$V_\text{rest}$.

## Leaky Integrate & Fire Neuron Model
**Leaky Integrate & Fire** (**LIF**) neuron model is another simple and a common
spiking neuron model that displays slightly more complex behavior than the IF
neuron model. A LIF neuron, as the name goes, integrates the incoming/input
spikes into its _decaying_ membrane potential/voltage, followed by generating an
output spike when its voltage reaches/crosses the set voltage threshold. Note
that the refractory period (after spiking) is a standard component of the LIF
neuron model and is often included in its implementation, although, one can
choose to ignore this. Also note that including the refractory period in LIF
prevents it from spiking immediately after it has already spiked; this mimics the
neurobiological behavior of the neurons. Needless to say, inclusion of refractory
period influences LIF neuron’s firing rate behavior too, as well as its response
to the input stimuli. Following is the _continuous-time_ equation (Eq
{eq}`eq:continuous-lif`) of the LIF neuron [@gerstner2014neuronal]:

```{math}
:label: eq:continuous-lif
\tau_\text{m}\frac{dV(t)}{dt} = -(V(t) - V_\text{rest}) + R_\text{m}I(t)
```
where, $\tau_\text{m}$ and $R_\text{m}$ are the neuron's _time-constant_ and
_membrane resistance_ respectively. Note $\tau_\text{m}=R_\text{m}C_\text{m}$ and
$R_\text{m}$ contributes to the "leak" of accumulating charge in the membrane
capacitance  $C_\text{m}$, hence the name: "leaky integrator"
[@gerstner2014neuronal].

### Implementing LIF neuron
Similar to implementing the IF neuron on a digital computer, one can discretize
the Eq {eq}`eq:continuous-lif` of the LIF neuron via the forward Euler method; we
do that in Appx X. Following are the _discrete-time_ equations that describe a
LIF neuron:

\begin{align}
I[t] &= (1 - \tau_\text{cur})\times I[t-1] + w\times S_\text{inp}[t] \tag{a} \\
V[t] &= (1 - \tau_\text{vol})\times V[t-1] + I[t]  \tag{b} \\
S_\text{out}[t] &= \Theta(V[t] - V_\text{thr})  \tag{c} \\
V[t] &\leftarrow \begin{cases}
    V_\text{rest} \text{\quad\qquad\qquad\qquad$\cdots$ if $V[t]>V_\text{thr}$ and \textit{hard reset}} \\
    V[t] - V_\text{rest}  \text{\qquad\qquad$\cdots$ if $V[t]>V_\text{thr}$ and \textit{soft reset}} \\
\end{cases} \tag{d}
\label{eq:discrete-lif}
\end{align}

The notations tau-cur, tau-vol in Eq {eq}`eq:discrete-lif` have the same meaning
as described in the Eq for the IF neuron.
In Eq {eq}`eq:discrete-lif`$\textsf{a}$, $\tau_\text{cur}$ is the current decay
constant – same as defined for the IF neuron; and in Eq
{eq}`eq:discrete-lif`$\textsf{b}$, $\tau_\text{vol}$ is the voltage decay
constant (such that, 0 < $\tau_\text{vol}$ < 1).

Note that Eq {eq}`eq:discrete-lif`$\textsf{b}$ implements a decayed voltage
accumulation - this is unlike the Eq {eq}`eq:discrete-if`$\textsf{b}$, where _no
decayed_ voltage was accumulated. However, if $\tau_\text{vol}=0$, i.e., _no_
voltage decay, then the LIF neuron becomes equivalent to the IF neuron; and if
$\tau_\text{vol}=1$, then the LIF neuron _does not_ account for its previous
time-step's (i.e., of $t-1$) value. Thus, in a LIF neuron, $\tau_\text{vol}$
cannot be a $0$ or a $1$. Rest of the Eqs {eq}`eq:discrete-lif`$\textsf{c}$ and
{eq}`eq:discrete-lif`$\textsf{d}$ remain the same as described for the IF neuron.




Henceforth, in all the
chapters, IF will imply Integrate & Fire neuron (implemented
with Eqs (1.6), (1.7), (1.8), and (1.9)) and LIF will imply Leaky Integrate & Fire neuron
(implemented with Eqs (1.19) , (1.20), (1.21), and (1.22)); where hard reset is chosen (for
both IF and LIF neuron models) unless stated otherwise.
```{note}
Most of the literature on SNNs use point neuron models because they are simple and easy to implement in both software and hardware.
```

```{admonition} Highlight
:class: important
Some highlight
```

## Resonate & Fire neuron model

```{note} Statefulness of LIF and IF neuron
In the Eqs (1.6) and (1.7) , note that we account
for the previous state values: I[t − 1] and V [t − 1] respectively – this realizes the
statefulness of the IF neuron. However, in some implementations of IF neuron in
SNNs, one may set τcur (in Eq (1.6) ) to 1, thereby effectively discarding the current
I[t]’s statefulness and consider only the weighted Sinp[t].
```
