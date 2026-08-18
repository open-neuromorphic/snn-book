(chapter:spk-vs-artfcl)=
# Spiking vs Artificial Neurons

SNNs are considered to be the _third_ generation of neural networks
[@maass1997networks] compared to the ANNs, which are _second_ generation.
Therefore, it is but obvious to compare spiking neurons with artificial neurons
because of their foundational role in building neural networks; note that SNNs
and ANNs are mostly isomorphic in architecture, and, in
[Topic {number}](#training), we will see that the SNNs'
training and inference methodologies are heavily inspired from deep learning
literature.

As we know, spiking neurons are stateful models, whereas artificial neurons are
stateless; this _statefulness_ of spiking neurons is what makes the SNNs
inherently temporal. Here, we explore a very important relation between spiking
and artificial neurons based on rate-coding theory:

```{important} An artificial neuron is essentially a steady-state, time-averaged
mathematical abstraction of a spiking neuron; i.e., the continuous numerical
output of an artificial neuron represents the instantaneous firing rate of a
spiking neuron.
```

This factual observation enables us to build rate-coding based SNNs and train
them using deep learning based methods. In fact, one of the earliest and most
effective methods to build SNNs: **ANN-to-SNN** conversion (as we will see in
[Topic {number}](training) chapters), is foundationally based on artificial
neurons being the rate approximation of spiking neurons. We next demonstrate
this _rate approximation_ of an artificial neuron with a LIF neuron.


## Rate Approximation

For a detailed understanding of this _rate approximation_, we refer to a
resource (a blog article) **outside** of this book: the static webpage [From
Spiking Neurons To Artificial Neurons](https://r-gaurav.github.io/2020/05/08/From-Spiking-Neurons-To-Artificial-Neurons.html). Feel free to copy-paste the code there in
a local jupyter notebook and execute for a thorough understanding of the
following explanation. This article simulates a LIF neuron by discretizing its
continuous time first-order differential equation Eq {eq}`eq:continuous-lif`
(written in an arrangement different than this book, noted below):

\begin{equation}
\frac{V(t)}{dt} = \frac{V_{rest} - V(t) + RJ(t)}{\tau_{RC}}
\end{equation}

where $V(t)$ and $J(t)$ denote the membrane potential and static input current
to the LIF neuron. Note that the discretization of LIF neuron in the article is
more nuanced than the one in this book (thus, another resource to learn LIF
dynamics!). Also note that even if the LIF neuron in [From Spiking Neurons To Artificial
Neurons](https://r-gaurav.github.io/2020/05/08/From-Spiking-Neurons-To-Artificial-Neurons.html) article is written and discretized differently, the findings with
respect to _rate approximation_ remains unchanged.

The article develops the intuition behind activation functions in traditional
(i.e., the second generation of) neural networks by conducting a series of
experiments, where the LIF neuron is simulated for varying values of $J(t)$. In
the article, under the **Experiments** section, the first plot (shown below):

```{figure}../assets/topic_1/chapter_1_2/output_j_0.png
:align: center
:width: 100%
```

shows that when $J(t)=0$, no spikes are produced, and the neuron's $V(t)$
expectedly remains at $0$ in the second plot (shown below):

```{figure}../assets/topic_1/chapter_1_2/output_v_0.png
:align: center
:width: 100%
```

However, in the immediately next plot (shown below):

```{figure}../assets/topic_1/chapter_1_2/output_j_1.png
:align: center
:width: 100%
```

it can be seen that even if $J(t)=1$, the neuron does not spike! This is because
$V(t)$ does not reach voltage threshold (even if visually appearing so), as can
be seen below:

```{figure}../assets/topic_1/chapter_1_2/output_v_lt_1.png
:align: center
:width: 100%
```

In the further plots, we see that for $J(t)=1.1$, the neuron produces $20$
spikes (seen below):

```{figure}../assets/topic_1/chapter_1_2/output_j_1_1.png
:align: center
:width: 100%
```

and $V(t)$ demonstrates the spiking dynamics (seen below):

```{figure}../assets/topic_1/chapter_1_2/output_v_1_1.png
:align: center
:width: 100%
```

Thus, for $J(t)=1.1$, the simulated LIF neuron fires at $20Hz$ (since $20$
spikes are produced in a simulation period of $1$s). To develop the intuition of
_rate approximation_, the article then simulates the LIF neuron for $J(t) \in
[0, 1, 2, \cdots, 10]$, and plots the firing rate profile in first subplot of
the last plot in the article (shown below):

```{figure}../assets/topic_1/chapter_1_2/output_fr_prfl.png
:align: center
:width: 100%
```

Upon comparing the LIF's firing rate profile with (the first half of)
$\texttt{sigmoid}$ and $\texttt{ReLU}$ activation functions in last two subplots
of the last plot (shown above), we see that the firing rate profile quite
closely matches to that of the $\texttt{sigmoid}$. Note that by adjusting the
refractory period ($\tau_{ref}$) and membrane time-constant ($\tau_{RC}$) of the
simulated LIF neuron, one can very closely match its firing rate profile to the
activation output of $\texttt{ReLU}$ (or of $\texttt{sigmoid}$) functions.

Thus, empirically, we see that spiking neurons "rate approximate" the
artificial neurons! Note that this analysis will remain unchanged for
time-varying input $J(t)$ as well.
