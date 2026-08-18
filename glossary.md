---
numbering: false
---
# Glossary

Terms are listed alphabetically. Each entry gives the expansion of the term
(where it has one) followed by a short definition. Reference an entry from any
chapter with the `{term}` role, e.g. ``{term}`LIF` ``, so that the reader can
jump straight here.

:::{glossary}

action potential
: See {term}`spike`.

AEDAT
: Address Event Data &mdash; a family of file formats used to store recordings
from event-based sensors such as a {term}`DVS`.

AER
: Address Event Representation &mdash; a format for communicating spikes as a
stream of addresses, where each address identifies the neuron that fired and
the event's position in the stream carries its timing.

ALIF
: Adaptive Leaky Integrate & Fire &mdash; a {term}`LIF` neuron whose firing
threshold rises after each spike and decays back over time, so that sustained
input produces a falling firing rate.

ANN
: [Artificial Neural Network](https://en.wikipedia.org/wiki/Artificial_neural_network)
&mdash; a second-generation neural network whose neurons emit continuously
valued activations rather than spikes, and which carries no state across time
unless one is added explicitly.

BPTT
: Backpropagation Through Time &mdash; training a stateful network by unrolling
it across simulation time steps and backpropagating through the resulting
graph, in which the weights are shared across every step.

CPU
: Central Processing Unit &mdash; the general-purpose processor of a
conventional computer, responsible for arithmetic, logic, control and I/O.

credit assignment
: The problem of determining which neurons and synapses were responsible for an
output error, and by how much each should change. In an SNN it must be solved
in space *and* time.

CUBA
: CUrrent-BAsed &mdash; a neuron model in which an incoming spike injects a
current that then charges the membrane, as opposed to a conductance-based
(COBA) model, in which the spike changes the membrane's conductance.

decoding
: Converting spike trains back into continuous values, so that the output of a
spiking network can be interpreted. See also {term}`rate decoding` and
{term}`spike trace`.

DSP
: Digital Signal Processor &mdash; a processor specialised for numerical
operations on sampled signals, often present alongside a neuromorphic
accelerator to carry out preprocessing.

DVS
: [Dynamic Vision Sensor](https://en.wikipedia.org/wiki/Event_camera) &mdash; a
camera whose pixels asynchronously emit events when the luminance they observe
changes, rather than reporting whole frames at a fixed rate.

eligibility trace
: A per-synapse record of recent pre- and post-synaptic activity that marks the
synapse as eligible for a weight update when a learning signal later arrives,
allowing credit to be assigned backwards in time without storing the full
history.

encoder
: A {term}`spike generator` designed to accept an input signal and represent it
as spikes, i.e. to represent a dense continuous-valued signal as a sparse
sequence of discrete events.

encoding
: Converting continuous-valued data into spikes so that it can be fed to a
spiking network. Broadly divided into {term}`rate encoding` and
{term}`temporal encoding`.

GPU
: Graphics Processing Unit &mdash; a highly parallel accelerator, originally
built for graphics, now the standard hardware for training neural networks.

graded spike
: A spike carrying an integer amplitude greater than one, rather than the
binary value used by most models. Biological action potentials have no
equivalent notion of amplitude.

GRF
: Gaussian Receptive Field &mdash; a population encoding scheme in which each
neuron responds to a Gaussian-shaped window of the input range, and the
distance from an input to a neuron's centre sets that neuron's spike latency.

hard reset
: Setting the membrane potential to $V_\text{rest}$ after a spike, discarding
any charge accumulated beyond the threshold. Contrast {term}`soft reset`.

Heaviside step function
: The function $\Theta$ that returns $1$ for a positive argument and $0$
otherwise, used to convert a membrane potential crossing into a spike. Its
derivative is zero almost everywhere, which is why SNNs need
{term}`surrogate gradients <surrogate gradient>`.

Hodgkin-Huxley
: A {term}`spatial neuron` model that reproduces the generation of an action
potential from the dynamics of individual ionic conductances, at considerably
greater computational cost than a {term}`point neuron`.

IF
: Integrate & Fire &mdash; the simplest point neuron model, which integrates
input into a *non-decaying* membrane potential and spikes when that potential
crosses the threshold. Contrast {term}`LIF`.

LIF
: Leaky Integrate & Fire &mdash; a point neuron model that integrates input
into a *decaying* membrane potential, so that charge accumulated in the absence
of further input leaks away over time. The most widely used neuron model in
SNNs.

LTD
: Long-Term Depression &mdash; a persistent decrease in synaptic strength,
typically produced when the pre-synaptic neuron fires *after* the post-synaptic
one. See {term}`STDP`.

LTP
: Long-Term Potentiation &mdash; a persistent increase in synaptic strength,
typically produced when the pre-synaptic neuron fires shortly *before* the
post-synaptic one. See {term}`STDP`.

membrane potential
: The internal state variable $V$ of a spiking neuron, which accumulates
incoming current and triggers a spike on crossing the threshold. Also called
the neuron's voltage.

mismatch
: Device-to-device variation introduced by the manufacturing process, which
causes nominally identical analog or mixed-signal neurons on the same chip to
behave differently. Models targeting such substrates must be trained or
validated to tolerate it.

NAS
: Neural Architecture Search &mdash; automated search over the space of possible
network topologies for one that best meets a target objective.

NEF
: [Neural Engineering Framework](https://en.wikipedia.org/wiki/Neural_engineering_object)
&mdash; a framework for building spiking networks that compute specified
functions, grounded in representation, transformation and dynamics principles.

[NoC](https://en.wikipedia.org/wiki/Network_on_a_chip)
: Network-on-Chip &mdash; a communication architecture that interconnects
multiple processing elements on a single chip.

[ODE](https://en.wikipedia.org/wiki/Ordinary_differential_equation)
: Ordinary Differential Equation &mdash; an equation describing how a function
changes with respect to one or more variables. The continuous-time equations of
the {term}`IF` and {term}`LIF` neurons are first-order ODEs.

plasticity
: The capacity of a synapse to change its strength in response to neural
activity, and hence the basis of learning in a spiking network.

point neuron
: A neuron model that ignores the spatial structure of a biological neuron
&mdash; its ionic channels, axial conductances and axonal propagation &mdash;
and reduces it to a single state variable. Contrast {term}`spatial neuron`.

population coding
: Representing one input dimension with a group of differently tuned neurons
rather than a single neuron, so that distinct characteristics of the signal can
be captured separately.

quantization
: Reducing the numerical precision used to represent weights, neuron state and
activations, so that a model fits the arithmetic and memory available on the
target hardware.

R&F
: Resonate & Fire &mdash; a point neuron model whose sub-threshold dynamics
oscillate, making it selectively responsive to inputs near its resonant
frequency.

rank order coding
: A temporal scheme that carries information in the *order* in which neurons
fire rather than in their precise spike times. Commonly abbreviated ROC, but
note that in machine learning ROC almost always denotes the *receiver
operating characteristic*; this book prefers the full name to avoid the clash.

rate decoding
: Recovering a value from a spike train by averaging its spikes over the
simulation window, so that a higher spike count indicates stronger evidence.

rate encoding
: Representing a continuous value as a spike *rate*, such that the number of
spikes per unit time is proportional to the value being encoded.

refractory period
: A short interval after a spike during which a neuron is prevented from firing
again, mimicking the biological neuron's reluctance to produce two action
potentials in immediate succession.

ReLU
: Rectified Linear Unit &mdash; the activation function $\max(x, 0)$, widely
used in {term}`ANNs <ANN>`. A {term}`LIF` neuron's firing-rate curve can be
tuned to closely approximate it.

SNN
: [Spiking Neural Network](https://en.wikipedia.org/wiki/Spiking_neural_network)
&mdash; a third-generation neural network in which neurons carry state across
time and communicate through discrete spikes rather than continuous
activations.

soft reset
: Subtracting the threshold $V_\text{thr}$ from the membrane potential after a
spike, so that charge accumulated beyond the threshold is retained rather than
discarded. Contrast {term}`hard reset`.

spatial neuron
: A neuron model that represents the physical extent of a biological neuron,
including axonal propagation delays and dendritic structure. Contrast
{term}`point neuron`.

spike
: A discrete, all-or-nothing event emitted by a neuron when its membrane
potential crosses threshold; the unit of communication in an SNN. Also called
an action potential.

spike generator
: A programming construct that produces a spike train according to some chosen
implementation. It does not necessarily take an input; one that does is an
{term}`encoder`.

spike trace
: A smoothed, continuous-valued signal obtained by low-pass filtering a spike
train, which tracks the neuron's mean firing rate. Also called synaptic
filtering.

spike train
: A sequence of spikes ordered in time, usually represented as a vector whose
index denotes the time step and whose elements are $0$ or an integer.

SRM
: Spike Response Model &mdash; a formulation that decomposes a neuron into
linear filters followed by a single threshold nonlinearity, which is what makes
{term}`surrogate gradients <surrogate gradient>` principled: only that one
nonlinearity needs approximating.

STDP
: Spike-Timing-Dependent Plasticity &mdash; a learning rule that adjusts a
synaptic weight according to the relative timing of the pre- and post-synaptic
spikes, combining {term}`LTP` and {term}`LTD`.

substrate
: The physical medium from which the neurons and synapses of a device are built
&mdash; analog, digital or mixed-signal. The choice fixes the numerical
precision the hardware can hold, the effort of porting to a newer process node,
and the maturity of the surrounding tools, and it is among the hardest design
decisions to undo. See also {term}`mismatch`.

surrogate gradient
: A smooth function substituted for the derivative of the
{term}`Heaviside step function` during the backward pass, leaving the forward
pass discrete. The standard method for training SNNs with gradient descent.

temporal encoding
: Representing a value in the *timing* of spikes rather than in their rate,
which avoids the integration window that rate schemes require. See
{term}`TTFS` and {term}`GRF`.

TinyML
: Machine learning deployed on severely resource-constrained embedded devices,
where memory, latency and energy budgets dominate every design decision.

TTFS
: Time-to-First-Spike &mdash; a latency encoding scheme in which each neuron
fires at most once, with a delay inversely related to the magnitude of its
input, so that stronger stimuli spike sooner.

WTA
: Winner-Takes-All &mdash; a mechanism in which the most strongly stimulated
neuron in a group suppresses the activity of the others.

$i_\text{decay}$
: $=$exp$(\frac{-\Delta t}{\tau_\text{s}})$, it is the **current decay** of a CUBA
spiking neuron model (in their discrete-time implementation), where
$\tau_\text{s}$ is the synaptic time-constant [@rossbroich2022fluctuation].

$v_\text{decay}$
: $=$exp$(\frac{-\Delta t}{\tau_\text{m}})$, it is the **voltage decay** of a
CUrrent BAsed (CUBA) spiking neuron (in their discrete-time implementation),
where $\tau_\text{m}$ is the membrane time-constant [@bellec2018long].
:::
