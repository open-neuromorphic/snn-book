---
numbering:
  headings: true
---
(chapter:rate-enc)=
# Rate Encoding

```{draft}
```

**Rate Encoding** is a prevalent form of encoding continuous values to discrete
spikes, and is quite easy to work with. This is because it relates well to the
Deep Learning networks and training methodologies (that researchers leverage
to train SNNs – discussed in the later chapters). The core idea behind Rate
Encoding is to represent continuous values via a spike _rate_ over time (i.e.,
number of spikes averaged over time), e.g., 20Hz, 25Hz, etc. – such that the
spike rate is _proportional_ to the input value. Here, we discuss two popular
methods of rate encoding: **Count Rate Encoding** (also commonly known as
**Frequency Rate Encoding**) and **Population Rate Encoding**.

## Count/Frequency Rate Encoding
This encoding method is a standard approach used in most Spiking Neural Networks.
The idea is to have **one** spike generator _per input dimension_ to encode
continuous values to binary spikes. That one spike generator can either be a
mathematical function (e.g., **Poisson Encoding**) or a neuron (e.g., **Neuron
Encoding**); these are described below in more detail.

### Poisson Encoding

### Neuron Encoding
In the **Neuron Encoding** method, continuous values are encoded to spikes via
a _spiking neuron_ stimulation. Consider a continuous-valued scalar input $x[t]$
that is to be encoded; the idea is to obtain a _current_ $J[t]$ from $x[t]$ and
use $J[t]$ to stimulate a neuron (can be a $\texttt{LIF}$ or an $\texttt{IF}$)
corresponding to $x[t]$ to produce spikes. This method is popularly used in the
Neural Engineering Framework (NEF) [@eliasmith2003neural],
[@stewart2012technical]
that we shall look into in later sections. The following equation can be used to
obtain $J[t]$ from the input $x[t]$ to an encoding neuron:

\begin{equation}
J[t] = \alpha \times e \times x[t] + J_\text{bias} \label{eq:enc-nrn-jt}
\end{equation}

where $\alpha$ is the encoding neuron’s _gain_, $e$ is the encoding neuron’s
_encoder_ coefficient, $x[t]$ is the scalar input, and $J_\text{bias}$ is the
_bias current_ to the encoding neuron. Note that $e$ determines the _sensitivity_
of the encoding neuron to input values; we will provide more details in the NEF
appendix. After obtaining $J[t]$, one can use Eqs.
{eq}`eq:discrete-if`($\textsf{b}$, $\textsf{c}$, $\textsf{d}$) or Eqs.
{eq}`eq:discrete-lif`($\textsf{b}$, $\textsf{c}$, $\textsf{d}$) to encode a
continuous signal $x[t]$ to spikes by using an $\texttt{IF}$ or a $\texttt{LIF}$
neuron, respectively; note that $I[t]$ in these equations is replaced by $J[t]$.


Looking at the values of the hyper-parameters in Eq. {eq}`eq:enc-nrn-jt` above,
one can set their values to $\alpha\in\mathbb{R}^+$ and
$J_\text{bias}\in\mathbb{R}^+_0$. However, the value of $e$ depends not only on
its intended sensitivity, but also on the dimensionality of the input (more in
the NEF Appendix). For now, let us consider only scalar input, i.e.,
$x[t]\in\mathbb{R}$. This implies that $e$ should also be a scalar with $e=1$
_or_ $e=-1$ if the input values that need to be encoded are _only_ positive _or_
negative, respectively. Overall, one should be careful in choosing appropriate
values of $\alpha$, $e$, $J_\text{bias}$ in accordance with the input $x[t]$ and
the chosen $V_\text{thr}\in\mathbb{R}^+$ or any other hyperparameter of the
encoding neuron (e.g., voltage decay $v_\text{decay}$ in $\texttt{LIF}$ neuron,
i.e., in Eq. {eq}`eq:discrete-lif`).

```{note}
It's highly recommended to check the spiking profile of your encoding neurons
(in the input layer of your SNN) on a few samples to ensure the input $x[t]$ is
properly represented and the information doesn't get lost.
```

<!-- The following code demonstrates how to encode an example signal $x[t]$ using Eq.
{eq}`eq:enc-nrn-jt` via an $\texttt{IF}$ neuron (Eq. {eq}`eq:discrete-if`).
$\textcolor{red}{start}$ -->




## Population Rate Encoding
This is another standard but relatively less common encoding approach used in
SNNs. The idea is to have **a group** of encoders _per input dimension_ to
encode continuous values to binary spikes. Why so? A population of _differently
characterized_ encoders is required when you want to capture _different
characteristics_ of the input signal, e.g., if your signal is composed of
_positive_ and _negative_ values! In such a case, you would ideally like your
encoders to be _sensitive_ to the positive and negative values of your input
signal. You can do this by specially tuning the implementation of your encoders.
We next describe a special case of Population Rate Encoding, followed by the
general case.

### Two-Neuron Encoding
Two-Neuron Encoding is the simplest version and a special case of Population
Rate Encoding, where only _two_ neurons are used for encoding the input. As
hinted above, such an encoding system is commonly used when one has to encode an
input signal composed of positive and negative values over time. If you use only
one neuron sensitive to positive values, only the positive part of the signal
will be encoded into spikes, and you will lose the information available from
the negative part of the signal, and vice versa if you use only one neuron
sensitive to negative values. To illustrate this, we take the following example
of rate encoding a sine wave (oscillating between -1 and 1) using the
abovementioned **Neuron Encoding** approach -- first by using a _single_ neuron,
then with _two_ neurons. Consider the $\texttt{IF}$ neuron's current $J[t]$ Eq.
{eq}`eq:enc-nrn-jt` and voltage Eq. {eq}`eq:discrete-if`($\textsf{b}$,
$\textsf{c}$, and $\textsf{d}$) below:

\begin{equation}
J[t] &= \alpha \times e \times x[t] + J_\text{bias} \\
V[t] &= V[t-1] + J[t] \\
S[t] &= \Theta(V[t] - V_\text{thr}) \\
V[t] &\leftarrow V_\text{rest}
\end{equation}

where $\alpha (=1)$ is the gain of the $\texttt{IF}$ neuron, $J_\text{bias}
(=0)$ is the bias and $e$ is the neuron's encoder coefficient determining its
_sensitivity_; $x[t]$ is the input signal (i.e., sine wave in our example) to
our $\texttt{IF}$ neuron – the above rate-encoding equation is taken from the
Neural Engineering Framework theory [@eliasmith2003neural,
@stewart2012technical]. The encoding neuron produces a binary spike when $V[t]$
> $V_\text{thr}$, and its voltage $V[t]$ is reset to 0 upon spiking. Note that
$V[t]$ is constrained to be always $> 0$; there is _no_ reason for it go
negative – as for the neuron to spike, its $V[t]$ should increase towards the
positive $V_\text{thr}$. The following code demonstrates the sine wave $x[t]$
and its rate-encoded spikes when only _one_ encoding neuron is used with
$e = 1$:

```{figure}../assets/topic_1/chapter_1_3/original-sine.png
:name: ch1_3_sine_wave
:alt: Sine Wave
:align: center
:width: 100%
```

```{figure}../assets/topic_1/chapter_1_3/positive-spikes.png
:width: 100%
```

<!-- <span style="color:red">Write code later</span> -->

<!-- As can be clearly seen in Fig. x, -->
The neuron is sensitive to only the positive
part of the sine wave and encodes it to spikes, however, the information from
the negative part is lost. If we allow negative $V[t]$, and set another
$V_\text{thr}$ in the negative direction - to produce spikes for the negative
part of the sine wave, then that would go against the convention of $V[t]$ and
$V_\text{thr}$ being $\geq 0$. It would also complicate both the neuron design
and hardware implementations thereof.

One option is to pre-process the sine wave by taking its absolute value, which
would ensure that the input is always non-negative (as shown in Fig. x)

```{figure}../assets/topic_1/chapter_1_3/mod-sine.png
:width: 100%
```

Let's call this $|x[t]|$ signal $u_1[t]$ and encode it with a single neuron
(again with $e = 1$), as done for $x[t]$. Then, the following spike train would
be produced (Fig. 2b)

```{figure}../assets/topic_1/chapter_1_3/mod-spikes.png
:width: 100%
```

It can be easily inferred from the above that if another signal $u_2[t]$ with
the same wave-form as the original signal $u_1[t]$ is encoded, then it would
produce the same spike train as for $|x[t]|$ in Fig. 2b. Note that pre-processing
$u_2[t]$ by taking its absolute value will have no effect as $u_2[t]$ is
already non-negative. Thus, there would be **no** difference between the spike
trains obtained from the original sine wave $x[t]$ and another non-negative
signal $u_2[t]$ (after applying the same pre-processing step, i.e., absolute
value operation).

Therefore, let us use another encoding neuron with $e = −1$ to encode the
original sine wave $x[t]$; analogous to the case of $e = 1$, this would encode
only the negative part of the sine wave, as can be seen in the Figs. 3a & 3b
below:

```{figure}../assets/topic_1/chapter_1_3/original-sine.png
:width: 100%
```

```{figure}../assets/topic_1/chapter_1_3/negative-spikes.png
:width: 100%
```

Thus, if _two_ neurons - one with $e = 1$ and another with $e = −1$ are used,
then both the positive and the negative parts of the sine wave $x[t]$ would be
encoded faithfully, and no information would be lost, as shown in Fig. 4:

```{figure}../assets/topic_1/chapter_1_3/positive-negative-spikes.png
:width: 100%
```

It is also noteworthy that if the signal $u_2[t]$ (of the same waveform as
$|x[t]|$) is encoded via such a system of two neurons, then the neuron with
$e = −1$ would _not_ spike at all, while the neuron with $e = 1$ would spike and
produce the spike train seen in Fig. 2b, thereby differentiating between the
inputs $x[t]$ and $u_2[t]$.

```{tip} Encoding a real-valued signal
A real-valued signal is typically composed of positive and negative values,
therefore, always consider employing a Two-Neuron Encoding system.
```

<!-- ### Ensemble Encoding
Next step: Write this. -->

<!--Note that in the scientific literature it is common to refer to all these
encoding methods simply as rate encoding. However, some authors explicitly
distinguish between _rate encoding_, where the firing rate of a single neuron is
used as a proxy for real-valued input, and _population rate encoding_, which
employs more than one neuron to capture different characteristics of the input.

```{warning} High Spike Count!
Next step: Write this.
```
-->
