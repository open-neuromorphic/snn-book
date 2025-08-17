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

### Current Encoding

## Population Rate Encoding

### Two-Neuron Encoding

### Ensemble Encoding


Note that in the research papers, it is common to mention all the above types of
encoding methods as simply rate encoding, however, sometimes, methods under
Population Rate Encoding are explicitly named.
