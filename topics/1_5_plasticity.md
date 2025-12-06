(chapter:plasticity)=
# What is Synaptic Plasticity?

In the previous chapters, we saw how spikes travel across synapses and how synaptic weights control the flow of information in SNNs.
Up to now, those weights were *static*, i.e., set once, used forever.
But in biological systems, and often in SNN, weights can evolve over time.
This ability to change is called *synaptic plasticity*.

In biology, *plastic* means malleable, i.e., capable of being reshaped.  
A synapse is said to be plastic when its strength changes based on neural activity.
Two of the most studied complementary mechanisms of these synaptic changes are Long-Term Potentiation (LTP) and Long-Term Depression (LTD). 
In the next sections, we look at how each mechanism works and why they matter for SNNs.


## Long-Term Potentiation

LTP refers to a persistent increase of a synaptic weight following specific patterns of correlated pre- and post-synaptic activity. 
Specifically, when a pre-synaptic neuron repeatedly fires *just before* the post-synaptic neuron, the system interprets it as a "causal" relationship:  
> "Neuron A helped neuron B fire, let's make that connection stronger."

In SNNs, this principle appears in multiple practical forms.
One of the most common ones is based on how close in time the two spikes occur: if the pre-synaptic spike arrives shortly before the post-synaptic one, the weight increases; if the delay is large, the effect becomes negligible. 

Formally, this timing-based increase of the weight can be described by:

```{math}
:label: eq:ltp
\Delta W_{\text{LTP}}
    = A_+ \, \exp\!\left(-\frac{\Delta t}{\tau_+}\right),
    \qquad \text{for } \Delta t > 0 ,
```

where:  
- $A_+$ is a learning rate controlling the strength of the weight increase,  
- $\tau_+$ is a time constant controling how fast the effect decays in time,  
- $\Delta t = t_{\text{post}} - t_{\text{pre}}$ is the spike-timing difference.

Because $\tau_+$ appears in the denominator of the exponential term in Eq {numref}`eq:ltp`, it sets the rate at which the curve decays.
A small $\tau_+$ means only spikes that occur very close together strengthen the synapse, while a larger $\tau_+$ makes the rule more tolerant to longer delays between pre- and post-synaptic spikes. 
This behavior is illustrated in {numref}`fig-stdp-ltp-tau`.

```{figure} /assets/images/stdp_ltp_tau.pdf
:width: 60%
:name: fig-stdp-ltp-tau

Example of LTP curve for different $\tau_+$ values.
```


## Long-Term Depression

LTD refers to a persistent decrease of a synaptic weight that occurs when pre- and post-synaptic activity are poorly coordinated.
In practice, this happens when the pre-synaptic neuron tends to fire *after* the post-synaptic one.
In that situation, the system interprets the timing as a "non-causal" relationship:
> "Neuron A didn't contribute to neuron B firing, let's weaken that connection."

Similar to LTP, a common form of LTD depends on timing: if the pre-synaptic spike arrives shortly after the post-synaptic one, the weight decreases, and the further apart the spikes are, the weaker the effect becomes.

Formally, this timing-based decrease of the weight can be described by:

```{math}
:label: eq:ltd
\Delta W_{\text{LTD}}
    = -A_- \, \exp\!\left(\frac{\Delta t}{\tau_-}\right),
    \qquad \text{for } \Delta t < 0 ,
```

where:  
- $A_-$ is a learning rate controlling the strength of the weight decrease,  
- $\tau_-$ is a time constant controlling how quickly the effect fades.

{numref}`fig-stdp-ltd-tau` illustrates how $\tau_-$ shapes the width of the LTD window.

```{figure} /assets/images/stdp_ltd_tau.pdf
:width: 60%
:name: fig-stdp-ltd-tau

Example of LTD curve for different $\tau_-$ values.
```


## From plasticity to learning

LTP and LTD capture both causal (input before output) and non-causal (output before input) spike relationships.
By combining these two mechanisms, 
Taken together, they form the basis of timing-dependent learning rules such as Spike Timing-Dependent Plasticity (STDP), which we will cover in the next chapter.


## TODOs 
- Correctly link the images
- Add LTP/LTD plots
- Other forms of LTP/LTD (weight dependent, constant)
- Add code to vizualize their effect 
- Runnqble code to see effect of LTP/LTD based on value of tau
