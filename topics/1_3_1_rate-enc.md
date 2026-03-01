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
It's highly recommended to check the spiking profile of your encondig neurons (in
the input layer of your SNN) on a few samples to ensure the input $x[t]$ is 
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
Two-neuron encoding is 

### Ensemble Encoding
Nest step: Write this.

Note that in the scientific literature it is common to refer to all these 
encoding methods simply as rate encoding. However, some authors explicitly 
distinguish between _rate encoding_, where the firing rate of a single neuron is 
used as a proxy for real-valued input, and _population rate encoding_, which 
employs more than one neuron to capture different characteristics of the input.

```{warning} High Spike Count!
Next step: Write this.
```
