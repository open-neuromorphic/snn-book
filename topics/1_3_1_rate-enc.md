(chapter:rate-enc)=
# Rate Encoding
**Rate Encoding** is most prevalent form of encoding continuous values to 
discrete spikes and easiest to work with. It is because it relates well to the 
Deep Learning networks and training methodologies (that the researchers leverage 
to train SNNs – discussed in the later chapters). The core idea behind Rate 
Encoding is to represent the continuous values via a spike _rate_ over time 
(i.e., number of spikes averaged over time), e.g., 20Hz, 25Hz, etc. – such that 
the spike rate is _proportional_ to the continuous value. Here, we discuss two 
popular methods of rate encoding: **Count Rate Encoding** (also commonly known as 
**Frequency Rate Encoding**) and **Population Rate Encoding**. 

## Count/Frequency Rate Encoding
This encoding method is the most common approach used in most spiking works. The 
idea is to have _one_ spike generator _per dimension_ of the input to encode 
continuous values to binary spikes. That one spike generator can either be a 
mathematical function (e.g., **Poisson Encoding**) or a neuron (e.g., **Neuron 
Encoding**); we describe them next.

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


Coming to the values of the hyper-parameters in Eq {eq}`eq:enc-nrn-jt` above, 
$\alpha$, $e$, and $J_\text{bias}$ characterize the encoding neuron. One can 
choose the values of $\alpha\in\mathbb{R}^+$, $J_\text{bias}\in\mathbb{R}^$, and 


in accordance with the
input x[t] and the chosen Vthr, however, the encoder e’s value should be either +1 or −1;
a +1 and −1 denote that the encoding neuron is sensitive to positive and negative x[t],
respectively. Following code demonstrates how to encode an example x[t] using the Eq
(2.2) via an IF neuron.

$\textcolor{red}{start}$


## Population Rate Encoding

### Two-Neuron Encoding

### Ensemble Encoding


Note that in the research papers, it is common to mention all the above types of
encoding methods as simply rate encoding, however, sometimes, methods under
Population Rate Encoding are explicitly named.
