(chapter:point-neurons)=
# Point Neuron Models

**Point Neurons Models** are minimalistic spiking neuron models that use
simplified electro-mathematical equations to mimic the _spike generation_,
_voltage reset_, and _refractory state_ behaviours of biological neurons; they
conveniently ignore to model the ionic channels, axial conductance, axonal
propagation of spike/action-potential, etc., basically anything that relates to
the spatial form of a biological neuron. Common examples of point spiking
neurons are *Integrate & Fire*, *Leaky Integrate & Fire*, and *Resonate & Fire*
spiking neuron models. We explain each of these three point neuron models below,
along with their code examples. We highly encourage you to play with their
different hyper-parameter settings, and observe/analyse their spiking behaviour.

**Notations:**

Before we explain the various spiking models of point neurons, we first 
introduce the mathematical notations (of their variables) that we henceforth 
use; these notations are consistent in their meaning throughout the book,
unless stated otherwise.

- **Spike**: The incoming/outgoing spike to/from a spiking neuron is denoted as 
  $S(t)$ in continuous time or $S[t]$ in discrete time.

- **Current**: The input current (to a spiking neuron) is denoted as $I(t)$ in
  continuous time or$I[t]$ in discrete time.

- **Voltage**: The voltage/membrane potential of a spiking neuron is denoted as
  $V(t)$ in continuous time or $V[t]$ in discrete time.

(sec:spk-nrn-if)=
## Integrate & Fire Neuron Model

**Integrate & Fire** (**$\texttt{IF}$**) neuron model is the simplest of all the 
spiking neuron models -- by virtue of which, it's dynamic behaviour is also 
quite limited. An $\texttt{IF}$ neuron, as the name goes, *integrates* the 
incoming/input spikes into its *non-decaying* membrane potential/voltage, 
followed by generating an output spike when its voltage reaches/crosses the set
voltage threshold; whether or not it undergoes through a _refractory_ state, is
dependent on its subjective implementation. Following is the *continuous-time*
equation of an $\texttt{IF}$ neuron [@heeger2000integrate] :

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
$max(x, 0)$, where $x\in\mathbb{R}$; and as it can be seen in the 
$\texttt{ReLU}$ neuron, there is **no** temporal component in it! This is one of 
the stark differences between between **spiking neurons** and 
**artificial neurons**, i.e.,

```{important}
In contrast to the Artificial Neurons, the Spiking Neurons are **inherently**
temporal!
```

Other few differences are:
* Unlike artificial neurons, spiking neurons are (_implicitly_) recurrent (note 
  the relation between $V[t]$ and $V[t-1]$).
* Spiking neurons output _discrete_ spikes (which can be graded too, i.e., 
  non-binary integers).
  
In the later sections, we will present an interesting relation between the
spiking and artificial neurons.

### Implementing $\texttt{IF}$ neuron
Coming back to the $\texttt{IF}$ neurons, to implement it on a digital system, 
i.e., a computer, it is necessary to discretize its continuous-time equation 
such that one can program it. We can discretize the Eq {eq}`eq:continuous-if` 
using the **forward Euler method** -- we show how to do it in the 
[](#sec:discretizing-if-neuron). For quick reference, following are the 
*discrete-time* equations that describe an $\texttt{IF}$ neuron:

```{math}
:label: eq:discrete-if
\begin{aligned}
I[t] &= (1 - i_\text{decay})\times I[t-1] + w\times S_\text{inp}[t] && \text{(a)}\\
V[t] &= V[t-1] + I[t] && \text{(b)}\\
S_\text{out}[t] &= \Theta(V[t] - V_\text{thr}) && \text{(c)}\\
V[t] &\leftarrow \begin{cases}
    V_\text{rest} \text{\quad\qquad\qquad\qquad$\cdots$ if $V[t]>V_\text{thr}$ and \textit{hard reset}} \\
    V[t] - V_\text{thr}  \text{\qquad\qquad$\cdots$ if $V[t]>V_\text{thr}$ and \textit{soft reset}} \\
\end{cases} \tag{d}
\label{eq:discrete-if}
\end{aligned}

Before we begin explaining the Eqs {eq}`eq:discrete-if`, let us introduce the 
concept of **Spike Train**. 
```{note} Spike Train
A spike train is a sequential collection of spikes in time; consider it to be a 
1-dimensional binary vector. That is, the individual elements of such a vector 
can either be a 0 or an integer (generally 1), where the index of each scalar 
element denotes a time-step.
```
A spike train holding a _random_ collection of binary spikes and feeding them to 
an $\texttt{IF}$ neuron (see {numref}`fig:spk-neuron-if`) is shown below.

```{figure}
:name: fig:spk-neuron-if
:align: center

[Spike Train] --w--> [IF Neuron]

A Spike Train stimulating an IF Neuron. $w$ is the weight of connection.
```

In Eq {eq}`eq:discrete-if`$\textsf{a}$, $I[t]$ and $I[t-1]$ are the 
$\texttt{IF}$ neuron's *current* at time-step $t$ and $t-1$, $i_\text{decay}$ is 
the *current decay* value (such that, $0\leq i_\text{decay}\leq1$). As can be 
seen in the *current update* Eq {eq}`eq:discrete-if`$\textsf{a}$, the current at
time-step $t$ i.e., $I[t]$ is a sum of the *decayed* value of current at the
previous time-step $t-1$ i.e., $I[t-1]$ (decayed by the factor $(1 - 
i_\text{decay})$) and the $w$ weighted spike input $S_\text{inp}[t]$. Note that
the $S_\text{inp}[t]$ can be from a pre-synaptic neuron too (instead of just 
being a part of the above randomly generated spike train).

In Eq {eq}`eq:discrete-if`$\textsf{b}$, $V[t]$ and $V[t−1]$ are the 
$\texttt{IF}$ neuron’s *voltage* at the time-steps $t$ and $t-1$. Note that 
unlike Eq {eq}`eq:discrete-if`$\textsf{a}$, **no** decayed value of $V[t-1]$ is 
added to $I[t]$ to obtain the updated $V[t]$.

In Eq {eq}`eq:discrete-if`$\textsf{c}$ $V_\text{thr}$ is the threshold voltage and
$\Theta$ is the Heaviside step-function that outputs $1$ for positive arguments
and $0$ for non-positive arguments. As can be seen in the spike output Eq
{eq}`eq:discrete-if`$\textsf{c}$, a binary spike $S_\text{out}[t]$ (which can
either be a $0$ or a $1$) is generated by the $\texttt{IF}$ neuron at the 
time-step $t$ if it’s voltage $V[t]$ crosses the $V_\text{thr}$. Note that 
$V_\text{thr}$ here is fixed, however, a few implementations also keep it 
variable/adaptable over time.

In the Eq {eq}`eq:discrete-if`$\textsf{d}$, $V_\text{rest}$ is the resting 
membrane potential/voltage value, which is generally set as $0$. As explained 
before, the two ways to _hard reset_ and _soft reset_ are shown in the voltage 
reset Eq {eq}`eq:discrete-if`$\textsf{d}$, either of which can be chosen for the
implementation. The operational difference between these two implementations of
voltage reset will be clear when we will implement them in code later. For now,
a hard reset sets $V[t]$ to $V_\text{rest}$ after the neuron produces a spike 
and a soft reset instead subtracts $V_\text{thr}$ from $V[t]$. In 
other words, the soft reset enables the neuron to retain some contribution of 
the $I[t]$ or $S_\text{inp}[t]$ received, while hard reset results the neuron to
discard any such contribution and start updating its $V[t]$ right from
$V_\text{rest}$.

(sec:spk-nrn-lif)=
## Leaky Integrate & Fire Neuron Model
**Leaky Integrate & Fire** (**$\texttt{LIF}$**) neuron model is another simple 
and a common spiking neuron model that displays slightly more complex behavior 
than the $\texttt{IF}$ neuron model. A $\texttt{LIF}$ neuron, as the name goes, 
integrates the incoming/input spikes into its _decaying_ membrane 
potential/voltage, followed by generating an output spike when its voltage 
reaches/crosses the set voltage threshold. Note that the _refractory_ period 
(after spiking) is a standard component of the $\texttt{LIF}$ neuron model and 
is often included in its implementation, although, one can choose to ignore 
this. Since the refractory period in a spiking neuron prevents it from spiking 
immediately after it has spiked, it influences the $\texttt{LIF}$ neuron’s 
firing (rate) behavior i.e., its response to the input stimuli. Following is the 
_continuous-time_ equation (Eq {eq}`eq:continuous-lif`) of the $\texttt{LIF}$ 
neuron [@gerstner2014neuronal]:

```{math}
:label: eq:continuous-lif
\tau_\text{m}\frac{dV(t)}{dt} = -(V(t) - V_\text{rest}) + R_\text{m}I(t)
```
where, $\tau_\text{m}$ and $R_\text{m}$ are the neuron's _time-constant_ and
_membrane resistance_ respectively. Note $\tau_\text{m}=R_\text{m}C_\text{m}$ 
and $R_\text{m}$ contributes to the "leak" of accumulating charge in the 
membrane capacitance  $C_\text{m}$, hence the name: "leaky integrator"
[@gerstner2014neuronal].

### Implementing $\texttt{LIF}$ neuron
Similar to implementing the $\texttt{IF}$ neuron on a digital computer, one can 
discretize the Eq {eq}`eq:continuous-lif` of the $\texttt{LIF}$ neuron via the 
forward Euler method; we do that in the [](#sec:discretizing-lif-neuron). 
Following are the _discrete-time_ equations that describe a $\texttt{LIF}$ 
neuron:

```{math}
:label: eq:discrete-lif
\begin{aligned}
I[t] &= (1 - i_\text{decay})\times I[t-1] + w\times S_\text{inp}[t] && \text{(a)} \\
V[t] &= (1 - v_\text{decay})\times V[t-1] + I[t] && \text{(b)} \\
S_\text{out}[t] &= \Theta(V[t] - V_\text{thr}) && \text{(c)} \\
V[t] &\leftarrow \begin{cases}
    V_\text{rest} \text{\quad\qquad\qquad\qquad$\cdots$ if $V[t]>V_\text{thr}$ and \textit{hard reset}} \\
    V[t] - V_\text{thr}  \text{\qquad\qquad$\cdots$ if $V[t]>V_\text{thr}$ and \textit{soft reset}} \\
\end{cases} && \text{(d)}
\end{aligned}
```

In Eq {eq}`eq:discrete-lif`$\textsf{a}$, $i_\text{decay}$ is the *current decay*
value – same as defined for the $\texttt{IF}$ neuron; and in Eq
{eq}`eq:discrete-lif`$\textsf{b}$, $v_\text{decay}$ is the *voltage decay* value 
(such that, $0 < v_\text{decay} < 1$).

Note that Eq {eq}`eq:discrete-lif`$\textsf{b}$ implements a _decayed_ voltage
accumulation - this is unlike the Eq {eq}`eq:discrete-if`$\textsf{b}$, where 
voltage was accumulated _without_ decay. However, if $v_\text{decay}=0$, i.e., 
_no_ voltage decay, then the $\texttt{LIF}$ neuron becomes equivalent to the 
$\texttt{IF}$ neuron; and if $v_\text{decay}=1$, then the $\texttt{LIF}$ neuron 
_does not_ account for its previous time-step's (i.e., of $t-1$) voltage value. 
Thus, in a $\texttt{LIF}$ neuron, $v_\text{decay}$ _cannot_ be a $0$ or a $1$. 
Rest of the Eqs {eq}`eq:discrete-lif`$\textsf{c}$ and 
{eq}`eq:discrete-lif`$\textsf{d}$ remain the same as described for the 
$\texttt{IF}$ neuron.

Henceforth, in all the chapters, $\texttt{IF}$ will imply **Integrate & Fire** 
spiking neuron (implemented with Eqs {eq}`eq:discrete-if`) and $\texttt{LIF}$ 
will imply **Leaky Integrate & Fire** spiking neuron (implemented with Eqs 
{eq}`eq:discrete-lif`); where _hard reset_ is chosen (for both $\texttt{IF}$ and 
$\texttt{LIF}$ neuron models) unless stated otherwise.

```{note}
Most of the literature on SNNs use **point** neuron models because they are 
simple and easy to implement in both software and hardware.
```

```{note} Statefulness of $\texttt{IF}$ and $\texttt{LIF}$ neurons
In the Eqs {eq}`eq:discrete-if`$\textsf{a}$/$\textsf{b}$ and Eqs 
{eq}`eq:discrete-lif`$\textsf{a}$/$\textsf{b}$ (of $\texttt{IF}$ and 
$\texttt{LIF}$ respectively), note that we account for the previous state 
values of current and voltage, i.e., $I[t − 1]$ and $V[t − 1]$ respectively – 
this realizes the **statefulness** of the $\texttt{IF}$ and $\texttt{LIF}$ 
neurons. 

However, in some implementations of $\texttt{IF}$ and $\texttt{LIF}$ (in SNNs), 
one may set $i_\text{decay}$ to 1, thereby effectively discarding the current
$I[t]$’s statefulness and considering only the weighted $S_\text{inp}[t].$
```

## Resonate & Fire neuron model

```{admonition} Highlight
:class: important
Some highlight
```
