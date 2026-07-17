(chapter:snn-basics)=
# Why SNNs?

%### Should we write a topic on why Spiking Neurons
%Sparse method of encoding and working with temporal information. H/W neurons don't need to be active all the time. Sparsity in spiking.

%## Some topic.

### From Neurons to Networks

In "[What is a Spiking Neuron?](#spiking)", the components of individual biological neurons' dynamics were described at varying levels of mathematical abstraction. The most popular biologically-plausible neuron models adopted in neuromorphic computing, i.e. **Point Neurons** such as **LIF**, capture the _temporal_ nature of neural computation, with sparse action potentials carrying information through their precise timings. Input spikes arriving within close temporal proximity to the soma elicit an output spike, driving computation through temporal corellation. However, this is only half of the story of neural computation, as the _spatial_ origin of each incoming spike tells the other half. Not to be confused with "[**Spatial Neuron Models**](#spatial-neurons)", spatial computation refers to correlating signals coming in from different input neurons. To understand it, one should first step back and understand how neurons are connected and communicate in the brain. 

Action potentials are generated upon input currents accumulating in the soma and crossing the firing threshold, however, **_what happens afterwards?_** The answer is that the the current travels across the **axon**, a wire-like appendage that extends from the neuron body for up to a meter or more [@bear2025neuroscience]. Towards its end, the axon branches out to multiple destination neurons. To receive axonal signals from multiple sources, neurons use **dendritic trees**, which branch out to meet other neurons' axons. The junctions between axons and dendtrites are referred to as **synapses**. 

-- Describe what synapses are 

-- Synaptic Strenght

-- A lot of non-linearity

-- Neural networks simplify all to weight matrix 




