(chapter:temp-enc)=
# Temporal Encoding

Our perception of the world relies of various biosensors, which need to convey
what is going on in our environment to the brain
[@Gollisch.Meister-2008-RapidNeural].
However, there is a fundamental difference between the
analogue world, where all stimuli are continuous and graded,
and the way the brain processes information, which is
inherently discrete and heavily reliant on temporal information.

One of the core advantages of SNNs is that they can take into account
the temporal dynamics of their stimulus.
To harness this advantage, it makes sense to convert graded real-valued
stimuli into sequences of spikes that encode the characteristics of the input
into the time domain [@Bian.Donati.ea-2024-EvaluationEncoding].
This chapter outlines several techniques for temporal encoding based on
the *timing* of the spikes produced by the encoding neurons.

## Latency-based Encoding Schemes

Latency-based schemes translate real-valued stimuli into spike _delays_
(or _latencies_). In principle, there is no limit to the delay.
However, in practice, most encoding schemes employ a cutoff
time beyond which inputs are considered to have
an infinite delay, meaning that the corresponding encoding neurons
do not produce spikes.

In this chapter, we will introduce two latency-based encoding schemes:

- **Time-to-First-Spike (TTFS)**: a straightforward scheme
 where neurons are allowed to spike only once (similarly to
 [Rank Order Encoding (ROC)](#))
- **Gaussian Receptive Fields (GRFs)**: a population-based scheme using
overlapping Gaussians to encode each input channel.

### Time-to-First-Spike (TTFS) Encoding

In TTFS [@Eshraghian.Ward.ea-2023-TrainingSpiking], the first (and only) spike
produced by a neuron is generated with a
delay that is inversely proportional to the magnitude of the input.
In other words, a strong stimulus (a large input value)
translates into a spike with a short delay ([Fig. 1](#fig-TTFS)).

The implementation of TTFS is fairly straightforward. The delay can be computed
either by numerical integration or by directly mapping the values to the time
domain. The integration method is based on the membrane dynamics of the neuron,
whereby the speed of depolarisation of the membrane depends on the strength
of the stimulus. Specifically, assuming a LIF neuron (cf. @sec:spk-nrn-lif), the
the evolution of the membrane potential follows Eq. @eq:continuous-lif,
where $I$ is the input current corresponding to the value being encoded.
The stronger the stimulus $I$, the faster the membrane potential reaches the
threshold, producing a spike.

If numerical integration is undesirable or impractical,
the input can also be mapped directly to a discretised version of the time
domain by normalising the input values and applying a simple
direct linear mapping:

```{math}
:label: eq:ttfs-logarithmic
l_{t} = \max(\tau(1- I_{t}), \tau(1 - \theta)),
```

where

- $l_{t}$: spike latency at time step $t$
- $\tau$: time constant of the neuron
- $\theta$: the threshold
- $t$: the time step

A non-linear (usually logarithmic) mapping can also be applied:

\begin{equation}
l_{t} = \tau~\log(\frac{I}{I - \theta}).
\end{equation}

The notation is the same as in the linear case.
Logarithmic mapping places a stronger emphasis on larger input values, where
the delay decreases faster than the difference between the raw input values.
In other words, the delays corresponding to two small input values would be
closer to each other than the delays corresponding to two relatively larger
values.
In all cases, neurons are allowed to spike only **once** - if multiple spikes
are produced, any spikes after the first are ignored.

```{figure} assets/chapter1/plots/ttfs.png
:alt: TTFS encoding
:name: fig-TTFS

An example of time-to-first-spike (TTFS) encoding. The neurons encode
(normalised) input stimuli, where larger values translate into shorter
delays.
```

## Encoding with Gaussian Receptive Fields (GRFs)

The Gaussian Receptive Field (GRF) encoding scheme
[@Bohte.Kok.ea-2002-Errorbackprop] is loosely modelled on the
operating principle of the cochlea, where different sound frequencies are
mapped to different physical locations. The GRF encoding mechanism is
somewhat different to the ones introduced above in that it
uses a _population_ of neurons with overlapping receptive fields, whereby
a real-valued input is encoded into a (potentially sparse) train of spikes
with different delays.

In the GRF encoding scheme, *each* real-valued input variable $u$ is encoded by
a population of $M$ equidistant neurons covering the interval
$[u_{min}, u_{max}]$ of possible values that the variable can take.
Each neuron is located at the peak of
a Gaussian receptive field, and the distances between the
peaks is chosen such that the receptive fields have significant overlap
[Fig. 3](#fig-GRF). For each input channel encoded by GRFs, the neurons
should cover the entire range of values that the input for this channel
could take.

The parameters ($\mu$ and standard deviation $\sigma$) of each Gaussian are
chosen as follows:

```{math}
:label: eq:grf-mean
\mu_{i} = u_{min} + \frac{(2i + 1)(u_{max} - u_{min})}{2M}
```

```{math}
:label: eq:grf-sigma
\sigma = \frac{u_{max} - u_{min}}{\beta M}
```

Here, the parameter $\beta\in(1,2)$ directly controls the width of the
Gaussian receptive fields.

The input stimulus is mapped to the encoded interval $(u_{min}, u_{max})$.
The vertical line originating at the point corresponding to the input stimulus
($0.72$ in [Fig. 3](#fig-GRF)) crosses the GRF for each encoding neuron.
The vertical offset of the crossing point determines the delay for the
corresponding neuron. An input value that is closer to the mean of a certain
GRF would cause the neuron associated with that GRF to spike earlier.
A threshold (denoted as $\theta$ here) can be used to sparsify the spike train,
whereby if the delay is longer than the
threshold, the neuron does not produce a spike.

```{note}
This encoding method requires that the input range be known in advance.
In practice, it makes sense to normalise each input channel so that its
stimulus range falls between $0$ and $1$. This has the added advantage
that each input channel can be encoded with the same number of GRFs with
the same mean $\mu$ and standard deviation $\sigma$.
```

```{figure} assets/chapter1/plots/grf.png
:alt: GRF encoding
:name: fig-GRF

An example of encoding based on Gaussian Receptive Fields (GRF).
Each input channel is encoded by a population of neurons with overlapping
GRFs. This encoding resembles the encoding of sound in the cochlea,
where different frequencies are encoded by populations of neurons in
different physical locations along the cochlea.
```
