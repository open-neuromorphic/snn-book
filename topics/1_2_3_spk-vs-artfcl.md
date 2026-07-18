(chapter:spk-vs-artfcl)=
# Spiking vs Artificial Neurons

It is but obvious to compare spiking neurons with artificial neurons because of
their foundational role in building neural networks; note that SNNs and ANNs are
mostly isomorphic in architecture, as well as, the SNNs' training and inference
methodologies are heavily inspired from deep learning literature.

As mentioned earlier, spiking neurons are stateful models, whereas artificial
neurons are stateless; this statefulness of spiking neurons is what makes the
SNNs inherently temporal. Note that there exists a very important relation
between spiking and artificial neurons based on rate-coding theory:

```{important}
An artificial neuron is essentially a steady-state, time-averaged mathematical
abstraction of a spiking neuron; i.e., the continuous numerical output of an
artificial neuron represents the instantaneous firing rate of a spiking neuron.
```

This factual observation enables us to build rate-coding based SNNs and train
them using deep learning based methods. In fact, one of the earliest and most
effective methods to build SNNs: **ANN-to-SNN** conversion (as we will see in
later chapters) is foundationally based on artificial neurons being the rate
approximation of spiking neurons. We next demonstrate this _rate approximation_
of an artificial neuron with a LIF neuron.

## Rate Approximation
For a detailed understanding of this _rate approximation_, we refer to a
resource (a blog article) **outside** of this book: the static webpage [From
Spiking Neurons To Artificial Neurons](https://r-gaurav.github.io/2020/05/08/From-Spiking-Neurons-To-Artificial-Neurons.html). Feel free to copy-paste the code there in
a local jupyter notebook and execute for a thorough understanding of the
following explanation. This article simulates a LIF neuron by discretizing its
continuous time first-order differential equation Eq {eq}`eq:continuous-lif`
(written in an arrangement different than this book) and develops the intuition
behind activation functions in traditional (i.e., the second generation of)
neural networks. Note that the discretization of LIF neuron in the article is
more nuanced than the one in this book (thus, another resource to learn LIF
dynamics!). Also note that even if the LIF neuron in [From Spiking Neurons To
Artificial Neurons](https://r-gaurav.github.io/2020/05/08/From-Spiking-Neurons-To-Artificial-Neurons.html) article is written and discretized differently, the findings
with respect to _rate approximation_ remains unchanged.

In the article, the $V(t)$ and $J(t)$ denote the membrane potential and static
input current to the LIF neuron. Under the **Experiments** section, the first
two plots show that when $J(t)=0$, the neuron's $V(t)$ expectedly remains at
$0$. However, in the immediately next two plots, it can be seen that even if
$J(t)=1$, $V(t)$ does not reach threshold, and thus no spikes are produced. In
the further plots, we see that for $J(t)=1.1$, $V(t)$ demonstrates the spiking
dynamics, and $20$ spikes (in a simulation period of $1$s) are produced, i.e.,
for $J(t)=1$, the simulated LIF neuron fires at $20Hz$. To develop the intuition
of rate approximation, the article then simulates the LIF neuron for $J(t) \in
[0, 1, 2, \cdots, 10]$, and plots the firing rate profile in first subplot of
the last plot. Upon comparing the LIF's firing rate profile with (the first half
of) $\texttt{sigmoid}$ and $\texttt{ReLU}$ activation functions in last two
subplots of the last plot, we see that the firing rate profile quite closely
matches to that of the $\texttt{sigmoid}$. Note that by adjusting the refractory
period ($\tau_{ref}$) and membrane time-constant ($\tau_{RC}$) of the simulated
LIF neuron, one can very closely match its firing rate profile to
$\texttt{ReLU}$ (or of $\texttt{sigmoid}$) functions.

Thus, emprirically, we see that spiking neurons "rate approximate" the
artificial neurons! Note that this analysis will remain unchanged for
time-varying input $J(t)$ as well.
