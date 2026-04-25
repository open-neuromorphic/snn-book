(chapter:rate-enc)=
# Rate Encoding
**Rate Encoding** is a prevalent form of encoding continuous values to discrete
spikes and quite easy to work with. It is because it relates well to the
Deep Learning networks and training methodologies (that the researchers leverage
to train SNNs – discussed in the later chapters). The core idea behind Rate
Encoding is to represent the continuous values via a spike _rate_ over time
(i.e., number of spikes averaged over time), e.g., 20Hz, 25Hz, etc. – such that
the spike rate is _proportional_ to the continuous value. Here, we discuss two
popular methods of rate encoding: **Count Rate Encoding** (also commonly known as
**Frequency Rate Encoding**) and **Population Rate Encoding**.

## Count/Frequency Rate Encoding
This encoding method is a standard approach used in most Spiking Neural Networks.
The idea is to have **one** spike generator _per dimension_ of the input to
encode continuous values to binary spikes. That one spike generator can either
be a mathematical function (e.g., **Poisson Encoding**) or a neuron (e.g.,
**Neuron Encoding**); these are described below in more detail.

### Poisson Encoding

### Neuron Encoding
In **Neuron Encoding** method, the continuous values are encoded to spikes via
a _spiking neuron_ stimulation. Consider a continuous-valued scalar input $x[t]$
that is to be encoded, the idea is to obtain a _current_ $J[t]$ from $x[t]$ and
use $J[t]$ to stimulate a neuron (can be a $\texttt{LIF}$ or an $\texttt{IF}$)
corresponding to $x[t]$ to produce spikes. This method is popularly used in the
Neural Engineering Framework (NEF) [@eliasmith2003neural],
[@stewart2012technical]
that we shall look into in the later sections. Following is the equation to
obtain $J[t]$ from the input $x[t]$ to an encoding neuron:

\begin{equation}
J[t] = \alpha \times e \times x[t] + J_\text{bias} \label{eq:enc-nrn-jt}
\end{equation}

where $\alpha$ is the encoding neuron’s _gain_ value, $e$ is the encoding
neuron’s _encoder_ value, $x[t]$ is the scalar input, and $J_\text{bias}$ is the
_bias current_ to the encoding neuron. Note that $e$ determines the _sensitivity_
(of the enoding neuron) to input values; we will provide more details in the NEF
appendix. After obtaining $J[t]$, one can use the
Eqs {eq}`eq:discrete-if`($\textsf{b}$, $\textsf{c}$, $\textsf{d}$) or the
Eqs {eq}`eq:discrete-lif`($\textsf{b}$, $\textsf{c}$, $\textsf{d}$) depending on
the choice of $\texttt{IF}$ or $\texttt{LIF}$ neuron respectively to encode
continuous $x[t]$ to spikes; note that $I[t]$ in these equations will be replaced
by $J[t]$.


Coming to the values of the hyper-parameters in Eq {eq}`eq:enc-nrn-jt` above, one
can set their values as $\alpha\in\mathbb{R}^+$ and
$J_\text{bias}\in\mathbb{R}^+_0$. However the value of $e$ depends not only on
its intended sensitivity, but also on the dimensionality of the input (more in
the NEF Appendix). For now, let us consider only scalar input, i.e.,
$x[t]\in\mathbb{R}$. This implies that $e$ should be scalar too; coming to its
sensitivity, it should be set $e=1$ if one wants to encode _only_ positive
values, and $e=-1$ for encoding _only_ negative values. Overall, one should be
careful in choosing appropriate values of $\alpha$, $e$, $J_\text{bias}$ in
accordance with in the input $x[t]$ and the chosen $V_\text{thr}\in\mathbb{R}^+$
or any other hyper-parameter of the encoding neuron (e.g., voltage decay
$\tau_\text{vol}$ in $\texttt{LIF}$ neuron, i.e., in Eq {eq}`eq:discrete-lif`).

```{note}
It's highly recommended to check the spiking profile of your encondig neurons
(in the input layer of your SNN) on a few samples to ensure the input $x[t]$ is
properly represented and the information doesn't get lost.
```

Following code demonstrates how to encode an example signal $x[t]$ using the Eq
{eq}`eq:enc-nrn-jt` via an $\texttt{IF}$ neuron (Eq {eq}`eq:discrete-if`).
$\textcolor{red}{start}$




## Population Rate Encoding
This is another standard but relatively less common encoding approach used in
SNNs. The idea is to have **a group** of encoders _per dimension_ of the input
to encode continuous values to binary spikes. Why so? A population of
_differently characterized_ encoders is required when you want to capture
_different characteristics_ of the input signal, e.g., if your signal is
composed of _positive_ and _negative_ values! In such a case, you would ideally
like your encoders to be _sensitive_ to the positive and negative
characteristics of your input signal! You can do this by specially tuning the
implementation of your encoders. We next describe a special case of Population
Rate Encoding, followed by the general case.

### Two-Neuron Encoding
Two-Neuron Encoding is the simplest and a special case of Population Rate
Encoding, where one uses only _two_ neurons in their encoder design. As hinted
above, such an encoding system is commonly used when one has to encode an input
signal composed of positive and negative values over time. If you use only one
neuron sensitive to positive values, only the positive part of the signal will
be encoded to spikes, and you will lose the information available from the
negative part of the signal; and vice-versa if you use only one neuron sensitive
to negative values. To illustrate this, we take the following example of rate
encoding a Sine wave (oscillating between -1 and 1) using the abovementioned
**Neuron Encoding** approach -- first by using a _single_ neuron, then by _two_
neurons. For the same, consider the $\texttt{IF}$ neuron's current $J[t]$ Eq
{eq}`eq:enc-nrn-jt` and voltage Eq {eq}`eq:discrete-if`($\textsf{b}$,
$\textsf{c}$, $\textsf{d}$),  below:

\begin{equation}
J[t] &= \alpha \times e \times x[t] + J_\text{bias} \\
V[t] &= V[t-1] + J[t] \\
S[t] &= \Theta(V[t] - V_\text{thr}) \\
V[t] &\leftarrow V_\text{rest}
\end{equation}

where $\alpha (=1)$ is gain of the $\texttt{IF}$ neuron, $J_\text{bias} (=0)$ is
the bias and $e$ is the neuron's encoder value determining it's _sensitivity_;
$x[t]$ is signal input (i.e., Sine wave in our example) to our $\texttt{IF}$
neuron – the above rate-encoding equation is taken from the Neural Engineering
Framework theory [@eliasmith2003neural, @stewart2012technical]. The encoding
neuron produces a binary spike when $V[t]$ > $V_\text{thr}$ and its voltage
$V[t]$ is reset to 0 upon spiking. Note that $V[t]$ is constrained to be always
$> 0$; there is _no_ reason for it go negative – as for the neuron to spike,
its $V[t]$ should increase towards the positive $V_\text{thr}$. Following code
demonstrates the Sine wave $x[t]$ and its rate-encoded spikes when only _one_
encoding neuron is used with $e = 1$:

```{figure}../assets/topic_1/chapter_1_3/original-sine.png
:name: ch1_3_sine_wave
:alt: Sine Wave
:align: center
:width: 100%
```

```{figure}../assets/topic_1/chapter_1_3/positive-spikes.png
:width: 100%
```

<span style="color:red">Write code later</span>

As you can see, the neuron is sensitive to only the positive part of the Sine
wave and encodes it to spikes, however, the information from the negative part
is lost! If one does decide to implement negative $V[t]$, and set another
$V_\text{thr}$ in the negative direction - to produce spikes for the negative
part of Sine wave, then such a contraption will go against the convention of
$V[t]$ and $V_\text{thr}$ being $\geq 0$; and will also complicate the neuron
design and hardware design for the same.

One may cleverly plan to pre-process the Sine wave by taking its absolute value,
thus, its negative part will then be in the positive domain (as shown in Figure
below):

```{figure}../assets/topic_1/chapter_1_3/mod-sine.png
:width: 100%
```

Let's call this $|x[t]|$ signal as $u_1[t]$ and encode it with a single neuron
(again with $e = 1$), as done for $x[t]$. Then, the following spike train
(in Fig 2b) is produced:

```{figure}../assets/topic_1/chapter_1_3/mod-spikes.png
:width: 100%
```

It can be easily inferred from the above that if another signal, say $u_2[t]$,
_originally_ of the same wave-form as $u_1[t]$ is encoded, then it will produce
the same spike train as in the Fig 2b for $|x[t]|$. Note that pre-processing
$u_2[t]$ by taking its absolute value will have no effect on it, as $u_2[t]$ is
already all positive. Thus, there would be **no** difference between the spike
trains obtained from the original Sine wave $x[t]$ and another all positive
signal $u_2[t]$ (after applying the same pre-processing step).

Therefore, let us use another encoding neuron with $e = −1$ to encode the
original Sine wave x[t]; analogous to case of $e = 1$, this will encode only the
negative part of the Sine wave, as can be seen in the Figs 3a & 3b below:

```{figure}../assets/topic_1/chapter_1_3/original-sine.png
:width: 100%
```

```{figure}../assets/topic_1/chapter_1_3/negative-spikes.png
:width: 100%
```

Thus, if one uses _two_ neurons - one with $e = 1$ and another with $e = −1$,
then both the positive and negative parts of the Sine wave $x[t]$ are encoded
faithfully and no information is lost. Following Fig 4 shows it:

```{figure}../assets/topic_1/chapter_1_3/positive-negative-spikes.png
:width: 100%
```

It is also easy to note that if the signal $u_2[t]$ (of same waveform as
$|x[t]|$) is encoded via such a system of two neurons, then the neuron with
$e = −1$ will _not_ spike at all, while the neuron with $e = 1$ will spike and
produce the spike train as in the Fig 2b, thereby differentiating the inputs
$x[t]$ and $u_2[t]$.

```{tip} Encoding a real-valued signal
A real-valued signal is typically composed of positive and negative values,
therefore, always consider employing a Two-Neuron Encoding system.
```

### Ensemble Encoding
Next step: Write this.

<!--Note that in the scientific literature it is common to refer to all these
encoding methods simply as rate encoding. However, some authors explicitly
distinguish between _rate encoding_, where the firing rate of a single neuron is
used as a proxy for real-valued input, and _population rate encoding_, which
employs more than one neuron to capture different characteristics of the input.

```{warning} High Spike Count!
Next step: Write this.
```
-->
