(chapter:encdec)=
# What is Encoding & Decoding?

This chapter describes another foundational concept in neuromorphic computing: 
**Encoding** & **Decoding**. Spiking networks work with _discrete_ spikes 
(generally binary, i.e., 0 and 1); however, the real-world data are (almost
always) _continuous_ valued. Therefore, the real-world data need to be converted 
to _discrete_ spikes to work with spiking networks. Likewise, one also needs 
to convert the _discrete_ spikes back to _continuous_ values to make real-world 
sense. 

The conversion of real-world _continuous_ data to _spikes_ is called 
**Encoding**, while the conversion of _spikes_ to _continuous_ values is called 
**Decoding**. Herein, we present a few popular methods of Encoding and Decoding 
in spiking networks, and recommend the readers to read [@panzeri2010sensory] and 
[@auge2021survey] for an in-depth knowledge on various encoding/decoding 
methodologies. Let's dig a bit deeper into these conversion methodologies. 

## Encoding
When one wishes to input data to their spiking network, they must ensure that the 
data are discrete events/spikes. If the input data are already discretized, e.g.,
obtained from _Event-based Sensors_ (DVS Cameras, etc.), then it's all set to be 
fed to the spiking network. However, if the data are continuous-valued (which is 
mostly the case), then one must employ some sort of encoding methodology to 
convert the continuous-valued data to input events/spikes. Therefore, this 
encoding process can be considered as the task of the _Input_ layer in an SNN. 
The encoding methods fall under two broad categories: **Rate Encoding** and 
**Temporal Encoding**; in this chapter, we will discuss them both. 

## Decoding
Spiking neurons output spikes, and use that to communicate with each other; they 
do _not_ output their internal voltage and current states. Therefore, for 
operations that involve discrete spikes as input and continuous-values as output 
e.g., at the output layer of an SNN for classification or regression, we need to
decode the spikes. In other words, when we need to extract some meaningful
information from spikes, we decode them. Similar to encoding, there are multiple 
decoding approaches that can be broadly placed in two categories: **Rate 
Decoding** and **Temporal Decoding**; we will discuss both of these in this
chapter.


---
---

Before we begin with this chapter, we here introduce the concept of a **Spike
Generator**:

```{seealso}Spike Generator
A Spike Generator is a mere *programming construct* (that follows a desired 
implementation) to generate a binary/graded spike train. Note that it may _not_
necessarily receive an input!
```

Spike Generators are used for various tasks, e.g.,
* to stimulate/inhibit connected neuron(s)
* to study the implemented spiking behaviour
* to encode an input signal to binary/graded spikes

This bring us to define the term **Encoder**: 

```{seealso}
An Encoder is a Spike Generator that is specifically designed to accept an input
signal and encode it to generate binary/graded spikes, i.e., it _represents_ the 
_dense_ continuous valued signal through a _sparse_ sequence of discrete values. 
```
