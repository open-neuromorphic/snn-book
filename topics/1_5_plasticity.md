(chapter:plasticity)=
# What is Synaptic Plasticity?

In previous chapters, we saw how spikes travel across synapses and how synaptic weights control the flow of information in SNNs.
Up to now, those weights were *static*, i.e., set once, used forever.
But in neural systems, and often in SNN models, weights can evolve over time.
This ability to change is called *synaptic plasticity*.

In biology, *plastic* means malleable, i.e., capable of being reshaped.  
A synapse is said to be plastic when its strength changes based on neural activity.

In SNNs, this can mean: TODO

Plasticity mechanisms give SNNs practical benefits:
- **Adaptation:** allows neurons to adjust to new stimuli or noise conditions.
- **Memory:** encodes temporal relationships directly in the network dynamics.
- **Learning:** fundamental building block of rules like STDP (TO LINK) used for training. 

---

Long-Term Potentiation (LTP) and Long-Term Depression (LTD) are the two fundamental, complementary mechanisms through which biological synapses adjust their strength over time.
TODO explain biology.
They form the core of activity-dependent synaptic plasticity, enabling neural circuits to encode experience, adapt to their environment, and support learning and memory.


## Long-Term Potentiation

**LTP** refers to a persistent increase of a synaptic weight following specific patterns of correlated pre- and postsynaptic activity. 
Specifically, when a presynaptic neuron repeatedly fires *just before* the postsynaptic neuron, the system interprets it as a "causal" relationship:  
> "Neuron A helped neuron B fire, let’s make that connection stronger."

In SNNs, this principle appears in multiple practical forms.
One of the most common ones is based on how close in time the two spikes occur: if the presynaptic spike arrives shortly before the postsynaptic one, the weight increases; if the delay is large, the effect becomes negligible.  
Figure TODO illustrates this timing-based increase of the weight.

*Plot placeholder:*  
`![LTP: Δw vs Δt (positive lobe for Δt>0)](./_static/plots/ltp.png)`

The above plot can be expressed as:

\[
\Delta W_{\text{LTP}}
    = A_+ \, \exp\!\left(-\frac{\Delta t}{\tau_+}\right),
    \qquad \text{for } \Delta t > 0 ,
\]

where:  
- \(A_+\) controls the strength of the weight increase,  
- \(\tau_+\) controls how fast the effect decays in time,  
- \(\Delta t = t_{\text{post}} - t_{\text{pre}}\) is the spike-timing difference.


## Long-Term Depression

**LTD** refers to a persistent decrease of a synaptic weight that occurs when pre- and postsynaptic activity are poorly coordinated.
In practice, this happens when the presynaptic neuron tends to fire *after* the postsynaptic one.
In that situation, the system interprets the timing as a "non-causal" relationship:
> "Neuron A didn’t contribute to neuron B firing, let’s weaken that connection."

Similar to LTP, a common form of LTD depends on timing: if the presynaptic spike arrives shortly after the postsynaptic one, the weight decreases, and the further apart the spikes are, the weaker the effect becomes.
Figure TODO illustrates this timing-based decrease of the weight.

*Plot placeholder:*  
`![LTD: Δw vs Δt (negative lobe for Δt<0)](./_static/plots/ltd.png)`

The above plot can be expressed as:

\[
\Delta W_{\text{LTD}}
    = -A_- \, \exp\!\left(\frac{\Delta t}{\tau_-}\right),
    \qquad \text{for } \Delta t < 0 ,
\]

where:  
- \(A_-\) controls the strength of the weight decrease,  
- \(\tau_-\) sets how quickly the effect fades,  
- \(\Delta t = t_{\text{post}} - t_{\text{pre}}\) is the spike-timing difference.


## From plasticity to learning

LTP and LTD capture both causal (input before output) and non-causal (output before input) spike relationships.
Taken together, they form the basis of timing-dependent learning rules such as Spike Timing-Dependent Plasticity (STDP), which we will cover in the next chapter.














---



## TODO 
- Add LTP/LTD plots
- Add code to vizualize their effect 
